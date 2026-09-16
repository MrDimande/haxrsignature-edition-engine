import { randomUUID } from "node:crypto";
import { getEditionDatabaseProvider } from "@lib/db";
import { getNeonPool } from "@lib/db/neon-client";
import { publicMutationRateLimit } from "@lib/security/mutation-rate-limit";
import { RATE_LIMITS } from "@lib/security/rate-limit";
import { resolveMemoriesConfig, resolveMemoriesConfigForEvent, PLUS_MEMORIES_CHALLENGE_WHITELIST } from "./config";
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
import { authorizeMemoriesRequest } from "./gateway";
import { sanitizeMediaMetadata, resolveDerivativePaths } from "./metadata";
import { resolveTargetStage } from "./stage-policy";
import { listStages } from "./stage-store";
import { submitMissionPhoto } from "./mission-store";
import { enqueueDerivativeJob } from "./derivatives";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export type MemoryUploadIntentInput = {
  slug: string;
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
  clientUploadId?: string;
  guestName?: string;
  caption?: string;
  challengeId?: string;
  tableId?: string;
  participantId?: string;
  stageId?: string;
  capturedAt?: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
};

export type MemoryUploadIntentResult =
  | {
      success: true;
      photoId: string;
      uploadUrl: string;
      storagePath: string;
      expiresAt: string;
      contentType: string;
      alreadyCompleted?: boolean;
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
  stageId?: string;
  capturedAt?: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
};

export type MemoryCompleteResult = {
  success: boolean;
  error?: string;
  code?: string;
  retryAfterSeconds?: number;
  pointsAwarded?: number;
  totalPoints?: number;
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
  const isLegacyChallenge = trimmed.length <= 20 && PLUS_MEMORIES_CHALLENGE_WHITELIST.includes(trimmed as any);
  const isUuidMission = UUID_V4_REGEX.test(trimmed);
  if (!isLegacyChallenge && !isUuidMission) {
    return "ID de desafio inválido.";
  }
  return null;
}

function validateTableId(tableId?: string): string | null {
  if (!tableId?.trim()) return null;
  if (tableId.trim().length > 10) return "Número de mesa inválido.";
  return null;
}

