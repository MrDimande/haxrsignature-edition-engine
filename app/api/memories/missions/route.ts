import { NextResponse } from "next/server";
import { authorizeMemoriesRequest } from "@lib/memories/gateway";
import { memoriesJson } from "@lib/memories/admin-auth";
import { listMissionsForParticipant } from "@lib/memories/mission-store";

export const dynamic = "force-dynamic";

/**
 * GET /api/memories/missions?slug=...[&tableId=...]
 * Retorna as missões activas e elegíveis para o participante da sessão.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug")?.trim() || "";
    const queryTableId = searchParams.get("tableId")?.trim() || null;

    if (!slug) {
      return memoriesJson(400, { success: false, error: "Slug do evento é obrigatório." });
    }

    // 1. Gateway Central de Autorização
    const auth = await authorizeMemoriesRequest({
      request,
      slug,
      permission: "gallery:read",
    });

    if (!auth.ok) {
      return auth.response;
    }

    // 2. Resolver o ID do participante autoritativamente server-side
    const participantId = auth.context.isLegacy
      ? (searchParams.get("participantId")?.trim() || null)
      : (auth.context.participant?.id || null);

    // 3. Consultar missões com status de conclusão
    const result = await listMissionsForParticipant(slug, participantId, queryTableId);

    if (!result.success) {
      return memoriesJson(400, { success: false, error: result.error || "Erro ao listar missões." });
    }

    return NextResponse.json({
      success: true,
      data: result.missions,
      missions: result.missions,
    }, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error("GET /api/memories/missions error:", error?.message || error);
    return memoriesJson(500, {
      success: false,
      error: "Não foi possível carregar as missões do evento.",
    });
  }
}
