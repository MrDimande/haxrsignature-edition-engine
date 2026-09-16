/**
 * HAXR PLUS MEMORIES 2.0 — FASE 8: ENDPOINT PÚBLICO / GUEST DO RECAP
 *
 * GET /api/memories/recap?slug=xxx
 * Devolve a narrativa editorial publicada com assinaturas efémeras de media,
 * aplicando precedência activa de moderação e isolamento de favoritos privados.
 */

import { NextResponse } from "next/server";
import { resolveRecapAccessContext } from "@lib/memories/gateway";
import { getPublishedRecapSnapshot } from "@lib/memories/recap-store";
import { memoriesJson } from "@lib/memories/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
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

    // 1. Resolver autoritativamente o contexto no servidor
    const accessRes = await resolveRecapAccessContext(request, slug);
    if (!accessRes.ok || !accessRes.context) {
      return memoriesJson(accessRes.status || 404, {
        success: false,
        error: accessRes.error || "Evento não encontrado.",
        code: "EVENT_NOT_FOUND",
      });
    }

    // 2. Consultar o snapshot oficial publicado da narrativa
    const snapshotRes = await getPublishedRecapSnapshot(accessRes.context);
    if (!snapshotRes.ok || !snapshotRes.payload) {
      return memoriesJson(snapshotRes.status, {
        success: false,
        error: snapshotRes.error,
        code: snapshotRes.status === 403 ? "ACCESS_DENIED" : "RECAP_NOT_FOUND",
      });
    }

    // Headers de privacidade e SEO estritos (Hardening 20 & 21)
    const isPublic = snapshotRes.payload.publication.accessLevel === "public";
    const headers: Record<string, string> = {
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": isPublic ? "noindex, nofollow" : "noindex, nofollow",
    };

    return NextResponse.json(
      {
        success: true,
        data: snapshotRes.payload,
      },
      { status: 200, headers }
    );
  } catch (err: any) {
    console.error("[GET /api/memories/recap] Erro:", err);
    return memoriesJson(500, {
      success: false,
      error: "Ocorreu um erro ao carregar a memória pós-evento.",
      code: "INTERNAL_ERROR",
    });
  }
}
