import { NextResponse } from "next/server";
import { authorizeMemoriesRequest } from "@lib/memories/gateway";
import { memoriesJson } from "@lib/memories/admin-auth";
import { addMediaComment, listMediaComments } from "@lib/memories/social-store";
import { rateLimit, getRequestIp, RATE_LIMITS } from "@lib/security/rate-limit";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteParams) {
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
    });

    if (!auth.ok) {
      return auth.response;
    }

    // Identidade do participante para visualizar seus próprios comentários pendentes (apenas via sessão autenticada)
    const participantId = auth.context.participant?.id || null;
    const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "50", 10), 1), 100);
    const offset = Math.max(parseInt(url.searchParams.get("offset") || "0", 10), 0);

    const result = await listMediaComments({
      slug,
      mediaId,
      participantId,
      limit,
      offset,
    });

    if (!result.success) {
      return memoriesJson(400, { success: false, error: result.error || "Erro ao listar comentários." });
    }

    return NextResponse.json({
      success: true,
      comments: result.comments,
    });
  } catch (err: any) {
    console.error("[GET /api/memories/media/:id/comments] Erro:", err.message);
    return memoriesJson(500, { success: false, error: "Erro interno ao consultar comentários." });
  }
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
    const rawBody = typeof body.body === "string" ? body.body : "";

    if (!slug) {
      return memoriesJson(400, { success: false, error: "Slug do evento é obrigatório." });
    }
    if (!rawBody.trim()) {
      return memoriesJson(400, { success: false, error: "O texto do comentário não pode estar vazio." });
    }
    if (rawBody.length > 500) {
      return memoriesJson(400, { success: false, error: "O comentário excede o limite máximo de 500 caracteres." });
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
        error: "Sessão de participante necessária para comentar.",
      });
    }

    // Rate Limiting anti-abuso de comentários por evento + participante + endpoint
    const eventId = auth.context.event.id;
    const rl = rateLimit(`rl:${eventId}:${participantId}:comment`, RATE_LIMITS.mediaComment);
    if (!rl.allowed) {
      return memoriesJson(429, {
        success: false,
        error: "Demasiados comentários enviados. Por favor aguarde um momento antes de voltar a comentar.",
      });
    }

    const result = await addMediaComment({
      slug,
      mediaId,
      participantId,
      body: rawBody,
    });

    if (!result.success) {
      return memoriesJson(400, {
        success: false,
        error: result.error || "Não foi possível registar o comentário.",
      });
    }

    return NextResponse.json({
      success: true,
      comment: result.comment,
    });
  } catch (err: any) {
    console.error("[POST /api/memories/media/:id/comments] Erro:", err.message);
    return memoriesJson(500, { success: false, error: "Erro interno ao registar comentário." });
  }
}
