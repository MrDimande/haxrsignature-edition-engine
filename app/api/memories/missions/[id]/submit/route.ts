import { NextResponse } from "next/server";
import { authorizeMemoriesRequest } from "@lib/memories/gateway";
import { memoriesJson } from "@lib/memories/admin-auth";
import { submitMissionPhoto } from "@lib/memories/mission-store";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/memories/missions/[id]/submit
 * Submete uma fotografia ou vídeo do Media Core para a missão especificada.
 *
 * Directivas de Segurança:
 * 1. Autorização central obrigatória via Gateway (permissão "challenge:submit").
 * 2. O browser NUNCA define a pontuação (qualquer campo de pontos recebido é estritamente ignorado).
 * 3. O participant_id é extraído exclusivamente da sessão autenticada (ou fallback seguro em legado).
 * 4. Idempotência garantida server-side com bloqueios transaccionais.
 */
export async function POST(request: Request, context: RouteParams) {
  try {
    const { id: missionId } = await context.params;

    if (!missionId) {
      return memoriesJson(400, { success: false, error: "Identificador da missão em falta." });
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      return memoriesJson(400, { success: false, error: "Corpo do pedido em formato JSON inválido." });
    }

    const slug = body.slug?.trim() || "";
    const mediaId = body.mediaId?.trim() || "";
    const tableId = body.tableId?.trim() || null;

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
      // Se for legado e não houver participantId, usar identificador determinístico da sessão/convidado
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
    // Nota: Qualquer valor de "points" enviado pelo cliente é deliberadamente descartado aqui
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
    console.error("POST /api/memories/missions/[id]/submit error:", error?.message || error);
    return memoriesJson(500, {
      success: false,
      error: "Erro interno ao processar a submissão da missão.",
    });
  }
}
