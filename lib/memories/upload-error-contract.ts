export const MEMORY_UPLOAD_ERROR_CODES = [
  "UNSUPPORTED_MEDIA",
  "FILE_TOO_LARGE",
  "SESSION_EXPIRED",
  "UPLOAD_INTENT_FAILED",
  "UPLOAD_SIGN_FAILED",
  "STORAGE_UPLOAD_FAILED",
  "UPLOAD_COMPLETE_FAILED",
  "MISSION_SUBMISSION_FAILED",
  "SERVICE_UNAVAILABLE",
] as const;

export type MemoryUploadErrorCode = (typeof MEMORY_UPLOAD_ERROR_CODES)[number];

const SESSION_ERROR_CODES = new Set([
  "SESSION_REQUIRED",
  "SESSION_INVALID",
  "SESSION_REVOKED",
  "SESSION_EXPIRED",
]);

export function normalizeMemoryUploadErrorCode(
  code: unknown,
  fallback: MemoryUploadErrorCode
): MemoryUploadErrorCode {
  if (typeof code !== "string") return fallback;
  if ((MEMORY_UPLOAD_ERROR_CODES as readonly string[]).includes(code)) {
    return code as MemoryUploadErrorCode;
  }
  if (SESSION_ERROR_CODES.has(code)) return "SESSION_EXPIRED";
  if (code === "STORAGE_ERROR") return "UPLOAD_SIGN_FAILED";
  if (code === "UPLOAD_MISSING") return "STORAGE_UPLOAD_FAILED";
  if (code === "DB_ERROR") return "SERVICE_UNAVAILABLE";
  return fallback;
}

export function memoryUploadHttpStatus(code: MemoryUploadErrorCode): number {
  switch (code) {
    case "SESSION_EXPIRED":
      return 401;
    case "FILE_TOO_LARGE":
      return 413;
    case "UPLOAD_INTENT_FAILED":
    case "UPLOAD_COMPLETE_FAILED":
    case "MISSION_SUBMISSION_FAILED":
    case "SERVICE_UNAVAILABLE":
      return 503;
    case "UPLOAD_SIGN_FAILED":
    case "STORAGE_UPLOAD_FAILED":
      return 502;
    default:
      return 400;
  }
}

export const MEMORY_UPLOAD_ERROR_MESSAGES: Record<MemoryUploadErrorCode, string> = {
  UNSUPPORTED_MEDIA: "Este formato não é suportado. Use JPEG, PNG, HEIC/HEIF, MP4, MOV ou WebM.",
  FILE_TOO_LARGE: "O ficheiro excede o tamanho permitido para este tipo de média.",
  SESSION_EXPIRED: "A tua sessão expirou. Abre novamente o link do convite antes de tentar.",
  UPLOAD_INTENT_FAILED: "Não foi possível preparar o envio. Tenta novamente dentro de instantes.",
  UPLOAD_SIGN_FAILED: "O armazenamento não conseguiu autorizar o envio. Tenta novamente dentro de instantes.",
  STORAGE_UPLOAD_FAILED: "A fotografia não chegou ao armazenamento. Verifica a ligação e tenta novamente.",
  UPLOAD_COMPLETE_FAILED: "Não foi possível confirmar a fotografia recebida. Tenta novamente.",
  MISSION_SUBMISSION_FAILED: "A fotografia foi recebida, mas a missão ainda não foi concluída. Tenta novamente.",
  SERVICE_UNAVAILABLE: "Serviço temporariamente indisponível. Tenta novamente dentro de instantes.",
};

const ACCEPTED_FILE_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "heic",
  "heif",
  "mp4",
  "mov",
  "webm",
]);

const ACCEPTED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "video/mp4",
  "video/quicktime",
  "video/webm",
]);

export type ClientMediaFile = Pick<File, "name" | "size" | "type">;

export function validateClientMediaFile(file: ClientMediaFile): MemoryUploadErrorCode | null {
  const extension = file.name.split(".").pop()?.trim().toLowerCase() ?? "";
  const contentType = file.type.trim().toLowerCase();
  if (!ACCEPTED_MIME_TYPES.has(contentType) && !ACCEPTED_FILE_EXTENSIONS.has(extension)) {
    return "UNSUPPORTED_MEDIA";
  }

  const isVideo = contentType.startsWith("video/") || ["mp4", "mov", "webm"].includes(extension);
  const maximumBytes = isVideo ? 100 * 1024 * 1024 : 25 * 1024 * 1024;
  return file.size > maximumBytes ? "FILE_TOO_LARGE" : null;
}

export function createMemoryUploadClientId(): string {
  const browserCrypto = globalThis.crypto;
  if (browserCrypto && typeof browserCrypto.randomUUID === "function") {
    return browserCrypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  if (browserCrypto && typeof browserCrypto.getRandomValues === "function") {
    browserCrypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
