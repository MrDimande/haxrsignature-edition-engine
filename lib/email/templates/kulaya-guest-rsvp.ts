import { buildBrandEmailHtml, buildEmailDetailCard } from "@lib/email/brand-shell";
import { HAXR_AUTH } from "@lib/brand/authorship";
import type { RsvpSubmission } from "@lib/rsvp/send-notification";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  "https://edition.haxrsignature.com";

function partySummary(submission: RsvpSubmission): string {
  if (!submission.attending) return "Não comparecerá";
  if (submission.guests <= 1) return "1 pessoa (apenas o convidado)";
  return `${submission.guests} pessoas (${submission.guests - 1} acompanhante(s))`;
}

export function buildKulayaGuestRsvpEmail(
  submission: RsvpSubmission,
  eventName: string,
  slug: string
): { subject: string; html: string } | null {
  if (!submission.email?.trim()) return null;

  const inviteUrl = `${SITE_URL}/${slug}`;
  const guestName = submission.name.trim();

  if (submission.attending) {
    const subject = `${HAXR_AUTH.brand} · Presença confirmada · ${eventName}`;
    const html = buildBrandEmailHtml({
      title: "Presença confirmada",
      subtitle: eventName,
      editionTag: "Edition · Convite digital",
      preheader: `A sua presença foi registada.`,
      body: `<p style="margin:0 0 16px;">Olá <strong style="color:#f5f0e8;font-weight:400;">${guestName}</strong>,</p>
<p style="margin:0 0 8px;">A sua confirmação foi recebida com apreço. Seguem os detalhes da cerimónia.</p>
${buildEmailDetailCard([
  ["Evento", eventName],
  ["Total", partySummary(submission)],
  ...(submission.messageForBride?.trim()
    ? ([["Observação", submission.messageForBride.trim()]] as Array<
        readonly [string, string]
      >)
    : []),
])}
<p style="margin:24px 0 0;font-size:14px;line-height:1.7;color:#8a8478;">Guarde o passe digital no convite — pode imprimi-lo ou fazer screenshot para apresentar na recepção.</p>`,
      cta: { label: "Ver convite", href: inviteUrl },
    });
    return { subject, html };
  }

  const subject = `${HAXR_AUTH.brand} · Resposta registada · ${eventName}`;
  const html = buildBrandEmailHtml({
    title: "Resposta registada",
    subtitle: eventName,
    editionTag: "Edition · Convite digital",
    preheader: `Recebemos a sua resposta.`,
    body: `<p style="margin:0 0 16px;">Olá <strong style="color:#f5f0e8;font-weight:400;">${guestName}</strong>,</p>
<p style="margin:0;">Recebemos a sua resposta e agradecemos que nos tenha informado. Será sempre bem-vinda se as circunstâncias mudarem.</p>`,
  });
  return { subject, html };
}
