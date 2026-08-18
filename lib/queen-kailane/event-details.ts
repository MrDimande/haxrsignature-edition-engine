/**
 * Queen Kailane Cande — Sacramento do Crisma · LUZ DA GRAÇA
 * Fonte única de verdade do evento Edition.
 *
 * Hora da celebração religiosa ainda NÃO fornecida —
 * manter `ceremonyTime` null e NÃO inventar / NÃO mostrar “hora a confirmar”.
 */

export const QUEEN_KAILANE_SLUG = "queenkailanecrisma" as const;
export const QUEEN_KAILANE_TIMEZONE = "Africa/Maputo" as const;

export const QUEEN_KAILANE_VERSE = {
  text: "ANDAI COMO FILHOS DA LUZ.",
  reference: "EFÉSIOS 5:8",
} as const;

export const QUEEN_KAILANE_SIGNATURE = {
  line1: "CONFIRMADA NA FÉ.",
  line2: "GUIADA PELA LUZ.",
} as const;

export const QUEEN_KAILANE_EVENT = {
  slug: QUEEN_KAILANE_SLUG,
  title: "Sacramento do Crisma — Queen Kailane Cande",
  celebrant: "Queen Kailane Cande",
  conceptualTitle: "LUZ DA GRAÇA",
  calendarTitle: "Sacramento do Crisma — Queen Kailane Cande",
  eventType: "Sacramento do Crisma",
  dateIso: "2026-08-30",
  dateDisplay: "30 · Agosto · 2026",
  dateDisplayShort: "30 · AGOSTO · 2026",
  /** Pendente — não inventar; UI omite enquanto null */
  ceremonyTime: null as string | null,
  ceremonyVenue: "Igreja Anglicana — Paróquia de São Estêvão e Lourenço",
  ceremonyVenueShort: "Igreja Anglicana",
  ceremonyParish: "Paróquia de São Estêvão e Lourenço",
  lunchTime: "13h00",
  lunchLocation: "São Dâmaso",
  lunchVenue: "Residência dos seus Pais",
} as const;

export type QueenKailaneFieldStatus = "pending" | "confirmed";

export function getQueenKailaneCeremonyTime(): string | null {
  return QUEEN_KAILANE_EVENT.ceremonyTime;
}

export function shouldShowQueenKailaneCeremonyTime(): boolean {
  return Boolean(QUEEN_KAILANE_EVENT.ceremonyTime?.trim());
}

export function getQueenKailaneLunchTime(): string {
  return QUEEN_KAILANE_EVENT.lunchTime;
}

/** Env: EDITION_EVENT_QUEEN_KAILANE_ID — nunca inventar UUID */
export function getQueenKailaneEventIdFromEnv(): string | null {
  if (typeof process === "undefined") return null;
  const value = process.env.EDITION_EVENT_QUEEN_KAILANE_ID?.trim();
  return value || null;
}

export function isQueenKailaneRemotePersistConfigured(): boolean {
  return Boolean(getQueenKailaneEventIdFromEnv());
}

export const QUEEN_KAILANE_COPY = {
  gateCta: "ENTRAR NA LUZ",
  heroEyebrow: "SACRAMENTO DO CRISMA",
  celebracaoLead:
    "Com gratidão a Deus e alegria no coração, Queen Kailane Cande celebra um momento especial da sua caminhada de fé: o Sacramento do Crisma.",
  celebracaoBody:
    "Um dia de confirmação, bênção e renovação espiritual, que gostaríamos de partilhar com aqueles que fazem parte da sua história.",
  almocoLead: "Depois da celebração, continuamos juntos.",
  almocoBody:
    "Um almoço preparado para celebrar em família este dia de fé, amor e gratidão.",
  story: [
    "HÁ MOMENTOS QUE MARCAM A VIDA.",
    "Alguns celebram conquistas.",
    "Outros anunciam novos caminhos.",
    "Este confirma uma fé.",
    "Hoje, Queen dá mais um passo na sua caminhada com Deus.",
  ] as const,
  rsvpTitle: "SERÁ UMA ALEGRIA PARTILHAR ESTE MOMENTO CONSIGO.",
  rsvpYes: "SIM, ESTAREI PRESENTE",
  rsvpNo: "NÃO PODEREI ESTAR PRESENTE",
  rsvpClosing:
    "A sua confirmação foi recebida com gratidão. Que a luz acompanhe este dia.",
  rsvpDeclined:
    "Obrigado por nos informar. A sua presença no coração permanece.",
  haxrLine: "UMA EXPERIÊNCIA ASSINADA POR",
  haxrBrand: "HAXR SIGNATURE",
  haxrSub: "Conceito · Direcção Criativa · Experiência Digital",
  haxrClose: "Cada celebração merece uma assinatura.",
} as const;

