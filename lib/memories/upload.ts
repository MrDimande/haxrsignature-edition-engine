import { randomUUID } from "node:crypto";
import { createAdminClient, isSupabaseConfigured } from "@lib/supabase/server";
import { publicMutationRateLimit } from "@lib/security/mutation-rate-limit";
import { RATE_LIMITS } from "@lib/security/rate-limit";
import { resolveMemoriesConfigAsync, PLUS_MEMORIES_CHALLENGE_WHITELIST } from "./config";
import { isValidPhaseId, resolvePhaseForChallenge } from "./phases";
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
  phaseId?: string;
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
  phaseId?: string;
};

// ──────────────────────────────────────────────
// Signed URL (testable seam)
// ──────────────────────────────────────────────

type SignedUploadUrlResult = {
  signedUrl: string | null;
  error?: string;
};

type SignedUploadUrlFn = (
  bucketName: string,
  storagePath: string
) => Promise<SignedUploadUrlResult>;

let signedUploadUrlImpl: SignedUploadUrlFn = async (
  bucketName,
  storagePath
) => {
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(bucketName)
    .createSignedUploadUrl(storagePath);
  return { signedUrl: data?.signedUrl ?? null, error: error?.message };
};

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
  const config = await resolveMemoriesConfigAsync(input.slug);
  if (!config) {
    return { success: false, error: "Convite não encontrado.", code: "NOT_FOUND" };
  }

  const storageSlug = config.storageSlug;
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

  const expiresAt =
    Date.now() + config.uploadIntentTtlSeconds * 1000;
  const expiresAtIso = new Date(expiresAt).toISOString();

  try {
    await getPhotoUploadIntentRepository().create({
      photoId,
      experienceId: config.experienceId,
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

  const signed = await signedUploadUrlImpl(bucketName, storagePath);
  if (!signed.signedUrl) {
    console.error("[Memories] upload intent storage error");
    return {
      success: false,
      error: "Não foi possível preparar o envio.",
      code: "STORAGE_ERROR",
    };
  }

  return {
    success: true,
    photoId,
    uploadUrl: signed.signedUrl,
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
    phaseId?: string;
  } = {}
): Promise<{ success: boolean; error?: string; code?: string; retryAfterSeconds?: number }> {
  const config = await resolveMemoriesConfigAsync(slug);
  if (!config) {
    return { success: false, error: "Convite não encontrado.", code: "NOT_FOUND" };
  }

  const storageSlug = config.storageSlug;
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

  const requestedPhaseId = metadata.phaseId?.trim() || undefined;
  const derivedPhaseId = resolvePhaseForChallenge(
    metadata.challengeId?.trim(),
    config.phases,
    config.challengePhaseMapping
  );
  if (
    !metadata.challengeId &&
    requestedPhaseId &&
    !isValidPhaseId(requestedPhaseId, config.phases)
  ) {
    return { success: false, error: "Fase da celebração inválida." };
  }
  const phaseId = metadata.challengeId ? derivedPhaseId : requestedPhaseId ?? null;

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
    intent.bucketName !== bucketName ||
    !intent.storagePath.startsWith(`${storageSlug}/`)
  ) {
    return { success: false, error: "Pedido de envio inválido.", code: "INVALID_INTENT" };
  }

  const supabase = createAdminClient();

  const { data: fileData, error: downloadError } = await supabase.storage
    .from(bucketName)
    .download(intent.storagePath);

  if (downloadError || !fileData) {
    return {
      success: false,
      error: "Não foi possível confirmar o envio.",
      code: "UPLOAD_MISSING",
    };
  }

  const buffer = new Uint8Array(await fileData.arrayBuffer());
  const sizeError = validateFileSize(buffer.byteLength, intent.contentType);
  if (sizeError || buffer.byteLength > intent.declaredFileSizeBytes) {
    await supabase.storage.from(bucketName).remove([intent.storagePath]);
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
    await supabase.storage.from(bucketName).remove([intent.storagePath]);
    return {
      success: false,
      error: "Tipo de ficheiro inválido.",
      code: "INVALID_SIGNATURE",
    };
  }

  const originalFilename = intent.storagePath.split("/").pop() ?? "original.jpg";

  const { error: insertError } = await supabase.from("wedding_photos").insert({
    id: photoId,
    invitation_slug: storageSlug,
    experience_id: config.experienceId,
    storage_path: intent.storagePath,
    original_filename: originalFilename,
    content_type: intent.contentType,
    file_size_bytes: buffer.byteLength,
    guest_name: metadata.guestName?.trim() || null,
    caption: metadata.caption?.trim() || null,
    challenge_id: metadata.challengeId?.trim() || null,
    table_id: metadata.tableId?.trim() || null,
    participant_id: metadata.participantId?.trim() || null,
    phase_id: phaseId,
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
// Test seam
// ──────────────────────────────────────────────

export function __setSignedUploadUrlForMemoriesTests(impl: SignedUploadUrlFn | null): void {
  signedUploadUrlImpl =
    impl ??
    (async (bucketName, storagePath) => {
      const supabase = createAdminClient();
      const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUploadUrl(storagePath);
      return { signedUrl: data?.signedUrl ?? null, error: error?.message };
    });
}
