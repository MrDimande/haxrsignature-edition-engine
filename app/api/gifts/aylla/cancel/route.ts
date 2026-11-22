import { NextResponse } from "next/server";
import { callCoreGiftApi } from "@lib/aylla/gifts/core-adapter/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getSessionTokenFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/(?:^|;\s*)haxr_aylla_guest_session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function POST(request: Request) {
  const sessionToken = getSessionTokenFromRequest(request);

  if (!sessionToken) {
    return NextResponse.json(
      { success: false, outcome: "verification_required", error: "Sessão de convidado necessária." },
      { status: 401 }
    );
  }

  let body: { reservationId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Payload inválido." }, { status: 400 });
  }

  if (!body.reservationId) {
    return NextResponse.json({ success: false, error: "reservationId obrigatório." }, { status: 400 });
  }

  const result = await callCoreGiftApi<{
    success: boolean;
    outcome: string;
    reservation?: unknown;
  }>({
    method: "POST",
    path: "/api/v1/edition/gifts/aylla/cancel",
    body: {
      sessionToken,
      reservationId: body.reservationId,
    },
  });

  return NextResponse.json(
    result.ok ? result.data : { success: false, outcome: result.code, error: result.error },
    { status: result.status }
  );
}
