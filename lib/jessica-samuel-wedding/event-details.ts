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
 * Divergência por confirmar: 08h00 vs 10h30.
 * Alterar apenas aqui — itinerário, detalhes e calendário/.ics consomem este valor.
 * Não considerar o itinerário pronto para publicação até
 * WEDDING_ITINERARY_SCHEDULE_CONFIRMED === true.
 */
export const WEDDING_RELIGIOUS_CEREMONY_TIME = "10h30" as const;

/** false enquanto 08h00 vs 10h30 não estiver decidido. */
export const WEDDING_ITINERARY_SCHEDULE_CONFIRMED = false;

/**
 * Itinerário — 15 de Agosto de 2026.
 * Horário da religiosa: WEDDING_RELIGIOUS_CEREMONY_TIME (provisório).
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
  dressCode: "Black-tie · formal",
  dateIso: "2026-08-15",
  /**
   * Espelha WEDDING_RELIGIOUS_CEREMONY_TIME (fonte única).
   * Provisório para Google Calendar / .ics até confirmação final.
   */
  timeLabel: WEDDING_RELIGIOUS_CEREMONY_TIME,
  locationName: WEDDING_VENUE.name,
  mapsUrl: WEDDING_VENUE.mapsUrl,
  giftStoreName: "Casa das Loiças da Karl Marx",
  giftStoreMapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Casa+das+Loi%C3%A7as+da+Karl+Marx+Maputo+Mo%C3%A7ambique",
  calendarTitle: "Casamento — Jessica Muege & Samuel Govene",
  calendarDescription: `Casamento de Jessica Muege e Samuel Govene. Itinerário: ${WEDDING_RELIGIOUS_CEREMONY_TIME} Cerimónia Religiosa (Santos Mártires de Uganda, Malhampsene); 13h30 Cerimónia Civil (Vila Verde — percurso sugerido via Matola-Rio); 14h00 Sessão de Fotografias; 15h00 Copo de Água.`,
  bibleVerse:
    "Por essa razão, o homem deixará pai e mãe e unir-se-á à sua mulher, e eles se tornarão uma só carne.",
  bibleReference: "Gênesis 2:24",
} as const;

export const WEDDING_ASSETS = {
  heroImage: "/images/jessica-samuel-wedding/hero.png",
  coupleImage: "/images/jessica-samuel-wedding/couple.png",
  /** Countdown editorial — reutiliza asset existente (sem duplicar ficheiro). */
  countdownImage: "/images/jessica-samuel-wedding/couple.png",
  /**
   * Capa / intro — retrato de revista (galeria I).
   * Diferente do hero pós-entrada para criar progressão editorial.
   */
  coverImage: "/images/jessica-samuel-wedding/gallery-01.png",
} as const;

/** Galeria editorial — black-tie (sem placeholders). */
export const WEDDING_GALLERY = [
  {
    id: "gallery-01",
    src: "/images/jessica-samuel-wedding/gallery-01.png",
    alt: "Jessica Muege e Samuel Govene — retrato editorial em preto",
    layout: "feature" as const,
    chapter: "I",
    caption: "O encontro",
    line: "Dois olhares. Uma promessa.",
  },
  {
    id: "gallery-02",
    src: "/images/jessica-samuel-wedding/gallery-02.png",
    alt: "Jessica e Samuel — contraste e intimidade",
    layout: "pair" as const,
    chapter: "II",
    caption: "Luz & sombra",
    line: "O contraste que nos define.",
  },
  {
    id: "gallery-03",
    src: "/images/jessica-samuel-wedding/gallery-03.png",
    alt: "Jessica e Samuel — elegância em arco",
    layout: "pair" as const,
    chapter: "III",
    caption: "Presença",
    line: "Elegância que se sente.",
  },
  {
    id: "gallery-04",
    src: "/images/jessica-samuel-wedding/gallery-04.png",
    alt: "Jessica e Samuel — alta costura black-tie",
    layout: "closing" as const,
    chapter: "IV",
    caption: "Alta costura",
    line: "Black-tie. O nosso capítulo.",
  },
] as const;

/** @deprecated usar WEDDING_GALLERY */
export const WEDDING_GALLERY_IMAGES = WEDDING_GALLERY.map((item) => item.src);

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
  galleryEyebrow: "Alta Costura",
  galleryTitle: "Em preto & luz",
  galleryLead:
    "Uma sequência editorial — intimidade, contraste e a assinatura do nosso amor.",
  coupleSectionTitle: "Os Noivos",
  familiesEyebrow: "União das Famílias",
  sonOfLabel: "Filho de",
  daughterOfLabel: "Filha de",
  invitationLead: "Com Amor,",
  invitationBody:
    "Temos a honra de convidá-lo(a) a celebrar connosco o nosso casamento. A vossa presença será o maior presente neste dia.",
  dressCodeLead:
    "Solicitamos traje black-tie formal, em harmonia com a elegância desta celebração.",
  dressCodeBody:
    "Traje de gala para senhoras e smoking ou fraque para cavalheiros. Preferimos sobriedade, refinamento e discrição.",
  giftsLead:
    "Com delicadeza e respeito, preparamos uma lista de presentes para quem desejar honrar este momento connosco.",
  giftsRegistryNameNote:
    "A lista vem em nome de Jessica Muege e Samuel Govene.",
  giftsConsultNote:
    "A lista encontra-se disponível para consulta presencial. A equipa da loja receberá cada convidado com atenção e orientará com todo o cuidado.",
  giftsStoreNote:
    "Visite a loja com calma, escolha com o coração e deixe que a nossa lista o guie com proximidade e elegância.",
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
  options?: { scheduleConfirmed?: boolean },
): string | null {
  const scheduleConfirmed =
    options?.scheduleConfirmed ?? WEDDING_ITINERARY_SCHEDULE_CONFIRMED;
  // Não embutir horário provisório como facto em calendários externos.
  if (!scheduleConfirmed) return null;
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
  options?: { scheduleConfirmed?: boolean },
): string | null {
  const scheduleConfirmed =
    options?.scheduleConfirmed ?? WEDDING_ITINERARY_SCHEDULE_CONFIRMED;
  // Não gerar .ics enquanto o horário religioso não estiver confirmado.
  if (!scheduleConfirmed) return null;
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
