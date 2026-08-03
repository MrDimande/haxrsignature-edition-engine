import { NextResponse } from "next/server";
import { reserveStanGift } from "@lib/stan/gifts";
import { publicMutationRateLimit } from "@lib/security/mutation-rate-limit";
import { RATE_LIMITS, rateLimitResponse } from "@lib/security/rate-limit";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const giftId = typeof body.giftId === "string" ? body.giftId.trim() : "";
    const reservedBy =
      typeof body.reservedBy === "string" ? body.reservedBy.trim() : "";

    if (!giftId) {
      return NextResponse.json(
        { success: false, error: "Presente inválido." },
        { status: 400 }
      );
    }
    if (reservedBy.length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: "Indique o seu nome para reservar o presente.",
        },
        { status: 400 }
      );
    }

    const limit = await publicMutationRateLimit(
      {
        scope: "gifts",
        slug: "stan",
        action: "reserve",
        request,
      },
      RATE_LIMITS.giftReserve
    );
    if (!limit.allowed) {
      return rateLimitResponse(limit, { code: "RATE_LIMITED" });
    }

    const result = await reserveStanGift(giftId, reservedBy);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error, gifts: result.gifts },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Presente reservado com sucesso!",
        gifts: result.gifts,
        giftName: result.giftName,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/stan/gifts/reserve error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Ocorreu um erro ao processar a reserva do seu presente.",
      },
      { status: 500 }
    );
  }
}
