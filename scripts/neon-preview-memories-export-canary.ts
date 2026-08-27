import JSZip from "jszip";
import { neon } from "@neondatabase/serverless";
import { createMemoryUploadIntent, completeMemoryUpload } from "../lib/memories/upload.ts";
import { generateMemoriesZip } from "../lib/memories/export.ts";
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
    console.log("[memories-export-canary] skipped outside dedicated migration Preview");
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
  const guestName = `Zip QA ${sha}`;
  const caption = `ZIP export canary ${sha}`;
  const headers = {
    "x-forwarded-for": "198.51.100.78",
    "user-agent": `haxr-zip-export-canary/${sha}`,
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
  let photoId: string | null = null;
  let storagePath: string | null = null;
  let failure: Error | null = null;

  try {
    const intent = await createMemoryUploadIntent(
      {
        slug: SLUG,
        fileName: `zip-export-canary-${sha}.jpg`,
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

    const zipBuffer = await generateMemoriesZip(SLUG);
    if (!zipBuffer?.byteLength) throw new Error("zip_missing");

    const zip = await JSZip.loadAsync(zipBuffer);
    const shortId = photoId.slice(0, 8);
    const entry = Object.values(zip.files).find(
      (file) => !file.dir && file.name.startsWith(`Momentos_Espontaneos/${shortId}_`)
    );
    if (!entry) throw new Error("zip_entry_missing");

    const exportedBytes = await entry.async("uint8array");
    if (
      exportedBytes.byteLength !== JPEG_BYTES.byteLength ||
      !exportedBytes.every((value, index) => value === JPEG_BYTES[index])
    ) {
      throw new Error("zip_bytes_mismatch");
    }

    console.log(
      "[memories-export-canary] intent=true put=true complete=true neon_reader=true blob_download=true zip=true entry=true bytes=true"
    );
  } catch (error) {
    failure = error instanceof Error ? error : new Error("unknown_canary_failure");
    console.error(`[memories-export-canary] failed=${failure.message}`);
  } finally {
    try {
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
        `[memories-export-canary] cleanup photo_rows=${residue?.photo_rows ?? 0} intent_rows=${residue?.intent_rows ?? 0} rate_rows=${residue?.rate_rows ?? 0}`
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
      const cleanupFailure = cleanupError instanceof Error ? cleanupError : new Error("cleanup_failed");
      console.error(`[memories-export-canary] cleanup_failed=${cleanupFailure.message}`);
      failure ??= cleanupFailure;
    }
  }

  if (failure) throw failure;
}

main().catch((error) => {
  console.error(
    `[memories-export-canary] fatal=${error instanceof Error ? error.message : "unknown"}`
  );
  process.exit(3);
});
