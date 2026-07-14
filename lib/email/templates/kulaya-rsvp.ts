import {
  buildBrandEmailHtml,
  buildEmailDetailCard,
  buildEmailStatusHero,
} from "@lib/email/brand-shell";
import { HAXR_AUTH } from "@lib/brand/authorship";
import { getEditionEventBinding } from "@lib/rsvp/events";
import type { RsvpSubmission } from "@lib/rsvp/send-notification";

const ADMIN_BASE = "https://www.haxrsignature.com/admin/events";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  "https://edition.haxrsignature.com";

function buildGuestSummary(submission: RsvpSubmission): string {
  if (!submission.attending) {
    return "Não comparecerá ao evento";
  }
  if (submission.guests <= 1) {
    return "1 pessoa · apenas o convidado";
  }
  return `${submission.guests} pessoas · ${submission.guests - 1} acompanhante(s)`;
}

export function buildKulayaRsvpTeamEmail(
  submission: RsvpSubmission,
  eventName: string,
  slug: string
): { subject: string; html: string } {
  const statusLabel = submission.attending
    ? "Presença confirmada"
    : "Impossibilidade registada";
  const guestSummary = buildGuestSummary(submission);
  const timestamp = new Date().toLocaleString("pt-MZ", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Africa/Maputo",
  });

  const subject = submission.attending
    ? `${HAXR_AUTH.brand} · RSVP ✓ · ${submission.name} · ${eventName}`
    : `${HAXR_AUTH.brand} · RSVP · ${submission.name} · ${eventName}`;

  const binding = getEditionEventBinding(slug);
  const adminUrl = binding?.eventId
    ? `${ADMIN_BASE}/${binding.eventId}`
    : `${ADMIN_BASE}`;

  const detailRows: Array<readonly [string, string]> = [
    ...(submission.email?.trim()
      ? [
          [
            "Email",
            `<a href="mailto:${submission.email.trim()}" style="color:${"#c9a962"};text-decoration:none;">${submission.email.trim()}</a>`,
          ] as const,
        ]
      : []),
    ...(submission.phone?.trim()
      ? [["Telefone", submission.phone.trim()] as const]
      : []),
    ...(submission.messageForBride?.trim()
      ? [["Observação", submission.messageForBride.trim()] as const]
      : []),
    ["Evento", eventName],
    ["Recebido em", timestamp],
    [
      "Convite digital",
      `<a href="${SITE_URL}/${slug}" style="color:#c9a962;text-decoration:none;">edition.haxrsignature.com/${slug}</a>`,
    ],
  ];

  const html = buildBrandEmailHtml({
    title: "Nova confirmação RSVP",
    subtitle: eventName,
    editionTag: "Edition · Convite digital",
    preheader: `${submission.name} — ${statusLabel}`,
    body: `<p style="margin:0;color:#8a8478;font-size:15px;line-height:1.7;">Recebemos uma nova resposta no convite digital. Os detalhes seguem abaixo.</p>
${buildEmailStatusHero(submission.attending, submission.name, guestSummary)}
${buildEmailDetailCard(detailRows)}`,
    cta: { label: "Abrir no admin", href: adminUrl },
    secondaryCta: { label: "Ver convite", href: `${SITE_URL}/${slug}` },
    footerNote: `Notificação automática · ${HAXR_AUTH.product}`,
    signature: true,
  });

  return { subject, html };
}
