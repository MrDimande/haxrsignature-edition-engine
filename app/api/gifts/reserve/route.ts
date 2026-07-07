import { NextResponse } from "next/server";
import { reserveGift } from "@lib/gifts";
import { sendGiftReserveNotificationEmail } from "@lib/gifts/send-notification";
import { reserveJessicaSamuelGift } from "@lib/jessica-samuel-wedding/gifts/inventory";
import { resolveInvitationContext } from "@lib/context-resolver";
import { validateGiftReservationPayload } from "@core/contracts/gifts.contract";
import { publicMutationRateLimit } from "@lib/security/mutation-rate-limit";
import { RATE_LIMITS, rateLimitResponse } from "@lib/security/rate-limit";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawSlug = typeof body.slug === "string" ? body.slug : typeof body.registry === "string" ? body.registry : "jessicachadelingerie";

    const context = resolveInvitationContext(rawSlug);
    if (!context || !context.giftsRegistryKey) {
      return NextResponse.json(
        { success: false, error: "Lista de presentes não encontrada para este convite." },
        { status: 404 }
      );
    }

    const registryKey = context.giftsRegistryKey;
    const requiresPhone = registryKey === "jessica-samuel";

    const validation = validateGiftReservationPayload(body, { requiresPhone });
    if (!validation.ok) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: validation.status }
      );
    }

    const { itemId, guestName, guestPhone, quantity, message } = validation.sanitized;

    const limit = await publicMutationRateLimit(
      {
        scope: "gifts",
        slug: context.slug,
        action: "reserve",
        request,
      },
      RATE_LIMITS.giftReserve
    );
    if (!limit.allowed) {
      return rateLimitResponse(limit, { code: "RATE_LIMITED" });
    }

    if (registryKey === "jessica-samuel") {
      const result = await reserveJessicaSamuelGift({
        itemId,
        guestName,
        guestPhone: guestPhone || "",
        quantity,
        message,
        slug: context.slug,
      });

      if (!result.success) {
        const status = result.code === "GIFT_REGISTRY_CLOSED" ? 410 : 409;
        return NextResponse.json(
          {
            success: false,
            code: result.code,
            error: result.error,
            items: result.items,
            available: result.available,
          },
          { status }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: "Presente reservado com sucesso!",
          items: result.items,
        },
        { status: 200 }
      );
    }

    // Default to the standard registry resolver (e.g. rose-elegance)
    const result = await reserveGift(itemId, guestName, registryKey);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error, gifts: result.gifts },
        { status: 409 }
      );
    }

    if (result.giftName) {
      sendGiftReserveNotificationEmail({
        reservedBy: guestName,
        giftName: result.giftName,
        slug: context.slug,
      }).catch((err) => {
        console.error("[Gifts] Notification email error:", err);
      });
    }

    return NextResponse.json(
      { success: true, message: "Presente reservado com sucesso!", gifts: result.gifts },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/gifts/reserve error:", error);
    return NextResponse.json(
      { success: false, error: "Ocorreu um erro ao processar a reserva do seu presente." },
      { status: 500 }
    );
  }
}
