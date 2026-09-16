/**
 * HAXR PLUS MEMORIES 2.0 — FASE 8: ENDPOINT ADMINISTRATIVO DE CURADORIA
 *
 * GET /api/memories/recap/curation?slug=xxx
 * POST /api/memories/recap/curation
 *
 * Exige autenticação administrativa (requireMemoriesAdmin) com CSRF canónico.
 * Suporta concorrência optimista via lock_version e sanitização de campos editoriais.
 */

import { NextResponse } from "next/server";
import { requireMemoriesAdmin, memoriesJson } from "@lib/memories/admin-auth";
import { resolveMemoriesEvent } from "@lib/memories/session-store";
import { getCurationDraft, saveCurationDraft } from "@lib/memories/recap-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = requireMemoriesAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const url = new URL(request.url);
    const slug = url.searchParams.get("slug")?.trim() || url.searchParams.get("eventId")?.trim();

    if (!slug) {
      return memoriesJson(400, {
        success: false,
        error: "Identificador de convite ou evento obrigatório (?slug=...).",
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

    const draftRes = await getCurationDraft(eventInfo.experienceId, eventInfo.id);
    if (!draftRes.ok) {
      return memoriesJson(500, {
        success: false,
        error: draftRes.error || "Erro ao consultar rascunho de curadoria.",
        code: "DRAFT_LOAD_ERROR",
      });
    }

    return NextResponse.json(
      {
        success: true,
        draft: draftRes.draft,
        candidates: draftRes.candidates,
      },
      { status: 200, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } }
    );
  } catch (err: any) {
    console.error("[GET /api/memories/recap/curation] Erro:", err);
    return memoriesJson(500, {
      success: false,
      error: "Erro interno no servidor ao carregar curadoria.",
      code: "INTERNAL_ERROR",
    });
  }
}

export async function POST(request: Request) {
  const auth = requireMemoriesAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { slug, publicationId, expectedLockVersion, title, welcomeMessage, closingMessage, accessLevel, configuration, items } = body;

    if (!slug || !publicationId || typeof expectedLockVersion !== "number" || !Array.isArray(items)) {
      return memoriesJson(400, {
        success: false,
        error: "Payload inválido: slug, publicationId, expectedLockVersion e items são obrigatórios.",
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

    const saveRes = await saveCurationDraft({
      experienceId: eventInfo.experienceId,
      eventId: eventInfo.id,
      publicationId,
      expectedLockVersion,
      title,
      welcomeMessage,
      closingMessage,
      accessLevel,
      configuration,
      items,
    });

    if (!saveRes.ok) {
      return memoriesJson(saveRes.status, {
        success: false,
        error: saveRes.error,
        code: saveRes.status === 409 ? "CONCURRENT_MODIFICATION" : "SAVE_ERROR",
      });
    }

    return NextResponse.json(
      {
        success: true,
        publication: saveRes.publication,
      },
      { status: 200, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } }
    );
  } catch (err: any) {
    console.error("[POST /api/memories/recap/curation] Erro:", err);
    return memoriesJson(500, {
      success: false,
      error: "Erro interno no servidor ao gravar curadoria.",
      code: "INTERNAL_ERROR",
    });
  }
}
