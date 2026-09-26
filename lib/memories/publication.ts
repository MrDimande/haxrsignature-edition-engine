import type { PublicMemoryPhotoRow } from "@lib/db/types";
import { assertCanonicalStoragePath } from "./storage/path-security";
import type { MemoriesVisibility } from "./session-policy";

export interface InitialMediaModerationDecision {
  moderationStatus: "approved" | "pending";
  approvedAt: Date | null;
}

/**
 * Resolve autoritativamente o estado inicial de moderação da mídia com base na visibilidade da experiência.
 * - community: auto-publicação imediata para participantes autenticados com mídia válida.
 * - moderated: requer moderação administrativa prévia antes de aparecer na comunidade.
 * - private_to_couple: preserva a semântica privada, retido até decisão do casal/organizador.
 */
export function resolveInitialMediaModerationStatus(
  visibility: MemoriesVisibility | string,
  now: Date = new Date()
): InitialMediaModerationDecision {
  if (visibility === "community") {
    return {
      moderationStatus: "approved",
      approvedAt: now,
    };
  }

  return {
    moderationStatus: "pending",
    approvedAt: null,
  };
}

export type ExperienceValidationOutcome =
  | { valid: true; visibility: string }
  | { valid: false; code: "EXPERIENCE_NOT_FOUND" | "EXPERIENCE_INCONSISTENT" | "EXPERIENCE_INACTIVE"; error: string };

/**
 * Valida a experiência de memórias sob transacção para finalização de envio de mídia.
 * Aplica regra estrita fail-closed contra inconsistências entre o intent emitido e o evento/experiência autoritativos.
 */
export function validateExperienceForUploadCompletion(
  experienceRow: { id: string; event_id: string; status: string; visibility: string } | null | undefined,
  expectedExperienceId: string,
  expectedEventId: string | null
): ExperienceValidationOutcome {
  if (!experienceRow) {
    return {
      valid: false,
      code: "EXPERIENCE_NOT_FOUND",
      error: "Experiência de memórias não encontrada.",
    };
  }

  if (experienceRow.id !== expectedExperienceId || (expectedEventId && experienceRow.event_id !== expectedEventId)) {
    return {
      valid: false,
      code: "EXPERIENCE_INCONSISTENT",
      error: "Inconsistência entre evento e experiência.",
    };
  }

  if (experienceRow.status !== "active") {
    return {
      valid: false,
      code: "EXPERIENCE_INACTIVE",
      error: "Experiência de memórias inactiva.",
    };
  }

  return {
    valid: true,
    visibility: experienceRow.visibility,
  };
}


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

