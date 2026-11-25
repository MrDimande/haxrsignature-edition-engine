import { callCoreGiftApi } from "@lib/aylla/gifts/core-adapter/client";
import { isAyllaEditionRegistryOperational } from "@lib/aylla/gifts/test-activation";
import {
  getOrCreateAyllaRequestId,
  jsonWithAyllaRequestId,
  logEditionAyllaTrace,
} from "@lib/aylla/gifts/trace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const startedAt = Date.now();
  const requestId = getOrCreateAyllaRequestId(request);
  logEditionAyllaTrace(requestId, "edition_route_enter", { route: "challenge" });

  if (!isAyllaEditionRegistryOperational()) {
    logEditionAyllaTrace(requestId, "edition_route_exit", {
      route: "challenge",
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

  let body: { contact?: string };
  try {
    body = await request.json();
  } catch {
    return jsonWithAyllaRequestId({ success: false, error: "Payload inválido." }, { status: 400 }, requestId);
  }

  if (!body.contact || typeof body.contact !== "string") {
    return jsonWithAyllaRequestId({ success: false, error: "Contacto obrigatório." }, { status: 400 }, requestId);
  }

  const result = await callCoreGiftApi<{
    success: boolean;
    outcome: string;
    challengeId?: string;
  }>({
    method: "POST",
    path: "/api/v1/edition/gifts/aylla/challenge",
    requestId,
    signal: request.signal,
    body: { contact: body.contact.trim() },
  });

  logEditionAyllaTrace(requestId, "edition_route_exit", {
    route: "challenge",
    status: result.status,
    outcome: result.ok ? result.data.outcome : result.code,
    durationMs: Date.now() - startedAt,
  });

  if (!result.ok) {
    return jsonWithAyllaRequestId(
      { success: false, error: result.error, code: result.code },
      { status: result.status },
      requestId
    );
  }

  // Keep challengeId out of browser JSON to preserve zero enumeration;
  // bind it inside a short-lived HttpOnly cookie for OTP verification.
  const response = jsonWithAyllaRequestId(
    { success: true, outcome: result.data.outcome },
    { status: 200 },
    requestId
  );

  if (result.data.challengeId) {
    const isSecureRequest =
      request.url.startsWith("https://") ||
      request.headers.get("x-forwarded-proto") === "https";
    const useSecureCookie =
      process.env.VERCEL_ENV === "production" ||
      (process.env.NODE_ENV === "production" && isSecureRequest);

    response.cookies.set("haxr_aylla_challenge", result.data.challengeId, {
      httpOnly: true,
      secure: useSecureCookie,
      sameSite: "lax",
      path: "/",
      maxAge: 10 * 60,
    });
  }

  return response;
}
