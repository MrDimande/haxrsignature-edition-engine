import { NextResponse } from "next/server";
import { getParticipantProgress } from "@lib/memories/leaderboard";
import { authorizeMemoriesRequest } from "@lib/memories/gateway";
import { memoriesJson } from "@lib/memories/admin-auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug")?.trim() || "";
    let participantId = searchParams.get("participantId")?.trim() || "";

    if (!slug) {
      return memoriesJson(400, { success: false, error: "Convite inválido." });
    }

    const auth = await authorizeMemoriesRequest({ request, slug, permission: "progress:read" });
    if (!auth.ok) {
      return auth.response;
    }

    // Se estiver em session mode, a identidade do participante provém exclusivamente da sessão verificada
    if (!auth.context.isLegacy) {
      participantId = auth.context.participant?.id || "";
    }

    if (!participantId) {
      return memoriesJson(400, { success: false, error: "ID de participante é obrigatório." });
    }

    const result = await getParticipantProgress(slug, participantId);
    if (!result.success) {
      return memoriesJson(400, result as unknown as Record<string, unknown>);
    }

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("GET /api/memories/progress error:", error);
    return memoriesJson(400, { success: false, error: "Pedido inválido." });
  }
}
