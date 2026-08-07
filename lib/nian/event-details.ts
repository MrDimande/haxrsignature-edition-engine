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
  dateIso: "2026-09-12",
  dateDisplay: "12 · Setembro · 2026",
  dateDisplayShort: "12 · SETEMBRO · 2026",
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
  deadlineIso: null as string | null,
  deadlineLabel: null as string | null,
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
