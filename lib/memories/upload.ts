import { randomUUID } from "node:crypto";
import { createAdminClient, isSupabaseConfigured } from "@lib/supabase/server";
import { publicMutationRateLimit } from "@lib/security/mutation-rate-limit";
import { RATE_LIMITS } from "@lib/security/rate-limit";
import { resolveMemoriesConfig, PLUS_MEMORIES_CHALLENGE_WHITELIST, type MemoriesEventConfig } from "./config";
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
import { getPhotoUploadIntentRepository } from "@lib/jessica-samuel-wedding/photo-wall/upload-intent-store";
import {
  isMemoriesWriteFrozen,
  STORAGE_WRITE_FROZEN_CODE,
  STORAGE_WRITE_FROZEN_MESSAGE,
  getMemoriesStorageProvider,
  assertCanonicalStoragePath,
} from "./storage";

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
// Signed URL (testable seam de compatibilidade)
// ──────────────────────────────────────────────

type SignedUploadUrlResult = {
  signedUrl: string | null;
  error?: string;
};

type SignedUploadUrlFn = (
  bucketName: string,
  storagePath: string
) => Promise<SignedUploadUrlResult>;

let legacySignedUploadUrlTestSeam: SignedUploadUrlFn | null = null;

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
  if (trimmed.length > 20 || !PLUS_MEMORIES_CHALLENGE_WHITELIST.includes(trimmed as any)) {
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
  // 1. FREEZE CHECK FAIL-CLOSED (antes de qualquer alocação de ID, DB ou storage)
  if (isMemoriesWriteFrozen()) {
    return {
      success: false,
      error: STORAGE_WRITE_FROZEN_MESSAGE,
      code: STORAGE_WRITE_FROZEN_CODE,
    };
  }

  const config = resolveMemoriesConfig(input.slug);
  if (!config) {
    return { success: false, error: "Convite não encontrado.", code: "NOT_FOUND" };
  }

  const storageSlug = config.invitationSlug;
  const bucketName = config.bucket;
  const safeFileName = normalizeUploadFileName(input.fileName);
  const resolvedType = resolveContentType(input.contentType, safeFileName);
  if (!resolvedType) {
    return {
      success: false,
      error: "Tipo não suportado. Use foto (JPEG, PNG, HEIC) ou vídeo (MP4, MOV).",
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

  if (!isSupabaseConfigured()) {
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

  assertCanonicalStoragePath(storagePath);

  const expiresAt =
    Date.now() + config.uploadIntentTtlSeconds * 1000;
  const expiresAtIso = new Date(expiresAt).toISOString();

  try {
    await getPhotoUploadIntentRepository().create({
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

  let uploadUrl: string;

  if (legacySignedUploadUrlTestSeam) {
    const signed = await legacySignedUploadUrlTestSeam(bucketName, storagePath);
    if (!signed.signedUrl) {
      return {
        success: false,
        error: "Não foi possível preparar o envio.",
        code: "STORAGE_ERROR",
      };
    }
    uploadUrl = signed.signedUrl;
  } else {
    try {
      const provider = getMemoriesStorageProvider();
      const signed = await provider.createSignedUploadUrl({
        storagePath,
        contentType: resolvedType,
        expiresInSeconds: config.uploadIntentTtlSeconds,
      });
      uploadUrl = signed.uploadUrl;
    } catch (err: any) {
      console.error("[Memories] upload intent storage provider error:", err?.message || err);
      return {
        success: false,
        error: "Não foi possível preparar o envio.",
        code: "STORAGE_ERROR",
      };
    }
  }

  return {
    success: true,
    photoId,
    uploadUrl,
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
): Promise<{ success: boolean; error?: string; code?: string; retryAfterSeconds?: number }> {
  // NOTA ARQUITECTURAL CRÍTICA:
  // NÃO bloqueamos completeMemoryUpload pelo freeze para permitir a drenagem
  // de intents legítimos já em trânsito dentro da janela de TTL.

  const config = resolveMemoriesConfig(slug);
  if (!config) {
    return { success: false, error: "Convite não encontrado.", code: "NOT_FOUND" };
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
    return { success: false, error: "Pedido de envio expirado.", code: "INTENT_EXPIRED" };
  }

  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error: "Serviço temporariamente indisponível.",
      code: "SERVICE_UNAVAILABLE",
    };
  }

  let intent;
  try {
    intent = await getPhotoUploadIntentRepository().consume({
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
    return { success: false, error: "Pedido de envio expirado.", code: "INTENT_EXPIRED" };
  }

  if (
    intent.slug !== storageSlug ||
    !intent.storagePath.startsWith(`${storageSlug}/`)
  ) {
    return { success: false, error: "Pedido de envio inválido.", code: "INVALID_INTENT" };
  }

  assertCanonicalStoragePath(intent.storagePath);

  const provider = getMemoriesStorageProvider();

  // Inspecção de objecto desacoplada do provider (evita carregar 100MB em serverless)
  let objectInfo;
  try {
    objectInfo = await provider.getObjectInfo(intent.storagePath);
  } catch (err: any) {
    console.error("[Memories] getObjectInfo error:", err?.message || err);
    return {
      success: false,
      error: "Não foi possível confirmar o envio.",
      code: "UPLOAD_MISSING",
    };
  }

  if (!objectInfo.exists || objectInfo.contentLength === undefined) {
    return {
      success: false,
      error: "Não foi possível confirmar o envio.",
      code: "UPLOAD_MISSING",
    };
  }

  const actualSizeBytes = objectInfo.contentLength;

  const sizeError = validateFileSize(actualSizeBytes, intent.contentType);
  if (sizeError || actualSizeBytes > intent.declaredFileSizeBytes) {
    await provider.remove(intent.storagePath);
    return {
      success: false,
      error:
        sizeError ??
        `O ficheiro excede o limite de ${Math.round(
          maxBytesForContentType(intent.contentType) / (1024 * 1024)
        )} MB.`,
    };
  }

  // Bounded read dos primeiros 512 bytes para validação atómica de magic bytes
  const prefixBytes = await provider.readObjectPrefix(intent.storagePath, 512);
  if (!prefixBytes || !matchesMagicBytes(prefixBytes, intent.contentType)) {
    await provider.remove(intent.storagePath);
    return {
      success: false,
      error: "Tipo de ficheiro inválido.",
      code: "INVALID_SIGNATURE",
    };
  }

  const originalFilename = intent.storagePath.split("/").pop() ?? "original.jpg";
  const supabase = createAdminClient();

  const { error: insertError } = await supabase.from("wedding_photos").insert({
    id: photoId,
    invitation_slug: storageSlug,
    storage_path: intent.storagePath,
    original_filename: originalFilename,
    content_type: intent.contentType,
    file_size_bytes: actualSizeBytes,
    guest_name: metadata.guestName?.trim() || null,
    caption: metadata.caption?.trim() || null,
    challenge_id: metadata.challengeId?.trim() || null,
    table_id: metadata.tableId?.trim() || null,
    participant_id: metadata.participantId?.trim() || null,
    moderation_status: "pending",
  });

  if (insertError) {
    console.error("[Memories] insert error:", insertError.message);
    return {
      success: false,
      error: "Não foi possível registar a memória.",
      code: "DB_ERROR",
    };
  }

  return { success: true };
}

// ──────────────────────────────────────────────
// Test seam de compatibilidade
// ──────────────────────────────────────────────

export function __setSignedUploadUrlForMemoriesTests(impl: SignedUploadUrlFn | null): void {
  legacySignedUploadUrlTestSeam = impl;
}
