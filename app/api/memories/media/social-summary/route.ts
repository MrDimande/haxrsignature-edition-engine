import { NextResponse } from "next/server";
import { authorizeMemoriesRequest } from "@lib/memories/gateway";
import { memoriesJson } from "@lib/memories/admin-auth";
import { getBatchSocialSummary } from "@lib/memories/social-store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      return memoriesJson(400, { success: false, error: "Corpo do pedido em formato JSON inválido." });
    }

    const slug = body.slug?.trim() || "";
    const mediaIds = Array.isArray(body.mediaIds) ? body.mediaIds : [];

    if (!slug) {
      return memoriesJson(400, { success: false, error: "Slug do evento é obrigatório." });
    }

    const auth = await authorizeMemoriesRequest({
      request,
      slug,
      permission: "gallery:read",
    });

    if (!auth.ok) {
      return auth.response;
    }

    // Identidade estritamente resolvida no servidor (sem aceitar participantId do body)
    const participantId = auth.context.participant?.id || null;

    const summaryMap = await getBatchSocialSummary(mediaIds, participantId);
    const summaries: Record<string, any> = {};
    for (const [id, s] of summaryMap) {
      summaries[id] = s;
    }

    return NextResponse.json({
      success: true,
      summaries,
    });
  } catch (err: any) {
    console.error("[POST /api/memories/media/social-summary] Erro:", err.message);
    return memoriesJson(500, { success: false, error: "Erro interno ao consultar resumo social." });
  }
}
