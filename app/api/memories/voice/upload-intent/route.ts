import { NextResponse } from "next/server";
import { createVoiceUploadIntent } from "@lib/memories/voice";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const result = await createVoiceUploadIntent(
      {
        slug: typeof body.slug === "string" ? body.slug.trim() : "",
        photoId: typeof body.photoId === "string" ? body.photoId.trim() : "",
        contentType:
          typeof body.contentType === "string" ? body.contentType.trim() : "",
        fileSizeBytes:
          typeof body.fileSizeBytes === "number" ? body.fileSizeBytes : Number.NaN,
        durationSeconds:
          typeof body.durationSeconds === "number" ? body.durationSeconds : Number.NaN,
        participantId:
          typeof body.participantId === "string" ? body.participantId.trim() : undefined,
        guestName:
          typeof body.guestName === "string" ? body.guestName.trim() : undefined,
      },
      request
    );

    if (!result.success) {
      const status =
        result.code === "RATE_LIMITED"
          ? 429
          : result.code === "NOT_FOUND"
            ? 404
            : result.code === "SERVICE_UNAVAILABLE"
              ? 503
              : 400;
      const headers: Record<string, string> = {
        "Cache-Control": "no-store",
      };
      if (result.code === "RATE_LIMITED" && result.retryAfterSeconds) {
        headers["Retry-After"] = String(result.retryAfterSeconds);
      }
      return NextResponse.json(result, {
        status,
        headers,
      });
    }

    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Pedido inválido." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }
}
