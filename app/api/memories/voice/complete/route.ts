import { NextResponse } from "next/server";
import { completeVoiceUpload } from "@lib/memories/voice";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const slug = typeof body.slug === "string" ? body.slug.trim() : "";
    const voiceMessageId =
      typeof body.voiceMessageId === "string" ? body.voiceMessageId.trim() : "";
    const result = await completeVoiceUpload(slug, voiceMessageId, request);

    if (!result.success) {
      const status =
        result.code === "RATE_LIMITED"
          ? 429
          : result.code === "FEATURE_OFF"
            ? 404
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

    return NextResponse.json(
      {
        success: true,
        message: "Mensagem guardada para os anfitriões.",
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Pedido inválido." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }
}
