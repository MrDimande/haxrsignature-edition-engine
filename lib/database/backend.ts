export type DatabaseBackend = "supabase" | "neon";

const NEON_MIGRATION_BRANCH = "migration/supabase-to-neon";

function isMigrationPreview(): boolean {
  return (
    process.env.VERCEL_ENV === "preview" &&
    process.env.VERCEL_GIT_COMMIT_REF === NEON_MIGRATION_BRANCH
  );
}

/**
 * Safe-by-default database selector.
 * - Explicit HAXR_DATABASE_BACKEND always wins.
 * - The dedicated migration Preview auto-selects Neon.
 * - Every other environment, including Production, defaults to Supabase.
 */
export function getDatabaseBackend(): DatabaseBackend {
  const configured = process.env.HAXR_DATABASE_BACKEND?.trim().toLowerCase();

  if (configured === "neon") return "neon";
  if (configured === "supabase") return "supabase";

  return isMigrationPreview() ? "neon" : "supabase";
}

export function isNeonDatabaseBackend(): boolean {
  return getDatabaseBackend() === "neon";
}
