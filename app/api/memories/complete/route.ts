import { NextResponse } from "next/server";
import { completeMemoryUpload } from "@lib/memories/upload";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      slug?: string;
      photoId?: string;
      guestName?: string;
      caption?: string;
      challengeId?: string;
      tableId?: string;
      participantId?: string;
      phaseId?: string;
    };

    if (!body || typeof body !== "object") {
      return NextResponse.json({ success: false, error: "Pedido inválido." }, { status: 400 });
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
        phaseId: typeof body.phaseId === "string" ? body.phaseId : undefined,
      }
    );

    if (!result.success) {
      const status =
        result.code === "RATE_LIMITED"
          ? 429
          : result.code === "NOT_FOUND"
            ? 404
            : 400;
      return NextResponse.json(result, {
        status,
        headers:
          result.code === "RATE_LIMITED" && result.retryAfterSeconds
            ? { "Retry-After": String(result.retryAfterSeconds) }
            : undefined,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Momento guardado com sucesso. Obrigado por nos ajudar a guardar este dia.",
    });
  } catch (error) {
    console.error("POST /api/memories/complete error:", error);
    return NextResponse.json(
      { success: false, error: "Pedido inválido." },
      { status: 400 }
    );
  }
}

