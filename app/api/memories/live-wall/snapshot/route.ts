import { NextResponse } from "next/server";
import { resolveMemoriesEvent } from "@lib/memories/session-store";
import { memoriesJson } from "@lib/memories/admin-auth";
import { authorizeDisplayRequest } from "@lib/memories/display-security";
import { getLiveWallSnapshot } from "@lib/memories/live-wall-store";

export const dynamic = "force-dynamic";

/**
 * GET /api/memories/live-wall/snapshot?slug=...
 * Retorna o snapshot inicial do Live Wall com mídias aprovadas, configuração e cursor de stream.
 * Exige sessão de display válida e Live Wall activado na experiência.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug")?.trim() || "";

  if (!slug) {
    return memoriesJson(400, { success: false, error: "Slug do evento é obrigatório." });
  }

  const eventInfo = await resolveMemoriesEvent(slug);
  if (!eventInfo) {
    return memoriesJson(404, { success: false, error: "Evento não encontrado." });
  }

  // Validação estrita de credenciais de display
  const auth = await authorizeDisplayRequest(request, eventInfo.id);
  if (!auth.ok) {
    return memoriesJson(auth.status, { success: false, error: auth.error, code: auth.code });
  }

  const snapshot = await getLiveWallSnapshot({
    eventId: eventInfo.id,
    experienceId: eventInfo.experienceId,
    eventSlug: eventInfo.slug,
  });

  if (!snapshot.ok) {
    return memoriesJson(snapshot.code === "LIVE_WALL_DISABLED" ? 403 : 500, {
      success: false,
      error: snapshot.error,
      code: snapshot.code,
      config: snapshot.config,
    });
  }

  return NextResponse.json({
    success: true,
    config: snapshot.config,
    cursor: snapshot.cursor,
    media: snapshot.media,
    explorers: snapshot.explorers,
  });
}
