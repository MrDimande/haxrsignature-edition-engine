import {
  JESSICA_SAMUEL_PHOTO_WALL,
  PHOTO_WALL_ACCEPTED_MIME_TYPES,
  type PhotoWallMimeType,
} from "./config";

const EXTENSION_TO_MIME: Record<string, PhotoWallMimeType> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
  mp4: "video/mp4",
  m4v: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
};

function readAscii(buffer: Uint8Array, start: number, length: number): string {
  return String.fromCharCode(
    ...buffer.slice(start, Math.min(start + length, buffer.length))
  );
}

function hasFtypBrand(buffer: Uint8Array, brands: readonly string[]): boolean {
  if (buffer.length < 12) return false;
  if (readAscii(buffer, 4, 4) !== "ftyp") return false;
  const major = readAscii(buffer, 8, 4).toLowerCase();
  if (brands.includes(major)) return true;
  // Compat brands after major brand + minor version
  for (let offset = 16; offset + 4 <= Math.min(buffer.length, 64); offset += 4) {
    const brand = readAscii(buffer, offset, 4).toLowerCase();
    if (brands.includes(brand)) return true;
  }
  return false;
}

export function isJessicaSamuelPhotoSlug(slug: string): boolean {
  return slug === JESSICA_SAMUEL_PHOTO_WALL.invitationSlug;
}

export function isPhotoWallOpen(now: Date = new Date()): boolean {
  if (!JESSICA_SAMUEL_PHOTO_WALL.enabled) return false;
  const { opensAt, closesAt } = JESSICA_SAMUEL_PHOTO_WALL;
  if (opensAt && now < new Date(opensAt)) return false;
  if (closesAt && now > new Date(closesAt)) return false;
  return true;
}

/** Fase editorial da secção Memórias (teaser → upload → álbum). */
export type PhotoWallPhase = "before" | "open" | "closed";

export function getPhotoWallPhase(now: Date = new Date()): PhotoWallPhase {
  if (!JESSICA_SAMUEL_PHOTO_WALL.enabled) return "before";
  const { opensAt, closesAt } = JESSICA_SAMUEL_PHOTO_WALL;
  if (opensAt && now < new Date(opensAt)) return "before";
  if (closesAt && now > new Date(closesAt)) return "closed";
  return "open";
}

export function isVideoContentType(contentType: string): boolean {
  return contentType.startsWith("video/");
}

export function isImageContentType(contentType: string): boolean {
  return contentType.startsWith("image/");
}

export function maxBytesForContentType(contentType: string): number {
  return isVideoContentType(contentType)
    ? JESSICA_SAMUEL_PHOTO_WALL.maxVideoFileSizeBytes
    : JESSICA_SAMUEL_PHOTO_WALL.maxImageFileSizeBytes;
}

export function formatMegabytes(bytes: number): string {
  return String(Math.round(bytes / (1024 * 1024)));
}

/** Normaliza MIME vazio/incorrecto de alguns telemóveis a partir da extensão. */
export function resolveContentType(
  contentType: string | undefined,
  fileName: string
): PhotoWallMimeType | null {
  const trimmed = contentType?.trim().toLowerCase() ?? "";
  if (
    PHOTO_WALL_ACCEPTED_MIME_TYPES.includes(trimmed as PhotoWallMimeType)
  ) {
    return trimmed as PhotoWallMimeType;
  }

  // Alguns browsers enviam image/jpg em vez de image/jpeg
  if (trimmed === "image/jpg") return "image/jpeg";

  const ext = fileName.split(".").pop()?.trim().toLowerCase() ?? "";
  return EXTENSION_TO_MIME[ext] ?? null;
}

/** Sanitiza nomes vindos do telemóvel / WhatsApp (espaços, acentos, etc.). */
export function normalizeUploadFileName(fileName: string): string {
  const base = fileName.split(/[/\\]/).pop()?.trim() || "memoria";
  const cleaned = base
    .normalize("NFKD")
    .replace(/[^\w.\- ()[\]]+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 120);
  return cleaned || "memoria";
}

export function validateUploadFileName(fileName: string): string | null {
  const normalized = normalizeUploadFileName(fileName);
  if (!normalized) return "Nome de ficheiro inválido.";
  return null;
}

