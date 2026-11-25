import { callCoreGiftApi } from "@lib/aylla/gifts/core-adapter/client";
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

export async function GET(request: Request) {
  const startedAt = Date.now();
  const requestId = getOrCreateAyllaRequestId(request);
  const sessionToken = getSessionTokenFromRequest(request);
  logEditionAyllaTrace(requestId, "edition_route_enter", {
    route: "session_get",
    hasCookie: Boolean(sessionToken),
  });

  if (!sessionToken) {
    return jsonWithAyllaRequestId(
      { success: false, authenticated: false, reason: "session_expired" },
      { status: 401 },
      requestId
    );
  }

  const result = await callCoreGiftApi<{
    success: boolean;
    valid: boolean;
    guest?: { id: string; name: string; contact: string };
    reason?: string;
  }>({
    method: "POST",
    path: "/api/v1/edition/gifts/aylla/session",
    requestId,
    signal: request.signal,
    body: { sessionToken },
  });

  logEditionAyllaTrace(requestId, "edition_route_exit", {
    route: "session_get",
    status: result.ok && result.data.valid ? 200 : 401,
    durationMs: Date.now() - startedAt,
  });

  if (!result.ok || !result.data.valid) {
    const response = jsonWithAyllaRequestId(
      { success: false, authenticated: false, reason: "session_expired" },
      { status: 401 },
      requestId
    );
    response.cookies.delete("haxr_aylla_guest_session");
    return response;
  }

  return jsonWithAyllaRequestId(
    {
      success: true,
      authenticated: true,
      guest: result.data.guest,
    },
    { status: 200 },
    requestId
  );
}

export async function DELETE(request: Request) {
  const startedAt = Date.now();
  const requestId = getOrCreateAyllaRequestId(request);
  const sessionToken = getSessionTokenFromRequest(request);
  logEditionAyllaTrace(requestId, "edition_route_enter", {
    route: "session_delete",
    hasCookie: Boolean(sessionToken),
  });

  if (sessionToken) {
    await callCoreGiftApi({
      method: "DELETE",
      path: "/api/v1/edition/gifts/aylla/session",
      requestId,
      signal: request.signal,
      body: { sessionToken },
    });
  }

  logEditionAyllaTrace(requestId, "edition_route_exit", {
    route: "session_delete",
    status: 200,
    durationMs: Date.now() - startedAt,
  });

  const response = jsonWithAyllaRequestId({ success: true, loggedOut: true }, { status: 200 }, requestId);
  response.cookies.delete("haxr_aylla_guest_session");
  return response;
}
