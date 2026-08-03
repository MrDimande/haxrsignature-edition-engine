/**
 * Stan — 5º Aniversário · Real Madrid Experience
 * Fonte única de verdade do evento Edition.
 *
 * Campos ainda não confirmados pela família ficam `null` / `pending`
 * e NÃO devem ser inventados na interface pública.
 */

export const STAN_SLUG = "stan" as const;
export const STAN_TIMEZONE = "Africa/Maputo" as const;
/** CAT — Maputo não observa horário de verão */
export const STAN_UTC_OFFSET = "+02:00" as const;

export const STAN_EVENT = {
  slug: STAN_SLUG,
  title: "5º Aniversário do Stan — Real Madrid Experience",
  subtitle: "O Quinto Acto de um Pequeno Campeão",
  calendarTitle: "5º Aniversário do Stan — O Quinto Acto de um Pequeno Campeão",
  calendarDescription:
    "Venha celebrar o 5º Aniversário do Stan na Residência do S5 (Belo Horizonte, Maputo)! Kit Matchday: navy, azul, cream e areia. Uma tarde de alegria e memórias preciosas.",
  dateIso: "2026-09-12",
  /** Hora local Maputo (Africa/Maputo) */
  timeLabel: "11h00",
  timeHour: 11,
  timeMinute: 0,
  /**
   * Término opcional — null enquanto a família não confirmar.
   * Google Calendar usa janela provisória; ICS omite DTEND.
   */
  endTimeLabel: null as string | null,
  endTimeHour: null as number | null,
  endTimeMinute: null as number | null,
  /** Soft window só para Google Calendar TEMPLATE (exige fim) */
  googleSoftDurationHours: 4,
  eventType: "Aniversário Infantil",
  city: "Maputo",
  neighborhood: "Belo Horizonte",
  country: "Moçambique",
} as const;

export type StanFieldStatus = "pending" | "confirmed";

/** Coordenadas OSM — Residência do S5 · Belo Horizonte */
export const STAN_VENUE_COORDS = {
  lat: -26.0199559,
  lng: 32.3992847,
} as const;

function buildStanMapLinks(lat: number, lng: number, label: string) {
  const q = `${lat},${lng}`;
  const named = encodeURIComponent(label);
  return {
    google: `https://www.google.com/maps/dir/?api=1&destination=${q}`,
    googleSearch: `https://www.google.com/maps/search/?api=1&query=${q}`,
    waze: `https://waze.com/ul?ll=${q}&navigate=yes`,
    osm: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=18/${lat}/${lng}`,
    apple: `https://maps.apple.com/?ll=${q}&q=${named}`,
  } as const;
}

/** Local — Residência do S5 · Belo Horizonte (Maputo) */
export const STAN_VENUE: {
  status: StanFieldStatus;
  name: string | null;
  shortName: string | null;
  address: string | null;
  directions: string | null;
  mapCoordinates: string | null;
  lat: number | null;
  lng: number | null;
  mapsUrl: string | null;
  mapLinks: ReturnType<typeof buildStanMapLinks> | null;
  pendingLabel: string;
} = {
  status: "confirmed",
  name: "Residência do S5",
  shortName: "Belo Horizonte",
  address: "Belo Horizonte · Maputo, Moçambique",
  directions: "Residência do S5 — bairro Belo Horizonte, Maputo.",
  mapCoordinates: `${STAN_VENUE_COORDS.lat},${STAN_VENUE_COORDS.lng}`,
  lat: STAN_VENUE_COORDS.lat,
  lng: STAN_VENUE_COORDS.lng,
  mapsUrl: buildStanMapLinks(
    STAN_VENUE_COORDS.lat,
    STAN_VENUE_COORDS.lng,
    "Residência do S5 · Belo Horizonte"
  ).google,
  mapLinks: buildStanMapLinks(
    STAN_VENUE_COORDS.lat,
    STAN_VENUE_COORDS.lng,
    "Residência do S5 · Belo Horizonte"
  ),
  pendingLabel: "Localização a confirmar · Maputo",
};

