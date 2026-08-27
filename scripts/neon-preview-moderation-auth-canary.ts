import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { POST as moderatePost } from "../app/api/memories/moderate/route.ts";
import { getDatabaseBackend } from "../lib/database/backend.ts";

const TARGET_BRANCH = "migration/supabase-to-neon";
const SLUG = "jessicasamuelwedding";

async function main(): Promise<void> {
  if (
    process.env.VERCEL_ENV !== "preview" ||
    process.env.VERCEL_GIT_COMMIT_REF !== TARGET_BRANCH
  ) {
    console.log("[moderation-auth-canary] skipped outside dedicated migration Preview");
    return;
  }

  delete process.env.HAXR_DATABASE_BACKEND;
  if (getDatabaseBackend() !== "neon") throw new Error("database_backend_not_neon");

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) throw new Error("DATABASE_URL_missing");

  const sql = neon(databaseUrl);
  const photoId = randomUUID();
  const sha = (process.env.VERCEL_GIT_COMMIT_SHA ?? "local").slice(0, 12);
  const testSecret = `qa-${sha}-${randomUUID()}`;
  const originalSecret = process.env.ADMIN_MODERATION_SECRET;
  let failure: Error | null = null;

  const status = async (): Promise<string | null> => {
    const rows = (await sql`
      SELECT moderation_status
      FROM public.wedding_photos
      WHERE id = ${photoId}::uuid
    `) as Array<{ moderation_status: string }>;
    return rows[0]?.moderation_status ?? null;
  };

  const request = (input: {
    action?: string;
    bearer?: string;
    bodySecret?: string;
  }): Request =>
    new Request("https://preview.local/api/memories/moderate", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(input.bearer ? { authorization: `Bearer ${input.bearer}` } : {}),
      },
      body: JSON.stringify({
        slug: SLUG,
        photoId,
        action: input.action ?? "approve",
        ...(input.bodySecret ? { secretKey: input.bodySecret } : {}),
      }),
    });

  try {
    await sql`
      INSERT INTO public.wedding_photos (
        id,
        invitation_slug,
        storage_path,
        original_filename,
        content_type,
        file_size_bytes,
        guest_name,
        caption,
        challenge_id,
        table_id,
        participant_id,
        moderation_status
      ) VALUES (
        ${photoId}::uuid,
        ${SLUG},
        ${`${SLUG}/auth-canary/${photoId}/original.jpg`},
        'original.jpg',
        'image/jpeg',
        4,
        ${`Auth QA ${sha}`},
        'Temporary moderation authorization canary',
        NULL,
        NULL,
        NULL,
        'pending'
      )
    `;

    delete process.env.ADMIN_MODERATION_SECRET;
    const unconfigured = await moderatePost(request({}));
    if (unconfigured.status !== 503 || (await status()) !== "pending") {
      throw new Error("missing_server_secret_did_not_fail_closed");
    }

    process.env.ADMIN_MODERATION_SECRET = testSecret;

    const missingCredential = await moderatePost(request({}));
    if (missingCredential.status !== 401 || (await status()) !== "pending") {
      throw new Error("missing_credential_not_blocked");
    }

    const invalidCredential = await moderatePost(
      request({ bearer: `${testSecret}-wrong` })
    );
    if (invalidCredential.status !== 401 || (await status()) !== "pending") {
      throw new Error("invalid_credential_not_blocked");
    }

    const invalidAction = await moderatePost(
      request({ action: "archive", bearer: testSecret })
    );
    if (invalidAction.status !== 400 || (await status()) !== "pending") {
      throw new Error("invalid_action_not_blocked");
    }

    const validBearer = await moderatePost(request({ bearer: testSecret }));
    if (validBearer.status !== 200 || (await status()) !== "approved") {
      throw new Error("valid_bearer_not_authorized");
    }

    await sql`
      UPDATE public.wedding_photos
      SET moderation_status = 'pending'
      WHERE id = ${photoId}::uuid
    `;

    const validLegacyBody = await moderatePost(
      request({ action: "reject", bodySecret: testSecret })
    );
    if (validLegacyBody.status !== 200 || (await status()) !== "rejected") {
      throw new Error("legacy_body_credential_compat_failed");
    }

    console.log(
      "[moderation-auth-canary] no_server_secret=503 missing_credential=401 invalid_credential=401 invalid_action=400 bearer=200 legacy_body=200 mutation_guard=true"
    );
  } catch (error) {
    failure = error instanceof Error ? error : new Error("unknown_canary_failure");
    console.error(`[moderation-auth-canary] failed=${failure.message}`);
  } finally {
    if (originalSecret === undefined) delete process.env.ADMIN_MODERATION_SECRET;
    else process.env.ADMIN_MODERATION_SECRET = originalSecret;

    try {
      await sql`DELETE FROM public.wedding_photos WHERE id = ${photoId}::uuid`;
      const residue = (await sql`
        SELECT count(*)::int AS rows
        FROM public.wedding_photos
        WHERE id = ${photoId}::uuid
      `) as Array<{ rows: number }>;
      console.log(
        `[moderation-auth-canary] cleanup photo_rows=${Number(residue[0]?.rows ?? 0)}`
      );
      if (Number(residue[0]?.rows ?? 0) !== 0) {
        failure ??= new Error("cleanup_verification_failed");
      }
    } catch (cleanupError) {
      const cleanupFailure = cleanupError instanceof Error ? cleanupError : new Error("cleanup_failed");
      console.error(`[moderation-auth-canary] cleanup_failed=${cleanupFailure.message}`);
      failure ??= cleanupFailure;
    }
  }

  if (failure) throw failure;
}

main().catch((error) => {
  console.error(
    `[moderation-auth-canary] fatal=${error instanceof Error ? error.message : "unknown"}`
  );
  process.exit(3);
});