function validateClientUploadId(clientUploadId?: string): string | null {
  if (!clientUploadId?.trim()) return null;
  const trimmed = clientUploadId.trim();
  if (!UUID_V4_REGEX.test(trimmed)) {
    return "ID de upload do cliente inválido (deve ser UUID v4).";
  }
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

  // 2. Gateway Central de Autorização
  const auth = await authorizeMemoriesRequest({
    request,
    slug: input.slug,
    permission: "media:upload",
  });
  if (!auth.ok) {
    return {
      success: false,
      error: auth.error,
      code: auth.code,
    };
  }

  const config = resolveMemoriesConfigForEvent(input.slug, auth.ok ? auth.context.event : null);
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
      code: "UNSUPPORTED_MEDIA",
    };
  }

  const typeError = validateContentType(resolvedType);
  if (typeError) return { success: false, error: typeError, code: "UNSUPPORTED_MEDIA" };

  const sizeError = validateFileSize(input.fileSizeBytes, resolvedType);
  if (sizeError) return { success: false, error: sizeError, code: "FILE_TOO_LARGE" };

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

  const clientUploadError = validateClientUploadId(input.clientUploadId);
  if (clientUploadError) return { success: false, error: clientUploadError };

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

  const db = getEditionDatabaseProvider();
  if (!db.isConfigured()) {
    return {
      success: false,
      error: "Serviço temporariamente indisponível.",
      code: "SERVICE_UNAVAILABLE",
    };
  }

  // Idempotência Server-side em Session Mode (Regras 1, 2, 3, 4, 5)
  if (
    !auth.context.isLegacy &&
    auth.context.event?.id &&
    auth.context.experience?.id &&
    auth.context.participant?.id &&
    input.clientUploadId
  ) {
    const existing = db.findUploadIntentByClientIdempotency
      ? await db.findUploadIntentByClientIdempotency(
          auth.context.event.id,
          auth.context.experience.id,
          auth.context.participant.id,
          input.clientUploadId
        )
      : null;

    if (existing) {
      // 1. Já concluído: devolver media existente
      if (existing.status === "completed" || (existing.status === "consumed" && existing.completedMediaId)) {
        return {
          success: true,
          photoId: existing.completedMediaId || existing.photoId,
          uploadUrl: "",
          storagePath: existing.storagePath,
          expiresAt: existing.expiresAt,
          contentType: existing.contentType,
          alreadyCompleted: true,
        };
      }

      // 2. Pendente: verificar se expirou
      let effectiveExpiresAt = existing.expiresAt;
      const isExpired = new Date(existing.expiresAt).getTime() <= Date.now();
      if (isExpired) {
        // Regra 5: renovar o mesmo intent
        const newExpiresMs = Date.now() + config.uploadIntentTtlSeconds * 1000;
        effectiveExpiresAt = new Date(newExpiresMs).toISOString();
        if ((db as any).renewUploadIntent) {
          await (db as any).renewUploadIntent(existing.photoId, effectiveExpiresAt);
        }
      }

      // Gerar/renovar URL assinada para o mesmo storagePath canónico
      let uploadUrl: string;
      if (legacySignedUploadUrlTestSeam) {
        const signed = await legacySignedUploadUrlTestSeam(existing.bucketName, existing.storagePath);
        uploadUrl = signed.signedUrl || "";
      } else {
        const provider = getMemoriesStorageProvider();
        const signed = await provider.createSignedUploadUrl({
          storagePath: existing.storagePath,
          contentType: existing.contentType,
          expiresInSeconds: config.uploadIntentTtlSeconds,
        });
        uploadUrl = signed.uploadUrl;
      }

      return {
        success: true,
        photoId: existing.photoId,
        uploadUrl,
        storagePath: existing.storagePath,
        expiresAt: effectiveExpiresAt,
        contentType: existing.contentType,
      };
    }
  }

  let photoId: string = randomUUID();
  let storagePath = buildStoragePath(photoId, resolvedType, storageSlug);
  if (!storagePath) {
    return { success: false, error: "Tipo de ficheiro inválido." };
  }

  assertCanonicalStoragePath(storagePath);

  const expiresAt = Date.now() + config.uploadIntentTtlSeconds * 1000;
  const expiresAtIso = new Date(expiresAt).toISOString();

  const sanitizedMeta = sanitizeMediaMetadata({
    capturedAt: input.capturedAt,
    width: input.width,
    height: input.height,
    durationSeconds: input.durationSeconds,
    contentType: resolvedType,
    fileName: input.fileName,
  });

  const { thumbnailPath, posterPath } = resolveDerivativePaths(storagePath, sanitizedMeta.mediaType);

  let targetStageId = input.stageId || null;
  if (!auth.context.isLegacy && auth.context.experience?.id && auth.context.event?.id) {
    try {
      const stages = await listStages(auth.context.experience.id, auth.context.event.id);
      const stage = resolveTargetStage({
        overrideStageId: input.stageId,
        capturedAt: sanitizedMeta.capturedAt,
        stages,
      });
      if (stage) {
        targetStageId = stage.id;
      }
    } catch (err) {
      console.warn("[Memories] stage resolution error:", err);
    }
  }

  try {
    await getPhotoUploadIntentRepository().create({
      photoId,
      slug: storageSlug,
      bucketName,
      storagePath,
      contentType: resolvedType,
      declaredFileSizeBytes: input.fileSizeBytes,
      expiresAt: expiresAtIso,
      clientUploadId: input.clientUploadId || null,
      eventId: auth.context.isLegacy ? null : auth.context.event.id,
      participantId: auth.context.isLegacy ? null : auth.context.participant?.id,
      sessionId: auth.context.isLegacy ? null : auth.context.session?.id,
      experienceId: auth.context.isLegacy ? null : auth.context.experience.id,
      stageId: targetStageId,
      capturedAt: sanitizedMeta.capturedAt,
      width: sanitizedMeta.width,
      height: sanitizedMeta.height,
      durationSeconds: sanitizedMeta.durationSeconds,
      thumbnailStoragePath: thumbnailPath,
      posterStoragePath: posterPath,
    });
  } catch {
    console.error("[Memories] upload intent repository error");
    return {
      success: false,
      error: "Não foi possível preparar o envio.",
      code: "UPLOAD_INTENT_FAILED",
    };
  }

  // Regra 4: Garantia de atomicidade sob concorrência multi-request com o mesmo clientUploadId
  if (
    !auth.context.isLegacy &&
    auth.context.event?.id &&
    auth.context.experience?.id &&
    auth.context.participant?.id &&
    input.clientUploadId &&
    db.findUploadIntentByClientIdempotency
  ) {
    const finalRecord = await db.findUploadIntentByClientIdempotency(
      auth.context.event.id,
      auth.context.experience.id,
      auth.context.participant.id,
      input.clientUploadId
    );
    if (finalRecord) {
      photoId = finalRecord.photoId;
      storagePath = finalRecord.storagePath;
    }
  }

  let uploadUrl: string;

  if (legacySignedUploadUrlTestSeam) {
    const signed = await legacySignedUploadUrlTestSeam(bucketName, storagePath);
    if (!signed.signedUrl) {
      return {
        success: false,
        error: "Não foi possível preparar o envio.",
        code: "UPLOAD_SIGN_FAILED",
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
      code: "UPLOAD_SIGN_FAILED",
      };
    }
  }

  return {
    success: true,
    photoId,
    uploadUrl,
    storagePath,
    expiresAt: expiresAtIso,
    contentType: resolvedType,
  };
}

