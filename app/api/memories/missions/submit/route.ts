import { NextResponse } from "next/server";
import { authorizeMemoriesRequest } from "@lib/memories/gateway";
import { memoriesJson } from "@lib/memories/admin-auth";
import { submitMissionPhoto } from "@lib/memories/mission-store";

export const dynamic = "force-dynamic";

/**
 * POST /api/memories/missions/submit
 * Endpoint alternativo que aceita missionId directamente no corpo do pedido.
 */
export async function POST(request: Request) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      return memoriesJson(400, { success: false, error: "Corpo do pedido em formato JSON inválido." });
    }

    const missionId = body.missionId?.trim() || "";
    const slug = body.slug?.trim() || "";
    const mediaId = body.mediaId?.trim() || "";
    const tableId = body.tableId?.trim() || null;

    if (!missionId) {
      return memoriesJson(400, { success: false, error: "Identificador da missão em falta." });
    }
    if (!slug) {
      return memoriesJson(400, { success: false, error: "Slug do evento é obrigatório." });
    }
    if (!mediaId) {
      return memoriesJson(400, { success: false, error: "Identificador da mídia (mediaId) é obrigatório." });
    }

    // 1. Gateway Central de Autorização
    const auth = await authorizeMemoriesRequest({
      request,
      slug,
      permission: "challenge:submit",
      requireSameOriginMutation: true,
    });

    if (!auth.ok) {
      return auth.response;
    }

    // 2. Determinar participantId de forma autoritativa
    let participantId: string | null = null;
    if (auth.context.isLegacy) {
      participantId = body.participantId?.trim() || null;
      if (!participantId) {
        participantId = "00000000-0000-0000-0000-000000000001";
      }
    } else {
      participantId = auth.context.participant?.id || null;
    }

    if (!participantId) {
      return memoriesJson(401, {
        success: false,
        error: "Identidade do participante não pôde ser verificada na sessão.",
      });
    }

    // 3. Submeter via store transaccional seguro
    const result = await submitMissionPhoto({
      slug,
      missionId,
      mediaId,
      participantId,
      tableId,
    });

    if (!result.success) {
      return memoriesJson(400, {
        success: false,
        error: result.error || "Não foi possível submeter a missão.",
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        submissionId: result.submissionId,
        pointsAwarded: result.pointsAwarded,
        totalPoints: result.totalPoints,
      },
    });
  } catch (error: any) {
    console.error("POST /api/memories/missions/submit error:", error?.message || error);
    return memoriesJson(500, {
      success: false,
      error: "Erro interno ao processar a submissão da missão.",
    });
  }
}
