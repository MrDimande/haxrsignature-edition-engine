import { NextResponse } from "next/server";
import { FAREWELL_EVENT } from "@lib/farewell/event-details";
import { reserveGift } from "@lib/gifts";
import { sendGiftReserveNotificationEmail } from "@lib/gifts/send-notification";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { giftId, reservedBy } = body;

    if (!giftId || typeof giftId !== "string" || giftId.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Identificador do presente em falta." },
        { status: 400 }
      );
    }

    if (!reservedBy || typeof reservedBy !== "string" || reservedBy.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Por favor, indique quem oferece o presente para que a Jessica saiba." },
        { status: 400 }
      );
    }

    const result = await reserveGift(giftId, reservedBy);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error, gifts: result.gifts },
        { status: 409 } // Conflict
      );
    }

    if (result.giftName) {
      sendGiftReserveNotificationEmail({
        reservedBy: reservedBy.trim(),
        giftName: result.giftName,
        slug: FAREWELL_EVENT.slug,
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
