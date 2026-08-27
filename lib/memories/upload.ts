import { randomUUID } from "node:crypto";
import { publicMutationRateLimit } from "@lib/security/mutation-rate-limit";
import { RATE_LIMITS } from "@lib/security/rate-limit";
import { resolveMemoriesConfig, PLUS_MEMORIES_CHALLENGE_WHITELIST } from "./config";
import {
  createMemoryUploadIntentRecord,
  consumeMemoryUploadIntentRecord,
  insertMemoryPhoto,
  isMemoriesDatabaseConfigured,
} from "./database";
import {
  createMemorySignedUploadUrl,
  downloadMemoryObject,
  isMemoriesStorageConfigured,
  removeMemoryObject,
} from "./storage";
import {
  buildStoragePath,
  matchesMagicBytes,
  maxBytesForContentType,
  normalizeUploadFileName,
  resolveContentType,
  validateCaption,
  validateContentType,
  validateFileSize,
  validateGuestName,
} from "@lib/jessica-samuel-wedding/photo-wall/validation";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export type MemoryUploadIntentInput = {
  slug: string;
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
  guestName?: string;
  caption?: string;
  challengeId?: string;
  tableId?: string;
  participantId?: string;
};

export type MemoryUploadIntentResult =
  | {
      success: true;
      photoId: string;
      uploadUrl: string;
      storagePath: string;
      expiresAt: string;
    }
  | { success: false; error: string; code?: string; retryAfterSeconds?: number };

export type MemoryCompleteInput = {
  slug: string;
  photoId: string;
  guestName?: string;
  caption?: string;
  challengeId?: string;
  tableId?: string;
  participantId?: string;
};

// ──────────────────────────────────────────────
// Signed URL test seam
// ──────────────────────────────────────────────

type SignedUploadUrlResult = {
  signedUrl: string | null;
  error?: string;
};

type SignedUploadUrlFn = (
  bucketName: string,
  storagePath: string
) => Promise<SignedUploadUrlResult>;

let signedUploadUrlOverride: SignedUploadUrlFn | null = null;

// ──────────────────────────────────────────────
// Validadores locais
// ──────────────────────────────────────────────

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validateParticipantId(participantId?: string): string | null {
  if (!participantId?.trim()) return null;
  const trimmed = participantId.trim();
  if (trimmed.length > 36 || !UUID_V4_REGEX.test(trimmed)) {
    return "ID de participante inválido.";
  }
  return null;
}

function validateChallengeId(challengeId?: string): string | null {
  if (!challengeId?.trim()) return null;
  const trimmed = challengeId.trim();
  if (
    trimmed.length > 20 ||
    !PLUS_MEMORIES_CHALLENGE_WHITELIST.includes(trimmed as never)
  ) {
    return "ID de desafio inválido.";
  }
  return null;
}

function validateTableId(tableId?: string): string | null {
  if (!tableId?.trim()) return null;
  if (tableId.trim().length > 10) return "Número de mesa inválido.";
  return null;
}

// ──────────────────────────────────────────────
// Upload Intent (genérico multi-evento)
// ──────────────────────────────────────────────

