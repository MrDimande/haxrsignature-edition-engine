import { TRADITIONAL_EVENT } from "../event-details";

/**
/ * Memórias do Nosso Dia — Casamento Tradicional Jessica & Samuel
/ * Configuração isolada com slug canónico e suporte a desafios e mesas.
/ */
export const TRADITIONAL_MEMORIES_CONFIG = {
  enabled: true,
  /** Slug canónico de isolamento Storage/DB */
  invitationSlug: "jessicaesamueltraditionalwedding",
  bucket: "wedding-photos",
  /** null = aberto imediatamente para testes de produção */
  opensAt: null as string | null,
  closesAt: null as string | null,
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
  ...TRADITIONAL_MEMORIES_CONFIG.acceptedImageMimeTypes,
  ...TRADITIONAL_MEMORIES_CONFIG.acceptedVideoMimeTypes,
] as const;

export type MemoriesMimeType = (typeof MEMORIES_ACCEPTED_MIME_TYPES)[number];
