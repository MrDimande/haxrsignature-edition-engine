import { NextResponse } from "next/server";
import { AYLLA_GIFTS_CONFIG } from "../config";
import type { createCoreAyllaGiftService } from "./service";

export interface ProxyAuthValidator {
  (request: Request): { ok: boolean; reason?: string };
}

export interface CoreRouteDeps {
  readonly service: ReturnType<typeof createCoreAyllaGiftService>;
  readonly validateProxyAuth: ProxyAuthValidator;
  readonly getClientIp: (request: Request) => string;
  readonly isProduction: boolean;
}

export function createCoreAyllaGiftRoutes(deps: CoreRouteDeps) {
  const { service, validateProxyAuth, getClientIp, isProduction } = deps;

  /**
   * POST /api/v1/edition/gifts/aylla/challenge
   * Request verification challenge.
   */
  async function handleChallengeRequest(request: Request): Promise<NextResponse> {
    const auth = validateProxyAuth(request);
    if (!auth.ok) {
      return NextResponse.json({ success: false, error: "Não autorizado." }, { status: 401 });
    }

    let body: { contact?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: "Payload inválido." }, { status: 400 });
    }

    if (!body.contact || typeof body.contact !== "string") {
      return NextResponse.json({ success: false, error: "Contacto obrigatório." }, { status: 400 });
    }

    const clientIp = getClientIp(request);
    const result = await service.requestVerification(body.contact, clientIp);

    if (result.outcome === "rate_limited") {
      return NextResponse.json({ success: false, error: "Demasiados pedidos. Tente mais tarde." }, { status: 429 });
    }

    return NextResponse.json({ success: true, outcome: "verification_pending" });
  }

  /**
   * POST /api/v1/edition/gifts/aylla/verify
   * Verify challenge and return session cookie.
   */
  async function handleChallengeVerify(request: Request): Promise<NextResponse> {
    const auth = validateProxyAuth(request);
    if (!auth.ok) {
      return NextResponse.json({ success: false, error: "Não autorizado." }, { status: 401 });
    }

    let body: { challengeId?: string; code?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: "Payload inválido." }, { status: 400 });
    }

    if (!body.challengeId || !body.code) {
      return NextResponse.json({ success: false, error: "Parâmetros em falta." }, { status: 400 });
    }

    const clientIp = getClientIp(request);
    const result = await service.verifyChallenge(body.challengeId, body.code, clientIp);

    if (result.outcome === "rate_limited") {
      return NextResponse.json({ success: false, error: "Demasiadas tentativas." }, { status: 429 });
    }

    if (result.outcome !== "verified") {
      return NextResponse.json({ success: false, outcome: "verification_required" }, { status: 403 });
    }

    const response = NextResponse.json({ success: true, outcome: "verified" });
    response.cookies.set("haxr_aylla_guest_session", result.cookieValue, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 20 * 60,
    });

    return response;
  }

  /**
   * POST /api/v1/edition/gifts/aylla/reserve
   * Reserve an item (Fail-closed).
   */
  async function handleReservationRequest(request: Request): Promise<NextResponse> {
    const auth = validateProxyAuth(request);
    if (!auth.ok) {
      return NextResponse.json({ success: false, error: "Não autorizado." }, { status: 401 });
    }

    if (!AYLLA_GIFTS_CONFIG.enabled) {
      return NextResponse.json({ success: false, outcome: "registry_closed" }, { status: 403 });
    }

    let body: { itemId?: string; quantity?: number; idempotencyKey?: string; csrfToken?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: "Payload inválido." }, { status: 400 });
    }

    const cookieHeader = request.headers.get("cookie") ?? "";
    const match = cookieHeader.match(/haxr_aylla_guest_session=([^;]+)/);
    if (!match) {
      return NextResponse.json({ success: false, outcome: "verification_required" }, { status: 401 });
    }

    const [sessionId, secret] = match[1].split(".");
    if (!sessionId || !secret) {
      return NextResponse.json({ success: false, outcome: "verification_required" }, { status: 401 });
    }

    const result = await service.reserveGift({
      sessionId,
      secret,
      itemId: body.itemId ?? "",
      quantity: body.quantity ?? 1,
      idempotencyKey: body.idempotencyKey ?? "",
      csrfToken: body.csrfToken ?? "",
    });

    if (result.outcome === "reservation_confirmed") {
      return NextResponse.json({ success: true, outcome: result.outcome, reservation: result.reservation });
    }

    const statusMap: Record<string, number> = {
      registry_closed: 403,
      access_denied: 403,
      session_expired: 401,
      verification_required: 401,
      item_unavailable: 409,
      quantity_unconfirmed: 400,
      service_unavailable: 503,
    };

    return NextResponse.json({ success: false, outcome: result.outcome }, { status: statusMap[result.outcome] ?? 400 });
  }

  return {
    handleChallengeRequest,
    handleChallengeVerify,
    handleReservationRequest,
  };
}
