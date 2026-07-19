/**
 * Jessica & Samuel — Casamento Tradicional (Lobolo)
 * Conteúdo canónico do convite Edition.
 */

export const TRADITIONAL_WEDDING_SLUG = "jessicaesamueltraditionalwedding" as const;

export const TRADITIONAL_COUPLE = {
  display: "Jessica & Samuel",
  bride: "Jessica Muege",
  groom: "Samuel Govene",
} as const;

export const TRADITIONAL_PARENTS = {
  bride: {
    title: "Pais da Noiva",
    names: [
      "Maria da Sagrada Família Andre Djive",
      "Lucas Jagino António Muege",
    ],
  },
  groom: {
    title: "Pais do Noivo",
    names: ["Maria Rosa Maxaieie", "Jaime Govene"],
  },
} as const;

export const TRADITIONAL_VENUE = {
  name: "Casa D'Artista Kutenga",
  short: "Casa D'Artista Kutenga, Matola",
  city: "Matola, Moçambique",
  full: "Casa D'Artista Kutenga, Matola, Moçambique",
  mapsUrl: "https://maps.app.goo.gl/BSynBHVrt2CB3W6bA?g_st=ac",
} as const;

export const TRADITIONAL_EVENT = {
  ceremonyLabel: "Casamento Tradicional | Lobolo",
  themeName: "Primavera",
  themePalette: ["Laranja", "Dourado", "Branco"],
  dressCode: "Formal",
  waterToastLabel: "Copo de Água",
  waterToastTime: "14h00",
  dateIso: "2026-08-08",
  locationName: TRADITIONAL_VENUE.name,
  mapsUrl: TRADITIONAL_VENUE.mapsUrl,
  giftStoreName: "Casa das Loiças da Karl Marx",
  giftStoreMapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Casa+das+Loi%C3%A7as+da+Karl+Marx+Maputo+Mo%C3%A7ambique",
  calendarTitle: "Casamento Tradicional · Lobolo — Jessica & Samuel",
  calendarDescription:
    "Celebração do Lobolo de Jessica Muege e Samuel Govene. Uma união de famílias com honra, tradição e gratidão.",
} as const;

export const TRADITIONAL_ASSETS = {
  heroImage: "/images/traditional-wedding/jessica-samuel-hero.png",
} as const;

export const TRADITIONAL_COPY = {
  heroLabel: "Lobolo",
  heroInvitation:
    "Com honra e gratidão, convidamo-vos a testemunhar a união das nossas famílias.",
  heroEyebrow: "O Lobolo de",
  heroHeritage: "Raízes Moçambicanas · Tradição Africana",
  heroSubtitle:
    "Uma celebração solene do compromisso entre duas linhagens que se tornam uma só.",
  introWhisper: "Duas famílias. Um compromisso solene.",
  intro:
    "Com profunda gratidão e respeito pelas nossas raízes, convidamo-vos a testemunhar o Lobolo — o reconhecimento solene do compromisso entre duas famílias que se tornam uma só.",
  introQuoteTitle: "Uma União de Famílias",
  introQuoteAttribution: "Casamento Tradicional · Lobolo",
  coupleSectionTitle: "Os Noivos",
  sonOfLabel: "Filho de",
  daughterOfLabel: "Filha de",
  invitationLead: "Com Amor,",
  invitationBody:
    "Com a bênção dos pais, tem a honra de convidá-lo a testemunhar a celebração do Lobolo. Junte-se a nós e ajude-nos a celebrar esta união de famílias, conforme a agenda abaixo.",
  familiesTitle: "A Bênção das Nossas Famílias",
  dressCodeLead:
    "Solicitamos traje formal, em harmonia com a solenidade desta celebração.",
  dressCodeBody:
    "O vestuário formal honra a ocasião e o lugar de cada convidado neste momento de união. Preferimos sobriedade, elegância e discrição — sem excessos ornamentais.",
  giftsLead:
    "Com delicadeza e respeito, preparamos uma lista de presentes para quem desejar honrar este momento connosco.",
  giftsConsultNote:
    "A lista encontra-se disponível para consulta presencial, em nome de Jessica Muege e Samuel Govene. A equipa da loja receberá cada convidado com atenção e orientará com todo o cuidado.",
  giftsStoreNote:
    "Visite a loja com calma, escolha com o coração e deixe que a nossa lista o guie com proximidade e elegância.",
  countdownEyebrow: "Falta Pouco",
  countdownTitle: "Até o Nosso Encontro",
  countdownLead:
    "Cada instante aproxima-nos desta celebração solene — um encontro de famílias, tradição e bênção.",
  countdownComplete:
    "O grande dia chegou. Será uma honra recebê-los na Casa D'Artista Kutenga.",
  rsvpEmotionalLine:
    "A sua presença será recebida com honra pelas nossas famílias.",
  rsvpTitle: "Confirmar Presença",
  rsvpSubtitle:
    "A vossa presença é uma honra para as nossas famílias. Por favor, confirmem até à data indicada.",
  closing:
    "Que esta celebração seja testemunho de respeito, continuidade e bênção sobre o nosso caminho.",
} as const;

