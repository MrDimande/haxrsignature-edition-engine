import { NextResponse } from "next/server";
import { authorizeMemoriesRequest } from "@lib/memories/gateway";
import { memoriesJson } from "@lib/memories/admin-auth";
import { toggleMediaReaction, removeMediaReaction, ALLOWED_REACTION_TYPES } from "@lib/memories/social-store";
import { rateLimit, getRequestIp, RATE_LIMITS } from "@lib/security/rate-limit";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteParams) {
  try {
    const { id: mediaId } = await context.params;
    if (!mediaId) {
      return memoriesJson(400, { success: false, error: "Identificador da mídia em falta." });
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      return memoriesJson(400, { success: false, error: "Corpo do pedido em formato JSON inválido." });
    }

    const slug = body.slug?.trim() || "";
    const rawType = body.reactionType?.trim().toLowerCase() || "";

    if (!slug) {
      return memoriesJson(400, { success: false, error: "Slug do evento é obrigatório." });
    }
    if (!rawType || !ALLOWED_REACTION_TYPES.includes(rawType as any)) {
      return memoriesJson(400, { success: false, error: "Tipo de reacção inválido ou em falta." });
    }

    const auth = await authorizeMemoriesRequest({
      request,
      slug,
      permission: "gallery:read",
      requireSameOriginMutation: true,
    });

    if (!auth.ok) {
      return auth.response;
    }

    // Identidade do participante resolvida estritamente pelo gateway server-side
    const participantId = auth.context.participant?.id;
    if (!participantId) {
      return memoriesJson(401, {
        success: false,
        error: "Sessão de participante necessária para reagir.",
      });
    }

    // Rate Limiting anti-abuso por evento + participante + endpoint
    const eventId = auth.context.event.id;
    const rl = rateLimit(`rl:${eventId}:${participantId}:reaction`, RATE_LIMITS.mediaReaction);
    if (!rl.allowed) {
      return memoriesJson(429, {
        success: false,
        error: "Demasiadas reacções consecutivas. Por favor aguarde um momento.",
      });
    }

    const result = await toggleMediaReaction({
      slug,
      mediaId,
      participantId,
      reactionType: rawType,
    });

    if (!result.success) {
      return memoriesJson(400, {
        success: false,
        error: result.error || "Não foi possível registar a reacção.",
      });
    }

    return NextResponse.json({
      success: true,
      action: result.action,
      reactionType: result.reactionType,
      reactionCounts: result.reactionCounts,
      totalReactions: result.totalReactions,
    });
  } catch (err: any) {
    console.error("[POST /api/memories/media/:id/reaction] Erro:", err.message);
    return memoriesJson(500, { success: false, error: "Erro interno ao processar reacção." });
  }
}

export async function DELETE(request: Request, context: RouteParams) {
  try {
    const { id: mediaId } = await context.params;
    if (!mediaId) {
      return memoriesJson(400, { success: false, error: "Identificador da mídia em falta." });
    }

    const url = new URL(request.url);
    const slug = url.searchParams.get("slug")?.trim() || "";
    if (!slug) {
      return memoriesJson(400, { success: false, error: "Slug do evento é obrigatório." });
    }

    const auth = await authorizeMemoriesRequest({
      request,
      slug,
      permission: "gallery:read",
      requireSameOriginMutation: true,
    });

    if (!auth.ok) {
      return auth.response;
    }

    // Identidade do participante resolvida estritamente pelo gateway server-side
    const participantId = auth.context.participant?.id;
    if (!participantId) {
      return memoriesJson(401, {
        success: false,
        error: "Sessão de participante necessária para remover reacção.",
      });
    }

    const eventId = auth.context.event.id;
    const rl = rateLimit(`rl:${eventId}:${participantId}:reaction`, RATE_LIMITS.mediaReaction);
    if (!rl.allowed) {
      return memoriesJson(429, {
        success: false,
        error: "Demasiadas operações consecutivas. Por favor aguarde um momento.",
      });
    }

    const result = await removeMediaReaction({
      slug,
      mediaId,
      participantId,
    });

    if (!result.success) {
      return memoriesJson(400, {
        success: false,
        error: result.error || "Não foi possível remover a reacção.",
      });
    }

    return NextResponse.json({
      success: true,
      action: "removed",
      reactionType: null,
      reactionCounts: result.reactionCounts,
      totalReactions: result.totalReactions,
    });
  } catch (err: any) {
    console.error("[DELETE /api/memories/media/:id/reaction] Erro:", err.message);
    return memoriesJson(500, { success: false, error: "Erro interno ao remover reacção." });
  }
}