// ──────────────────────────────────────────────
// Complete Upload (genérico multi-evento com transacção e idempotência)
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
    stageId?: string;
    capturedAt?: string;
    width?: number;
    height?: number;
    durationSeconds?: number;
  } = {}
): Promise<MemoryCompleteResult> {
  // 1. Gateway Central de Autorização
  const auth = await authorizeMemoriesRequest({
    request,
    slug,
    permission: "media:upload",
  });
  if (!auth.ok) {
    return {
      success: false,
      error: auth.error,
      code: auth.code,
    };
  }

  const config = resolveMemoriesConfigForEvent(slug, auth.ok ? auth.context.event : null);
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

  const db = getEditionDatabaseProvider();
  if (!db.isConfigured()) {
    return {
      success: false,
      error: "Serviço temporariamente indisponível.",
      code: "SERVICE_UNAVAILABLE",
    };
  }

  // Se o provider for Neon, executar fluxo transaccional com SELECT FOR UPDATE e idempotência
  if (db.completePhotoUploadTransaction && db.name === "neon") {
    const pool = getNeonPool();
    let preCheck;
    try {
      preCheck = await pool.query(
        `SELECT storage_path, content_type, declared_file_size_bytes, status, completed_media_id
         FROM photo_upload_intents
         WHERE id = $1 AND invitation_slug = $2`,
        [photoId, storageSlug]
      );
    } catch {
      console.error("[Memories] complete upload pre-check failed");
      return { success: false, error: "Serviço temporariamente indisponível.", code: "SERVICE_UNAVAILABLE" };
    }

    if (preCheck.rows.length === 0) {
      return { success: false, error: "Pedido de envio expirado.", code: "INTENT_EXPIRED" };
    }

    const intentRow = preCheck.rows[0];

    // Idempotência imediata se já concluído: reconciliar side effects idempotentes (Hardening 7)
    if (intentRow.status === "completed" || (intentRow.status === "consumed" && intentRow.completed_media_id)) {
      const existingMediaId = intentRow.completed_media_id || photoId;
      if (metadata.challengeId && existingMediaId) {
        const partId = auth.context.isLegacy
          ? (metadata.participantId || "00000000-0000-0000-0000-000000000001")
          : auth.context.participant?.id;

        if (partId) {
          try {
            const missionResult = await submitMissionPhoto({
              slug,
              missionId: metadata.challengeId,
              mediaId: existingMediaId,
              participantId: partId,
              tableId: metadata.tableId,
            });
            if (!missionResult.success) {
              return {
                success: false,
                error: missionResult.error || "Não foi possível concluir a missão.",
                code: "MISSION_SUBMISSION_FAILED",
              };
            }
            return {
              success: true,
              pointsAwarded: missionResult.pointsAwarded,
              totalPoints: missionResult.totalPoints,
            };
          } catch {
            console.error("[Memories] replay mission reconciliation failed");
            return { success: false, error: "Não foi possível concluir a missão.", code: "MISSION_SUBMISSION_FAILED" };
          }
        }
      }
      return { success: true };
    }

    if (intentRow.status === "cancelled") {
      return { success: false, error: "Pedido de envio cancelado.", code: "INTENT_CANCELLED" };
    }

    assertCanonicalStoragePath(intentRow.storage_path);
    const provider = getMemoriesStorageProvider();

    let objectInfo;
    try {
      objectInfo = await provider.getObjectInfo(intentRow.storage_path);
    } catch (err: any) {
      console.error("[Memories] getObjectInfo error:", err?.message || err);
      return { success: false, error: "Não foi possível confirmar o envio.", code: "UPLOAD_COMPLETE_FAILED" };
    }

    if (!objectInfo.exists || objectInfo.contentLength === undefined) {
      return { success: false, error: "Não foi possível confirmar o envio.", code: "STORAGE_UPLOAD_FAILED" };
    }

    const actualSizeBytes = objectInfo.contentLength;
    const sizeError = validateFileSize(actualSizeBytes, intentRow.content_type);
    if (sizeError || actualSizeBytes > intentRow.declared_file_size_bytes) {
      await provider.remove(intentRow.storage_path);
      return {
        success: false,
        error:
          sizeError ??
          `O ficheiro excede o limite de ${Math.round(
            maxBytesForContentType(intentRow.content_type) / (1024 * 1024)
          )} MB.`,
        code: "FILE_TOO_LARGE",
      };
    }

    const prefixBytes = await provider.readObjectPrefix(intentRow.storage_path, 512);
    if (!prefixBytes || !matchesMagicBytes(prefixBytes, intentRow.content_type)) {
      await provider.remove(intentRow.storage_path);
      return { success: false, error: "Tipo de ficheiro inválido.", code: "UNSUPPORTED_MEDIA" };
    }

    const txResult = await db.completePhotoUploadTransaction({
      photoId,
      slug: storageSlug,
      actualSizeBytes,
      guestName: metadata.guestName,
      caption: metadata.caption,
      challengeId: metadata.challengeId,
      tableId: metadata.tableId,
      participantId: metadata.participantId,
      stageId: metadata.stageId,
      capturedAt: metadata.capturedAt,
      width: metadata.width,
      height: metadata.height,
      durationSeconds: metadata.durationSeconds,
      context: auth.context.isLegacy
        ? null
        : {
            eventId: auth.context.event.id,
            experienceId: auth.context.experience.id,
            participantId: auth.context.participant!.id,
            sessionId: auth.context.session!.id,
          },
    });

    if (!txResult.success) {
      return { success: false, error: txResult.error, code: txResult.code };
    }

    // Fase 5: Enfileirar processamento assíncrono de derivados (não-bloqueante, apenas para novas mídias)
    if (txResult.mediaId && !txResult.replayed) {
      enqueueDerivativeJob(txResult.mediaId);
    }

    // Fase 3: Integrar submissão da missão se challengeId estiver presente
    if (metadata.challengeId && txResult.mediaId) {
      const partId = auth.context.isLegacy
        ? (metadata.participantId || "00000000-0000-0000-0000-000000000001")
        : auth.context.participant?.id;

      if (partId) {
        try {
          const subRes = await submitMissionPhoto({
            slug,
            missionId: metadata.challengeId,
            mediaId: txResult.mediaId,
            participantId: partId,
            tableId: metadata.tableId,
          });
          if (!subRes.success) {
            return {
              success: false,
              error: subRes.error || "Não foi possível concluir a missão.",
              code: "MISSION_SUBMISSION_FAILED",
            };
          }
          return {
            success: true,
            pointsAwarded: subRes.pointsAwarded,
            totalPoints: subRes.totalPoints,
          };
        } catch (err: any) {
          console.error("[Memories] mission submission failed");
          return { success: false, error: "Não foi possível concluir a missão.", code: "MISSION_SUBMISSION_FAILED" };
        }
      }
    }

    return { success: true };
  }

  // Fallback para provedores sem transacção completa
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

  const inserted = await db.insertPendingPhoto({
    id: photoId,
    invitationSlug: storageSlug,
    storagePath: intent.storagePath,
    originalFilename,
    contentType: intent.contentType,
    fileSizeBytes: actualSizeBytes,
    guestName: metadata.guestName?.trim() || null,
    caption: metadata.caption?.trim() || null,
    challengeId: metadata.challengeId?.trim() || null,
    tableId: metadata.tableId?.trim() || null,
    participantId: metadata.participantId?.trim() || null,
  });

  if (!inserted) {
    console.error("[Memories] insert error");
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
