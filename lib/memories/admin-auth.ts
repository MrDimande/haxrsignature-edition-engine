import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

// Contrato recuperado de codex/plus-memories-product-engine (b2ffe46).
export type MemoriesAdminAuthResult =
  | { ok: true }
  | { ok: false; response: NextResponse };

export const MEMORIES_PRIVATE_HEADERS = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow",
} as const;

export function memoriesJson(status: number, body: Record<string, unknown>): NextResponse {
  return NextResponse.json(body, { status, headers: MEMORIES_PRIVATE_HEADERS });
}

export function requireMemoriesAdmin(request: Request): MemoriesAdminAuthResult {
  const expected = process.env.ADMIN_MODERATION_SECRET?.trim();
  if (!expected) {
    return { ok: false, response: memoriesJson(503, {
      success: false, error: "Serviço administrativo indisponível.",
    }) };
  }

  // 1. Authorization: Bearer <secret> (CLI, API, machine-to-machine)
  const authorization = request.headers.get("authorization")?.trim() ?? "";
  const providedBearer = /^Bearer ([^\s]+)$/i.exec(authorization)?.[1];
  if (providedBearer) {
    const expectedBytes = Buffer.from(expected, "utf8");
    const providedBytes = Buffer.from(providedBearer, "utf8");
    if (providedBytes.length === expectedBytes.length && timingSafeEqual(providedBytes, expectedBytes)) {
      return { ok: true };
    }
    return { ok: false, response: memoriesJson(401, {
      success: false, error: "Acesso não autorizado.",
    }) };
  }

  // 2. Cookie administrativo (Web UI admin)
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookies = cookieHeader.split(";").reduce((acc, part) => {
    const [k, ...v] = part.trim().split("=");
    if (k) acc[k] = v.join("=");
    return acc;
  }, {} as Record<string, string>);

  const adminCookie = cookies["haxr_admin_session"] || cookies["admin_token"];
  if (adminCookie) {
    const expectedBytes = Buffer.from(expected, "utf8");
    const cookieBytes = Buffer.from(adminCookie, "utf8");
    const isTokenValid = cookieBytes.length === expectedBytes.length && timingSafeEqual(cookieBytes, expectedBytes);
    if (!isTokenValid) {
      return { ok: false, response: memoriesJson(401, {
        success: false, error: "Credencial administrativa inválida.",
      }) };
    }

    // Mutações administrativas baseadas em cookie EXIGEM protecção CSRF canónica
    const csrfToken = request.headers.get("x-csrf-token") || request.headers.get("x-haxr-csrf");
    const expectedCsrf = cookies["haxr_csrf_token"] || cookies["csrf_token"];

    if (!csrfToken) {
      return { ok: false, response: memoriesJson(403, {
        success: false, error: "Token CSRF ausente.", code: "CSRF_REQUIRED",
      }) };
    }

    if (expectedCsrf && csrfToken !== expectedCsrf) {
      return { ok: false, response: memoriesJson(403, {
        success: false, error: "Token CSRF inválido.", code: "CSRF_INVALID",
      }) };
    }

    return { ok: true };
  }

  return { ok: false, response: memoriesJson(401, {
    success: false, error: "Acesso administrativo obrigatório.",
  }) };
}
