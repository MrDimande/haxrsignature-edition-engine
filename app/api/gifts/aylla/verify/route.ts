import { callCoreGiftApi } from "@lib/aylla/gifts/core-adapter/client";
import { isAyllaEditionRegistryOperational } from "@lib/aylla/gifts/test-activation";
import {
  getOrCreateAyllaRequestId,
  jsonWithAyllaRequestId,
  logEditionAyllaTrace,
} from "@lib/aylla/gifts/trace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getChallengeCookieFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/(?:^|;\s*)haxr_aylla_challenge=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  const requestId = getOrCreateAyllaRequestId(request);
  logEditionAyllaTrace(requestId, "edition_route_enter", { route: "verify" });

  if (!isAyllaEditionRegistryOperational()) {
    logEditionAyllaTrace(requestId, "edition_route_exit", {
      route: "verify",
      status: 403,
      outcome: "registry_closed",
      durationMs: Date.now() - startedAt,
    });
    return jsonWithAyllaRequestId(
      { success: false, outcome: "registry_closed", error: "A lista de presentes da Aylla ainda não está aberta." },
      { status: 403 },
      requestId
    );
  }

  let body: { challengeId?: string; code?: string };
  try {
    body = await request.json();
  } catch {
    return jsonWithAyllaRequestId({ success: false, error: "Payload inválido." }, { status: 400 }, requestId);
  }

  const resolvedChallengeId =
    (typeof body.challengeId === "string" && body.challengeId.trim()) ||
    getChallengeCookieFromRequest(request);

  logEditionAyllaTrace(requestId, "edition_cookie_checked", {
    route: "verify",
    hasChallenge: Boolean(resolvedChallengeId),
  });

  if (!resolvedChallengeId || !body.code || typeof body.code !== "string" || !body.code.trim()) {
    return jsonWithAyllaRequestId(
      { success: false, outcome: "verification_required", error: "Introduza o código de verificação recebido." },
      { status: 400 },
      requestId
    );
  }

  const result = await callCoreGiftApi<{
    success: boolean;
    outcome: string;
    sessionToken?: string;
    expiresAt?: string;
  }>({
    method: "POST",
    path: "/api/v1/edition/gifts/aylla/verify",
    requestId,
    signal: request.signal,
    body: { challengeId: resolvedChallengeId, code: body.code.trim() },
  });

  logEditionAyllaTrace(requestId, "edition_route_exit", {
    route: "verify",
    status: result.status,
    outcome: result.ok ? result.data.outcome : result.code,
    durationMs: Date.now() - startedAt,
  });

  if (!result.ok) {
    return jsonWithAyllaRequestId(
      { success: false, outcome: result.code || "verification_required", error: result.error },
      { status: result.status },
      requestId
    );
  }

  if (result.data.outcome !== "verified" || !result.data.sessionToken) {
    return jsonWithAyllaRequestId(
      { success: false, outcome: "verification_required" },
      { status: 401 },
      requestId
    );
  }

  // Set HttpOnly session cookie on the Edition origin.
  // The raw session token is NEVER returned in the client-facing response body.
  const response = jsonWithAyllaRequestId(
    {
      success: true,
      outcome: "verified",
    },
    { status: 200 },
    requestId
  );

  const isSecureRequest =
    request.url.startsWith("https://") ||
    request.headers.get("x-forwarded-proto") === "https";
  const useSecureCookie =
    process.env.VERCEL_ENV === "production" ||
    (process.env.NODE_ENV === "production" && isSecureRequest);

  response.cookies.set("haxr_aylla_guest_session", result.data.sessionToken, {
    httpOnly: true,
    secure: useSecureCookie,
    sameSite: "lax",
    path: "/",
    maxAge: 20 * 60, // 20 minutes
  });
  response.cookies.delete("haxr_aylla_challenge");

  return response;
}
