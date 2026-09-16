/**
 * HAXR PLUS MEMORIES 2.0 — FASE 8: ENDPOINT ADMINISTRATIVO DE PUBLICAÇÃO DO RECAP
 *
 * POST /api/memories/recap/publish
 *
 * Promove uma publicação em draft para 'published' de forma atómica e idempotente.
 * Exige requireMemoriesAdmin + CSRF. Concorrência optimista via lock_version.
 */

import { NextResponse } from "next/server";
import { requireMemoriesAdmin, memoriesJson } from "@lib/memories/admin-auth";
import { resolveMemoriesEvent } from "@lib/memories/session-store";
import { publishRecap } from "@lib/memories/recap-store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = requireMemoriesAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { slug, publicationId, expectedLockVersion } = body;

    if (!slug || !publicationId || typeof expectedLockVersion !== "number") {
      return memoriesJson(400, {
        success: false,
        error: "Campos obrigatórios em falta: slug, publicationId, expectedLockVersion.",
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

    const pubRes = await publishRecap({
      experienceId: eventInfo.experienceId,
      eventId: eventInfo.id,
      publicationId,
      expectedLockVersion,
    });

    if (!pubRes.ok) {
      return memoriesJson(pubRes.status, {
        success: false,
        error: pubRes.error,
        code: pubRes.status === 409 ? "CONCURRENT_MODIFICATION" : "PUBLISH_ERROR",
      });
    }

    return NextResponse.json(
      {
        success: true,
        publication: pubRes.publication,
      },
      { status: 200, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } }
    );
  } catch (err: any) {
    console.error("[POST /api/memories/recap/publish] Erro:", err);
    return memoriesJson(500, {
      success: false,
      error: "Erro interno ao publicar o Recap.",
      code: "INTERNAL_ERROR",
    });
  }
}
