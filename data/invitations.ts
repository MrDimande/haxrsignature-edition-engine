import type { ExperienceType } from "@experience/types";
import type { RegistryEngineMetaKey } from "../engines/registry-meta";
import type { RegistryThemeKey } from "../theme/registry-types";

export type { ExperienceType };

/** @deprecated Use RegistryEngineMetaKey from theme/registry */
export type EngineType = RegistryEngineMetaKey;

export type InvitationStatus = "active" | "draft" | "archived";

export interface InvitationMetadata {
  title: string;
  /** ISO date — registry field */
  date: string;
  time: string;
  location: string;
  dressCode?: string;
  audio?: string;
  /** Narrative layer */
  subtitle: string;
  description: string;
  eventType: string;
  /** @deprecated Use metadata.date */
  eventDate: string;
  /** Imagem Open Graph / WhatsApp (1200×630 recomendado) */
  ogImage?: string;
}

export interface InvitationAdminBinding {
  clientName: string;
  eventTypeLabel: string;
  adminEventName: string;
  envVar: string;
  expectedRegistryKey?: string;
}

/**
 * Variant identifica o perfil funcional da experiência de memórias.
 * Não confundir com theme (apresentação visual) — variant determina comportamento.
 */
export type MemoriesVariant = "traditional-memories" | "plus-memories";

export interface InvitationCompetitionConfig {
  enabled: boolean;
  mode: "unique-challenges";
  totalChallenges: number;
}

export interface InvitationFeatures {
  memories?: {
    enabled: boolean;
    /** Perfil funcional da experiência (determina componentes, desafios, etc.) */
    variant: MemoriesVariant;
    competition?: InvitationCompetitionConfig;
  };
}

export interface InvitationConfig {
  slug: string;
  aliases?: string[];
  engine: RegistryEngineMetaKey;
  theme: RegistryThemeKey;
  experienceType: ExperienceType;
  sourcePath: string;
  legacyFolder: string;
  status: InvitationStatus;
  metadata: InvitationMetadata;
  admin?: InvitationAdminBinding;
  features?: InvitationFeatures;
}

