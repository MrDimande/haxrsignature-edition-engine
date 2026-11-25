/**
 * Baby Aylla — AYLLA · ÉDITION ROSE
 * Single Source of Truth for Event Details & Editorial Narrative
 *
 * All dates, editorial text, and confirmed/pending state machines are centralized here.
 * Never invent unconfirmed details.
 */

export interface BabyAyllaEventDetails {
  readonly name: string;
  readonly celebrant: string;
  readonly fullName: string;
  readonly familyName: string;
  readonly experienceName: string;
  readonly collection: string;
  readonly narrativeSignature: string;
  readonly productionSignature: string;
  readonly concept: string;
  readonly eventType: string;
  readonly eventDateIso: string;
  readonly eventDateFormatted: string;
  readonly eventDayOfWeek: string;
  readonly timezone: string;
  readonly time: {
    readonly isConfirmed: boolean;
    readonly display: string;
    readonly startIso?: string;
  };
  readonly venue: {
    readonly isConfirmed: boolean;
    readonly name: string;
    readonly address: string;
    readonly mapsUrl?: string;
  };
  readonly dressCode: {
    readonly isConfirmed: boolean;
    readonly title: string;
    readonly subtitle: string;
    readonly description: string;
    readonly swatches: readonly {
      readonly name: string;
      readonly hex: string;
    }[];
  };
  readonly chapters: readonly {
    readonly number: string;
    readonly title: string;
    readonly quote: string;
    readonly imagePath: string;
    readonly alt: string;
  }[];
  readonly editorial: {
    readonly coverEyebrow: string;
    readonly titlePart1: string;
    readonly titlePart2: string;
    readonly occasionBadge: string;
    readonly coverTagline: string;
    readonly ctaLabel: string;
    readonly storyEyebrow: string;
    readonly storyTitle: string;
    readonly storyLead: string;
    readonly saveTheDateDay: string;
    readonly saveTheDateMonth: string;
    readonly saveTheDateYear: string;
    readonly saveTheDateWeekday: string;
    readonly invitationLead: string;
    readonly invitationCallout: string;
    readonly familyNoteTitle: string;
    readonly familyNoteText: string;
    readonly closingQuote: string;
  };
  readonly music: {
    readonly title: string;
    readonly composer: string;
    readonly recordingCredit: string;
    readonly src: string;
  };
  readonly rsvp: {
    readonly isConfigured: boolean;
    readonly deadlineIso?: string;
    readonly deadlineFormatted?: string;
    readonly maxPartySize: number;
    readonly adminEnvVar: string;
  };
}

export const BABY_AYLLA_EVENT: BabyAyllaEventDetails = {
  name: "Baby Aylla",
  celebrant: "Aylla",
  fullName: "Aylla Nunurai",
  familyName: "Nunurai",
  experienceName: "AYLLA — ÉDITION ROSE",
  collection: "Dior Collection Rosa",
  narrativeSignature: "Une rose à son nom — Uma rosa com o seu nome",
  productionSignature: "An HAXR Signature Digital Couture Experience",
  concept: "Alta-Costura Infantil, Romantismo e Delicadeza Editorial",
  eventType: "Celebração de Aniversário",
  eventDateIso: "2027-01-23",
  eventDateFormatted: "23 de Janeiro de 2027",
  eventDayOfWeek: "Sábado",
  timezone: "Africa/Maputo",
  time: {
    isConfirmed: true,
    display: "11h00",
    startIso: "2027-01-23T11:00:00+02:00",
  },
  venue: {
    isConfirmed: true,
    name: "Vila do Mar Eventos",
    address: "Costa do Sol, Zona dos Pescadores, Maputo, Moçambique",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Vila+do+Mar+Eventos+Maputo",
  },
  dressCode: {
    isConfirmed: false,
    title: "Dior Collection Rosa · Guia de Estilo",
    subtitle: "A subtileza dos tons poudré e tecidos nobres",
    description:
      "Uma celebração inspirada na pureza e no romantismo de uma maison clássica. Convidamos os nossos convidados a vestir tons delicados e luminosos de Rose Poudré, Marfim, Creme ou Champagne suave, transmitindo suavidade e bom gosto.",
    swatches: [
      { name: "Rose Poudré", hex: "#ECCBC0" },
      { name: "Blush Satin", hex: "#D4958A" },
      { name: "Pearl Ivory", hex: "#FBF8F5" },
      { name: "Antique Rose", hex: "#C49994" },
      { name: "Champagne Suave", hex: "#DFBA73" },
      { name: "Couture Ink", hex: "#4A3B39" },
    ],
  },
  chapters: [
    {
      number: "Capítulo I",
      title: "O Encanto",
      quote: "Há histórias que começam muito antes de sabermos contá-las.",
      imagePath: "/images/baby-aylla/aylla-chapter-1-encanto.jpg",
      alt: "Baby Aylla no cenário celestial de lua e estrelas",
    },
    {
      number: "Capítulo II",
      title: "As Descobertas",
      quote: "Entre descobertas, sorrisos e pequenos passos, nasce um mundo de encanto.",
      imagePath: "/images/baby-aylla/aylla-chapter-2-descobertas.jpg",
      alt: "Baby Aylla a dar os seus primeiros passos com apoio carinhoso",
    },
    {
      number: "Capítulo III",
      title: "A Alegria de Ser Aylla",
      quote: "E há momentos que merecem ser celebrados para sempre.",
      imagePath: "/images/baby-aylla/aylla-chapter-3-alegria.jpg",
      alt: "Baby Aylla de pé, sorridente, com mão levantada em alegria",
    },
  ],
  editorial: {
    coverEyebrow: "CONVITE DIGITAL",
    titlePart1: "BABY",
    titlePart2: "Aylla",
    occasionBadge: "ANIVERSÁRIO",
    coverTagline: "Um convite para viver um dia encantado",
    ctaLabel: "ABRIR CONVITE",
    storyEyebrow: "The Story of Aylla",
    storyTitle: "Três Momentos de uma História de Amor",
    storyLead: "Há presenças tão pequenas que transformam mundos inteiros.",
    saveTheDateDay: "23",
    saveTheDateMonth: "JANEIRO",
    saveTheDateYear: "2027",
    saveTheDateWeekday: "SÁBADO",
    invitationLead: "Com muito carinho, convidamos-te a fazer parte de um dia especialmente dedicado à nossa Aylla.",
    invitationCallout: "Une rose à son nom — Uma rosa com o seu nome.",
    familyNoteTitle: "Uma Nota de Carinho e Gratidão",
    familyNoteText:
      "Agradecemos profundamente cada oração, gesto de afecto e presença na vida da nossa preciosa Aylla.",
    closingQuote: "Os momentos mais bonitos são aqueles que partilhamos. Esperamos por ti para celebrar a nossa Aylla.",
  },
  music: {
    title: "Valsa das Flores",
    composer: "Piotr Ilitch Tchaikovsky",
    recordingCredit: "Irineu de Souzandrade",
    src: "/audio/baby-aylla/valsa-das-flores.mp3",
  },
  rsvp: {
    isConfigured: true,
    maxPartySize: 2,
    adminEnvVar: "EDITION_EVENT_AYLLA_ID",
  },
} as const;
