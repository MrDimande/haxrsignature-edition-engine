import { NextResponse } from "next/server";
import { authorizeMemoriesRequest } from "@lib/memories/gateway";
import { memoriesJson } from "@lib/memories/admin-auth";
import { resolveMemoriesConfig } from "@lib/memories/config";
import { listExplorersLeaderboard } from "@lib/memories/mission-store";

export const dynamic = "force-dynamic";

/**
 * GET /api/memories/explorers?slug=...
 * Retorna a tabela oficial de classificação dos Exploradores.
 *
 * Directivas de Privacidade e Segurança:
 * 1. Apenas disponível quando a competição está expressamente activada (competition_enabled = true).
 * 2. Protegida pelo Gateway Central de autorização.
 * 3. Nunca expõe dados privados dos convidados (apenas display_name, pontuação, missões e posição).
 * 4. Ordenação determinística garantida pela base de dados.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug")?.trim() || "";

    if (!slug) {
      return memoriesJson(400, { success: false, error: "Slug do evento é obrigatório." });
    }

    // 1. Verificar se a competição está activada na configuração do evento
    const config = resolveMemoriesConfig(slug);
    if (config && config.competition?.enabled === false) {
      return memoriesJson(403, {
        success: false,
        error: "A funcionalidade Exploradores não está activada para este evento.",
      });
    }

    // 2. Gateway Central de Autorização
    const auth = await authorizeMemoriesRequest({
      request,
      slug,
      permission: "gallery:read",
    });

    if (!auth.ok) {
      return auth.response;
    }

    // 3. Consultar a classificação oficial
    const result = await listExplorersLeaderboard(slug);

    if (!result.success) {
      return memoriesJson(400, {
        success: false,
        error: result.error || "Erro ao consultar a classificação dos Exploradores.",
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: result.leaderboard,
        leaderboard: result.leaderboard,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error: any) {
    console.error("GET /api/memories/explorers error:", error?.message || error);
    return memoriesJson(500, {
      success: false,
      error: "Não foi possível carregar a tabela dos Exploradores.",
    });
  }
}
