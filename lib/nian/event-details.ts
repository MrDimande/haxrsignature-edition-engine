/**
 * Nian — NIGHT OF THE WEB
 * Fonte única de verdade do evento Edition.
 *
 * NIGHT OF THE WEB = universo criativo (não indicação de horário).
 * Celebração real: 19 Set 2026 · 12h00 (Africa/Maputo).
 */

export const NIAN_SLUG = "nian" as const;
export const NIAN_TIMEZONE = "Africa/Maputo" as const;
export const NIAN_UTC_OFFSET = "+02:00" as const;

export const NIAN_EVENT = {
  slug: NIAN_SLUG,
  title: "Nian — NIGHT OF THE WEB",
  subtitle: "Uma cidade em movimento. Um pequeno herói. Uma celebração inesquecível.",
  conceptualTitle: "NIGHT OF THE WEB",
  calendarTitle: "Aniversário do Nian — NIGHT OF THE WEB",
  dateIso: "2026-09-19",
  dateDisplay: "19 · Setembro · 2026",
  dateDisplayShort: "19 · SETEMBRO · 2026",
  /** Confirmed — 12h00 Africa/Maputo */
  timeLabel: "12h00",
  timeHour: 12,
  timeMinute: 0,
  /** Soft Google Calendar span when end time is unknown — not shown in UI. */
  googleSoftDurationHours: 3,
  eventType: "Aniversário Infantil",
  city: "Marracuene, Maputo",
  country: "Moçambique",
} as const;

export type NianFieldStatus = "pending" | "confirmed";

export const NIAN_VENUE: {
  status: NianFieldStatus;
  /** Alias configurável — venueName */
  name: string;
  shortName: string;
  address: string;
  /** Alias configurável — venueCity (UI: MARRACUENE · MAPUTO) */
  city: string;
  cityDisplay: string;
  directions: string;
  mapCoordinates: string | null;
  /**
   * Alias configurável — mapsUrl.
   * URL exacta fornecida pela organização. Null/ inválida → botão oculto.
   */
  mapsUrl: string | null;
} = {
  status: "confirmed",
  name: "Salão de Eventos Benerla",
  shortName: "Benerla",
  address: "Marracuene, Maputo, Moçambique",
  city: "Marracuene, Maputo",
  cityDisplay: "MARRACUENE · MAPUTO",
  directions: "Salão de Eventos Benerla — Marracuene, Maputo.",
  mapCoordinates: null,
  mapsUrl: "https://share.google/iJNUcEM5s2AiQUxiX",
};

/** Configuráveis — Localização */
export function getNianVenueName(): string {
  return NIAN_VENUE.name;
}

export function getNianVenueCity(): string {
  return NIAN_VENUE.cityDisplay || NIAN_VENUE.city;
}

