import {
  haxrMailboxes,
  PRIMARY_INBOX,
  type EmailChannel,
} from "@lib/email/addresses";
import { getInvitationAdminBinding } from "@lib/rsvp/events";
import { resolveSlug } from "@lib/engine";
import { FAREWELL_EVENT } from "@lib/farewell/event-details";
import { TRADITIONAL_WEDDING_SLUG } from "@lib/jessica-samuel-traditional/event-details";
import { WEDDING_SLUG } from "@lib/jessica-samuel-wedding/event-details";

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

export const LINGERIE_RSVP_EMAIL: RsvpEventEmailConfig = {
  eventName:
    getInvitationAdminBinding("cha-de-lingerie")?.adminEventName ??
    "Edition · Chá de Lingerie · Jessica Muege",
  slug: "cha-de-lingerie",
  channel: "rsvp",
  notifyTo: [haxrMailboxes.rsvp],
  cc: ["jessicamuege@gmail.com"],
  replyTo: PRIMARY_INBOX,
};

export const PANELA_RSVP_EMAIL: RsvpEventEmailConfig = {
  eventName: "Edition · Jessica Bride to Be Experience",
  slug: "cha-de-panela",
  channel: "rsvp",
  notifyTo: [haxrMailboxes.rsvp],
  cc: [],
  replyTo: PRIMARY_INBOX,
};

export const FAREWELL_RSVP_EMAIL: RsvpEventEmailConfig = {
  eventName:
    getInvitationAdminBinding(FAREWELL_EVENT.slug)?.adminEventName ??
    "Edition · Despedida de Solteira · Jessica Muege",
  slug: FAREWELL_EVENT.slug,
  channel: "rsvp",
  notifyTo: [haxrMailboxes.rsvp],
  cc: ["jessicamuege@gmail.com"],
  replyTo: PRIMARY_INBOX,
};

export const TRADITIONAL_RSVP_EMAIL: RsvpEventEmailConfig = {
  eventName:
    getInvitationAdminBinding(TRADITIONAL_WEDDING_SLUG)?.adminEventName ??
    "Edition · Casamento Tradicional · Jessica & Samuel",
  slug: TRADITIONAL_WEDDING_SLUG,
  channel: "rsvp",
  notifyTo: [haxrMailboxes.rsvp],
  cc: ["jessicamuege@gmail.com"],
  replyTo: PRIMARY_INBOX,
};

export const WEDDING_RSVP_EMAIL: RsvpEventEmailConfig = {
  eventName:
    getInvitationAdminBinding(WEDDING_SLUG)?.adminEventName ??
    "Edition · Casamento · Jessica & Samuel",
  slug: WEDDING_SLUG,
  channel: "rsvp",
  notifyTo: [haxrMailboxes.rsvp],
  cc: ["jessicamuege@gmail.com"],
  replyTo: PRIMARY_INBOX,
};

export function getRsvpEmailConfig(slug?: string): RsvpEventEmailConfig | null {
  if (!slug) return null;
  const canonicalSlug = resolveSlug(slug);
  if (!canonicalSlug) return null;
  if (canonicalSlug === "jessicakulaya") {
    return KULAYA_RSVP_EMAIL;
  }
  if (canonicalSlug === "cha-de-lingerie") {
    return LINGERIE_RSVP_EMAIL;
  }
  if (canonicalSlug === "cha-de-panela") {
    return PANELA_RSVP_EMAIL;
  }
  if (canonicalSlug === FAREWELL_EVENT.slug) {
    return FAREWELL_RSVP_EMAIL;
  }
  if (canonicalSlug === TRADITIONAL_WEDDING_SLUG) {
    return TRADITIONAL_RSVP_EMAIL;
  }
  if (canonicalSlug === WEDDING_SLUG) {
    return WEDDING_RSVP_EMAIL;
  }
  return null;
}