export const INVITATIONS: Record<string, InvitationConfig> = {
  jessicakulaya: {
    slug: "jessicakulaya",
    engine: "legacyKulaya",
    theme: "kulaya-traditional",
    experienceType: "ceremonial",
    sourcePath: "/jessicakhulaya",
    legacyFolder: "jessicakhulaya",
    status: "active",
    metadata: {
      title: "Kulaya Ceremony - Jessica Muege",
      date: "2026-08-01",
      time: "Cerimónia ao entardecer",
      location: "Condomínio Matola Village, Matola, Moçambique",
      audio: "uplifting-african",
      subtitle: "KULAYA · INVERNO 2026",
      description:
        "Convite digital imersivo para a Cerimónia de Kulaya. Uma celebração de raízes, dignidade e continuidade cultural.",
      eventDate: "2026-08-01",
      eventType: "Kulaya",
    },
    admin: {
      clientName: "Jessica Muege",
      eventTypeLabel: "Kulaya",
      adminEventName: "Edition · Kulaya · Jessica Muege",
      envVar: "EDITION_EVENT_JESSICA_KULAYA_ID",
    },
  },
  "lobolo-jessica-samuel": {
    slug: "lobolo-jessica-samuel",
    engine: "legacyLobolo",
    theme: "kulaya-traditional",
    experienceType: "ceremonial",
    sourcePath: "/lobolojessicaesamuel",
    legacyFolder: "lobolojessicaesamuel",
    status: "draft",
    metadata: {
      title: "Lobolo Ceremony",
      date: "2026-08-29",
      time: "A confirmar",
      location: "Maputo, Moçambique",
      subtitle: "Primavera Africana de Luxo",
      description:
        "Convite digital de casamento tradicional (Lobolo). Uma experiência HAXR Signature — cada celebração merece uma assinatura.",
      eventDate: "2026-08-29",
      eventType: "Lobolo",
      ogImage: "/images/og/lobolo-jessica-samuel-og.png",
    },
    admin: {
      clientName: "Jessica & Samuel",
      eventTypeLabel: "Lobolo",
      adminEventName: "Edition · Lobolo · Jessica & Samuel",
      envVar: "EDITION_EVENT_JESSICA_LOBOLO_ID",
    },
  },
  jessicaesamueltraditionalwedding: {
    slug: "jessicaesamueltraditionalwedding",
    engine: "theme",
    theme: "primavera-lobolo",
    experienceType: "ceremonial",
    sourcePath: "/jessicaesamueltraditionalwedding",
    legacyFolder: "jessicaesamueltraditionalwedding",
    status: "active",
    metadata: {
      title: "Casamento Tradicional — Jessica & Samuel",
      date: "2026-08-08",
      time: "Copo de Água · 14h00",
      location: "Casa D'Artista Kutenga, Matola",
      dressCode: "Formal",
      subtitle: "Casamento Tradicional | Lobolo · Tema Primavera",
      description:
        "Convite digital cerimonial para o Lobolo de Jessica & Samuel. Uma celebração da união das famílias com honra, tradição e elegância.",
      eventDate: "2026-08-08",
      eventType: "Casamento Tradicional · Lobolo",
      ogImage: "/images/og/casamento-tradicional-jessica-samuel-og.png",
    },
    admin: {
      clientName: "Jessica & Samuel",
      eventTypeLabel: "Casamento Tradicional",
      adminEventName: "Edition · Casamento Tradicional · Jessica & Samuel",
      envVar: "EDITION_EVENT_JESSICA_TRADITIONAL_ID",
      expectedRegistryKey: "traditional-wedding",
    },
    features: {
      memories: {
        enabled: true,
        variant: "traditional-memories",
      },
    },
  },
  /**
   * Stub Residência Muege / pink-lingerie — venues distintos de
   * jessicachadelingerie (Govene). Draft: sem binding Production nem gifts.
   * Canónico publicado: /jessicachadelingerie. NÃO unificar por redirect.
   */
  "cha-de-lingerie": {
    slug: "cha-de-lingerie",
    engine: "theme",
    theme: "pink-lingerie",
    experienceType: "intimate",
    sourcePath: "/chadelingerie",
    legacyFolder: "chadelingerie",
    status: "draft",
    metadata: {
      title: "Chá de Lingerie — Jessica Muege",
      date: "2026-07-25",
      time: "11h00 Horas pontual",
      location: "Residência Muege, Condomínio Matola Village, Matola",
      dressCode: "One piece in Pink",
      audio: "lingerie-ambient",
      subtitle: "BRIDE TO BE EXPERIENCE",
      description:
        "Um encontro exclusivo de cumplicidade e carinho, celebrando a transição da Jessica para uma nova fase da sua vida. Uma tarde repleta de risos, partilhas e elegância.",
      eventDate: "2026-07-25",
      eventType: "Chá de Lingerie",
    },
    admin: {
      clientName: "Jessica Muege",
      eventTypeLabel: "Chá de Lingerie",
      adminEventName: "Edition · Chá de Lingerie · Jessica Muege",
      envVar: "EDITION_EVENT_JESSICA_LINGERIE_ID",
    },
  },
  "cha-de-panela": {
    slug: "cha-de-panela",
    aliases: ["jessicabridetobe", "jessica-bride-to-be"],
    engine: "theme",
    theme: "bride-to-be-illustration",
    experienceType: "bride-to-be",
    sourcePath: "/chadepanela",
    legacyFolder: "chadepanela",
    status: "active",
    metadata: {
      title: "Chá de Panela — Bride-to-Be Experience",
      date: "2026-09-12",
      time: "15h00 Horas",
      location: "Local a confirmar · Maputo, Moçambique",
      dressCode: "One piece in Pink",
      audio: "lingerie-ambient",
      subtitle: "BRIDE-TO-BE · ILLUSTRATED JOURNEY",
      description:
        "Uma jornada emocional ilustrada antes do grande dia — celebração, feminilidade, elegância e alegria partilhada entre amigas.",
      eventDate: "2026-09-12",
      eventType: "Chá de Panela",
    },
  },
  jessicachadelingerie: {
    slug: "jessicachadelingerie",
    engine: "theme",
    theme: "rose-elegance-farewell",
    experienceType: "bride-to-be",
    sourcePath: "/jessicachadelingerie",
    legacyFolder: "jessicachadelingerie",
    status: "active",
    metadata: {
      title: "Despedida de Solteira — Jessica Muege",
      date: "2026-07-25",
      time: "11h00",
      location: "Residência Govene, Matola Gare",
      dressCode: "Uma peça rosa",
      audio: "if-i-aint-got-you",
      subtitle: "Chá de lingerie · despedida mimosa",
      description:
        "Uma despedida de solteira feminina e íntima, cursiva, rosa e cheia de charme para celebrar a noiva antes do grande dia.",
      eventDate: "2026-07-25",
      eventType: "Despedida de Solteira",
      ogImage: "/images/og/cha-de-lingerie-og.png",
    },
    admin: {
      clientName: "Jessica Muege",
      eventTypeLabel: "Despedida de Solteira",
      adminEventName: "Edition · Despedida de Solteira · Jessica Muege",
      envVar: "EDITION_EVENT_JESSICA_FAREWELL_ID",
      expectedRegistryKey: "rose-elegance",
    },
  },
  jessicasamuelwedding: {
    slug: "jessicasamuelwedding",
    aliases: ["jessica-samuel"],
    engine: "theme",
    theme: "jessica-samuel-wedding",
    experienceType: "editorial",
    sourcePath: "/jessicasamuelwedding",
    legacyFolder: "jessica-samuel",
    status: "active",
    metadata: {
      title: "Casamento — Jessica Muege & Samuel Govene",
      date: "2026-08-15",
      /** Espelha WEDDING_RELIGIOUS_CEREMONY_TIME (fonte única em event-details). */
      time: "10h30",
      location: "Salão de Eventos Vila Verde, Matola",
      dressCode: "Traje de gala · a rigor",
      subtitle: "Black-tie · Editorial · Celebração",
      description:
        "Convite digital de casamento editorial — uma experiência cinematográfica de amor, fé e união sob a assinatura HAXR.",
      eventDate: "2026-08-15",
      eventType: "Casamento",
      ogImage: "/images/og/jessica-samuel-wedding-og.png",
    },
    admin: {
      clientName: "Jessica & Samuel",
      eventTypeLabel: "Casamento",
      adminEventName: "Edition · Casamento · Jessica & Samuel",
      envVar: "EDITION_EVENT_JESSICA_WEDDING_ID",
      expectedRegistryKey: "jessica-samuel-wedding",
    },
    features: {
      memories: {
        enabled: true,
        variant: "plus-memories",
        competition: {
          enabled: true,
          mode: "unique-challenges",
          totalChallenges: 12,
        },
      },
    },
  },
  stanturns5: {
    slug: "stanturns5",
    aliases: ["stan", "convite-stan", "stan-5-anos"],
    engine: "theme",
    theme: "stan-real-madrid",
    experienceType: "editorial",
    sourcePath: "/stanturns5",
    legacyFolder: "stan",
    status: "active",
    metadata: {
      title: "5º Aniversário do Stan — Real Madrid Experience",
      date: "2026-09-12",
      time: "11h00",
      /** Residência do S5 · Belo Horizonte (Maputo) */
      location: "Residência do S5 · Belo Horizonte, Maputo",
      dressCode: "Kit Matchday · navy, azul, cream e areia",
      subtitle: "O Quinto Acto de um Pequeno Campeão",
      description:
        "12 de Setembro de 2026 · 11h00 · Residência do S5, Belo Horizonte. O Quinto Acto de um Pequeno Campeão.",
      eventDate: "2026-09-12",
      eventType: "Aniversário Infantil",
      ogImage: "/images/stan/social/stan-og.png",
    },
    admin: {
      clientName: "Stan",
      eventTypeLabel: "Aniversário",
      adminEventName: "Edition · Aniversário · Stan",
      envVar: "EDITION_EVENT_STAN_ID",
      expectedRegistryKey: "stan-real-madrid",
    },
  },
  nianwebnight: {
    slug: "nianwebnight",
    aliases: [
      "nian",
      "nightoftheweb",
      "convite-nian",
      "nian-night-of-the-web",
    ],
    engine: "theme",
    theme: "nian-night-of-the-web",
    experienceType: "editorial",
    sourcePath: "/nianwebnight",
    legacyFolder: "nian",
    status: "active",
    metadata: {
      title: "Nian — NIGHT OF THE WEB",
      date: "2026-09-19",
      time: "13h00",
      location: "Salão de Eventos Benerla · Marracuene, Maputo",
      dressCode: "Cores do Universo · Azul Royal e Vermelho Vivo",
      subtitle: "Uma cidade em movimento. Um pequeno herói. Uma celebração inesquecível.",
      description:
        "19 de Setembro de 2026 · 13h00 · Salão de Eventos Benerla, Marracuene. NIGHT OF THE WEB — aniversário do Nian.",
      eventDate: "2026-09-19",
      eventType: "Aniversário Infantil",
      ogImage: "/images/nian/social/nian-og.png",
    },
    admin: {
      clientName: "Nian",
      eventTypeLabel: "Aniversário",
      adminEventName: "Edition · Aniversário · Nian",
      envVar: "EDITION_EVENT_NIAN_ID",
      expectedRegistryKey: "nian-night-of-the-web",
    },
  },
  queenkailanecrisma: {
    slug: "queenkailanecrisma",
    aliases: ["queen-kailane", "queenkailane", "crisma-queen"],
    engine: "theme",
    theme: "queen-kailane-luz-da-graca",
    experienceType: "editorial",
    sourcePath: "/queenkailanecrisma",
    legacyFolder: "queen-kailane",
    status: "active",
    metadata: {
      title: "Sacramento do Crisma — Queen Kailane Cande",
      date: "2026-08-30",
      /** Hora da celebração religiosa: 08h00 · Almoço às 13h00 */
      time: "08h00",
      location: "Igreja Anglicana — Paróquia de São Estêvão e Lourenço",
      subtitle: "LUZ DA GRAÇA · Confirmada na fé. Guiada pela luz.",
      description:
        "30 de Agosto de 2026 · Sacramento do Crisma de Queen Kailane Cande às 08h00 — Igreja Anglicana, Paróquia de São Estêvão e Lourenço. Almoço às 13h00 em São Dâmaso.",
      eventDate: "2026-08-30",
      eventType: "Sacramento do Crisma",
      ogImage: "/images/queen-kailane/social/queen-kailane-og.png",
      audio: "tatana-yamukela-mhamba",
    },
    admin: {
      clientName: "Queen Kailane Cande",
      eventTypeLabel: "Crisma",
      adminEventName: "Edition · Crisma · Queen Kailane Cande",
      envVar: "EDITION_EVENT_QUEEN_KAILANE_ID",
      expectedRegistryKey: "queen-kailane-luz-da-graca",
    },
  },
  neidyejosewedding: {
    slug: "neidyejosewedding",
    aliases: [
      "neidyejose",
      "neidy-jose",
      "neidy-e-jose",
      "neidymarinoejosecabral",
    ],
    engine: "theme",
    theme: "neidy-jose-vinculo",
    experienceType: "ceremonial",
    sourcePath: "/neidyejosewedding",
    legacyFolder: "neidy-jose",
    status: "active",
    metadata: {
      title: "Neidy Marino e José Cabral — Convite de Casamento",
      date: "2026-12-05",
      time: "13:00 · Civil · 15:00 · Copo de Água",
      location: "Espaço Águia, Maputo",
      subtitle: "O VÍNCULO DA PERFEIÇÃO · Colossenses 3:14",
      description:
        "Celebração do Matrimónio de Neidy Marino e José Cabral. 5 de Dezembro de 2026 — Civil 13:00 & Copo de Água 15:00 · Espaço Águia, Maputo. Fé · Vitória · Amor.",
      eventDate: "2026-12-05",
      eventType: "Casamento",
      dressCode: "Traje de Gala",
      ogImage: "/neidyejosewedding/opengraph-image",
    },
    admin: {
      clientName: "Neidy Marino e José Cabral",
      eventTypeLabel: "Casamento",
      adminEventName: "Edition · Casamento · Neidy Marino e José Cabral",
      envVar: "EDITION_EVENT_NEIDY_JOSE_ID",
      expectedRegistryKey: "neidy-jose-vinculo",
    },
  },
};

