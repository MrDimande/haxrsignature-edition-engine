/** Despedida de Solteira · Rose Elegance · Jessica Muege */
export const FAREWELL_EVENT = {
  slug: "jessicachadelingerie",
  title: "Despedida de Solteira — Jessica Muege",
  dateIso: "2026-07-25",
  timeLabel: "11h00",
  /** Último dia para confirmar presença */
  rsvpDeadlineIso: "2026-07-20",
  rsvpDeadlineLabel: "20 de Julho de 2026",
  calendarTitle: "Despedida de Solteira — Jessica Muege",
  calendarDescription:
    "Chá de Lingerie · Rose Elegance Farewell. Dress code obrigatório: uma peça rosa. Branco reservado à noiva.",
} as const;

export const FAREWELL_VENUE = {
  name: "Residência Govene",
  full: "Residência Govene, Matola Gare, Moçambique",
  mapsUrl: "https://maps.app.goo.gl/SSvVg81vTzxnXXkJ7",
  mapCoordinates: "Residência Govene, Matola Gare, Moçambique",
} as const;

/** Noiva · contacto pós-RSVP (wa.me — só dígitos, sem +) */
export const FAREWELL_BRIDE_WHATSAPP = "258844933470";

export const FAREWELL_WHATSAPP_DEFAULT_MESSAGE =
  "Olá! Confirmo a minha presença na Despedida de Solteira da Jessica. Tenho uma dúvida:" as const;

export function isFarewellRsvpDeadlinePassed(
  now: Date = new Date(),
  deadlineIso: string = FAREWELL_EVENT.rsvpDeadlineIso
): boolean {
  const deadline = new Date(`${deadlineIso}T23:59:59+02:00`);
  return now.getTime() > deadline.getTime();
}

export function buildFarewellGoogleCalendarUrl(): string {
  return (
    "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    "&text=" +
    encodeURIComponent(FAREWELL_EVENT.calendarTitle) +
    "&dates=20260725T090000Z/20260725T120000Z" +
    "&details=" +
    encodeURIComponent(FAREWELL_EVENT.calendarDescription) +
    "&location=" +
    encodeURIComponent(FAREWELL_VENUE.full)
  );
}

export function buildFarewellIcsContent(): string {
  const stamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//HAXR Signature//Rose Elegance Farewell//PT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    "UID:rose-elegance-farewell-20260725@haxrsignature.com",
    `DTSTAMP:${stamp}`,
    "DTSTART:20260725T110000",
    "DTEND:20260725T140000",
    `SUMMARY:${FAREWELL_EVENT.calendarTitle}`,
    `DESCRIPTION:${FAREWELL_EVENT.calendarDescription}`,
    `LOCATION:${FAREWELL_VENUE.full}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadFarewellIcsFile(): void {
  const blob = new Blob([buildFarewellIcsContent()], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "despedida-jessica-muege.ics";
  anchor.click();
  URL.revokeObjectURL(url);
}

export function resolveFarewellWhatsAppDigits(override?: string): string {
  const raw =
    override?.trim() ||
    process.env.NEXT_PUBLIC_EDITION_FAREWELL_WHATSAPP?.trim() ||
    FAREWELL_BRIDE_WHATSAPP;
  return raw.replace(/\D/g, "");
}

export function getFarewellWhatsAppUrl(
  phone?: string,
  message?: string
): string | null {
  const digits = resolveFarewellWhatsAppDigits(phone);
  if (!digits) return null;

  const text = encodeURIComponent(
    message ?? FAREWELL_WHATSAPP_DEFAULT_MESSAGE
  );
  return `https://wa.me/${digits}?text=${text}`;
}
