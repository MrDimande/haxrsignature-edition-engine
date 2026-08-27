import { createHash, randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { createAdminClient, isSupabaseConfigured } from "../lib/supabase/server";

const TARGET_BRANCH = "migration/supabase-to-neon";
const SLUG = "jessicasamuelwedding";
const BUCKET = "wedding-photos";
const TEST_IP = "198.51.100.81";
const TEST_UA = "haxr-neon-memories-upload-canary";

function fingerprint(ip: string, userAgent: string): string {
  return createHash("sha256")
    .update(`${ip}|${userAgent}`)
    .digest("hex")
    .slice(0, 32);
}

function rateKey(action: string): string {
  return [
    "edition",
    "public-mutation",
    "memories",
    SLUG,
    action,
    fingerprint(TEST_IP, TEST_UA),
  ].join(":");
}

async function jsonBody(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

async function main(): Promise<void> {
  if (
    process.env.VERCEL_ENV !== "preview" ||
    process.env.VERCEL_GIT_COMMIT_REF !== TARGET_BRANCH
  ) {
    console.log("[neon-memories-upload-canary] skipped outside dedicated migration Preview");
    return;
  }

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) throw new Error("DATABASE_URL missing");
  if (!isSupabaseConfigured()) throw new Error("Supabase Storage credentials missing");

  delete process.env.HAXR_DATABASE_BACKEND;

  const sql = neon(databaseUrl);
  const supabase = createAdminClient();
  const participantId = randomUUID();
  const guestName = `Neon Upload Canary ${(process.env.VERCEL_GIT_COMMIT_SHA ?? "local").slice(0, 8)}`;
  const caption = "Preview storage canary";
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);

  let photoId = "";
  let storagePath = "";
  let failure: Error | null = null;

  async function cleanup(): Promise<void> {
    if (photoId) {
      await sql`DELETE FROM public.wedding_photos WHERE id = ${photoId}::uuid`;
      await sql`DELETE FROM public.photo_upload_intents WHERE id = ${photoId}::uuid`;
      await supabase.from("wedding_photos").delete().eq("id", photoId);
      await supabase.from("photo_upload_intents").delete().eq("id", photoId);
    }

    if (storagePath) {
      await supabase.storage.from(BUCKET).remove([storagePath]);
    }

    await sql`
      DELETE FROM public.api_rate_limits
      WHERE bucket_key IN (${rateKey("upload-intent")}, ${rateKey("complete")})
    `;
  }

  try {
    await cleanup();

    const { POST: uploadIntentPost } = await import(
      "../app/api/memories/upload-intent/route.ts"
    );
    const intentRequest = new Request(
      "https://preview.local/api/memories/upload-intent",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": TEST_IP,
          "user-agent": TEST_UA,
        },
        body: JSON.stringify({
          slug: SLUG,
          fileName: "canary.jpg",
          contentType: "image/jpeg",
          fileSizeBytes: jpeg.byteLength,
          guestName,
          caption,
          challengeId: "03",
          tableId: "QA",
          participantId,
        }),
      }
    );

    const intentResponse = await uploadIntentPost(intentRequest);
    const intentBody = await jsonBody(intentResponse);
    if (intentResponse.status !== 200 || intentBody.success !== true) {
      throw new Error(`intent_failed:${intentResponse.status}:${String(intentBody.code ?? "")}`);
    }

    photoId = String(intentBody.photoId ?? "");
    storagePath = String(intentBody.storagePath ?? "");
    const uploadUrl = String(intentBody.uploadUrl ?? "");
    if (!photoId || !storagePath || !uploadUrl) {
      throw new Error("intent_payload_incomplete");
    }

    const neonIntentRows = await sql`
      SELECT status, invitation_slug, bucket_name, storage_path
      FROM public.photo_upload_intents
      WHERE id = ${photoId}::uuid
    `;
    if (
      neonIntentRows.length !== 1 ||
      neonIntentRows[0]?.status !== "pending" ||
      neonIntentRows[0]?.invitation_slug !== SLUG ||
      neonIntentRows[0]?.bucket_name !== BUCKET ||
      neonIntentRows[0]?.storage_path !== storagePath
    ) {
      throw new Error("neon_intent_verification_failed");
    }

    const { data: supabaseIntentRows, error: supabaseIntentError } = await supabase
      .from("photo_upload_intents")
      .select("id")
      .eq("id", photoId);
    if (supabaseIntentError) throw new Error("supabase_intent_probe_failed");
    if ((supabaseIntentRows ?? []).length !== 0) {
      throw new Error("intent_was_written_to_supabase_db");
    }

    const storageUpload = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": "image/jpeg" },
      body: jpeg,
    });
    if (!storageUpload.ok) {
      const storageError = await storageUpload.text().catch(() => "");
      throw new Error(
        `storage_upload_failed:${storageUpload.status}:${storageError.slice(0, 80)}`
      );
    }

    const { data: downloadedBeforeComplete, error: downloadBeforeError } =
      await supabase.storage.from(BUCKET).download(storagePath);
    if (downloadBeforeError || !downloadedBeforeComplete) {
      throw new Error("storage_object_missing_after_upload");
    }
    const uploadedBytes = new Uint8Array(
      await downloadedBeforeComplete.arrayBuffer()
    );
    if (
      uploadedBytes.byteLength !== jpeg.byteLength ||
      uploadedBytes[0] !== 0xff ||
      uploadedBytes[1] !== 0xd8
    ) {
      throw new Error("storage_object_content_mismatch");
    }

    const { POST: completePost } = await import(
      "../app/api/memories/complete/route.ts"
    );
    const completeRequest = new Request(
      "https://preview.local/api/memories/complete",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": TEST_IP,
          "user-agent": TEST_UA,
        },
        body: JSON.stringify({
          slug: SLUG,
          photoId,
          guestName,
          caption,
          challengeId: "03",
          tableId: "QA",
          participantId,
        }),
      }
    );

    const completeResponse = await completePost(completeRequest);
    const completeBody = await jsonBody(completeResponse);
    if (completeResponse.status !== 200 || completeBody.success !== true) {
      throw new Error(
        `complete_failed:${completeResponse.status}:${String(completeBody.code ?? "")}`
      );
    }

    const neonPhotoRows = await sql`
      SELECT
        invitation_slug,
        storage_path,
        content_type,
        file_size_bytes,
        guest_name,
        caption,
        challenge_id,
        table_id,
        participant_id::text AS participant_id,
        moderation_status
      FROM public.wedding_photos
      WHERE id = ${photoId}::uuid
    `;
    const photo = neonPhotoRows[0];
    if (
      neonPhotoRows.length !== 1 ||
      photo?.invitation_slug !== SLUG ||
      photo?.storage_path !== storagePath ||
      photo?.content_type !== "image/jpeg" ||
      Number(photo?.file_size_bytes) !== jpeg.byteLength ||
      photo?.guest_name !== guestName ||
      photo?.caption !== caption ||
      photo?.challenge_id !== "03" ||
      photo?.table_id !== "QA" ||
      photo?.participant_id !== participantId ||
      photo?.moderation_status !== "pending"
    ) {
      throw new Error("neon_photo_metadata_verification_failed");
    }

    const consumedRows = await sql`
      SELECT status, consumed_at IS NOT NULL AS consumed
      FROM public.photo_upload_intents
      WHERE id = ${photoId}::uuid
    `;
    if (
      consumedRows.length !== 1 ||
      consumedRows[0]?.status !== "consumed" ||
      consumedRows[0]?.consumed !== true
    ) {
      throw new Error("neon_intent_consume_verification_failed");
    }

    const { data: supabasePhotoRows, error: supabasePhotoError } = await supabase
      .from("wedding_photos")
      .select("id")
      .eq("id", photoId);
    if (supabasePhotoError) throw new Error("supabase_photo_probe_failed");
    if ((supabasePhotoRows ?? []).length !== 0) {
      throw new Error("photo_metadata_was_written_to_supabase_db");
    }

    const { GET: galleryGet } = await import("../app/api/memories/route.ts");
    const galleryResponse = await galleryGet(
      new Request(`https://preview.local/api/memories?slug=${SLUG}`)
    );
    const galleryBody = await jsonBody(galleryResponse);
    const memories = Array.isArray(galleryBody.memories)
      ? (galleryBody.memories as Array<Record<string, unknown>>)
      : [];
    const galleryItem = memories.find((item) => item.id === photoId);
    if (
      galleryResponse.status !== 200 ||
      galleryBody.success !== true ||
      !galleryItem ||
      galleryItem.guestName !== guestName ||
      galleryItem.challengeId !== "03"
    ) {
      throw new Error("gallery_neon_metadata_verification_failed");
    }

    const signedReadUrl = String(galleryItem.signedUrl ?? "");
    const signedRead = await fetch(signedReadUrl);
    if (!signedRead.ok) {
      throw new Error(`gallery_signed_read_failed:${signedRead.status}`);
    }
    const signedBytes = new Uint8Array(await signedRead.arrayBuffer());
    if (
      signedBytes.byteLength !== jpeg.byteLength ||
      signedBytes[0] !== 0xff ||
      signedBytes[1] !== 0xd8
    ) {
      throw new Error("gallery_signed_read_content_mismatch");
    }

    const rateRows = await sql`
      SELECT bucket_key, request_count
      FROM public.api_rate_limits
      WHERE bucket_key IN (${rateKey("upload-intent")}, ${rateKey("complete")})
      ORDER BY bucket_key
    `;
    if (
      rateRows.length !== 2 ||
      rateRows.some((row) => Number(row.request_count) !== 1)
    ) {
      throw new Error("upload_rate_limit_verification_failed");
    }

    console.log(
      "[neon-memories-upload-canary] intent_neon=true storage_upload=true complete_neon=true supabase_db_metadata=false gallery_signed_read=true rate_limits=true"
    );
  } catch (error) {
    failure = error instanceof Error ? error : new Error("unknown");
    console.error(`[neon-memories-upload-canary] failed=${failure.message}`);
  } finally {
    try {
      await cleanup();

      const residue = photoId
        ? await sql`
            SELECT
              (SELECT count(*)::int FROM public.photo_upload_intents WHERE id = ${photoId}::uuid) AS intent_rows,
              (SELECT count(*)::int FROM public.wedding_photos WHERE id = ${photoId}::uuid) AS photo_rows,
              (SELECT count(*)::int FROM public.api_rate_limits
                WHERE bucket_key IN (${rateKey("upload-intent")}, ${rateKey("complete")})) AS rate_rows
          `
        : [{ intent_rows: 0, photo_rows: 0, rate_rows: 0 }];

      let storageRows = 0;
      if (storagePath) {
        const pathParts = storagePath.split("/");
        const fileName = pathParts.pop() ?? "";
        const folder = pathParts.join("/");
        const { data: listed, error: listError } = await supabase.storage
          .from(BUCKET)
          .list(folder, { search: fileName, limit: 10 });
        if (listError) throw new Error("storage_cleanup_probe_failed");
        storageRows = (listed ?? []).filter((item) => item.name === fileName).length;
      }

      console.log(
        `[neon-memories-upload-canary] cleanup intent_rows=${Number(
          residue[0]?.intent_rows ?? -1
        )} photo_rows=${Number(residue[0]?.photo_rows ?? -1)} rate_rows=${Number(
          residue[0]?.rate_rows ?? -1
        )} storage_rows=${storageRows}`
      );

      if (
        Number(residue[0]?.intent_rows ?? -1) !== 0 ||
        Number(residue[0]?.photo_rows ?? -1) !== 0 ||
        Number(residue[0]?.rate_rows ?? -1) !== 0 ||
        storageRows !== 0
      ) {
        failure ??= new Error("cleanup_residue_detected");
      }
    } catch (cleanupError) {
      const err =
        cleanupError instanceof Error ? cleanupError : new Error("cleanup_failed");
      console.error(`[neon-memories-upload-canary] cleanup_failed=${err.message}`);
      failure ??= err;
    }
  }

  if (failure) throw failure;
}

main().catch((error) => {
  console.error(
    `[neon-memories-upload-canary] fatal=${
      error instanceof Error ? error.message : "unknown"
    }`
  );
  process.exit(3);
});