export function validateContentType(contentType: string): string | null {
  if (
    !PHOTO_WALL_ACCEPTED_MIME_TYPES.includes(contentType as PhotoWallMimeType)
  ) {
    return "Tipo não suportado. Use foto (JPEG, PNG, HEIC) ou vídeo (MP4, MOV).";
  }
  return null;
}

export function validateFileSize(
  fileSizeBytes: number,
  contentType?: string
): string | null {
  if (!Number.isInteger(fileSizeBytes) || fileSizeBytes <= 0) {
    return "Tamanho de ficheiro inválido.";
  }

  const limit = contentType
    ? maxBytesForContentType(contentType)
    : JESSICA_SAMUEL_PHOTO_WALL.maxVideoFileSizeBytes;

  if (fileSizeBytes > limit) {
    const kind = contentType && isVideoContentType(contentType) ? "vídeo" : "ficheiro";
    return `O ${kind} excede o limite de ${formatMegabytes(limit)} MB.`;
  }
  return null;
}

export function validateGuestName(guestName?: string): string | null {
  if (!guestName?.trim()) return null;
  if (guestName.trim().length > JESSICA_SAMUEL_PHOTO_WALL.maxGuestNameLength) {
    return "Nome demasiado longo.";
  }
  return null;
}

export function validateCaption(caption?: string): string | null {
  if (!caption?.trim()) return null;
  if (caption.trim().length > JESSICA_SAMUEL_PHOTO_WALL.maxCaptionLength) {
    return "Legenda demasiado longa.";
  }
  return null;
}

export function extensionForContentType(contentType: string): string | null {
  switch (contentType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/heic":
      return "heic";
    case "image/heif":
      return "heif";
    case "video/mp4":
      return "mp4";
    case "video/quicktime":
      return "mov";
    case "video/webm":
      return "webm";
    default:
      return null;
  }
}

export function buildStoragePath(
  photoId: string,
  contentType: string,
  slug: string = JESSICA_SAMUEL_PHOTO_WALL.invitationSlug
): string | null {
  const ext = extensionForContentType(contentType);
  if (!ext) return null;
  return `${slug}/${photoId}/original.${ext}`;
}

export function matchesMagicBytes(
  buffer: Uint8Array,
  contentType: string
): boolean {
  switch (contentType) {
    case "image/jpeg":
      return (
        buffer.length >= 3 &&
        buffer[0] === 0xff &&
        buffer[1] === 0xd8 &&
        buffer[2] === 0xff
      );
    case "image/png":
      return (
        buffer.length >= 4 &&
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47
      );
    case "image/webp":
      return (
        buffer.length >= 12 &&
        readAscii(buffer, 0, 4) === "RIFF" &&
        readAscii(buffer, 8, 4) === "WEBP"
      );
    case "image/heic":
    case "image/heif":
      return hasFtypBrand(buffer, [
        "heic",
        "heif",
        "heix",
        "hevc",
        "hevx",
        "mif1",
        "msf1",
      ]);
    case "video/mp4":
    case "video/quicktime":
      // iPhone/Samsung gravam MP4/MOV com brands ISO ou QuickTime.
      return hasFtypBrand(buffer, [
        "isom",
        "iso2",
        "iso4",
        "iso5",
        "iso6",
        "mp41",
        "mp42",
        "avc1",
        "m4v",
        "dash",
        "qt  ",
        "qt",
      ]);
    case "video/webm":
      // EBML header
      return (
        buffer.length >= 4 &&
        buffer[0] === 0x1a &&
        buffer[1] === 0x45 &&
        buffer[2] === 0xdf &&
        buffer[3] === 0xa3
      );
    default:
      return false;
  }
}

export function toPublicGalleryItem(row: {
  id: string;
  caption: string | null;
  created_at: string;
  signedUrl: string;
  content_type?: string | null;
}): {
  id: string;
  caption: string | null;
  signedUrl: string;
  createdAt: string;
  contentType: string;
  kind: "image" | "video";
} {
  const contentType = row.content_type?.trim() || "image/jpeg";
  return {
    id: row.id,
    caption: row.caption,
    signedUrl: row.signedUrl,
    createdAt: row.created_at,
    contentType,
    kind: isVideoContentType(contentType) ? "video" : "image",
  };
}
