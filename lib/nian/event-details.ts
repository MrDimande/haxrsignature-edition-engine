/**
 * Nian — NIGHT OF THE WEB
 * Fonte única de verdade do evento Edition.
 *
 * Hora ainda não fornecida — manter `timeLabel` null e NÃO inventar /
 * NÃO mostrar “hora a confirmar” na UI pública.
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
  /** Pendente — não inventar; UI omite enquanto null */
  timeLabel: null as string | null,
  timeHour: null as number | null,
  timeMinute: null as number | null,
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
  title: "UNIFORME DA NOITE",
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
  "Olá! Acabei de confirmar presença no Aniversário do Nian — NIGHT OF THE WEB (19 de Setembro de 2026). Tenho uma dúvida:" as const;

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

/**
 * ICS dia inteiro enquanto a hora do evento não estiver confirmada.
 * Não inventa horário — VALUE=DATE em Africa/Maputo.
 */
export function buildNianIcsContent(): string {
  const day = NIAN_EVENT.dateIso.replace(/-/g, "");
  const [y, m, d] = NIAN_EVENT.dateIso.split("-").map(Number);
  const end = new Date(Date.UTC(y, m - 1, d + 1));
  const next = [
    end.getUTCFullYear(),
    String(end.getUTCMonth() + 1).padStart(2, "0"),
    String(end.getUTCDate()).padStart(2, "0"),
  ].join("");
  const description = `${NIAN_EVENT.subtitle} Local: ${getNianVenueCalendarLocation()}.`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//HAXR Signature//Nian Night of the Web//PT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    "UID:nian-night-of-the-web-20260919@haxrsignature.com",
    `DTSTAMP:${formatIcsStamp()}`,
    `DTSTART;VALUE=DATE:${day}`,
    `DTEND;VALUE=DATE:${next}`,
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

/** Google Calendar all-day (19 Set → 20 Set exclusivo). */
export function buildNianGoogleCalendarUrl(): string {
  return (
    "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    "&text=" +
    encodeURIComponent(NIAN_EVENT.calendarTitle) +
    "&dates=20260919/20260920" +
    "&details=" +
    encodeURIComponent(
      `${NIAN_EVENT.subtitle} Local: ${getNianVenueCalendarLocation()}.`
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
  const text = `${NIAN_EVENT.conceptualTitle} — ${NIAN_EVENT.dateDisplay}. Junta-te à aventura.`;

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
