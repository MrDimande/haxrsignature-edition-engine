import { WEDDING_EVENT } from "../event-details";

/** Jessica & Samuel — galeria de memórias (configuração isolada).
 *
 * Limites pensados para telemóveis reais (iPhone, Samsung S21, Xiaomi…):
 * - fotos JPEG/HEIC costumam ficar entre 2–15 MB;
 * - vídeos curtos (.mp4 / .mov) sobem rápido — teto separado.
 */
export const JESSICA_SAMUEL_PHOTO_WALL = {
  /** Feature live — teaser + galeria montados no convite. */
  enabled: true,
  /** Início do dia do casamento (Maputo). */
  opensAt: `${WEDDING_EVENT.dateIso}T00:00:00+02:00` as string | null,
  /** null = álbum permanente (uploads continuam após o dia). */
  closesAt: null as string | null,
  moderationRequired: true,
  publicGalleryEnabled: true,
  /** Fotos de telemóvel (incl. HEIC/JPEG de alta resolução). */
  maxImageFileSizeBytes: 25 * 1024 * 1024,
  /** Vídeos curtos do telemóvel (~30–90s, conforme qualidade). */
  maxVideoFileSizeBytes: 100 * 1024 * 1024,
  /**
   * Tipos aceites — cobrem a maioria dos telemóveis modernos.
   * iPhone: JPEG/HEIC + QuickTime (.mov)
   * Samsung / Xiaomi / Android: JPEG/WebP + MP4
   */
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
  bucket: "wedding-photos",
  /** Slug de isolamento Storage/DB (não confundir com slug público do convite). */
  invitationSlug: "jessica-samuel",
  maxCaptionLength: 200,
  maxGuestNameLength: 80,
  signedUrlTtlSeconds: 300,
  uploadIntentTtlSeconds: 15 * 60,
  /** Polling da galeria pública (ms). */
  galleryPollMs: 45_000,
} as const;

export const PHOTO_WALL_ACCEPTED_MIME_TYPES = [
  ...JESSICA_SAMUEL_PHOTO_WALL.acceptedImageMimeTypes,
  ...JESSICA_SAMUEL_PHOTO_WALL.acceptedVideoMimeTypes,
] as const;

export type PhotoWallMimeType = (typeof PHOTO_WALL_ACCEPTED_MIME_TYPES)[number];

/** Compat — maior teto (vídeo). Preferir validateFileSize por tipo. */
export const PHOTO_WALL_MAX_FILE_SIZE_BYTES =
  JESSICA_SAMUEL_PHOTO_WALL.maxVideoFileSizeBytes;

export const PHOTO_WALL_DISABLED_MESSAGE =
  "A galeria de memórias será aberta no dia da nossa celebração." as const;

export const PHOTO_WALL_UPLOAD_SUCCESS =
  "Momento partilhado com sucesso. Será apresentado na galeria após aprovação dos noivos." as const;

export const PHOTO_WALL_UPLOAD_CONSENT =
  "Ao partilhar esta memória, autoriza a sua utilização na galeria privada deste casamento, sujeita à aprovação dos noivos." as const;

export const PHOTO_WALL_COPY = {
  eyebrow: "Memórias do Nosso Dia",
  titleBefore: "Ainda vamos viver este dia.",
  titleOpen: "Partilhe o que os seus olhos viram.",
  titleAfter: "O nosso álbum colectivo.",
  bodyBefore:
    "No dia da celebração, poderá carregar aqui fotos e vídeos curtos do telemóvel — um mural vivo das memórias partilhadas.",
  bodyOpen:
    "Escolha uma foto ou um vídeo curto do telemóvel. Cada momento entra na galeria após a nossa aprovação.",
  bodyAfter:
    "Este álbum continua aberto. Se ainda tiver fotos ou vídeos do nosso dia, partilhe-os connosco — com carinho e gratidão.",
  cta: "Partilhar foto ou vídeo",
  emptyOpen:
    "Ainda não há memórias aprovadas. Seja o primeiro a partilhar um momento.",
  emptyAfter: "As memórias aprovadas aparecerão aqui.",
  qrHint: "No local, o QR Code leva directamente a esta secção.",
  acceptHint: "Fotos até 25 MB · Vídeos até 100 MB (MP4 ou MOV)",
} as const;