/** Valida URL http(s); devolve o texto exacto quando válido (sem normalizar). */
export function resolveNianMapsUrl(
  raw: string | null | undefined
): string | null {
  const url = typeof raw === "string" ? raw.trim() : "";
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

export function getNianMapsUrl(): string | null {
  return resolveNianMapsUrl(NIAN_VENUE.mapsUrl);
}

export function hasNianMapsUrl(): boolean {
  return Boolean(getNianMapsUrl());
}

/** Env: EDITION_EVENT_NIAN_ID — nunca inventar; null = modo local sem persist remota */
export function getNianEventIdFromEnv(): string | null {
  if (typeof process === "undefined") return null;
  const value = process.env.EDITION_EVENT_NIAN_ID?.trim();
  return value || null;
}

export function isNianRemotePersistConfigured(): boolean {
  return Boolean(getNianEventIdFromEnv());
}

export const NIAN_DRESS_CODE = {
  status: "confirmed" as NianFieldStatus,
  eyebrow: "PROTOCOLO DE ENTRADA",
  title: "CORES DO UNIVERSO",
  label: "Azul Royal · Vermelho Vivo · Preto",
  lead: "Veste as cores. Entra no universo do Nian.",
  colors: [
    { name: "Azul Royal", hex: "#4169E1" },
    { name: "Vermelho Vivo", hex: "#E10600" },
    { name: "Preto", hex: "#0A0A0C" },
  ],
} as const;

export const NIAN_RSVP = {
  title: "Vais juntar-te à aventura?",
  subtitle: "Confirmação de missão",
  closing: "Missão confirmada. A cidade espera por ti.",
  declinedClosing: "Mensagem recebida. O Nian sentirá a tua falta.",
  /** Confirmar presença até este dia (inclusive), antes do evento. */
  deadlineIso: "2026-09-05",
  deadlineLabel: "05 · Setembro · 2026",
  deadlineDisplay: "Confirma até 05 · SETEMBRO · 2026",
} as const;

export type NianRsvpLocalRecord = {
  attending: boolean;
  name: string;
  submittedAt: string;
};

export const NIAN_RSVP_STORAGE_SLUG = NIAN_SLUG;

export function readNianRsvpLocalRecord(
  raw: string | null
): NianRsvpLocalRecord | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Partial<NianRsvpLocalRecord>;
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

/** Paths de áudio — nunca obter Sunflower de fontes externas */
export const NIAN_AUDIO_PATHS = {
  authorized: "/audio/nian/sunflower-authorized.mp3",
  placeholder: "/audio/nian/sunflower-placeholder.mp3",
} as const;

/**
 * Flip to `true` only when the organisation-supplied authorised file
 * is committed at `NIAN_AUDIO_PATHS.authorized`.
 */
export const NIAN_AUDIO_AUTHORIZED = true;

export function resolveNianAudioSrc(): string {
  return NIAN_AUDIO_AUTHORIZED
    ? NIAN_AUDIO_PATHS.authorized
    : NIAN_AUDIO_PATHS.placeholder;
}

export function isNianAudioReady(src: string | null | undefined): boolean {
  return typeof src === "string" && src.trim().length > 0;
}

export function isNianAuthorizedTrackActive(): boolean {
  return NIAN_AUDIO_AUTHORIZED;
}

export function getNianEventTimeLabel(): string | null {
  return NIAN_EVENT.timeLabel?.trim() || null;
}

export function shouldShowNianEventTime(): boolean {
  return Boolean(getNianEventTimeLabel());
}

export type NianAudioPreference =
  | "undecided"
  | "with-music"
  | "without-music";

export const NIAN_AUDIO_PREF_KEY = "haxr:nian-night-of-the-web:audio-pref:v1";

export function readNianAudioPreference(): NianAudioPreference {
  if (typeof window === "undefined") return "undecided";
  try {
    const value = sessionStorage.getItem(NIAN_AUDIO_PREF_KEY);
    if (value === "with-music" || value === "without-music") return value;
  } catch {
    /* private mode */
  }
  return "undecided";
}

export function writeNianAudioPreference(pref: NianAudioPreference): void {
  if (typeof window === "undefined") return;
  try {
    if (pref === "undecided") {
      sessionStorage.removeItem(NIAN_AUDIO_PREF_KEY);
      return;
    }
    sessionStorage.setItem(NIAN_AUDIO_PREF_KEY, pref);
  } catch {
    /* private mode */
  }
}

/**
 * WhatsApp anfitrião — só dígitos via NEXT_PUBLIC_EDITION_NIAN_WHATSAPP.
 * Sem fallback: botão oculto até a família confirmar o número.
 */
export const NIAN_WHATSAPP_DEFAULT_MESSAGE =
  "Olá! Acabei de confirmar presença no Aniversário do Nian — NIGHT OF THE WEB (19 de Setembro de 2026 · 12h00). Tenho uma dúvida:" as const;

export function resolveNianWhatsAppDigits(override?: string): string {
  const raw =
    override?.trim() ||
    process.env.NEXT_PUBLIC_EDITION_NIAN_WHATSAPP?.trim() ||
    "";
  return raw.replace(/\D/g, "");
}

export function getNianWhatsAppUrl(
  phone?: string,
  message?: string
): string | null {
  const digits = resolveNianWhatsAppDigits(phone);
  if (!digits) return null;

  const text = encodeURIComponent(
    message ?? NIAN_WHATSAPP_DEFAULT_MESSAGE
  );
  return `https://wa.me/${digits}?text=${text}`;
}

export function getNianInvitePublicUrl(): string {
  const base =
    (typeof process !== "undefined" &&
      process.env.NEXT_PUBLIC_SITE_URL?.trim()) ||
    "https://edition.haxrsignature.com";
  return `${base.replace(/\/$/, "")}/nianwebnight`;
}

export function getNianVenueCalendarLocation(): string {
  const parts = [NIAN_VENUE.name, NIAN_VENUE.address].filter(Boolean);
  return parts.join(" — ");
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

function formatGoogleCalendarUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Componentes de data/hora locais Maputo para DTSTART;TZID=… */
function formatIcsLocalParts(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: NIAN_TIMEZONE,
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

/** Início do evento em instante absoluto (CAT → Date) */
export function getNianEventStartDate(): Date {
  const hh = String(NIAN_EVENT.timeHour).padStart(2, "0");
  const mm = String(NIAN_EVENT.timeMinute).padStart(2, "0");
  return new Date(`${NIAN_EVENT.dateIso}T${hh}:${mm}:00${NIAN_UTC_OFFSET}`);
}

/**
 * ICS com TZID=Africa/Maputo às 12h00.
 * Sem DTEND — horário de término não confirmado.
 */
export function buildNianIcsContent(): string {
  const start = getNianEventStartDate();
  const description = `${NIAN_EVENT.subtitle} Local: ${getNianVenueCalendarLocation()}. Início ${NIAN_EVENT.timeLabel}.`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//HAXR Signature//Nian Night of the Web//PT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VTIMEZONE",
    `TZID:${NIAN_TIMEZONE}`,
    "X-LIC-LOCATION:Africa/Maputo",
    "BEGIN:STANDARD",
    "TZOFFSETFROM:+0200",
    "TZOFFSETTO:+0200",
    "TZNAME:CAT",
    "DTSTART:19700101T000000",
    "END:STANDARD",
    "END:VTIMEZONE",
    "BEGIN:VEVENT",
    "UID:nian-night-of-the-web-20260919@haxrsignature.com",
    `DTSTAMP:${formatIcsStamp()}`,
    `DTSTART;TZID=${NIAN_TIMEZONE}:${formatIcsLocalParts(start)}`,
    `SUMMARY:${escapeIcsText(NIAN_EVENT.calendarTitle)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    `LOCATION:${escapeIcsText(getNianVenueCalendarLocation())}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadNianIcsFile(): void {
  if (typeof document === "undefined") return;

  const blob = new Blob([buildNianIcsContent()], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "Nian_Night_of_the_Web.ics";
  anchor.click();
  URL.revokeObjectURL(url);
}

/** Google Calendar — 12h00 Maputo; soft end only for template span (not UI). */
export function buildNianGoogleCalendarUrl(): string {
  const start = getNianEventStartDate();
  const end = new Date(
    start.getTime() + NIAN_EVENT.googleSoftDurationHours * 60 * 60 * 1000
  );

  return (
    "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    "&text=" +
    encodeURIComponent(NIAN_EVENT.calendarTitle) +
    "&dates=" +
    `${formatGoogleCalendarUtc(start)}/${formatGoogleCalendarUtc(end)}` +
    "&details=" +
    encodeURIComponent(
      `${NIAN_EVENT.subtitle} Local: ${getNianVenueCalendarLocation()}. Início ${NIAN_EVENT.timeLabel}.`
    ) +
    "&location=" +
    encodeURIComponent(getNianVenueCalendarLocation()) +
    "&ctz=" +
    encodeURIComponent(NIAN_TIMEZONE)
  );
}

export async function shareNianInvite(): Promise<"shared" | "copied" | "whatsapp" | "aborted"> {
  if (typeof window === "undefined") return "aborted";

  const url = getNianInvitePublicUrl();
  const title = NIAN_EVENT.title;
  const text = `${NIAN_EVENT.conceptualTitle} — ${NIAN_EVENT.dateDisplay} · ${NIAN_EVENT.timeLabel}. Junta-te à aventura.`;

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ title, text, url });
      return "shared";
    } catch {
      /* cancel or unsupported payload — fall through */
    }
  }

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      return "copied";
    }
  } catch {
    /* fall through */
  }

  window.open(
    `https://api.whatsapp.com/send?text=${encodeURIComponent(`${text}\n${url}`)}`,
    "_blank",
    "noopener,noreferrer"
  );
  return "whatsapp";
}
