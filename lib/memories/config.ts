import { resolveSlug } from "@lib/engine";
import { getInvitation, type InvitationConfig, type MemoriesVariant } from "@data/invitations";

/**
 * Configuração genérica de Memórias — multi-evento.
 *
 * Resolve a config de memórias a partir de qualquer slug
 * com `features.memories.enabled = true`.
 *
 * O slug canónico serve como:
 *  - prefixo de storage path
 *  - filtro de `invitation_slug` na DB
 *  - scope de rate-limiting
 */

export interface MemoriesEventConfig {
  enabled: true;
  variant: MemoriesVariant;
  invitationSlug: string;
  bucket: string;
  opensAt: string | null;
  closesAt: string | null;
  moderationRequired: boolean;
  publicGalleryEnabled: boolean;
  maxImageFileSizeBytes: number;
  maxVideoFileSizeBytes: number;
  acceptedImageMimeTypes: readonly string[];
  acceptedVideoMimeTypes: readonly string[];
  maxCaptionLength: number;
  maxGuestNameLength: number;
  signedUrlTtlSeconds: number;
  uploadIntentTtlSeconds: number;
}

/** Defaults partilhados por todos os eventos */
const MEMORIES_DEFAULTS = {
  bucket: "wedding-photos",
  opensAt: null,
  closesAt: null,
  moderationRequired: true,
  publicGalleryEnabled: true,
  maxImageFileSizeBytes: 25 * 1024 * 1024,
  maxVideoFileSizeBytes: 100 * 1024 * 1024,
  acceptedImageMimeTypes: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
  ] as const,
  acceptedVideoMimeTypes: [
    "video/mp4",
    "video/quicktime",
    "video/webm",
  ] as const,
  maxCaptionLength: 200,
  maxGuestNameLength: 80,
  signedUrlTtlSeconds: 300,
  uploadIntentTtlSeconds: 15 * 60,
} as const;

export const MEMORIES_ACCEPTED_MIME_TYPES = [
  ...MEMORIES_DEFAULTS.acceptedImageMimeTypes,
  ...MEMORIES_DEFAULTS.acceptedVideoMimeTypes,
] as const;

export type MemoriesMimeType = (typeof MEMORIES_ACCEPTED_MIME_TYPES)[number];

/**
 * Resolve a config de memórias para um dado slug.
 * Retorna `null` se o slug não existir, não estiver activo,
 * ou não tiver `features.memories.enabled`.
 */
export function resolveMemoriesConfig(slug: string): MemoriesEventConfig | null {
  const canonical = resolveSlug(slug);
  if (!canonical) return null;

  const invitation = getInvitation(canonical);
  if (!invitation || invitation.status !== "active") return null;
  if (!invitation.features?.memories?.enabled) return null;

  return {
    enabled: true,
    variant: invitation.features.memories.variant,
    invitationSlug: invitation.slug,
    ...MEMORIES_DEFAULTS,
  };
}

/**
 * Verifica se um slug tem memórias activadas.
 * Atalho para quando não precisas da config completa.
 */
export function isMemoriesEnabledForSlug(slug: string): boolean {
  return resolveMemoriesConfig(slug) !== null;
}

/**
 * Retorna o convite completo se tem memórias activadas.
 */
export function getMemoriesInvitation(slug: string): InvitationConfig | null {
  const canonical = resolveSlug(slug);
  if (!canonical) return null;
  const invitation = getInvitation(canonical);
  if (!invitation || invitation.status !== "active") return null;
  if (!invitation.features?.memories?.enabled) return null;
  return invitation;
}
