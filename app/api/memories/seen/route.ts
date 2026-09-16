import { NextResponse } from "next/server";
import { authorizeMemoriesRequest } from "@lib/memories/gateway";
import { recordMediaView } from "@lib/memories/seen-store";
import { memoriesJson } from "@lib/memories/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      slug?: string;
      mediaId?: string;
      progress?: number;
    };

    const slug = body.slug?.trim() || "";
    const mediaId = body.mediaId?.trim() || "";

    if (!slug || !mediaId) {
      return memoriesJson(400, {
        success: false,
        error: "slug e mediaId são obrigatórios.",
      });
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

    if (auth.context.isLegacy || !auth.context.participant?.id) {
      return memoriesJson(403, {
        success: false,
        error: "Apenas participantes com sessão activa podem registar visualizações.",
      });
    }

    const result = await recordMediaView({
      eventId: auth.context.event.id,
      experienceId: auth.context.experience.id,
      mediaId,
      participantId: auth.context.participant.id,
      sessionId: auth.context.session?.id || null,
      progress: typeof body.progress === "number" ? body.progress : 1.0,
    });

    if (!result.success) {
      return memoriesJson(400, {
        success: false,
        error: result.error || "Não foi possível registar o estado de visualização.",
      });
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error("POST /api/memories/seen error:", error?.message || error);
    return memoriesJson(500, {
      success: false,
      error: "Erro interno ao registar visualização.",
    });
  }
}
