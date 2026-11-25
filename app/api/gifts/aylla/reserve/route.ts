import { callCoreGiftApi } from "@lib/aylla/gifts/core-adapter/client";
import { humanizeAyllaError } from "@lib/aylla/gifts/error-copy";
import { isAyllaEditionRegistryOperational } from "@lib/aylla/gifts/test-activation";
import {
  getOrCreateAyllaRequestId,
  jsonWithAyllaRequestId,
  logEditionAyllaTrace,
} from "@lib/aylla/gifts/trace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getSessionTokenFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/(?:^|;\s*)haxr_aylla_guest_session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  const requestId = getOrCreateAyllaRequestId(request);
  logEditionAyllaTrace(requestId, "edition_route_enter", { route: "reserve" });

  // Fail-closed guard: catalog must be enabled (or isolated non-production test activation)
  if (!isAyllaEditionRegistryOperational()) {
    logEditionAyllaTrace(requestId, "edition_route_exit", {
      route: "reserve",
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

  const sessionToken = getSessionTokenFromRequest(request);
  logEditionAyllaTrace(requestId, "edition_cookie_checked", {
    route: "reserve",
    hasCookie: Boolean(sessionToken),
  });

  if (!sessionToken) {
    return jsonWithAyllaRequestId(
      { success: false, outcome: "verification_required", error: "Sessão de convidado necessária." },
      { status: 401 },
      requestId
    );
  }

  let body: { itemId?: string; quantity?: number; idempotencyKey?: string };
  try {
    body = await request.json();
  } catch {
    return jsonWithAyllaRequestId({ success: false, error: "Payload inválido." }, { status: 400 }, requestId);
  }

  if (!body.itemId || !body.idempotencyKey) {
    return jsonWithAyllaRequestId({ success: false, error: "Parâmetros obrigatórios em falta." }, { status: 400 }, requestId);
  }

  const result = await callCoreGiftApi<{
    success: boolean;
    outcome: string;
    reservation?: unknown;
  }>({
    method: "POST",
    path: "/api/v1/edition/gifts/aylla/reserve",
    requestId,
    signal: request.signal,
    body: {
      sessionToken,
      itemId: body.itemId,
      quantity: body.quantity ?? 1,
      idempotencyKey: body.idempotencyKey,
    },
  });

  if (result.ok) {
    logEditionAyllaTrace(requestId, "edition_route_exit", {
      route: "reserve",
      status: result.status,
      outcome: result.data.outcome,
      durationMs: Date.now() - startedAt,
    });
    return jsonWithAyllaRequestId(result.data, { status: result.status }, requestId);
  }

  logEditionAyllaTrace(requestId, "edition_route_exit", {
    route: "reserve",
    status: result.status,
    outcome: result.code,
    durationMs: Date.now() - startedAt,
  });

  const response = jsonWithAyllaRequestId(
    {
      success: false,
      outcome: result.code,
      error: humanizeAyllaError(result.code, result.error),
    },
    { status: result.status },
    requestId
  );

  if (result.status === 401 || result.code === "session_expired") {
    response.cookies.delete("haxr_aylla_guest_session");
  }

  return response;
}
