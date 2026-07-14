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
    },
    admin: {
      clientName: "Jessica & Samuel",
      eventTypeLabel: "Casamento Tradicional",
      adminEventName: "Edition · Casamento Tradicional · Jessica & Samuel",
      envVar: "EDITION_EVENT_JESSICA_TRADITIONAL_ID",
    },
  },
  "cha-de-lingerie": {
    slug: "cha-de-lingerie",
    engine: "theme",
    theme: "pink-lingerie",
    experienceType: "intimate",
    sourcePath: "/chadelingerie",
    legacyFolder: "chadelingerie",
    status: "active",
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
      ogImage: "/images/og/despedida-de-solteira-og.png",
    },
    admin: {
      clientName: "Jessica Muege",
      eventTypeLabel: "Despedida de Solteira",
      adminEventName: "Edition · Despedida de Solteira · Jessica Muege",
      envVar: "EDITION_EVENT_JESSICA_FAREWELL_ID",
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
  const canonical = LEGACY_SLUG_REDIRECTS[slug] ?? slug;
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
};

export const ALIAS_INDEX: Record<string, string> = {};
for (const inv of Object.values(INVITATIONS)) {
  if (inv.aliases) {
    for (const alias of inv.aliases) {
      ALIAS_INDEX[alias] = inv.slug;
    }
  }
}

