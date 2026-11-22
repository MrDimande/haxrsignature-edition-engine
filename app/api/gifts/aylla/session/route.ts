import { NextResponse } from "next/server";
import { callCoreGiftApi } from "@lib/aylla/gifts/core-adapter/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getSessionTokenFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/(?:^|;\s*)haxr_aylla_guest_session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function GET(request: Request) {
  const sessionToken = getSessionTokenFromRequest(request);

  if (!sessionToken) {
    return NextResponse.json(
      { success: false, authenticated: false, reason: "session_expired" },
      { status: 401 }
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
    body: { sessionToken },
  });

  if (!result.ok || !result.data.valid) {
    const response = NextResponse.json(
      { success: false, authenticated: false, reason: "session_expired" },
      { status: 401 }
    );
    response.cookies.delete("haxr_aylla_guest_session");
    return response;
  }

  return NextResponse.json({
    success: true,
    authenticated: true,
    guest: result.data.guest,
  });
}

export async function DELETE(request: Request) {
  const sessionToken = getSessionTokenFromRequest(request);

  if (sessionToken) {
    await callCoreGiftApi({
      method: "DELETE",
      path: "/api/v1/edition/gifts/aylla/session",
      body: { sessionToken },
    });
  }

  const response = NextResponse.json({ success: true, loggedOut: true });
  response.cookies.delete("haxr_aylla_guest_session");
  return response;
}
