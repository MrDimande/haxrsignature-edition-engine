import { NextResponse } from "next/server";
import { callCoreGiftApi } from "@lib/aylla/gifts/core-adapter/client";
import { AYLLA_GIFTS_CONFIG } from "@lib/aylla/gifts/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getSessionTokenFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/(?:^|;\s*)haxr_aylla_guest_session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function POST(request: Request) {
  // Fail-closed guard: catalog must be enabled
  if (!AYLLA_GIFTS_CONFIG.enabled) {
    return NextResponse.json(
      { success: false, outcome: "registry_closed", error: "A lista de presentes da Aylla ainda não está aberta." },
      { status: 403 }
    );
  }

  const sessionToken = getSessionTokenFromRequest(request);

  if (!sessionToken) {
    return NextResponse.json(
      { success: false, outcome: "verification_required", error: "Sessão de convidado necessária." },
      { status: 401 }
    );
  }

  let body: { itemId?: string; quantity?: number; idempotencyKey?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Payload inválido." }, { status: 400 });
  }

  if (!body.itemId || !body.idempotencyKey) {
    return NextResponse.json({ success: false, error: "Parâmetros obrigatórios em falta." }, { status: 400 });
  }

  const result = await callCoreGiftApi<{
    success: boolean;
    outcome: string;
    reservation?: unknown;
  }>({
    method: "POST",
    path: "/api/v1/edition/gifts/aylla/reserve",
    body: {
      sessionToken,
      itemId: body.itemId,
      quantity: body.quantity ?? 1,
      idempotencyKey: body.idempotencyKey,
    },
  });

  return NextResponse.json(
    result.ok ? result.data : { success: false, outcome: result.code, error: result.error },
    { status: result.status }
  );
}
