import { JESSICA_SAMUEL_PHOTO_WALL } from "./config";

const SAFE_FILENAME = /^[a-zA-Z0-9._-]{1,120}$/;

const MAGIC: Array<{ mime: string; bytes: number[] }> = [
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46] },
];

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

export function validateUploadFileName(fileName: string): string | null {
  const base = fileName.split(/[/\\]/).pop()?.trim() ?? "";
  if (!base || !SAFE_FILENAME.test(base)) {
    return "Nome de ficheiro inválido.";
  }
  return null;
}

export function validateContentType(contentType: string): string | null {
  if (
    !JESSICA_SAMUEL_PHOTO_WALL.acceptedMimeTypes.includes(
      contentType as (typeof JESSICA_SAMUEL_PHOTO_WALL.acceptedMimeTypes)[number]
    )
  ) {
    return "Tipo de ficheiro não suportado. Use JPEG, PNG ou WebP.";
  }
  return null;
}

export function validateFileSize(fileSizeBytes: number): string | null {
  if (!Number.isInteger(fileSizeBytes) || fileSizeBytes <= 0) {
    return "Tamanho de ficheiro inválido.";
  }
  if (fileSizeBytes > JESSICA_SAMUEL_PHOTO_WALL.maxFileSizeBytes) {
    return "A imagem excede o limite de 5 MB.";
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
  const rule = MAGIC.find((entry) => entry.mime === contentType);
  if (!rule) return false;
  if (buffer.length < rule.bytes.length) return false;
  return rule.bytes.every((byte, index) => buffer[index] === byte);
}

export function toPublicGalleryItem(row: {
  id: string;
  caption: string | null;
  created_at: string;
  signedUrl: string;
}): { id: string; caption: string | null; signedUrl: string; createdAt: string } {
  return {
    id: row.id,
    caption: row.caption,
    signedUrl: row.signedUrl,
    createdAt: row.created_at,
  };
}
