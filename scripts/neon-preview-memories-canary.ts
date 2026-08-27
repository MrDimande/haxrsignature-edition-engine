import { neon } from "@neondatabase/serverless";

const TARGET_BRANCH = "migration/supabase-to-neon";
const SLUG = "jessicasamuelwedding";
const PARTICIPANT_ID = "29ba476f-3043-45bd-87d5-ed2f43cbbb2d";
const PHOTO_ID = "0b7a55a0-42e0-4f40-bb2e-9e05f992437b";
const EXPECTED_CHALLENGES = ["01", "02", "04", "10", "11"];

async function jsonBody(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

async function main(): Promise<void> {
  if (
    process.env.VERCEL_ENV !== "preview" ||
    process.env.VERCEL_GIT_COMMIT_REF !== TARGET_BRANCH
  ) {
    console.log("[neon-memories-canary] skipped outside dedicated migration Preview");
    return;
  }

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) throw new Error("DATABASE_URL missing");

  delete process.env.HAXR_DATABASE_BACKEND;
  const secret = `neon-memories-canary-${(
    process.env.VERCEL_GIT_COMMIT_SHA ?? "local"
  ).slice(0, 10)}`;
  process.env.ADMIN_MODERATION_SECRET = secret;

  const sql = neon(databaseUrl);

  const originalRows = await sql`
    SELECT moderation_status
    FROM public.wedding_photos
    WHERE id = ${PHOTO_ID}::uuid
      AND invitation_slug = ${SLUG}
  `;
  if (originalRows.length !== 1) throw new Error("test_photo_missing");
  const originalStatus = String(originalRows[0]?.moderation_status ?? "");
  if (originalStatus !== "pending") {
    throw new Error(`unexpected_original_status:${originalStatus}`);
  }

  async function leaderboard(mode: "provisional" | "final") {
    const { GET } = await import("../app/api/memories/leaderboard/route.ts");
    const request = new Request(
      `https://preview.local/api/memories/leaderboard?slug=${SLUG}&mode=${mode}`,
      { headers: { authorization: `Bearer ${secret}` } }
    );
    const response = await GET(request);
    return { status: response.status, body: await jsonBody(response) };
  }

  async function progress() {
    const { GET } = await import("../app/api/memories/progress/route.ts");
    const request = new Request(
      `https://preview.local/api/memories/progress?slug=${SLUG}&participantId=${PARTICIPANT_ID}`
    );
    const response = await GET(request);
    return { status: response.status, body: await jsonBody(response) };
  }

  async function moderate(action: "approve" | "reject") {
    const { POST } = await import("../app/api/memories/moderate/route.ts");
    const request = new Request("https://preview.local/api/memories/moderate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug: SLUG, photoId: PHOTO_ID, action, secretKey: secret }),
    });
    const response = await POST(request);
    return { status: response.status, body: await jsonBody(response) };
  }

  let failure: Error | null = null;

  try {
    const provisionalBefore = await leaderboard("provisional");
    if (provisionalBefore.status !== 200 || provisionalBefore.body.success !== true) {
      throw new Error(`provisional_before_failed:${provisionalBefore.status}`);
    }
    const provisionalEntries = Array.isArray(provisionalBefore.body.leaderboard)
      ? (provisionalBefore.body.leaderboard as Array<Record<string, unknown>>)
      : [];
    const qaEntry = provisionalEntries.find((entry) => entry.displayName === "QA PR39");
    if (!qaEntry || Number(qaEntry.completed) !== 5 || Number(qaEntry.totalUploads) !== 5) {
      throw new Error("provisional_leaderboard_verification_failed");
    }

    const finalBefore = await leaderboard("final");
    if (finalBefore.status !== 200 || finalBefore.body.success !== true) {
      throw new Error(`final_before_failed:${finalBefore.status}`);
    }
    const finalBeforeEntries = Array.isArray(finalBefore.body.leaderboard)
      ? (finalBefore.body.leaderboard as Array<Record<string, unknown>>)
      : [];
    if (finalBeforeEntries.some((entry) => entry.displayName === "QA PR39")) {
      throw new Error("pending_photo_leaked_into_final_leaderboard");
    }

    const progressResult = await progress();
    if (progressResult.status !== 200 || progressResult.body.success !== true) {
      throw new Error(`progress_failed:${progressResult.status}`);
    }
    const ids = Array.isArray(progressResult.body.completedChallengeIds)
      ? [...(progressResult.body.completedChallengeIds as string[])].sort()
      : [];
    if (
      Number(progressResult.body.completedCount) !== 5 ||
      JSON.stringify(ids) !== JSON.stringify(EXPECTED_CHALLENGES)
    ) {
      throw new Error("progress_verification_failed");
    }

    const approve = await moderate("approve");
    if (approve.status !== 200 || approve.body.success !== true) {
      throw new Error(`moderation_failed:${approve.status}`);
    }

    const approvedRows = await sql`
      SELECT moderation_status
      FROM public.wedding_photos
      WHERE id = ${PHOTO_ID}::uuid
        AND invitation_slug = ${SLUG}
    `;
    if (approvedRows[0]?.moderation_status !== "approved") {
      throw new Error("moderation_persist_verification_failed");
    }

    const finalAfter = await leaderboard("final");
    if (finalAfter.status !== 200 || finalAfter.body.success !== true) {
      throw new Error(`final_after_failed:${finalAfter.status}`);
    }
    const finalAfterEntries = Array.isArray(finalAfter.body.leaderboard)
      ? (finalAfter.body.leaderboard as Array<Record<string, unknown>>)
      : [];
    const finalQa = finalAfterEntries.find((entry) => entry.displayName === "QA PR39");
    if (!finalQa || Number(finalQa.completed) !== 1 || Number(finalQa.totalUploads) !== 1) {
      throw new Error("final_leaderboard_after_moderation_failed");
    }

    console.log(
      "[neon-memories-canary] leaderboard_provisional=true progress=true moderation=true leaderboard_final=true"
    );
  } catch (error) {
    failure = error instanceof Error ? error : new Error("unknown");
    console.error(`[neon-memories-canary] failed=${failure.message}`);
  } finally {
    try {
      await sql`
        UPDATE public.wedding_photos
        SET moderation_status = ${originalStatus}
        WHERE id = ${PHOTO_ID}::uuid
          AND invitation_slug = ${SLUG}
      `;
      const restored = await sql`
        SELECT moderation_status
        FROM public.wedding_photos
        WHERE id = ${PHOTO_ID}::uuid
          AND invitation_slug = ${SLUG}
      `;
      console.log(
        `[neon-memories-canary] cleanup status=${String(
          restored[0]?.moderation_status ?? "missing"
        )}`
      );
      if (restored[0]?.moderation_status !== originalStatus) {
        failure ??= new Error("moderation_restore_failed");
      }
    } catch (cleanupError) {
      const err = cleanupError instanceof Error ? cleanupError : new Error("cleanup_failed");
      console.error(`[neon-memories-canary] cleanup_failed=${err.name}`);
      failure ??= err;
    }
  }

  if (failure) throw failure;
}

main().catch((error) => {
  console.error(
    `[neon-memories-canary] fatal=${error instanceof Error ? error.message : "unknown"}`
  );
  process.exit(3);
});
