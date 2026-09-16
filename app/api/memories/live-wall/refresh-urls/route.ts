import { NextResponse } from "next/server";
import { resolveMemoriesEvent } from "@lib/memories/session-store";
import { memoriesJson } from "@lib/memories/admin-auth";
import { authorizeDisplayRequest } from "@lib/memories/display-security";
import { refreshLiveWallUrls } from "@lib/memories/live-wall-store";

export const dynamic = "force-dynamic";

/**
 * POST /api/memories/live-wall/refresh-urls
 * Renovação atómica de URLs assinadas para mídias activas no Live Wall.
 * Permite que um display permaneça ligado por muitas horas consecutivas sem quebrar
 * as ligações a imagens e vídeos armazenados na Cloudflare R2.
 */
export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return memoriesJson(400, { success: false, error: "Payload JSON inválido." });
  }

  const slug = typeof body?.slug === "string" ? body.slug.trim() : "";
  const mediaIds = Array.isArray(body?.mediaIds) ? body.mediaIds : [];

  if (!slug) {
    return memoriesJson(400, { success: false, error: "Slug do evento é obrigatório." });
  }

  const eventInfo = await resolveMemoriesEvent(slug);
  if (!eventInfo) {
    return memoriesJson(404, { success: false, error: "Evento não encontrado." });
  }

  // Validação da Sessão de Display
  const auth = await authorizeDisplayRequest(request, eventInfo.id);
  if (!auth.ok) {
    return memoriesJson(auth.status, { success: false, error: auth.error, code: auth.code });
  }

  const refreshResult = await refreshLiveWallUrls({
    eventId: eventInfo.id,
    experienceId: eventInfo.experienceId,
    eventSlug: eventInfo.slug,
    mediaIds,
  });

  if (!refreshResult.ok) {
    return memoriesJson(500, { success: false, error: refreshResult.error || "Erro ao renovar URLs." });
  }

  return NextResponse.json({
    success: true,
    urls: refreshResult.urls || {},
  });
}
