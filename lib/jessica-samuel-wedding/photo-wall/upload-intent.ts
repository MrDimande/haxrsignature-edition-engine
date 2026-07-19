import { randomUUID } from "node:crypto";
import { createAdminClient, isSupabaseConfigured } from "@lib/supabase/server";
import { publicMutationRateLimit } from "@lib/security/mutation-rate-limit";
import { RATE_LIMITS } from "@lib/security/rate-limit";
import { resolveInvitationContext, type InvitationContext } from "@lib/context-resolver";
import type {
  WeddingPhotoUploadIntentInput,
  WeddingPhotoUploadIntentResult,
} from "./types";
import { JESSICA_SAMUEL_PHOTO_WALL } from "./config";
import {
  buildStoragePath,
  isPhotoWallOpen,
  normalizeUploadFileName,
  resolveContentType,
  validateCaption,
  validateContentType,
  validateFileSize,
  validateGuestName,
} from "./validation";
import { getPhotoUploadIntentRepository } from "./upload-intent-store";

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

function resolvePhotoWallContext(slug: string): InvitationContext | null {
  const ctx = resolveInvitationContext(slug);
  if (!ctx?.photoWallEnabled) return null;
  return ctx;
}

function closedResult(): WeddingPhotoUploadIntentResult {
  return {
    success: false,
    error: "A galeria de memórias ainda não está disponível.",
    code: "PHOTO_WALL_CLOSED",
  };
}

export async function createPhotoUploadIntent(
  input: WeddingPhotoUploadIntentInput,
  request: Request
): Promise<WeddingPhotoUploadIntentResult> {
  const ctx = resolvePhotoWallContext(input.slug);
  if (!ctx) {
    return { success: false, error: "Convite não encontrado.", code: "NOT_FOUND" };
  }

  if (!isPhotoWallOpen()) {
    return closedResult();
  }

  const bucketName = ctx.photoWallBucket;
  if (!bucketName) {
    return {
      success: false,
      error: "Serviço temporariamente indisponível.",
      code: "SERVICE_UNAVAILABLE",
    };
  }

  /** Isolamento Storage/DB — sempre o slug interno do Photo Wall. */
  const storageSlug = JESSICA_SAMUEL_PHOTO_WALL.invitationSlug;
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

  const limit = await publicMutationRateLimit(
    {
      scope: "photo-wall",
      slug: ctx.slug,
      action: "upload-intent",
      request,
    },
    RATE_LIMITS.jessicaSamuelPhotoIntent
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
    Date.now() + JESSICA_SAMUEL_PHOTO_WALL.uploadIntentTtlSeconds * 1000;
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
    console.error("[PhotoWall] upload intent repository error");
    return {
      success: false,
      error: "Não foi possível preparar o envio.",
      code: "STORAGE_ERROR",
    };
  }

  const signed = await signedUploadUrlImpl(bucketName, storagePath);
  if (!signed.signedUrl) {
    console.error("[PhotoWall] upload intent storage error");
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

export function __setSignedUploadUrlForTests(impl: SignedUploadUrlFn | null): void {
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
