import { NextResponse } from "next/server";
import { callCoreGiftApi } from "@lib/aylla/gifts/core-adapter/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { contact?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Payload inválido." }, { status: 400 });
  }

  if (!body.contact || typeof body.contact !== "string") {
    return NextResponse.json({ success: false, error: "Contacto obrigatório." }, { status: 400 });
  }

  const result = await callCoreGiftApi<{ success: boolean; outcome: string }>({
    method: "POST",
    path: "/api/v1/edition/gifts/aylla/challenge",
    body: { contact: body.contact.trim() },
  });

  if (!result.ok) {
    return NextResponse.json(
      { success: false, error: result.error, code: result.code },
      { status: result.status }
    );
  }

  return NextResponse.json(result.data, { status: 200 });
}