/** @deprecated Use INVITATIONS */
export const invitations = INVITATIONS;

export const invitationSlugs = Object.keys(INVITATIONS);

export function getActiveInvitations(): InvitationConfig[] {
  return Object.values(INVITATIONS).filter(
    (invitation) => invitation.status === "active"
  );
}

export const activeInvitationSlugs = getActiveInvitations().map(
  (invitation) => invitation.slug
);

export function getInvitation(slug: string): InvitationConfig | null {
  const canonical =
    LEGACY_SLUG_REDIRECTS[slug] ?? ALIAS_INDEX[slug] ?? slug;
  return INVITATIONS[canonical] ?? null;
}

/** Legacy slug redirects — never exposed on public routes */
export const LEGACY_SLUG_REDIRECTS: Record<string, string> = {
  jessicakhulaya: "jessicakulaya",
  "traditional-wedding": "jessicaesamueltraditionalwedding",
  "jessica-samuel-traditional": "jessicaesamueltraditionalwedding",
  "jessica-traditional-wedding": "jessicaesamueltraditionalwedding",
  chadelingerie: "cha-de-lingerie",
  "jessica-cha-de-lingerie": "cha-de-lingerie",
  chadepanela: "cha-de-panela",
  "despedida-de-solteira": "jessicachadelingerie",
  "jessica-farewell": "jessicachadelingerie",
  "jessica-samuel": "jessicasamuelwedding",
  /** Stan — rota antiga → canónica /stanturns5 */
  stan: "stanturns5",
  /** Nian — rota antiga → canónica /nianwebnight */
  nian: "nianwebnight",
};

export const ALIAS_INDEX: Record<string, string> = {};
for (const inv of Object.values(INVITATIONS)) {
  if (inv.aliases) {
    for (const alias of inv.aliases) {
      ALIAS_INDEX[alias] = inv.slug;
    }
  }
}

