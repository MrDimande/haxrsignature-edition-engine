/**
 * HAXR PLUS MEMORIES 2.0 — FASE 8: ENDPOINT ADMINISTRATIVO DE SHARE LINK DO RECAP
 *
 * POST /api/memories/recap/share-link
 *
 * Gera um link de acesso com scope estrito 'recap:view', associado exclusivamente
 * à experiência pós-evento actual. Exige requireMemoriesAdmin + CSRF.
 */

import { NextResponse } from "next/server";
import { requireMemoriesAdmin, memoriesJson } from "@lib/memories/admin-auth";
import { resolveMemoriesEvent } from "@lib/memories/session-store";
import { createRecapShareLink } from "@lib/memories/recap-store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = requireMemoriesAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { slug, label, expiresInDays } = body;

    if (!slug) {
      return memoriesJson(400, {
        success: false,
        error: "Identificador de evento obrigatório (?slug=...).",
        code: "MISSING_IDENTIFIER",
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

    const linkRes = await createRecapShareLink({
      eventId: eventInfo.id,
      experienceId: eventInfo.experienceId,
      eventSlug: eventInfo.slug,
      invitationSlug: eventInfo.slug,
      label,
      expiresInDays,
    });

    if (!linkRes.ok) {
      return memoriesJson(500, {
        success: false,
        error: linkRes.error || "Erro ao criar link de acesso ao Recap.",
        code: "SHARE_LINK_CREATE_ERROR",
      });
    }

    return NextResponse.json(
      {
        success: true,
        shareLink: linkRes.shareLink,
        token: linkRes.token,
      },
      { status: 200, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } }
    );
  } catch (err: any) {
    console.error("[POST /api/memories/recap/share-link] Erro:", err);
    return memoriesJson(500, {
      success: false,
      error: "Erro interno ao gerar link de acesso.",
      code: "INTERNAL_ERROR",
    });
  }
}
