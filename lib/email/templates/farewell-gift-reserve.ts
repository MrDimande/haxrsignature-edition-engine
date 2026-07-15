import {
  buildBrandEmailHtml,
  buildEmailDetailCard,
} from "@lib/email/brand-shell";
import { escapeHtml, sanitizeEmailText } from "@lib/email/escape-html";
import { HAXR_AUTH } from "@lib/brand/authorship";
import { FAREWELL_EVENT } from "@lib/farewell/event-details";
import { getEditionEventBinding } from "@lib/rsvp/events";

const ADMIN_BASE = "https://www.haxrsignature.com/admin/events";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  "https://edition.haxrsignature.com";

export function buildFarewellGiftReserveTeamEmail(input: {
  reservedBy: string;
  giftName: string;
  slug?: string;
  eventName?: string;
}): { subject: string; html: string } {
  const slug = input.slug ?? FAREWELL_EVENT.slug;
  const binding = getEditionEventBinding(slug);
  const adminUrl = binding?.eventId
    ? `${ADMIN_BASE}/${binding.eventId}`
    : ADMIN_BASE;
  const timestamp = new Date().toLocaleString("pt-MZ", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Africa/Maputo",
  });

  const safeReserver = sanitizeEmailText(input.reservedBy);
  const safeGift = sanitizeEmailText(input.giftName);
  const subject = `${HAXR_AUTH.brand} · Presente reservado · ${safeReserver}`;

  const html = buildBrandEmailHtml({
    title: "Novo gesto de carinho",
    subtitle: input.eventName ?? "Despedida de Solteira · Jessica Muege",
    editionTag: "Edition · Lista de presentes",
    preheader: `${safeReserver} reservou: ${safeGift}`,
    body: `<p style="margin:0;color:#8a8478;font-size:15px;line-height:1.7;"><strong style="color:#f5f0e8;font-weight:400;">${escapeHtml(input.reservedBy)}</strong> reservou um presente na lista da despedida.</p>
${buildEmailDetailCard([
  { label: "Presente", value: input.giftName },
  { label: "Oferecido por", value: input.reservedBy },
  { label: "Registado em", value: timestamp },
])}`,
    cta: { label: "Ver no admin", href: adminUrl },
    secondaryCta: { label: "Ver convite", href: `${SITE_URL}/${slug}` },
    footerNote: `Notificação automática · ${HAXR_AUTH.product}`,
    signature: true,
  });

  return { subject, html };
}
