export type DatabaseBackend = "supabase" | "neon";

/**
 * Safe-by-default database selector.
 * Production keeps the existing Supabase path unless Neon is explicitly enabled.
 */
export function getDatabaseBackend(): DatabaseBackend {
  const configured = process.env.HAXR_DATABASE_BACKEND?.trim().toLowerCase();
  return configured === "neon" ? "neon" : "supabase";
}

export function isNeonDatabaseBackend(): boolean {
  return getDatabaseBackend() === "neon";
}
