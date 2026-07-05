/** Jessica & Samuel — galeria de memórias (configuração isolada). */

export const JESSICA_SAMUEL_PHOTO_WALL = {
  enabled: false,
  opensAt: null as string | null,
  closesAt: null as string | null,
  moderationRequired: true,
  publicGalleryEnabled: true,
  maxFileSizeBytes: 5 * 1024 * 1024,
  acceptedMimeTypes: ["image/jpeg", "image/png", "image/webp"] as const,
  bucket: "wedding-photos",
  invitationSlug: "jessica-samuel",
  maxCaptionLength: 200,
  maxGuestNameLength: 80,
  signedUrlTtlSeconds: 300,
  uploadIntentTtlSeconds: 15 * 60,
} as const;

export const PHOTO_WALL_DISABLED_MESSAGE =
  "A galeria de memórias será aberta no dia da nossa celebração." as const;

export const PHOTO_WALL_UPLOAD_SUCCESS =
  "Momento partilhado com sucesso. Será apresentado na galeria após aprovação dos noivos." as const;

export const PHOTO_WALL_UPLOAD_CONSENT =
  "Ao partilhar esta foto, autoriza a sua utilização na galeria privada deste casamento, sujeita à aprovação dos noivos." as const;