export async function createMemoryUploadIntent(
  input: MemoryUploadIntentInput,
  request: Request
): Promise<MemoryUploadIntentResult> {
  const config = resolveMemoriesConfig(input.slug);
  if (!config) {
    return {
      success: false,
      error: "Convite não encontrado.",
      code: "NOT_FOUND",
    };
  }

  const storageSlug = config.invitationSlug;
  const bucketName = config.bucket;
  const safeFileName = normalizeUploadFileName(input.fileName);
  const resolvedType = resolveContentType(input.contentType, safeFileName);
  if (!resolvedType) {
    return {
      success: false,
      error:
        "Tipo não suportado. Use foto (JPEG, PNG, HEIC) ou vídeo (MP4, MOV).",
    };
  }

  const typeError = validateContentType(resolvedType);
  if (typeError) return { success: false, error: typeError };

  const sizeError = validateFileSize(input.fileSizeBytes, resolvedType);
  if (sizeError) return { success: false, error: sizeError };

  const nameError = validateGuestName(input.guestName);
  if (nameError) return { success: false, error: nameError };

  const captionError = validateCaption(input.caption);
  if (captionError) return { success: false, error: captionError };

  const challengeError = validateChallengeId(input.challengeId);
  if (challengeError) return { success: false, error: challengeError };

  const tableError = validateTableId(input.tableId);
  if (tableError) return { success: false, error: tableError };

  const participantError = validateParticipantId(input.participantId);
  if (participantError) return { success: false, error: participantError };

  const limit = await publicMutationRateLimit(
    {
      scope: "memories",
      slug: storageSlug,
      action: "upload-intent",
      request,
    },
    RATE_LIMITS.memoriesIntent
  );
  if (!limit.allowed) {
    return {
      success: false,
      error: "Demasiados pedidos. Aguarde alguns minutos e tente novamente.",
      code: "RATE_LIMITED",
      retryAfterSeconds: limit.retryAfterSeconds,
    };
  }

  if (!isMemoriesDatabaseConfigured() || !isMemoriesStorageConfigured()) {
    return {
      success: false,
      error: "Serviço temporariamente indisponível.",
      code: "SERVICE_UNAVAILABLE",
    };
  }

  const photoId = randomUUID();
  const storagePath = buildStoragePath(photoId, resolvedType, storageSlug);
  if (!storagePath) {
    return { success: false, error: "Tipo de ficheiro inválido." };
  }

  const expiresAt = Date.now() + config.uploadIntentTtlSeconds * 1000;
  const expiresAtIso = new Date(expiresAt).toISOString();

  try {
    await createMemoryUploadIntentRecord({
      photoId,
      slug: storageSlug,
      bucketName,
      storagePath,
      contentType: resolvedType,
      declaredFileSizeBytes: input.fileSizeBytes,
      expiresAt: expiresAtIso,
    });
  } catch {
    console.error("[Memories] upload intent repository error");
    return {
      success: false,
      error: "Não foi possível preparar o envio.",
      code: "STORAGE_ERROR",
    };
  }

  let signedUrl: string | null = null;
  try {
    if (signedUploadUrlOverride) {
      const signed = await signedUploadUrlOverride(bucketName, storagePath);
      signedUrl = signed.signedUrl;
    } else {
      signedUrl = await createMemorySignedUploadUrl({
        bucketName,
        storagePath,
        contentType: resolvedType,
        maximumSizeInBytes: input.fileSizeBytes,
        validUntil: expiresAt,
      });
    }
  } catch (error) {
    console.error(
      "[Memories] upload intent storage error:",
      error instanceof Error ? error.message : error
    );
  }

  if (!signedUrl) {
    return {
      success: false,
      error: "Não foi possível preparar o envio.",
      code: "STORAGE_ERROR",
    };
  }

  return {
    success: true,
    photoId,
    uploadUrl: signedUrl,
    storagePath,
    expiresAt: expiresAtIso,
  };
}

// ──────────────────────────────────────────────
// Complete Upload (genérico multi-evento)
// ──────────────────────────────────────────────

