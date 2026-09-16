import { resolveSlug } from "@lib/engine";
import {
  getInvitation,
  type InvitationConfig,
  type MemoriesVariant,
  type InvitationCompetitionConfig,
} from "@data/invitations";

/**
 * Whitelist oficial dos 12 desafios do Plus Memories no servidor.
 */
export const PLUS_MEMORIES_CHALLENGE_WHITELIST = [
  "01", "02", "03", "04", "05", "06",
  "07", "08", "09", "10", "11", "12",
] as const;

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
  competition: InvitationCompetitionConfig | null;
  challengeWhitelist: readonly string[];
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

  const memoriesFeature = invitation.features.memories;
  const competition = memoriesFeature.competition ?? null;

  return {
    enabled: true,
    variant: memoriesFeature.variant,
    invitationSlug: invitation.slug,
    competition,
    challengeWhitelist: PLUS_MEMORIES_CHALLENGE_WHITELIST,
    ...MEMORIES_DEFAULTS,
    publicGalleryEnabled: memoriesFeature.publicGalleryEnabled !== false,
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

/**
 * Resolve a config de memórias estática ou derivada de contexto de evento seguro.
 */
export function resolveMemoriesConfigForEvent(
  slug: string,
  eventContext?: { slug?: string; visibility?: string; competitionEnabled?: boolean } | null
): MemoriesEventConfig | null {
  const staticConfig = resolveMemoriesConfig(slug);
  if (staticConfig) return staticConfig;

  if (eventContext) {
    return {
      enabled: true,
      variant: "plus-memories",
      invitationSlug: eventContext.slug || slug,
      bucket: MEMORIES_DEFAULTS.bucket,
      opensAt: null,
      closesAt: null,
      moderationRequired: eventContext.visibility === "moderated",
      publicGalleryEnabled: true,
      maxImageFileSizeBytes: MEMORIES_DEFAULTS.maxImageFileSizeBytes,
      maxVideoFileSizeBytes: MEMORIES_DEFAULTS.maxVideoFileSizeBytes,
      acceptedImageMimeTypes: MEMORIES_DEFAULTS.acceptedImageMimeTypes,
      acceptedVideoMimeTypes: MEMORIES_DEFAULTS.acceptedVideoMimeTypes,
      maxCaptionLength: MEMORIES_DEFAULTS.maxCaptionLength,
      maxGuestNameLength: MEMORIES_DEFAULTS.maxGuestNameLength,
      signedUrlTtlSeconds: MEMORIES_DEFAULTS.signedUrlTtlSeconds,
      uploadIntentTtlSeconds: MEMORIES_DEFAULTS.uploadIntentTtlSeconds,
      competition: eventContext.competitionEnabled
        ? {
            enabled: true,
            mode: "unique-challenges",
            totalChallenges: 12,
          }
        : null,
      challengeWhitelist: PLUS_MEMORIES_CHALLENGE_WHITELIST,
    };
  }

  return null;
}
