import { NextResponse } from "next/server";
import { exchangeAccessLink } from "@lib/memories/session-store";
import { memoriesSessionCookie } from "@lib/memories/session-security";
import { memoriesJson } from "@lib/memories/admin-auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawToken = searchParams.get("token") || searchParams.get("link") || searchParams.get("code") || searchParams.get("access");
    const slug = searchParams.get("slug") || "stanturns5";
    const tokenOrCode = rawToken?.trim();

    if (!tokenOrCode) {
      return NextResponse.redirect(new URL(`/${slug}/memorias?auth=invalid`, request.url), 307);
    }

    const now = new Date();
    const result = await exchangeAccessLink({ tokenOrCode, now });

    if (!result.ok || !result.sessionToken || !result.expiresAt || !result.eventId) {
      return NextResponse.redirect(new URL(`/${slug}/memorias?auth=invalid`, request.url), 307);
    }

    const isSecure = request.url.startsWith("https://") || process.env.NODE_ENV === "production";
    const cookieHeader = memoriesSessionCookie({
      eventId: result.eventId,
      token: result.sessionToken,
      expiresAt: result.expiresAt,
      now,
      secure: isSecure,
    });

    const response = NextResponse.redirect(new URL(`/${slug}/memorias`, request.url), 307);
    response.headers.set("Set-Cookie", cookieHeader);
    return response;
  } catch (err: any) {
    console.error("[SessionExchange GET] error:", err?.message || err);
    const { searchParams } = new URL(request.url);
    const fallbackSlug = searchParams.get("slug") || "stanturns5";
    return NextResponse.redirect(new URL(`/${fallbackSlug}/memorias?auth=invalid`, request.url), 307);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { tokenOrCode?: string };
    const tokenOrCode = body.tokenOrCode?.trim();

    if (!tokenOrCode) {
      return memoriesJson(400, { success: false, error: "Link de acesso em falta." });
    }

    const now = new Date();
    const result = await exchangeAccessLink({ tokenOrCode, now });

    if (!result.ok || !result.sessionToken || !result.expiresAt || !result.eventId) {
      return memoriesJson(401, { success: false, error: result.error || "Link de acesso inválido ou expirado." });
    }

    const isSecure = request.url.startsWith("https://") || process.env.NODE_ENV === "production";
    const cookieHeader = memoriesSessionCookie({
      eventId: result.eventId,
      token: result.sessionToken,
      expiresAt: result.expiresAt,
      now,
      secure: isSecure,
    });

    const response = memoriesJson(200, {
      success: true,
      eventId: result.eventId,
      participantId: result.participantId,
      tableId: result.tableId ?? null,
      guestId: result.guestId ?? null,
    });

    response.headers.set("Set-Cookie", cookieHeader);
    return response;
  } catch (err: any) {
    console.error("[SessionExchange] error:", err?.message || err);
    return memoriesJson(500, { success: false, error: "Não foi possível activar o acesso." });
  }
}
