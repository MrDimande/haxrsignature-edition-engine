/**
 * HAXR PLUS MEMORIES 2.0 — FASE 8: ENDPOINT ADMINISTRATIVO DE DESPUBLICAÇÃO
 *
 * POST /api/memories/recap/unpublish
 *
 * Transita a publicação 'published' activa para 'archived'.
 * Exige requireMemoriesAdmin + CSRF.
 */

import { NextResponse } from "next/server";
import { requireMemoriesAdmin, memoriesJson } from "@lib/memories/admin-auth";
import { resolveMemoriesEvent } from "@lib/memories/session-store";
import { unpublishRecap } from "@lib/memories/recap-store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = requireMemoriesAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { slug, publicationId } = body;

    if (!slug || !publicationId) {
      return memoriesJson(400, {
        success: false,
        error: "Campos obrigatórios em falta: slug, publicationId.",
        code: "INVALID_PAYLOAD",
      });
    }

    const eventInfo = await resolveMemoriesEvent(slug);
    if (!eventInfo) {
      return memoriesJson(404, {
        success: false,
        error: "Evento não encontrado.",
        code: "EVENT_NOT_FOUND",
      });
    }

    const unpubRes = await unpublishRecap({
      experienceId: eventInfo.experienceId,
      eventId: eventInfo.id,
      publicationId,
    });

    if (!unpubRes.ok) {
      return memoriesJson(unpubRes.status, {
        success: false,
        error: unpubRes.error,
        code: "UNPUBLISH_ERROR",
      });
    }

    return NextResponse.json(
      { success: true, message: "Recap despublicado com sucesso." },
      { status: 200, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } }
    );
  } catch (err: any) {
    console.error("[POST /api/memories/recap/unpublish] Erro:", err);
    return memoriesJson(500, {
      success: false,
      error: "Erro interno ao despublicar o Recap.",
      code: "INTERNAL_ERROR",
    });
  }
}