export const QUEEN_KAILANE_RSVP = {
  title: QUEEN_KAILANE_COPY.rsvpTitle,
  subtitle: "Confirmação de presença",
  closing: QUEEN_KAILANE_COPY.rsvpClosing,
  declinedClosing: QUEEN_KAILANE_COPY.rsvpDeclined,
  /** Não inventar deadline */
  deadlineIso: null as string | null,
  deadlineLabel: null as string | null,
} as const;

export type QueenKailaneRsvpLocalRecord = {
  attending: boolean;
  name: string;
  submittedAt: string;
};

export function readQueenKailaneRsvpLocalRecord(
  raw: string | null
): QueenKailaneRsvpLocalRecord | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Partial<QueenKailaneRsvpLocalRecord>;
    if (typeof data.attending !== "boolean") return null;
    if (typeof data.name !== "string" || !data.name.trim()) return null;
    return {
      attending: data.attending,
      name: data.name.trim(),
      submittedAt:
        typeof data.submittedAt === "string"
          ? data.submittedAt
          : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function formatIcsStamp(date: Date = new Date()): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function getQueenKailaneCalendarLocation(): string {
  return `${QUEEN_KAILANE_EVENT.ceremonyVenue}. Almoço ${QUEEN_KAILANE_EVENT.lunchTime} — ${QUEEN_KAILANE_EVENT.lunchLocation}, ${QUEEN_KAILANE_EVENT.lunchVenue}.`;
}

/**
 * ICS dia inteiro enquanto a hora da celebração religiosa não estiver confirmada.
 * Não inventa horário — VALUE=DATE.
 */
export function buildQueenKailaneIcsContent(): string {
  const day = QUEEN_KAILANE_EVENT.dateIso.replace(/-/g, "");
  const [y, m, d] = QUEEN_KAILANE_EVENT.dateIso.split("-").map(Number);
  const end = new Date(Date.UTC(y, m - 1, d + 1));
  const next = [
    end.getUTCFullYear(),
    String(end.getUTCMonth() + 1).padStart(2, "0"),
    String(end.getUTCDate()).padStart(2, "0"),
  ].join("");

  const description = [
    QUEEN_KAILANE_EVENT.conceptualTitle,
    QUEEN_KAILANE_SIGNATURE.line1,
    QUEEN_KAILANE_SIGNATURE.line2,
    `Celebração: ${QUEEN_KAILANE_EVENT.ceremonyVenue}.`,
    `Almoço ${QUEEN_KAILANE_EVENT.lunchTime}: ${QUEEN_KAILANE_EVENT.lunchLocation} — ${QUEEN_KAILANE_EVENT.lunchVenue}.`,
  ].join(" ");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//HAXR Signature//Queen Kailane Luz da Graca//PT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    "UID:queen-kailane-luz-da-graca-20260830@haxrsignature.com",
    `DTSTAMP:${formatIcsStamp()}`,
    `DTSTART;VALUE=DATE:${day}`,
    `DTEND;VALUE=DATE:${next}`,
    `SUMMARY:${escapeIcsText(QUEEN_KAILANE_EVENT.calendarTitle)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    `LOCATION:${escapeIcsText(QUEEN_KAILANE_EVENT.ceremonyVenue)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadQueenKailaneIcsFile(): void {
  if (typeof document === "undefined") return;

  const blob = new Blob([buildQueenKailaneIcsContent()], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "Queen_Kailane_Sacramento_do_Crisma.ics";
  anchor.click();
  URL.revokeObjectURL(url);
}

/** Google Calendar all-day (30 Ago → 31 Ago exclusivo). */
export function buildQueenKailaneGoogleCalendarUrl(): string {
  return (
    "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    "&text=" +
    encodeURIComponent(QUEEN_KAILANE_EVENT.calendarTitle) +
    "&dates=20260830/20260831" +
    "&details=" +
    encodeURIComponent(
      `${QUEEN_KAILANE_EVENT.conceptualTitle}. ${getQueenKailaneCalendarLocation()}`
    ) +
    "&location=" +
    encodeURIComponent(QUEEN_KAILANE_EVENT.ceremonyVenue) +
    "&ctz=" +
    encodeURIComponent(QUEEN_KAILANE_TIMEZONE)
  );
}