export function formatTraditionalEventDate(isoDate: string): string {
  const date = new Date(isoDate + "T12:00:00");
  return date.toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Formato editorial do hero — 25 • 07 • 2026 */
export function formatTraditionalHeroDateDots(isoDate: string): string {
  const date = new Date(isoDate + "T12:00:00");
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}\u00a0•\u00a0${month}\u00a0•\u00a0${year}`;
}

function parseTraditionalEventDateTime(
  dateIso: string,
  timeLabel: string,
): { start: Date; end: Date } {
  const match = timeLabel.match(/(\d{1,2})h(\d{2})?/i);
  const hours = match ? Number(match[1]) : 14;
  const minutes = match && match[2] ? Number(match[2]) : 0;
  const padded = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
  const start = new Date(`${dateIso}T${padded}+02:00`);
  const end = new Date(start.getTime() + 4 * 60 * 60 * 1000);
  return { start, end };
}

function formatGoogleCalendarUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function formatIcsLocal(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Maputo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "00";

  return `${get("year")}${get("month")}${get("day")}T${get("hour")}${get("minute")}${get("second")}`;
}

export function buildTraditionalGoogleCalendarUrl(
  dateIso: string = TRADITIONAL_EVENT.dateIso,
  timeLabel: string = TRADITIONAL_EVENT.waterToastTime,
): string {
  const { start, end } = parseTraditionalEventDateTime(dateIso, timeLabel);

  return (
    "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    "&text=" +
    encodeURIComponent(TRADITIONAL_EVENT.calendarTitle) +
    "&dates=" +
    `${formatGoogleCalendarUtc(start)}/${formatGoogleCalendarUtc(end)}` +
    "&details=" +
    encodeURIComponent(TRADITIONAL_EVENT.calendarDescription) +
    "&location=" +
    encodeURIComponent(TRADITIONAL_VENUE.full)
  );
}

export function buildTraditionalIcsContent(
  dateIso: string = TRADITIONAL_EVENT.dateIso,
  timeLabel: string = TRADITIONAL_EVENT.waterToastTime,
): string {
  const { start, end } = parseTraditionalEventDateTime(dateIso, timeLabel);
  const stamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//HAXR Signature//Primavera Lobolo//PT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    "UID:primavera-lobolo-20260808@haxrsignature.com",
    `DTSTAMP:${stamp}`,
    `DTSTART:${formatIcsLocal(start)}`,
    `DTEND:${formatIcsLocal(end)}`,
    `SUMMARY:${TRADITIONAL_EVENT.calendarTitle}`,
    `DESCRIPTION:${TRADITIONAL_EVENT.calendarDescription}`,
    `LOCATION:${TRADITIONAL_VENUE.full}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadTraditionalIcsFile(): void {
  const blob = new Blob([buildTraditionalIcsContent()], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "lobolo-jessica-samuel.ics";
  anchor.click();
  URL.revokeObjectURL(url);
}