export async function completeMemoryUpload(
  slug: string,
  photoId: string,
  request: Request,
  metadata: {
    guestName?: string;
    caption?: string;
    challengeId?: string;
    tableId?: string;
    participantId?: string;
  } = {}
): Promise<{
  success: boolean;
  error?: string;
  code?: string;
  retryAfterSeconds?: number;
}> {
  const config = resolveMemoriesConfig(slug);
  if (!config) {
    return {
      success: false,
      error: "Convite não encontrado.",
      code: "NOT_FOUND",
    };
  }

  const storageSlug = config.invitationSlug;
  const bucketName = config.bucket;

  const nameError = validateGuestName(metadata.guestName);
  if (nameError) return { success: false, error: nameError };

  const captionError = validateCaption(metadata.caption);
  if (captionError) return { success: false, error: captionError };

  const challengeError = validateChallengeId(metadata.challengeId);
  if (challengeError) return { success: false, error: challengeError };

  const tableError = validateTableId(metadata.tableId);
  if (tableError) return { success: false, error: tableError };

  const participantError = validateParticipantId(metadata.participantId);
  if (participantError) return { success: false, error: participantError };

  const limit = await publicMutationRateLimit(
    {
      scope: "memories",
      slug: storageSlug,
      action: "complete",
      request,
    },
    RATE_LIMITS.memoriesComplete
  );
  if (!limit.allowed) {
    return {
      success: false,
      error: "Demasiados pedidos. Aguarde alguns minutos e tente novamente.",
      code: "RATE_LIMITED",
      retryAfterSeconds: limit.retryAfterSeconds,
    };
  }

  if (!photoId.trim()) {
    return {
      success: false,
      error: "Pedido de envio expirado.",
      code: "INTENT_EXPIRED",
    };
  }

  if (!isMemoriesDatabaseConfigured() || !isMemoriesStorageConfigured()) {
    return {
      success: false,
      error: "Serviço temporariamente indisponível.",
      code: "SERVICE_UNAVAILABLE",
    };
  }

  let intent;
  try {
    intent = await consumeMemoryUploadIntentRecord({
      photoId,
      slug: storageSlug,
      bucketName,
      nowIso: new Date().toISOString(),
    });
  } catch {
    console.error("[Memories] consume intent error");
    return {
      success: false,
      error: "Não foi possível confirmar o envio.",
      code: "INTENT_EXPIRED",
    };
  }

  if (!intent) {
    return {
      success: false,
      error: "Pedido de envio expirado.",
      code: "INTENT_EXPIRED",
    };
  }

  if (
    intent.slug !== storageSlug ||
    intent.bucketName !== bucketName ||
    !intent.storagePath.startsWith(`${storageSlug}/`)
  ) {
    return {
      success: false,
      error: "Pedido de envio inválido.",
      code: "INVALID_INTENT",
    };
  }

  let buffer: Uint8Array | null = null;
  try {
    buffer = await downloadMemoryObject({
      bucketName,
      storagePath: intent.storagePath,
    });
  } catch (error) {
    console.error(
      "[Memories] object download error:",
      error instanceof Error ? error.message : error
    );
  }

  if (!buffer) {
    return {
      success: false,
      error: "Não foi possível confirmar o envio.",
      code: "UPLOAD_MISSING",
    };
  }

  const sizeError = validateFileSize(buffer.byteLength, intent.contentType);
  if (sizeError || buffer.byteLength > intent.declaredFileSizeBytes) {
    await removeMemoryObject({
      bucketName,
      storagePath: intent.storagePath,
    });
    return {
      success: false,
      error:
        sizeError ??
        `O ficheiro excede o limite de ${Math.round(
          maxBytesForContentType(intent.contentType) / (1024 * 1024)
        )} MB.`,
    };
  }

  if (!matchesMagicBytes(buffer, intent.contentType)) {
    await removeMemoryObject({
      bucketName,
      storagePath: intent.storagePath,
    });
    return {
      success: false,
      error: "Tipo de ficheiro inválido.",
      code: "INVALID_SIGNATURE",
    };
  }

  const originalFilename =
    intent.storagePath.split("/").pop() ?? "original.jpg";

  try {
    await insertMemoryPhoto({
      id: photoId,
      invitationSlug: storageSlug,
      storagePath: intent.storagePath,
      originalFilename,
      contentType: intent.contentType,
      fileSizeBytes: buffer.byteLength,
      guestName: metadata.guestName?.trim() || null,
      caption: metadata.caption?.trim() || null,
      challengeId: metadata.challengeId?.trim() || null,
      tableId: metadata.tableId?.trim() || null,
      participantId: metadata.participantId?.trim() || null,
    });
  } catch (error) {
    console.error(
      "[Memories] insert error:",
      error instanceof Error ? error.message : error
    );
    return {
      success: false,
      error: "Não foi possível registar a memória.",
      code: "DB_ERROR",
    };
  }

  return { success: true };
}

// ──────────────────────────────────────────────
// Test seam
// ──────────────────────────────────────────────

export function __setSignedUploadUrlForMemoriesTests(
  impl: SignedUploadUrlFn | null
): void {
  signedUploadUrlOverride = impl;
}
