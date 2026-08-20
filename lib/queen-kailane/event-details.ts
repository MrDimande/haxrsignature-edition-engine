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
  ceremonyTime: "08h00" as string | null,
  ceremonyVenue: "Igreja Anglicana — Paróquia de São Estêvão e Lourenço",
  ceremonyVenueShort: "Igreja Anglicana",
  ceremonyParish: "Paróquia de São Estêvão e Lourenço",
  mapPlusCode: "3FG8+97Q Paróquia Santo Estêvão da, Matola",
  mapUrl: "https://www.google.com/maps/search/?api=1&query=3FG8%2B97Q+Matola",
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
  deadlineIso: "2026-08-28",
  deadlineLabel: "28 de Agosto de 2026",
} as const;

export type QueenKailaneRsvpLocalRecord = {
  attending: boolean;
  name: string;
  submittedAt: string;
  blessingId?: number;
};

export type QueenKailaneBlessing = {
  id: number;
  theme: string;
  verse: string;
  reference: string;
};

export const QUEEN_KAILANE_BLESSINGS: readonly QueenKailaneBlessing[] = [
  {
    id: 1,
    theme: "Bênção Sacerdotal",
    verse:
      "O Senhor te abençoe e te guarde; o Senhor faça resplandecer o Seu rosto sobre ti e tenha misericórdia de ti; o Senhor sobre ti levante o Seu rosto e te dê a paz.",
    reference: "Números 6:24-26",
  },
  {
    id: 2,
    theme: "Luz e Salvação",
    verse:
      "O Senhor é a minha luz e a minha salvação; a quem temerei? O Senhor é a força da minha vida; de quem me recearei?",
    reference: "Salmos 27:1",
  },
  {
    id: 3,
    theme: "Caminho Iluminado",
    verse:
      "Lâmpada para os meus pés é a tua palavra, e luz para o meu caminho.",
    reference: "Salmos 119:105",
  },
  {
    id: 4,
    theme: "Luz do Mundo",
    verse:
      "Vós sois a luz do mundo; não se pode esconder uma cidade edificada sobre um monte. Assim resplandeça a vossa luz.",
    reference: "Mateus 5:14-16",
  },
  {
    id: 5,
    theme: "Fruto do Espírito",
    verse:
      "Mas o fruto do Espírito é: amor, alegria, paz, longanimidade, benignidade, bondade, fidelidade, mansidão e domínio próprio.",
    reference: "Gálatas 5:22-23",
  },
  {
    id: 6,
    theme: "Força e Escudo",
    verse:
      "O Senhor é a minha força e o meu escudo; nele confiou o meu coração, e fui socorrido; pelo que o meu coração salta de prazer.",
    reference: "Salmos 28:7",
  },
  {
    id: 7,
    theme: "Filhos da Luz",
    verse:
      "Porque noutro tempo éreis trevas, mas agora sois luz no Senhor; andai como filhos da luz, pois o fruto da luz está em toda a bondade, justiça e verdade.",
    reference: "Efésios 5:8-9",
  },
] as const;

export function getQueenKailaneBlessingForGuest(
  name: string
): QueenKailaneBlessing {
  const normalized = name.trim().toLowerCase();
  if (!normalized) return QUEEN_KAILANE_BLESSINGS[0];
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash * 31 + normalized.charCodeAt(i)) % QUEEN_KAILANE_BLESSINGS.length;
  }
  return (
    QUEEN_KAILANE_BLESSINGS[Math.abs(hash)] ?? QUEEN_KAILANE_BLESSINGS[0]
  );
}

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
      ...(typeof data.blessingId === "number"
        ? { blessingId: data.blessingId }
        : {}),
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
 * ICS com horário oficial (08h00 Maputo) e almoço às 13h00.
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

  const hasTime = Boolean(QUEEN_KAILANE_EVENT.ceremonyTime?.trim());
  const dtStart = hasTime
    ? `DTSTART;TZID=${QUEEN_KAILANE_TIMEZONE}:20260830T080000`
    : `DTSTART;VALUE=DATE:${day}`;
  const dtEnd = hasTime
    ? `DTEND;TZID=${QUEEN_KAILANE_TIMEZONE}:20260830T170000`
    : `DTEND;VALUE=DATE:${next}`;

  const description = [
    QUEEN_KAILANE_EVENT.conceptualTitle,
    QUEEN_KAILANE_SIGNATURE.line1,
    QUEEN_KAILANE_SIGNATURE.line2,
    `Celebração ${QUEEN_KAILANE_EVENT.ceremonyTime ? `às ${QUEEN_KAILANE_EVENT.ceremonyTime}` : ""}: ${QUEEN_KAILANE_EVENT.ceremonyVenue}.`,
    `Almoço às ${QUEEN_KAILANE_EVENT.lunchTime}: ${QUEEN_KAILANE_EVENT.lunchLocation} — ${QUEEN_KAILANE_EVENT.lunchVenue}.`,
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
    dtStart,
    dtEnd,
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

/** Google Calendar (08h00 Maputo = 06h00 UTC até 17h00 Maputo = 15h00 UTC). */
export function buildQueenKailaneGoogleCalendarUrl(): string {
  const hasTime = Boolean(QUEEN_KAILANE_EVENT.ceremonyTime?.trim());
  const dates = hasTime
    ? "20260830T060000Z/20260830T150000Z"
    : "20260830/20260831";

  return (
    "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    "&text=" +
    encodeURIComponent(QUEEN_KAILANE_EVENT.calendarTitle) +
    "&dates=" +
    dates +
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

export type QueenKailaneGuestbookEntry = {
  id: string;
  name: string;
  relation?: string;
  message: string;
  dateDisplay: string;
  isInitial?: boolean;
};

export const INITIAL_QUEEN_KAILANE_BLESSINGS_MESSAGES: readonly QueenKailaneGuestbookEntry[] = [
  {
    id: "blessing-parents",
    name: "Os teus Pais",
    relation: "Pais",
    message:
      "Que a luz do Espírito Santo seja sempre a tua bússola, nossa filha. Caminha sempre na retidão, no amor e na fé. Estamos infinitamente orgulhosos de ti.",
    dateDisplay: "Agosto de 2026",
    isInitial: true,
  },
  {
    id: "blessing-godparents",
    name: "Os teus Padrinhos",
    relation: "Padrinhos de Crisma",
    message:
      "Que o óleo sagrado do Crisma confirme no teu coração a coragem de ser luz onde quer que vás. Estaremos sempre ao teu lado nesta caminhada de fé.",
    dateDisplay: "Agosto de 2026",
    isInitial: true,
  },
  {
    id: "blessing-family",
    name: "Família Cande",
    relation: "Família",
    message:
      "«O Senhor te guarde de todo o mal; Ele guardará a tua alma.» Que esta nova etapa espiritual seja repleta de graça e sabedoria divina.",
    dateDisplay: "Agosto de 2026",
    isInitial: true,
  },
] as const;

