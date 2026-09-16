import { NextResponse } from "next/server";
import { createMemoryUploadIntent } from "@lib/memories/upload";
import { STORAGE_WRITE_FROZEN_CODE } from "@lib/memories/storage";
import { randomUUID } from "node:crypto";
import {
  memoryUploadHttpStatus,
  normalizeMemoryUploadErrorCode,
} from "@lib/memories/upload-error-contract";

function correlationIdFor(request: Request): string {
  const supplied = request.headers.get("x-haxr-correlation-id")?.trim();
  return supplied && /^[a-zA-Z0-9_-]{8,128}$/.test(supplied) ? supplied : randomUUID();
}

function responseWithCorrelation(
  payload: Record<string, unknown>,
  status: number,
  correlationId: string,
  retryAfterSeconds?: number
) {
  return NextResponse.json({ ...payload, correlationId }, {
    status,
    headers: {
      "x-haxr-correlation-id": correlationId,
      ...(retryAfterSeconds ? { "Retry-After": String(retryAfterSeconds) } : {}),
    },
  });
}

export async function POST(request: Request) {
  const correlationId = correlationIdFor(request);
  try {
    const body = await request.json();

    if (!body || typeof body !== "object") {
      return responseWithCorrelation({ success: false, error: "Pedido inválido.", code: "UPLOAD_INTENT_FAILED" }, 400, correlationId);
    }

    const record = body as Record<string, unknown>;
    const slug = typeof record.slug === "string" ? record.slug.trim() : "";
    const fileName = typeof record.fileName === "string" ? record.fileName.trim() : "";
    const contentType = typeof record.contentType === "string" ? record.contentType.trim() : "";
    const fileSizeRaw = record.fileSizeBytes;
    const fileSizeBytes = typeof fileSizeRaw === "number" ? fileSizeRaw : Number(fileSizeRaw);
    const guestName = typeof record.guestName === "string" ? record.guestName.trim() : undefined;
    const caption = typeof record.caption === "string" ? record.caption.trim() : undefined;
    const challengeId = typeof record.challengeId === "string" ? record.challengeId.trim() : undefined;
    const tableId = typeof record.tableId === "string" ? record.tableId.trim() : undefined;
    const participantId = typeof record.participantId === "string" ? record.participantId.trim() : undefined;
    const clientUploadId = typeof record.clientUploadId === "string" ? record.clientUploadId.trim() : undefined;

    if (!slug) {
      return responseWithCorrelation({ success: false, error: "Convite inválido.", code: "UPLOAD_INTENT_FAILED" }, 400, correlationId);
    }
    if (!fileName) {
      return responseWithCorrelation({ success: false, error: "Seleccione um ficheiro.", code: "UPLOAD_INTENT_FAILED" }, 400, correlationId);
    }
    if (!Number.isInteger(fileSizeBytes) || fileSizeBytes <= 0) {
      return responseWithCorrelation({ success: false, error: "Tamanho de ficheiro inválido.", code: "FILE_TOO_LARGE" }, 400, correlationId);
    }

    const result = await createMemoryUploadIntent(
      {
        slug,
        fileName,
        contentType,
        fileSizeBytes,
        clientUploadId: clientUploadId || undefined,
        guestName: guestName || undefined,
        caption: caption || undefined,
        challengeId: challengeId || undefined,
        tableId: tableId || undefined,
        participantId: participantId || undefined,
      },
      request
    );

    if (!result.success) {
      const code = result.code === STORAGE_WRITE_FROZEN_CODE
        ? "SERVICE_UNAVAILABLE"
        : normalizeMemoryUploadErrorCode(result.code, "UPLOAD_INTENT_FAILED");
      const status = result.code === "RATE_LIMITED" ? 429 : result.code === "NOT_FOUND" ? 404 : memoryUploadHttpStatus(code);
      return responseWithCorrelation({ ...result, code }, status, correlationId, result.code === "RATE_LIMITED" ? result.retryAfterSeconds : undefined);
    }

    return responseWithCorrelation(result, 200, correlationId);
  } catch {
    console.error("POST /api/memories/upload-intent failed", { correlationId });
    return responseWithCorrelation(
      { success: false, error: "Serviço temporariamente indisponível.", code: "SERVICE_UNAVAILABLE" },
      503,
      correlationId
    );
  }
}
