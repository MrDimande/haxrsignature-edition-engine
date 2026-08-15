import { NextResponse } from "next/server";
import { getParticipantProgress } from "@lib/memories/leaderboard";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug")?.trim() || "";
    const participantId = searchParams.get("participantId")?.trim() || "";

    if (!slug) {
      return NextResponse.json(
        { success: false, error: "Convite inválido." },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    if (!participantId) {
      return NextResponse.json(
        { success: false, error: "ID de participante é obrigatório." },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const result = await getParticipantProgress(slug, participantId);
    if (!result.success) {
      return NextResponse.json(result, { status: 400, headers: { "Cache-Control": "no-store" } });
    }

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("GET /api/memories/progress error:", error);
    return NextResponse.json(
      { success: false, error: "Pedido inválido." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }
}