/** Kit / dress code — cores do plantel (navy · azul · cream · areia) */
export const STAN_DRESS_CODE: {
  status: StanFieldStatus;
  /** Linha curta (fixture strip, metadados) */
  label: string | null;
  /** Título editorial Matchday */
  title: string | null;
  /** Frase principal */
  lead: string | null;
  /** Nota de apoio */
  note: string | null;
  /** Swatches oficiais do kit */
  palette: readonly { id: string; name: string; hex: string }[];
} = {
  status: "confirmed",
  label: "Cores do plantel",
  title: "Kit Matchday",
  lead: "Vista as cores do plantel — navy, azul, cream e areia.",
  note: "Chegue confortável e elegante, pronto para a estreia do Quinto Acto.",
  palette: [
    { id: "navy", name: "Navy", hex: "#0B1C2C" },
    { id: "azul", name: "Azul", hex: "#5E7A8C" },
    { id: "cream", name: "Cream", hex: "#EDE6D9" },
    { id: "areia", name: "Areia", hex: "#C4A882" },
  ],
};

/**
 * RSVP — prazo e acompanhantes.
 * deadlineIso null = não mostrar prazo inventado ao convidado.
 */
export const STAN_RSVP = {
  title: "Estreia do Big 5",
  subtitle:
    "Você está na lista de convocados do S5. Confirme a sua presença na estreia do pequeno campeão.",
  closing:
    "Você está na lista de convocados do S5. Confirme a sua presença na estreia do pequeno campeão.",
  deadlineIso: null as string | null,
  deadlineLabel: null as string | null,
  /** Máximo de acompanhantes além do convidado principal */
  maxCompanions: 4,
  /** Exige nomes dos acompanhantes quando companions > 0 */
  requireCompanionNames: false,
} as const;

/**
 * WhatsApp anfitrião — só dígitos via NEXT_PUBLIC_EDITION_STAN_WHATSAPP.
 * Sem fallback: botão oculto até a família confirmar o número.
 */
export const STAN_WHATSAPP_DEFAULT_MESSAGE =
  "Olá! Acabei de confirmar presença no Aniversário do Stan (12 de Setembro de 2026). Tenho uma dúvida:" as const;

export function resolveStanWhatsAppDigits(override?: string): string {
  const raw =
    override?.trim() ||
    process.env.NEXT_PUBLIC_EDITION_STAN_WHATSAPP?.trim() ||
    "";
  return raw.replace(/\D/g, "");
}

export function getStanWhatsAppUrl(
  phone?: string,
  message?: string
): string | null {
  const digits = resolveStanWhatsAppDigits(phone);
  if (!digits) return null;

  const text = encodeURIComponent(
    message ?? STAN_WHATSAPP_DEFAULT_MESSAGE
  );
  return `https://wa.me/${digits}?text=${text}`;
}

export function formatStanEventDate(isoDate: string = STAN_EVENT.dateIso): string {
  const date = new Date(`${isoDate}T12:00:00${STAN_UTC_OFFSET}`);
  return date.toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: STAN_TIMEZONE,
  });
}

export function formatStanDisplayDate(): string {
  return "12 de Setembro de 2026";
}

export function getStanVenueDisplayName(): string {
  return STAN_VENUE.name?.trim() || STAN_VENUE.pendingLabel;
}

/** Nome curto para UI compacta (Hero strip, etc.) */
export function getStanVenueShortName(): string {
  return (
    STAN_VENUE.shortName?.trim() ||
    STAN_VENUE.name?.trim() ||
    STAN_EVENT.city
  );
}

export function getStanVenueCalendarLocation(): string {
  if (!isStanVenueConfirmed()) return STAN_VENUE.pendingLabel;
  const parts = [STAN_VENUE.name, STAN_VENUE.address].filter(Boolean);
  return parts.join(" — ");
}

export function isStanVenueConfirmed(): boolean {
  return STAN_VENUE.status === "confirmed" && Boolean(STAN_VENUE.name?.trim());
}

export function isStanDressCodeConfirmed(): boolean {
  return (
    STAN_DRESS_CODE.status === "confirmed" &&
    Boolean(STAN_DRESS_CODE.label?.trim())
  );
}

export function getStanDressCodeLabel(): string {
  return STAN_DRESS_CODE.label?.trim() || "Kit a confirmar";
}

export function isStanAudioReady(src: string | null | undefined): boolean {
  return typeof src === "string" && src.trim().length > 0;
}

/** Início do evento em instante absoluto (CAT → Date) */
export function getStanEventStartDate(): Date {
  const hh = String(STAN_EVENT.timeHour).padStart(2, "0");
  const mm = String(STAN_EVENT.timeMinute).padStart(2, "0");
  return new Date(`${STAN_EVENT.dateIso}T${hh}:${mm}:00${STAN_UTC_OFFSET}`);
}

