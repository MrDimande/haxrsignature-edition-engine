/** Plus Memories — cliente de upload com contrato explícito por etapa. */
import {
  createMemoryUploadClientId,
  MEMORY_UPLOAD_ERROR_MESSAGES,
  normalizeMemoryUploadErrorCode,
  type MemoryUploadErrorCode,
  validateClientMediaFile,
} from "@lib/memories/upload-error-contract";

export type MemoryUploadOptions = {
  slug: string;
  file: File;
  challengeId?: string;
  tableId?: string;
  guestName?: string;
  caption?: string;
  participantId?: string;
  clientUploadId?: string;
  onProgress?: (progress: number) => void;
};

export type MemoryUploadResult =
  | { success: true; message: string; pointsAwarded?: number; totalPoints?: number; correlationId?: string }
  | { success: false; error: string; code: MemoryUploadErrorCode; correlationId?: string };

type UploadApiResponse = {
  success?: boolean;
  error?: string;
  code?: string;
  message?: string;
  photoId?: string;
  uploadUrl?: string;
  contentType?: string;
  alreadyCompleted?: boolean;
  pointsAwarded?: number;
  totalPoints?: number;
  correlationId?: string;
};

async function readUploadResponse(response: Response): Promise<UploadApiResponse> {
  try {
    return (await response.json()) as UploadApiResponse;
  } catch {
    return {};
  }
}

function uploadError(
  data: UploadApiResponse,
  fallback: MemoryUploadErrorCode,
  correlationId?: string | null
): Extract<MemoryUploadResult, { success: false }> {
  const code = normalizeMemoryUploadErrorCode(data.code, fallback);
  return {
    success: false,
    code,
    error: MEMORY_UPLOAD_ERROR_MESSAGES[code],
    correlationId: data.correlationId || correlationId || undefined,
  };
}

export async function uploadPlusMemory({
  slug,
  file,
  challengeId,
  tableId,
  guestName,
  caption,
  participantId,
  clientUploadId,
}: MemoryUploadOptions): Promise<MemoryUploadResult> {
  const localValidationError = validateClientMediaFile(file);
  if (localValidationError) {
    return {
      success: false,
      code: localValidationError,
      error: MEMORY_UPLOAD_ERROR_MESSAGES[localValidationError],
    };
  }

  const stableClientUploadId = clientUploadId || createMemoryUploadClientId();

  try {
    // 1. Request Intent
    const intentRes = await fetch("/api/memories/upload-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        fileName: file.name,
        contentType: file.type,
        fileSizeBytes: file.size,
        guestName,
        caption,
        challengeId,
        tableId,
        participantId,
        clientUploadId: stableClientUploadId,
      }),
    });

    const intentData = await readUploadResponse(intentRes);
    if (!intentRes.ok || !intentData.success) {
      return uploadError(intentData, "UPLOAD_INTENT_FAILED", intentRes.headers.get("x-haxr-correlation-id"));
    }

    const { photoId, uploadUrl } = intentData;
    if (!photoId) {
      return uploadError(intentData, "UPLOAD_INTENT_FAILED", intentRes.headers.get("x-haxr-correlation-id"));
    }

    // 2. Upload directo para Storage. Um replay já concluído salta o PUT e reconcilia no complete.
    if (!intentData.alreadyCompleted) {
      if (!uploadUrl) {
        return uploadError(intentData, "UPLOAD_SIGN_FAILED", intentRes.headers.get("x-haxr-correlation-id"));
      }
      const storageRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": intentData.contentType || file.type },
        body: file,
      });

      if (!storageRes.ok) {
        return {
          success: false,
          code: "STORAGE_UPLOAD_FAILED",
          error: MEMORY_UPLOAD_ERROR_MESSAGES.STORAGE_UPLOAD_FAILED,
        };
      }
    }

    // 3. Complete Upload
    const completeRes = await fetch("/api/memories/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        photoId,
        guestName,
        caption,
        challengeId,
        tableId,
        participantId,
      }),
    });

    const completeData = await readUploadResponse(completeRes);
    if (!completeRes.ok || !completeData.success) {
      return uploadError(completeData, "UPLOAD_COMPLETE_FAILED", completeRes.headers.get("x-haxr-correlation-id"));
    }

    return {
      success: true,
      message: completeData.message || "MOMENTO GUARDADO",
      pointsAwarded: typeof completeData.pointsAwarded === "number" ? completeData.pointsAwarded : undefined,
      totalPoints: typeof completeData.totalPoints === "number" ? completeData.totalPoints : undefined,
      correlationId: completeData.correlationId || completeRes.headers.get("x-haxr-correlation-id") || undefined,
    };
  } catch {
    return {
      success: false,
      code: "SERVICE_UNAVAILABLE",
      error: MEMORY_UPLOAD_ERROR_MESSAGES.SERVICE_UNAVAILABLE,
    };
  }
}
