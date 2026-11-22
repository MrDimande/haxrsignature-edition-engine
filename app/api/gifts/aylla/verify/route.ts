import { NextResponse } from "next/server";
import { callCoreGiftApi } from "@lib/aylla/gifts/core-adapter/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { challengeId?: string; code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Payload inválido." }, { status: 400 });
  }

  if (!body.challengeId || !body.code || typeof body.code !== "string") {
    return NextResponse.json({ success: false, error: "Parâmetros em falta." }, { status: 400 });
  }

  const result = await callCoreGiftApi<{
    success: boolean;
    outcome: string;
    sessionToken?: string;
    expiresAt?: string;
  }>({
    method: "POST",
    path: "/api/v1/edition/gifts/aylla/verify",
    body: { challengeId: body.challengeId, code: body.code.trim() },
  });

  if (!result.ok) {
    return NextResponse.json(
      { success: false, error: result.error, code: result.code },
      { status: result.status }
    );
  }

  if (result.data.outcome !== "verified" || !result.data.sessionToken) {
    return NextResponse.json(
      { success: false, outcome: "verification_required" },
      { status: 403 }
    );
  }

  // Set HttpOnly session cookie on the Edition origin.
  // The raw session token is NEVER returned in the client-facing response body.
  const response = NextResponse.json({
    success: true,
    outcome: "verified",
  });

  const isProduction = process.env.NODE_ENV === "production";
  response.cookies.set("haxr_aylla_guest_session", result.data.sessionToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 20 * 60, // 20 minutes
  });

  return response;
}
