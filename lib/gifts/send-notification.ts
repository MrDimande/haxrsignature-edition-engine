import { buildFarewellGiftReserveTeamEmail } from "@lib/email/templates/farewell-gift-reserve";
import { isResendConfigured, sendHaxrEmail } from "@lib/email/resend";
import { FAREWELL_RSVP_EMAIL } from "@lib/rsvp/config";

export async function sendGiftReserveNotificationEmail(input: {
  reservedBy: string;
  giftName: string;
  slug?: string;
}): Promise<boolean> {
  if (!isResendConfigured()) {
    console.warn(
      "[Gifts] RESEND_API_KEY não configurada — reserva registada sem email."
    );
    return false;
  }

  const config = FAREWELL_RSVP_EMAIL;
  const { subject, html } = buildFarewellGiftReserveTeamEmail({
    reservedBy: input.reservedBy.trim(),
    giftName: input.giftName.trim(),
    slug: input.slug ?? config.slug,
    eventName: config.eventName,
  });

  const result = await sendHaxrEmail({
    channel: config.channel,
    to: config.notifyTo,
    cc: config.cc,
    replyTo: config.replyTo,
    subject,
    html,
  });

  if (!result.ok) {
    console.error("[Gifts] Gift reserve email failed:", result.error);
    return false;
  }

  return true;
}
