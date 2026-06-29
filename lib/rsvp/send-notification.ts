import { buildKulayaGuestRsvpEmail } from "@lib/email/templates/kulaya-guest-rsvp";
import { buildKulayaRsvpTeamEmail } from "@lib/email/templates/kulaya-rsvp";
import {
  buildFarewellGuestRsvpEmail,
  buildFarewellRsvpTeamEmail,
} from "@lib/email/templates/farewell-rsvp";
import { isResendConfigured, sendHaxrEmail } from "@lib/email/resend";
import { FAREWELL_EVENT } from "@lib/farewell/event-details";
import type { RsvpEventEmailConfig } from "./config";

export interface RsvpSubmission {
  name: string;
  attending: boolean;
  guests: number;
  slug?: string;
  email?: string;
  phone?: string;
  messageForBride?: string;
  size?: string;
  dressCodeConfirmed?: boolean;
}

export type RsvpEmailResult = {
  teamSent: boolean;
  guestSent: boolean;
  guestSkipped?: string;
};

export async function sendRsvpNotificationEmail(
  submission: RsvpSubmission,
  config: RsvpEventEmailConfig
): Promise<RsvpEmailResult> {
  const result: RsvpEmailResult = {
    teamSent: false,
    guestSent: false,
  };

  if (!isResendConfigured()) {
    console.warn(
      "[RSVP] RESEND_API_KEY não configurada — confirmação registada sem envio de email."
    );
    return result;
  }

  const slug = config.slug;
  const isFarewell = slug === FAREWELL_EVENT.slug;

  const { subject, html } = isFarewell
    ? buildFarewellRsvpTeamEmail(submission, config.eventName, slug)
    : buildKulayaRsvpTeamEmail(submission, config.eventName, slug);

  const teamResult = await sendHaxrEmail({
    channel: config.channel,
    to: config.notifyTo,
    cc: config.cc,
    replyTo: config.replyTo,
    subject,
    html,
  });

  if (!teamResult.ok) {
    throw new Error(teamResult.error ?? "Falha ao enviar email RSVP via Resend");
  }

  result.teamSent = true;

  const guestEmail = isFarewell
    ? buildFarewellGuestRsvpEmail(submission, config.eventName, slug)
    : buildKulayaGuestRsvpEmail(submission, config.eventName);
  if (!guestEmail) {
    result.guestSkipped = "no_email";
    return result;
  }

  const guestResult = await sendHaxrEmail({
    channel: "hello",
    to: submission.email!.trim(),
    subject: guestEmail.subject,
    html: guestEmail.html,
    replyTo: config.replyTo,
  });

  if (!guestResult.ok) {
    console.warn("[RSVP] Guest confirmation email failed:", guestResult.error);
    return result;
  }

  result.guestSent = true;
  return result;
}
