import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

export type MemoriesAdminAuthResult =
  | { ok: true }
  | { ok: false; response: NextResponse };

function noStoreJson(status: 401 | 503, error: string): NextResponse {
  return NextResponse.json(
    { success: false, error },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

function secretsMatch(provided: string, expected: string): boolean {
  const providedBuffer = Buffer.from(provided, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  if (providedBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(providedBuffer, expectedBuffer);
}

export function requireMemoriesAdmin(
  request: Request
): MemoriesAdminAuthResult {
  const expectedSecret = process.env.ADMIN_MODERATION_SECRET?.trim();
  if (!expectedSecret) {
    return {
      ok: false,
      response: noStoreJson(503, "Serviço administrativo indisponível."),
    };
  }

  const authorization = request.headers.get("authorization")?.trim() ?? "";
  const match = /^Bearer ([^\s]+)$/.exec(authorization);
  const providedSecret = match?.[1] ?? "";

  if (!providedSecret || !secretsMatch(providedSecret, expectedSecret)) {
    return {
      ok: false,
      response: noStoreJson(401, "Acesso não autorizado."),
    };
  }

  return { ok: true };
}
