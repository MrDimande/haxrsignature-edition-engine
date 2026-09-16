import { NextResponse } from "next/server";
import { completeMemoryUpload } from "@lib/memories/upload";
import { randomUUID } from "node:crypto";
import { memoryUploadHttpStatus, normalizeMemoryUploadErrorCode } from "@lib/memories/upload-error-contract";

function correlationIdFor(request: Request): string {
  const supplied = request.headers.get("x-haxr-correlation-id")?.trim();
  return supplied && /^[a-zA-Z0-9_-]{8,128}$/.test(supplied) ? supplied : randomUUID();
}

function responseWithCorrelation(payload: Record<string, unknown>, status: number, correlationId: string, retryAfterSeconds?: number) {
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
    const body = (await request.json()) as {
      slug?: string;
      photoId?: string;
      guestName?: string;
      caption?: string;
      challengeId?: string;
      tableId?: string;
      participantId?: string;
    };

    if (!body || typeof body !== "object") {
      return responseWithCorrelation({ success: false, error: "Pedido inválido.", code: "UPLOAD_COMPLETE_FAILED" }, 400, correlationId);
    }

    const result = await completeMemoryUpload(
      body.slug ?? "",
      body.photoId ?? "",
      request,
      {
        guestName: typeof body.guestName === "string" ? body.guestName : undefined,
        caption: typeof body.caption === "string" ? body.caption : undefined,
        challengeId: typeof body.challengeId === "string" ? body.challengeId : undefined,
        tableId: typeof body.tableId === "string" ? body.tableId : undefined,
        participantId: typeof body.participantId === "string" ? body.participantId : undefined,
      }
    );

    if (!result.success) {
      const code = normalizeMemoryUploadErrorCode(result.code, "UPLOAD_COMPLETE_FAILED");
      const status = result.code === "RATE_LIMITED" ? 429 : result.code === "NOT_FOUND" ? 404 : memoryUploadHttpStatus(code);
      return responseWithCorrelation({ ...result, code }, status, correlationId, result.code === "RATE_LIMITED" ? result.retryAfterSeconds : undefined);
    }

    return responseWithCorrelation({
      success: true,
      message: "Momento guardado com sucesso. Obrigado por nos ajudar a guardar este dia.",
      pointsAwarded: result.pointsAwarded,
      totalPoints: result.totalPoints,
    }, 200, correlationId);
  } catch {
    console.error("POST /api/memories/complete failed", { correlationId });
    return responseWithCorrelation(
      { success: false, error: "Serviço temporariamente indisponível.", code: "SERVICE_UNAVAILABLE" },
      503,
      correlationId
    );
  }
}

