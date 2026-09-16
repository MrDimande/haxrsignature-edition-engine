import type { PublicMemoryPhotoRow } from "@lib/db/types";
import { assertCanonicalStoragePath } from "./storage/path-security";

/**
 * Defesa adicional em profundidade antes de assinar media,
 * garantindo paridade canónica entre Moments, Live Wall e Recap.
 */
export function isCanonicalPublicMemory(
  row: { id: string; storage_path: string; moderation_status: string; invitation_slug?: string | null },
  slug?: string
): boolean {
  if (row.moderation_status !== "approved") return false;
  if (slug && row.invitation_slug && row.invitation_slug !== slug) return false;
  try {
    assertCanonicalStoragePath(row.storage_path);
    const [pathSlug, photoId] = row.storage_path.split("/");
    if (slug && pathSlug !== slug) return false;
    return photoId.toLowerCase() === row.id.toLowerCase();
  } catch {
    return false;
  }
}

/** Defesa adicional antes de assinar media, mesmo se um adapter devolver linhas indevidas. */
export function isPublishedMemoryForEvent(row: PublicMemoryPhotoRow, slug: string): boolean {
  return isCanonicalPublicMemory(row, slug);
}

/** Predicado canónico unificado para o Recap pós-evento */
export function isEligibleForRecap(
  row: { id: string; storage_path: string; moderation_status: string; invitation_slug?: string | null },
  slug?: string
): boolean {
  return isCanonicalPublicMemory(row, slug);
}

