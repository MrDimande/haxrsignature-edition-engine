export type StorageBackend = "supabase" | "vercel-blob";

const BLOB_MIGRATION_BRANCH = "migration/supabase-to-neon";

function isMigrationPreview(): boolean {
  return (
    process.env.VERCEL_ENV === "preview" &&
    process.env.VERCEL_GIT_COMMIT_REF === BLOB_MIGRATION_BRANCH
  );
}

/**
 * Safe-by-default object storage selector.
 * - Explicit HAXR_STORAGE_BACKEND always wins.
 * - The dedicated migration Preview auto-selects Vercel Blob.
 * - Every other environment, including Production, defaults to Supabase Storage.
 */
export function getStorageBackend(): StorageBackend {
  const configured = process.env.HAXR_STORAGE_BACKEND?.trim().toLowerCase();

  if (configured === "vercel-blob" || configured === "blob") {
    return "vercel-blob";
  }
  if (configured === "supabase") return "supabase";

  return isMigrationPreview() ? "vercel-blob" : "supabase";
}

export function isVercelBlobStorageBackend(): boolean {
  return getStorageBackend() === "vercel-blob";
}