/** Fim confirmado, ou null se ainda pendente */
export function getStanEventEndDate(): Date | null {
  if (
    STAN_EVENT.endTimeHour == null ||
    STAN_EVENT.endTimeMinute == null ||
    !STAN_EVENT.endTimeLabel
  ) {
    return null;
  }
  const hh = String(STAN_EVENT.endTimeHour).padStart(2, "0");
  const mm = String(STAN_EVENT.endTimeMinute).padStart(2, "0");
  return new Date(`${STAN_EVENT.dateIso}T${hh}:${mm}:00${STAN_UTC_OFFSET}`);
}

function formatGoogleCalendarUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function formatIcsStamp(date: Date = new Date()): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Componentes de data/hora locais Maputo para DTSTART;TZID=… */
function formatIcsLocalParts(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: STAN_TIMEZONE,
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

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/** Google Calendar: 11h00 Maputo = 09h00 UTC (nunca 11h00Z) */
export function buildStanGoogleCalendarUrl(): string {
  const start = getStanEventStartDate();
  const confirmedEnd = getStanEventEndDate();
  const end =
    confirmedEnd ??
    new Date(
      start.getTime() + STAN_EVENT.googleSoftDurationHours * 60 * 60 * 1000
    );

  const details = confirmedEnd
    ? STAN_EVENT.calendarDescription
    : `${STAN_EVENT.calendarDescription} Horário de término a confirmar.`;

  const location = getStanVenueCalendarLocation();

  return (
    "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    "&text=" +
    encodeURIComponent(STAN_EVENT.calendarTitle) +
    "&dates=" +
    `${formatGoogleCalendarUtc(start)}/${formatGoogleCalendarUtc(end)}` +
    "&details=" +
    encodeURIComponent(details) +
    "&location=" +
    encodeURIComponent(location) +
    "&ctz=" +
    encodeURIComponent(STAN_TIMEZONE)
  );
}

/**
 * ICS com TZID=Africa/Maputo (VTIMEZONE CAT fixo +0200).
 * Sem DTEND enquanto o término não estiver confirmado.
 */
export function buildStanIcsContent(): string {
  const start = getStanEventStartDate();
  const end = getStanEventEndDate();
  const location = getStanVenueCalendarLocation();
  const description = end
    ? STAN_EVENT.calendarDescription
    : `${STAN_EVENT.calendarDescription} Horário de término a confirmar.`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//HAXR Signature//Stan 5th Birthday//PT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VTIMEZONE",
    `TZID:${STAN_TIMEZONE}`,
    "X-LIC-LOCATION:Africa/Maputo",
    "BEGIN:STANDARD",
    "TZOFFSETFROM:+0200",
    "TZOFFSETTO:+0200",
    "TZNAME:CAT",
    "DTSTART:19700101T000000",
    "END:STANDARD",
    "END:VTIMEZONE",
    "BEGIN:VEVENT",
    "UID:stan-5th-birthday-20260912@haxrsignature.com",
    `DTSTAMP:${formatIcsStamp()}`,
    `DTSTART;TZID=${STAN_TIMEZONE}:${formatIcsLocalParts(start)}`,
  ];

  if (end) {
    lines.push(`DTEND;TZID=${STAN_TIMEZONE}:${formatIcsLocalParts(end)}`);
  }

  lines.push(
    `SUMMARY:${escapeIcsText(STAN_EVENT.calendarTitle)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    `LOCATION:${escapeIcsText(location)}`,
    "END:VEVENT",
    "END:VCALENDAR"
  );

  return lines.join("\r\n");
}

export function downloadStanIcsFile(): void {
  if (typeof document === "undefined") return;

  const blob = new Blob([buildStanIcsContent()], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "Stan_5_Anos.ics";
  anchor.click();
  URL.revokeObjectURL(url);
}

export function buildCompanionNote(
  companions: number,
  names: string[]
): string | undefined {
  if (companions <= 0) return undefined;

  const filledNames = names
    .slice(0, companions)
    .map((n) => n.trim())
    .filter((n) => n.length > 0);

  if (filledNames.length === 0) {
    return `${companions} acompanhante(s) · nomes não indicados`;
  }

  return `${companions} acompanhante(s): ${filledNames.join(", ")}`;
}
