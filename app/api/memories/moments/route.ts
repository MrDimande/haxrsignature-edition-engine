import { NextResponse } from "next/server";
import { authorizeMemoriesRequest } from "@lib/memories/gateway";
import { getMomentsFeed } from "@lib/memories/moments";
import { memoriesJson } from "@lib/memories/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug")?.trim() || "";

    if (!slug) {
      return memoriesJson(400, { success: false, error: "Slug é obrigatório." });
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

    const participantId = auth.context.isLegacy ? null : auth.context.participant?.id || null;
    const feed = await getMomentsFeed(slug, participantId);

    return NextResponse.json({
      success: true,
      data: feed,
    });
  } catch (error: any) {
    console.error("GET /api/memories/moments error:", error?.message || error);
    return memoriesJson(500, {
      success: false,
      error: "Não foi possível carregar os momentos do evento.",
    });
  }
}
