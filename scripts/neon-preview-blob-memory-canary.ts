import { neon } from "@neondatabase/serverless";
import { createMemoryUploadIntent, completeMemoryUpload } from "../lib/memories/upload.ts";
import { listMemories } from "../lib/memories/gallery.ts";
import { removeMemoryObject } from "../lib/memories/storage.ts";
import { getDatabaseBackend } from "../lib/database/backend.ts";
import { getStorageBackend } from "../lib/storage/backend.ts";
import { publicMutationRateLimitKey } from "../lib/security/mutation-rate-limit.ts";

const TARGET_BRANCH = "migration/supabase-to-neon";
const SLUG = "jessicasamuelwedding";
const BUCKET = "wedding-photos";
const JPEG_BYTES = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);

async function main(): Promise<void> {
  if (
    process.env.VERCEL_ENV !== "preview" ||
    process.env.VERCEL_GIT_COMMIT_REF !== TARGET_BRANCH
  ) {
    console.log("[blob-memory-canary] skipped outside dedicated migration Preview");
    return;
  }

  delete process.env.HAXR_DATABASE_BACKEND;
  delete process.env.HAXR_STORAGE_BACKEND;

  if (getDatabaseBackend() !== "neon") throw new Error("database_backend_not_neon");
  if (getStorageBackend() !== "vercel-blob") throw new Error("storage_backend_not_blob");

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) throw new Error("DATABASE_URL_missing");
  if (!process.env.BLOB_STORE_ID?.trim()) throw new Error("BLOB_STORE_ID_missing");
  if (!process.env.VERCEL_OIDC_TOKEN?.trim()) throw new Error("VERCEL_OIDC_TOKEN_missing");

  const sha = (process.env.VERCEL_GIT_COMMIT_SHA ?? "local").slice(0, 12);
  const guestName = `Blob QA ${sha}`;
  const caption = `Neon Blob canary ${sha}`;
  const clientIp = "198.51.100.77";
  const userAgent = `haxr-blob-canary/${sha}`;
  const headers = {
    "x-forwarded-for": clientIp,
    "user-agent": userAgent,
    "content-type": "application/json",
  };

  const intentRequest = new Request("https://preview.local/api/memories/upload-intent", {
    method: "POST",
    headers,
  });
  const completeRequest = new Request("https://preview.local/api/memories/complete", {
    method: "POST",
    headers,
  });

  const intentRateKey = publicMutationRateLimitKey({
    scope: "memories",
    slug: SLUG,
    action: "upload-intent",
    request: intentRequest,
  });
  const completeRateKey = publicMutationRateLimitKey({
    scope: "memories",
    slug: SLUG,
    action: "complete",
    request: completeRequest,
  });

  const sql = neon(databaseUrl);
  const baselineRows = (await sql`
    SELECT id::text AS id
    FROM public.photo_upload_intents
  `) as Array<{ id: string }>;
  const baselineIds = new Set(baselineRows.map((row) => row.id));

  let photoId: string | null = null;
  let storagePath: string | null = null;
  let failure: Error | null = null;

  try {
    const intent = await createMemoryUploadIntent(
      {
        slug: SLUG,
        fileName: `blob-canary-${sha}.jpg`,
        contentType: "image/jpeg",
        fileSizeBytes: JPEG_BYTES.byteLength,
        guestName,
        caption,
      },
      intentRequest
    );

    if (!intent.success) {
      throw new Error(`intent_failed:${intent.code ?? "unknown"}`);
    }

    photoId = intent.photoId;
    storagePath = intent.storagePath;

    if (!storagePath.startsWith(`${SLUG}/`)) {
      throw new Error("storage_path_isolation_failed");
    }

    const pending = (await sql`
      SELECT status
      FROM public.photo_upload_intents
      WHERE id = ${photoId}::uuid
        AND invitation_slug = ${SLUG}
    `) as Array<{ status: string }>;
    if (pending.length !== 1 || pending[0]?.status !== "pending") {
      throw new Error("intent_not_persisted_in_neon");
    }

    const uploadResponse = await fetch(intent.uploadUrl, {
      method: "PUT",
      headers: { "content-type": "image/jpeg" },
      body: JPEG_BYTES,
    });
    if (!uploadResponse.ok) {
      throw new Error(`blob_put_failed:${uploadResponse.status}`);
    }

    const complete = await completeMemoryUpload(
      SLUG,
      photoId,
      completeRequest,
      { guestName, caption }
    );
    if (!complete.success) {
      throw new Error(`complete_failed:${complete.code ?? "unknown"}`);
    }

    const persisted = (await sql`
      SELECT
        p.moderation_status,
        p.storage_path,
        p.file_size_bytes,
        i.status AS intent_status
      FROM public.wedding_photos p
      JOIN public.photo_upload_intents i ON i.id = p.id
      WHERE p.id = ${photoId}::uuid
        AND p.invitation_slug = ${SLUG}
    `) as Array<{
      moderation_status: string;
      storage_path: string;
      file_size_bytes: number;
      intent_status: string;
    }>;

    if (
      persisted.length !== 1 ||
      persisted[0]?.moderation_status !== "pending" ||
      persisted[0]?.intent_status !== "consumed" ||
      Number(persisted[0]?.file_size_bytes) !== JPEG_BYTES.byteLength ||
      persisted[0]?.storage_path !== storagePath
    ) {
      throw new Error("neon_persistence_verification_failed");
    }

    const gallery = await listMemories(SLUG);
    const galleryItem = gallery.find((item) => item.id === photoId);
    if (!galleryItem?.signedUrl) {
      throw new Error("gallery_signed_read_missing");
    }

    const readResponse = await fetch(galleryItem.signedUrl);
    if (!readResponse.ok) {
      throw new Error(`blob_signed_read_failed:${readResponse.status}`);
    }
    const readBytes = new Uint8Array(await readResponse.arrayBuffer());
    if (
      readBytes.byteLength !== JPEG_BYTES.byteLength ||
      !readBytes.every((value, index) => value === JPEG_BYTES[index])
    ) {
      throw new Error("blob_roundtrip_bytes_mismatch");
    }

    console.log(
      "[blob-memory-canary] intent=true put=true complete=true neon=true gallery=true signed_read=true bytes=true"
    );
  } catch (error) {
    failure = error instanceof Error ? error : new Error("unknown_canary_failure");
    console.error(`[blob-memory-canary] failed=${failure.message}`);
  } finally {
    try {
      if (!photoId) {
        const afterRows = (await sql`
          SELECT id::text AS id, storage_path
          FROM public.photo_upload_intents
          WHERE invitation_slug = ${SLUG}
        `) as Array<{ id: string; storage_path: string }>;
        const created = afterRows.filter((row) => !baselineIds.has(row.id));
        if (created.length === 1) {
          photoId = created[0]!.id;
          storagePath = created[0]!.storage_path;
        }
      }

      if (storagePath) {
        await removeMemoryObject({ bucketName: BUCKET, storagePath });
      }

      if (photoId) {
        await sql`DELETE FROM public.wedding_photos WHERE id = ${photoId}::uuid`;
        await sql`DELETE FROM public.photo_upload_intents WHERE id = ${photoId}::uuid`;
      }

      await sql`
        DELETE FROM public.api_rate_limits
        WHERE bucket_key IN (${intentRateKey}, ${completeRateKey})
      `;

      const residue = photoId
        ? ((await sql`
            SELECT
              (SELECT count(*)::int FROM public.wedding_photos WHERE id = ${photoId}::uuid) AS photo_rows,
              (SELECT count(*)::int FROM public.photo_upload_intents WHERE id = ${photoId}::uuid) AS intent_rows,
              (SELECT count(*)::int FROM public.api_rate_limits WHERE bucket_key IN (${intentRateKey}, ${completeRateKey})) AS rate_rows
          `) as Array<{ photo_rows: number; intent_rows: number; rate_rows: number }>)[0]
        : null;

      console.log(
        `[blob-memory-canary] cleanup photo_rows=${residue?.photo_rows ?? 0} intent_rows=${residue?.intent_rows ?? 0} rate_rows=${residue?.rate_rows ?? 0}`
      );

      if (
        residue &&
        (Number(residue.photo_rows) !== 0 ||
          Number(residue.intent_rows) !== 0 ||
          Number(residue.rate_rows) !== 0)
      ) {
        failure ??= new Error("cleanup_verification_failed");
      }
    } catch (cleanupError) {
      const cleanupFailure =
        cleanupError instanceof Error ? cleanupError : new Error("cleanup_failed");
      console.error(`[blob-memory-canary] cleanup_failed=${cleanupFailure.message}`);
      failure ??= cleanupFailure;
    }
  }

  if (failure) throw failure;
}

main().catch((error) => {
  console.error(
    `[blob-memory-canary] fatal=${error instanceof Error ? error.message : "unknown"}`
  );
  process.exit(3);
});
