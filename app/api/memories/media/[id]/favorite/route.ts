 import { memoriesJson } from "@lib/memories/admin-auth";
import { authorizeMemoriesRequest } from "@lib/memories/gateway";
import { addMediaFavorite, removeMediaFavorite, toggleMediaFavorite } from "@lib/memories/social-store";
import { RATE_LIMITS, rateLimit } from "@lib/security/rate-limit";
import { NextResponse } from "next/server";

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
        error: "Sessão de participante necessária para gerir favoritos.",
      });
    }

    // Rate Limiting anti-abuso por evento + participante + endpoint
    const eventId = auth.context.event.id;
    const rl = rateLimit(`rl:${eventId}:${participantId}:favorite`, RATE_LIMITS.mediaFavorite);
    if (!rl.allowed) {
      return memoriesJson(429, {
        success: false,
        error: "Demasiadas operações consecutivas. Por favor aguarde um momento.",
      });
    }

    let result;
    if (body.action === "remove") {
      result = await removeMediaFavorite({ slug, mediaId, participantId });
    } else if (body.action === "toggle") {
      result = await toggleMediaFavorite({ slug, mediaId, participantId });
    } else {
      result = await addMediaFavorite({ slug, mediaId, participantId });
    }

    if (!result.success) {
      return memoriesJson(400, {
        success: false,
        error: result.error || "Não foi possível actualizar o favorito.",
      });
    }

    return NextResponse.json({
      success: true,
      isFavorite: result.isFavorite,
    });
  } catch (err: any) {
    console.error("[POST /api/memories/media/:id/favorite] Erro:", err.message);
    return memoriesJson(500, { success: false, error: "Erro interno ao processar favorito." });
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

    const participantId = auth.context.participant?.id;
    if (!participantId) {
      return memoriesJson(401, {
        success: false,
        error: "Sessão de participante necessária para remover favorito.",
      });
    }

    const eventId = auth.context.event.id;
    const rl = rateLimit(`rl:${eventId}:${participantId}:favorite`, RATE_LIMITS.mediaFavorite);
    if (!rl.allowed) {
      return memoriesJson(429, {
        success: false,
        error: "Demasiadas operações consecutivas. Por favor aguarde um momento.",
      });
    }

    const result = await removeMediaFavorite({
      slug,
      mediaId,
      participantId,
    });

    if (!result.success) {
      return memoriesJson(400, {
        success: false,
        error: result.error || "Não foi possível remover favorito.",
      });
    }

    return NextResponse.json({
      success: true,
      isFavorite: false,
    });
  } catch (err: any) {
    console.error("[DELETE /api/memories/media/:id/favorite] Erro:", err.message);
    return memoriesJson(500, { success: false, error: "Erro interno ao remover favorito." });
  }
}
