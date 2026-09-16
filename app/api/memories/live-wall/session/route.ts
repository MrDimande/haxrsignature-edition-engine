import { NextResponse } from "next/server";
import { resolveMemoriesEvent } from "@lib/memories/session-store";
import { memoriesJson, requireMemoriesAdmin } from "@lib/memories/admin-auth";
import { createDisplaySession, revokeDisplaySession } from "@lib/memories/display-security";
import { memoriesDisplayCookie } from "@lib/memories/session-security";

export const dynamic = "force-dynamic";

/**
 * POST /api/memories/live-wall/session
 * Provisioning de sessão de display para ecrãs de evento (TVs, Projectores, Telas LED).
 * Exige autorização administrativa do Atelier.
 * Gera token criptograficamente aleatório, grava o hash e configura o cookie seguro.
 */
export async function POST(request: Request) {
  // 1. Verificar credenciais administrativas do Atelier (Bearer ou Cookie + CSRF)
  const adminAuth = requireMemoriesAdmin(request);
  if (!adminAuth.ok) {
    return adminAuth.response;
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return memoriesJson(400, { success: false, error: "Payload JSON inválido." });
  }

  const slug = typeof body?.slug === "string" ? body.slug.trim() : "";
  const deviceLabel = typeof body?.deviceLabel === "string" ? body.deviceLabel.trim() : undefined;
  const ttlHours = typeof body?.ttlHours === "number" ? body.ttlHours : 24;

  if (!slug) {
    return memoriesJson(400, { success: false, error: "Identificador de evento é obrigatório." });
  }

  const eventInfo = await resolveMemoriesEvent(slug);
  if (!eventInfo) {
    return memoriesJson(404, { success: false, error: "Evento não encontrado." });
  }

  const result = await createDisplaySession({
    eventId: eventInfo.id,
    experienceId: eventInfo.experienceId,
    deviceLabel,
    sessionTtlHours: ttlHours,
  });

  if (!result.ok || !result.sessionToken || !result.expiresAt) {
    return memoriesJson(500, { success: false, error: result.error || "Erro ao criar sessão de display." });
  }

  const isSecure = request.url.startsWith("https:");
  const cookieHeader = memoriesDisplayCookie({
    eventId: eventInfo.id,
    token: result.sessionToken,
    expiresAt: result.expiresAt,
    now: new Date(),
    secure: isSecure,
  });

  const response = NextResponse.json({
    success: true,
    sessionId: result.sessionId,
    eventId: eventInfo.id,
    experienceId: eventInfo.experienceId,
    expiresAt: result.expiresAt.toISOString(),
    displayToken: result.sessionToken, // Entregue uma única vez para uso opcional em clientes não-browser
  });

  response.headers.append("Set-Cookie", cookieHeader);
  return response;
}

/**
 * DELETE /api/memories/live-wall/session
 * Revogação imediata de sessão de display.
 */
export async function DELETE(request: Request) {
  const adminAuth = requireMemoriesAdmin(request);
  if (!adminAuth.ok) {
    return adminAuth.response;
  }

  const { searchParams } = new URL(request.url);
  let sessionId = searchParams.get("sessionId");
  if (!sessionId) {
    try {
      const body = await request.json();
      sessionId = body?.sessionId;
    } catch {}
  }

  if (!sessionId) {
    return memoriesJson(400, { success: false, error: "Identificador da sessão é obrigatório." });
  }

  const revoked = await revokeDisplaySession(sessionId);
  return memoriesJson(revoked ? 200 : 404, {
    success: revoked,
    message: revoked ? "Sessão de display revogada com sucesso." : "Sessão não encontrada ou já revogada.",
  });
}
