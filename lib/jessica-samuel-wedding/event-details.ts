/**
 * Jessica Muege & Samuel Govene — Casamento (black-tie editorial)
 * Conteúdo canónico do convite Edition.
 */

export const WEDDING_SLUG = "jessicasamuelwedding" as const;

export const WEDDING_COUPLE = {
  display: "Jessica & Samuel",
  bride: "Jessica Muege",
  groom: "Samuel Govene",
  brideFirst: "Jessica",
  groomFirst: "Samuel",
} as const;

export const WEDDING_PARENTS = {
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

export const WEDDING_VENUE = {
  name: "Salão de Eventos Vila Verde",
  short: "Salão de Eventos Vila Verde, Matola",
  city: "Matola, Moçambique",
  full: "Salão de Eventos Vila Verde, Matola, Moçambique",
  mapsUrl:
    "https://maps.app.goo.gl/9dctfp51KZGgJzH2A?g_st=ac",
} as const;

export const WEDDING_RELIGIOUS_VENUE = {
  name: "Comunidade Santos Mártires de Uganda, Malhampsene",
  /** Linhas editoriais para a timeline (sem URL). */
  locationLines: [
    "Comunidade Santos Mártires de Uganda",
    "Malhampsene",
  ] as const,
  short: "Santos Mártires de Uganda, Malhampsene",
  mapsUrl: "https://maps.app.goo.gl/ehwWJdHy9kZjFsvr9?g_st=ac",
} as const;

/**
 * FONTE ÚNICA do horário da cerimónia religiosa.
 * Confirmado pela noiva: 10h30.
 * Alterar apenas aqui — itinerário, detalhes, countdown e calendário/.ics consomem este valor.
 */
export const WEDDING_RELIGIOUS_CEREMONY_TIME = "10h30" as const;

/** Horário da cerimónia religiosa confirmado (10h30). */
export const WEDDING_ITINERARY_SCHEDULE_CONFIRMED = true;

/**
 * Itinerário — 15 de Agosto de 2026.
 * Horário da religiosa: WEDDING_RELIGIOUS_CEREMONY_TIME.
 */
export const WEDDING_ITINERARY = [
  {
    id: "cerimonia-religiosa",
    timeLabel: WEDDING_RELIGIOUS_CEREMONY_TIME,
    title: "Cerimónia Religiosa",
    location: WEDDING_RELIGIOUS_VENUE.name,
    locationLines: WEDDING_RELIGIOUS_VENUE.locationLines,
    mapsUrl: WEDDING_RELIGIOUS_VENUE.mapsUrl,
    note: null as string | null,
  },
  {
    id: "cerimonia-civil",
    timeLabel: "13h30",
    title: "Cerimónia Civil",
    location: "Vila Verde",
    locationLines: ["Vila Verde"] as const,
    mapsUrl: WEDDING_VENUE.mapsUrl,
    note: "Percurso sugerido: via Matola-Rio.",
  },
  {
    id: "sessao-fotografias",
    timeLabel: "14h00",
    title: "Sessão de Fotografias",
    location: null as string | null,
    locationLines: null as readonly string[] | null,
    mapsUrl: null as string | null,
    note: null as string | null,
  },
  {
    id: "copo-de-agua",
    timeLabel: "15h00",
    title: "Copo de Água",
    location: null as string | null,
    locationLines: null as readonly string[] | null,
    mapsUrl: null as string | null,
    note: null as string | null,
  },
] as const;

export const WEDDING_EVENT = {
  ceremonyLabel: "Casamento",
  dressCode: "Traje de gala · a rigor",
  dateIso: "2026-08-15",
  /**
   * Espelha WEDDING_RELIGIOUS_CEREMONY_TIME (fonte única) — confirmado: 10h30.
   */
  timeLabel: WEDDING_RELIGIOUS_CEREMONY_TIME,
  locationName: WEDDING_VENUE.name,
  mapsUrl: WEDDING_VENUE.mapsUrl,
  giftStoreName: "Casa das Loiças",
  giftStoreAddress: "Av. Karl Marx, Nº 450 · Maputo",
  giftStorePhoneDisplay: "+258 82 311 5680",
  giftStorePhoneTel: "258823115680",
  giftStoreMapsUrl: "https://share.google/6KosbZqnYAnAZS1aX",
  calendarTitle: "Casamento — Jessica Muege & Samuel Govene",
  calendarDescription: `Casamento de Jessica Muege e Samuel Govene. Itinerário: ${WEDDING_RELIGIOUS_CEREMONY_TIME} Cerimónia Religiosa (Santos Mártires de Uganda, Malhampsene); 13h30 Cerimónia Civil (Vila Verde — percurso sugerido via Matola-Rio); 14h00 Sessão de Fotografias; 15h00 Copo de Água.`,
  bibleVerse:
    "Por essa razão, o homem deixará pai e mãe e unir-se-á à sua mulher, e eles se tornarão uma só carne.",
  bibleReference: "Gênesis 2:24",
} as const;

/** Pedido solidário opcional apresentado no Guia da Celebração. */
export const WEDDING_CHARITY_REQUEST = {
  eyebrow: "Um gesto que continua",
  optionalLabel: "Participação opcional",
  title: "Que a nossa alegria chegue mais longe.",
  lead:
    "Neste dia em que celebramos o amor, convidamo-vos — se o coração o pedir — a trazer um produto não perecível.",
  body:
    "As contribuições serão entregues a um orfanato, prolongando esta celebração através da partilha e do cuidado.",
  whisper: "Um gesto simples. Uma mesa mais cheia de esperança.",
  verse:
    "Em verdade vos digo que, quando o fizestes a um destes meus pequeninos irmãos, a mim o fizestes.",
  verseReference: "Mateus 25:40",
} as const;

export const WEDDING_ASSETS = {
  heroImage: "/images/jessica-samuel-wedding/hero.png",
  coupleImage: "/images/jessica-samuel-wedding/couple.png",
  /** Countdown editorial — reutiliza asset existente (sem duplicar ficheiro). */
  countdownImage: "/images/jessica-samuel-wedding/couple.png",
  /**
   * Capa / intro — retrato editorial black-tie.
   * Diferente do hero pós-entrada para criar progressão visual.
   */
  coverImage: "/images/jessica-samuel-wedding/gallery-01.png",
} as const;

/** Referências editoriais — dress code (Save the Date). */
export const WEDDING_DRESS_REFERENCES = {
  her: [
    {
      id: "her-navy",
      src: "/images/jessica-samuel-wedding/dress-code/her-navy.png",
      alt: "Referência — vestido longo azul-noite com brilho",
      label: "Azul-noite",
    },
    {
      id: "her-red",
      src: "/images/jessica-samuel-wedding/dress-code/her-red.png",
      alt: "Referência — vestido longo vermelho de gala",
      label: "Vermelho",
    },
    {
      id: "her-rose",
      src: "/images/jessica-samuel-wedding/dress-code/her-rose.png",
      alt: "Referência — vestido longo rose gold com brilho",
      label: "Rose gold",
    },
  ],
  him: [
    {
      id: "him-suit",
      src: "/images/jessica-samuel-wedding/dress-code/him-suit.png",
      alt: "Referência — fato preto clássico com gravata",
      label: "Fato preto",
    },
    {
      id: "him-tuxedo",
      src: "/images/jessica-samuel-wedding/dress-code/him-tuxedo.png",
      alt: "Referência — smoking preto com laço",
      label: "Smoking",
    },
  ],
} as const;

export const WEDDING_COPY = {
  heroLabel: "Casamento",
  heroInvitation:
    "Com alegria e gratidão, convidamo-vos a testemunhar a nossa união.",
  heroEyebrow: "O Casamento de",
  heroSubtitle:
    "Uma celebração editorial de amor, fé e compromisso — black-tie, sob a nossa assinatura.",
  introWhisper: "Dois corações. Uma promessa.",
  intro:
    "Com profunda gratidão, convidamo-vos a partilhar connosco este momento solene — a celebração do nosso casamento, em noite de elegância e bênção.",
  introScriptTitle: "Uma só carne...",
  introQuoteTitle: "Uma Promessa de Amor",
  introQuoteAttribution: "Casamento · Black-tie",
  journeyEyebrow: "A Jornada",
  journeyScriptTitle: "A nossa viagem...",
  itineraryEyebrow: "Itinerário",
  itineraryTitle: "O nosso dia",
  itineraryLead:
    "Preparamos cada momento para celebrarmos juntos. Consulte os horários e acompanhe o percurso deste dia especial.",
  itineraryMapsCta: "Ver localização",
  coupleSectionTitle: "Os Noivos",
  familiesEyebrow: "União das Famílias",
  sonOfLabel: "Filho de",
  daughterOfLabel: "Filha de",
  invitationLead: "Com Amor,",
  invitationBody:
    "Temos a honra de convidá-lo(a) a celebrar connosco o nosso casamento. A vossa presença será o maior presente neste dia.",
  dressCodeLead:
    "Solicitamos a presença de todos em trajes de gala, vestidos a rigor, em harmonia com a elegância desta celebração.",
  dressCodeBody:
    "Para ela: vestido longo, com brilho ou sofisticação — qualquer cor, excepto branco. Para ele: fato preto ou smoking, camisa branca e gravata ou laço pretos.",
  dressCodeHerTitle: "Para ela",
  dressCodeHerLine:
    "Vestido longo. Brilho, presença e elegância — qualquer cor, excepto branco.",
  dressCodeHimTitle: "Para ele",
  dressCodeHimLine:
    "Fato preto ou smoking. Camisa branca, gravata ou laço pretos.",
  giftsLead:
    "Com delicadeza e respeito, preparamos uma lista de presentes para quem desejar honrar este momento connosco.",
  giftsRegistryNameNote:
    "Lista em nome de Jessica Muege e Samuel Govene.",
  giftsConsultNote:
    "Disponível para consulta presencial — a equipa da loja orienta com atenção.",
  countdownEyebrow: "Novo Capítulo · 15.08.2026",
  countdownTitle: "O nosso próximo capítulo começa em",
  countdownTitleToday: "O nosso capítulo começa hoje.",
  countdownTitleAfter: "E foi aqui que um novo capítulo começou.",
  countdownQuote: "Há histórias que não se contam. Vivem-se.",
  countdownLead:
    "Cada instante aproxima-nos do dia que escolhemos para celebrar o amor.",
  countdownLeadWithGuest:
    "Cada instante aproxima-nos do dia que escolhemos para celebrar consigo",
  countdownComplete: "E foi aqui que um novo capítulo começou.",
  countdownImageAlt:
    "Jessica Muege e Samuel Govene — o próximo capítulo",
  coverImageAlt:
    "Jessica Muege e Samuel Govene — capa editorial black-tie",
  rsvpEmotionalLine:
    "A vossa presença será recebida com imensa alegria pelos noivos e pelas famílias.",
  rsvpTitle: "Confirmar Presença",
  rsvpSubtitle:
    "Por favor, confirmem a vossa presença até à data indicada.",
  closing:
    "Que esta celebração seja testemunho de amor, fé e bênção sobre o nosso caminho.",
  footerStudioLabel: "Assinatura",
  footerStudioBody:
    "Este convite digital foi criado pela HAXR Signature — uma experiência editorial black-tie pensada para Jessica & Samuel, com elegância, presença e memória.",
  footerDirectoryLabel: "Contactos",
  footerInviteLabel: "Este Convite",
  footerSeasonLine: "Agosto 2026 · Matola",
} as const;

/** Mensagem pós-evento — agradecimento + acesso ao álbum. */
export const WEDDING_POST_EVENT = {
  eyebrow: "Com gratidão",
  title: "Obrigado por celebrarem connosco.",
  body:
    "A vossa presença tornou o nosso dia ainda mais especial. Guardamos cada gesto, cada sorriso e cada abraço com o coração cheio.",
  signOff: "Com amor,",
  signNames: "Jessica & Samuel",
  albumCta: "Ver o nosso álbum",
  shareCta: "Partilhar ainda uma foto",
  albumAnchorId: "memorias",
} as const;

export function formatWeddingEventDate(isoDate: string): string {
  const date = new Date(isoDate + "T12:00:00");
  return date.toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatWeddingHeroDateDots(isoDate: string): string {
  const date = new Date(isoDate + "T12:00:00");
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}\u00a0•\u00a0${month}\u00a0•\u00a0${year}`;
}

function parseWeddingEventDateTime(
  dateIso: string,
  timeLabel: string,
): { start: Date; end: Date } {
  const match = timeLabel.match(/(\d{1,2})h(\d{2})?/i);
  const hours = match ? Number(match[1]) : 18;
  const minutes = match && match[2] ? Number(match[2]) : 0;
  const padded = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
  const start = new Date(`${dateIso}T${padded}+02:00`);
  const end = new Date(start.getTime() + 5 * 60 * 60 * 1000);
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

export function buildWeddingGoogleCalendarUrl(
  dateIso: string = WEDDING_EVENT.dateIso,
  timeLabel: string = WEDDING_EVENT.timeLabel,
): string | null {
  if (!WEDDING_ITINERARY_SCHEDULE_CONFIRMED) return null;
  if (!timeLabel.match(/\d{1,2}h/i)) return null;

  const { start, end } = parseWeddingEventDateTime(dateIso, timeLabel);

  return (
    "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    "&text=" +
    encodeURIComponent(WEDDING_EVENT.calendarTitle) +
    "&dates=" +
    `${formatGoogleCalendarUtc(start)}/${formatGoogleCalendarUtc(end)}` +
    "&details=" +
    encodeURIComponent(WEDDING_EVENT.calendarDescription) +
    "&location=" +
    encodeURIComponent(WEDDING_VENUE.full)
  );
}

export function buildWeddingIcsContent(
  dateIso: string = WEDDING_EVENT.dateIso,
  timeLabel: string = WEDDING_EVENT.timeLabel,
): string | null {
  if (!WEDDING_ITINERARY_SCHEDULE_CONFIRMED) return null;
  if (!timeLabel.match(/\d{1,2}h/i)) return null;

  const { start, end } = parseWeddingEventDateTime(dateIso, timeLabel);
  const stamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//HAXR Signature//Jessica Samuel Wedding//PT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    "UID:jessica-samuel-wedding-20260815@haxrsignature.com",
    `DTSTAMP:${stamp}`,
    `DTSTART:${formatIcsLocal(start)}`,
    `DTEND:${formatIcsLocal(end)}`,
    `SUMMARY:${WEDDING_EVENT.calendarTitle}`,
    `DESCRIPTION:${WEDDING_EVENT.calendarDescription}`,
    `LOCATION:${WEDDING_VENUE.full}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadWeddingIcsFile(): void {
  const content = buildWeddingIcsContent();
  if (!content) return;

  const blob = new Blob([content], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "casamento-jessica-samuel.ics";
  anchor.click();
  URL.revokeObjectURL(url);
}
