import {
  haxrMailboxes,
  PRIMARY_INBOX,
  type EmailChannel,
} from "@lib/email/addresses";
import { getInvitationAdminBinding } from "@lib/rsvp/events";

export interface RsvpEventEmailConfig {
  eventName: string;
  slug: string;
  /** Canal Resend — remetente contextual (@rsvp, @hello, etc.) */
  channel: EmailChannel;
  /** Destinatários principais (caixa RSVP) */
  notifyTo: string[];
  /** Cópia — noiva / equipa adicional */
  cc: string[];
  /** Reply-to — caixa principal para respostas */
  replyTo: string;
}

export const KULAYA_RSVP_EMAIL: RsvpEventEmailConfig = {
  eventName:
    getInvitationAdminBinding("jessicakulaya")?.adminEventName ??
    "Edition · Kulaya · Jessica Muege",
  slug: "jessicakulaya",
  channel: "rsvp",
  notifyTo: [haxrMailboxes.rsvp],
  cc: ["jessicamuege@gmail.com"],
  replyTo: PRIMARY_INBOX,
};

export function getRsvpEmailConfig(slug?: string): RsvpEventEmailConfig | null {
  if (!slug || slug === "jessicakulaya" || slug === "jessicakhulaya") {
    return KULAYA_RSVP_EMAIL;
  }
  return null;
}
