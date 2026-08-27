import { neon } from "@neondatabase/serverless";
import { createPhotoUploadIntent } from "../lib/jessica-samuel-wedding/photo-wall/upload-intent.ts";
import {
  completePhotoUpload,
  listApprovedPublicPhotos,
} from "../lib/jessica-samuel-wedding/photo-wall/gallery.ts";
import { removeMemoryObject } from "../lib/memories/storage.ts";
import { getDatabaseBackend } from "../lib/database/backend.ts";
import { getStorageBackend } from "../lib/storage/backend.ts";
import { publicMutationRateLimitKey } from "../lib/security/mutation-rate-limit.ts";

const TARGET_BRANCH = "migration/supabase-to-neon";
const PUBLIC_SLUG = "jessicasamuelwedding";
const STORAGE_SLUG = "jessica-samuel";
const BUCKET = "wedding-photos";
const JPEG_BYTES = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);

async function main(): Promise<void> {
  if (
    process.env.VERCEL_ENV !== "preview" ||
    process.env.VERCEL_GIT_COMMIT_REF !== TARGET_BRANCH
  ) {
    console.log("[photo-wall-blob-canary] skipped outside dedicated migration Preview");
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
  const guestName = `PhotoWall QA ${sha}`;
  const caption = `Photo Wall Blob canary ${sha}`;
  const userAgent = `haxr-photo-wall-canary/${sha}`;
  const headers = {
    "x-forwarded-for": "198.51.100.78",
    "user-agent": userAgent,
    "content-type": "application/json",
  };

  const intentRequest = new Request("https://preview.local/api/wedding-photos/upload-intent", {
    method: "POST",
    headers,
  });
  const completeRequest = new Request("https://preview.local/api/wedding-photos/complete", {
    method: "POST",
    headers,
  });

  const intentRateKey = publicMutationRateLimitKey({
    scope: "photo-wall",
    slug: PUBLIC_SLUG,
    action: "upload-intent",
    request: intentRequest,
  });
  const completeRateKey = publicMutationRateLimitKey({
    scope: "photo-wall",
    slug: PUBLIC_SLUG,
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
    const intent = await createPhotoUploadIntent(
      {
        slug: STORAGE_SLUG,
        fileName: `photo-wall-canary-${sha}.jpg`,
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

    if (!storagePath.startsWith(`${STORAGE_SLUG}/`)) {
      throw new Error("storage_path_isolation_failed");
    }

    const persistedIntent = (await sql`
      SELECT status, invitation_slug, bucket_name
      FROM public.photo_upload_intents
      WHERE id = ${photoId}::uuid
    `) as Array<{ status: string; invitation_slug: string; bucket_name: string }>;

    if (
      persistedIntent.length !== 1 ||
      persistedIntent[0]?.status !== "pending" ||
      persistedIntent[0]?.invitation_slug !== STORAGE_SLUG ||
      persistedIntent[0]?.bucket_name !== BUCKET
    ) {
      throw new Error("intent_neon_verification_failed");
    }

    const uploadResponse = await fetch(intent.uploadUrl, {
      method: "PUT",
      headers: { "content-type": "image/jpeg" },
      body: JPEG_BYTES,
    });
    if (!uploadResponse.ok) {
      throw new Error(`blob_put_failed:${uploadResponse.status}`);
    }

    const completed = await completePhotoUpload(
      STORAGE_SLUG,
      photoId,
      completeRequest,
      { guestName, caption }
    );
    if (!completed.success) {
      throw new Error(`complete_failed:${completed.code ?? "unknown"}`);
    }

    const pending = (await sql`
      SELECT moderation_status, storage_path, file_size_bytes
      FROM public.wedding_photos
      WHERE id = ${photoId}::uuid
        AND invitation_slug = ${STORAGE_SLUG}
    `) as Array<{
      moderation_status: string;
      storage_path: string;
      file_size_bytes: number;
    }>;

    if (
      pending.length !== 1 ||
      pending[0]?.moderation_status !== "pending" ||
      pending[0]?.storage_path !== storagePath ||
      Number(pending[0]?.file_size_bytes) !== JPEG_BYTES.byteLength
    ) {
      throw new Error("pending_photo_neon_verification_failed");
    }

    await sql`
      UPDATE public.wedding_photos
      SET moderation_status = 'approved', approved_at = now(), rejected_at = NULL
      WHERE id = ${photoId}::uuid
        AND invitation_slug = ${STORAGE_SLUG}
    `;

    const gallery = await listApprovedPublicPhotos(STORAGE_SLUG);
    const item = gallery.find((photo) => photo.id === photoId);
    if (!item?.signedUrl) {
      throw new Error("approved_gallery_signed_url_missing");
    }

    const readResponse = await fetch(item.signedUrl);
    if (!readResponse.ok) {
      throw new Error(`signed_read_failed:${readResponse.status}`);
    }
    const readBytes = new Uint8Array(await readResponse.arrayBuffer());
    if (
      readBytes.byteLength !== JPEG_BYTES.byteLength ||
      !readBytes.every((value, index) => value === JPEG_BYTES[index])
    ) {
      throw new Error("blob_roundtrip_bytes_mismatch");
    }

    console.log(
      "[photo-wall-blob-canary] intent=true put=true complete=true neon=true approve=true gallery=true signed_read=true bytes=true"
    );
  } catch (error) {
    failure = error instanceof Error ? error : new Error("unknown_canary_failure");
    console.error(`[photo-wall-blob-canary] failed=${failure.message}`);
  } finally {
    try {
      if (!photoId) {
        const afterRows = (await sql`
          SELECT id::text AS id, storage_path
          FROM public.photo_upload_intents
          WHERE invitation_slug = ${STORAGE_SLUG}
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
        `[photo-wall-blob-canary] cleanup photo_rows=${residue?.photo_rows ?? 0} intent_rows=${residue?.intent_rows ?? 0} rate_rows=${residue?.rate_rows ?? 0}`
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
      console.error(`[photo-wall-blob-canary] cleanup_failed=${cleanupFailure.message}`);
      failure ??= cleanupFailure;
    }
  }

  if (failure) throw failure;
}

main().catch((error) => {
  console.error(
    `[photo-wall-blob-canary] fatal=${error instanceof Error ? error.message : "unknown"}`
  );
  process.exit(3);
});
