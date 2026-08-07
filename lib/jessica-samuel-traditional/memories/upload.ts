import { randomUUID } from "node:crypto";
import { createAdminClient, isSupabaseConfigured } from "@lib/supabase/server";
import { publicMutationRateLimit } from "@lib/security/mutation-rate-limit";
import { RATE_LIMITS } from "@lib/security/rate-limit";
import { resolveSlug } from "@lib/engine";
import { getInvitation } from "@data/invitations";
import { TRADITIONAL_MEMORIES_CONFIG } from "./config";
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

export type TraditionalMemoryUploadIntentInput = {
  slug: string;
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
  guestName?: string;
  caption?: string;
  challengeId?: string;
  tableId?: string;
};

export type TraditionalMemoryUploadIntentResult =
  | {
      success: true;
      photoId: string;
      uploadUrl: string;
      storagePath: string;
      expiresAt: string;
    }
  | { success: false; error: string; code?: string; retryAfterSeconds?: number };

export type TraditionalMemoryCompleteInput = {
  slug: string;
  photoId: string;
  guestName?: string;
  caption?: string;
  challengeId?: string;
  tableId?: string;
};

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

function validateChallengeId(challengeId?: string): string | null {
  if (!challengeId?.trim()) return null;
  if (challengeId.trim().length > 20) return "ID de desafio inválido.";
  return null;
}

function validateTableId(tableId?: string): string | null {
  if (!tableId?.trim()) return null;
  if (tableId.trim().length > 10) return "Número de mesa inválido.";
  return null;
}

function verifyTraditionalSlug(slug: string): boolean {
  const canonical = resolveSlug(slug);
  if (!canonical) return false;
  const invitation = getInvitation(canonical);
  return (
    invitation?.slug === TRADITIONAL_MEMORIES_CONFIG.invitationSlug &&
    Boolean(invitation?.features?.memories?.enabled)
  );
}

export async function createTraditionalMemoryUploadIntent(
  input: TraditionalMemoryUploadIntentInput,
  request: Request
): Promise<TraditionalMemoryUploadIntentResult> {
  if (!verifyTraditionalSlug(input.slug)) {
    return { success: false, error: "Convite não encontrado.", code: "NOT_FOUND" };
  }

  const storageSlug = TRADITIONAL_MEMORIES_CONFIG.invitationSlug;
  const bucketName = TRADITIONAL_MEMORIES_CONFIG.bucket;
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
    Date.now() + TRADITIONAL_MEMORIES_CONFIG.uploadIntentTtlSeconds * 1000;
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
    console.error("[TraditionalMemories] upload intent repository error");
    return {
      success: false,
      error: "Não foi possível preparar o envio.",
      code: "STORAGE_ERROR",
    };
  }

  const signed = await signedUploadUrlImpl(bucketName, storagePath);
  if (!signed.signedUrl) {
    console.error("[TraditionalMemories] upload intent storage error");
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

export async function completeTraditionalMemoryUpload(
  slug: string,
  photoId: string,
  request: Request,
  metadata: {
    guestName?: string;
    caption?: string;
    challengeId?: string;
    tableId?: string;
  } = {}
): Promise<{ success: boolean; error?: string; code?: string; retryAfterSeconds?: number }> {
  if (!verifyTraditionalSlug(slug)) {
    return { success: false, error: "Convite não encontrado.", code: "NOT_FOUND" };
  }

  const storageSlug = TRADITIONAL_MEMORIES_CONFIG.invitationSlug;
  const bucketName = TRADITIONAL_MEMORIES_CONFIG.bucket;

  const nameError = validateGuestName(metadata.guestName);
  if (nameError) return { success: false, error: nameError };

  const captionError = validateCaption(metadata.caption);
  if (captionError) return { success: false, error: captionError };

  const challengeError = validateChallengeId(metadata.challengeId);
  if (challengeError) return { success: false, error: challengeError };

  const tableError = validateTableId(metadata.tableId);
  if (tableError) return { success: false, error: tableError };

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
    console.error("[TraditionalMemories] consume intent error");
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
    storage_path: intent.storagePath,
    original_filename: originalFilename,
    content_type: intent.contentType,
    file_size_bytes: buffer.byteLength,
    guest_name: metadata.guestName?.trim() || null,
    caption: metadata.caption?.trim() || null,
    challenge_id: metadata.challengeId?.trim() || null,
    table_id: metadata.tableId?.trim() || null,
    moderation_status: "pending",
  });

  if (insertError) {
    console.error("[TraditionalMemories] insert error:", insertError.message);
    return {
      success: false,
      error: "Não foi possível registar a memória.",
      code: "DB_ERROR",
    };
  }

  return { success: true };
}

export function __setTraditionalSignedUploadUrlForTests(impl: SignedUploadUrlFn | null): void {
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
