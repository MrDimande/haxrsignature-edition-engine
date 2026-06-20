export type EngineType = "kulaya" | "lobolo" | "traditional";

export type InvitationStatus = "active" | "draft" | "archived";

export interface InvitationMetadata {
  title: string;
  subtitle: string;
  description: string;
  eventDate: string;
  eventType: string;
  audio?: string;
}

export interface InvitationAdminBinding {
  /** Nome do cliente — identificação no admin */
  clientName: string;
  /** Tipo curto do evento (Kulaya, Lobolo, etc.) */
  eventTypeLabel: string;
  /** Nome completo no admin: Edition · Kulaya · Jessica Muege */
  adminEventName: string;
  /** Variável .env / Vercel: EDITION_EVENT_JESSICA_KULAYA_ID */
  envVar: string;
}

export interface InvitationConfig {
  slug: string;
  engine: EngineType;
  sourcePath: string;
  legacyFolder: string;
  status: InvitationStatus;
  metadata: InvitationMetadata;
  /** Ligação ao evento no admin www.haxrsignature.com */
  admin?: InvitationAdminBinding;
}

export const INVITATIONS: Record<string, InvitationConfig> = {
  jessicakulaya: {
    slug: "jessicakulaya",
    engine: "kulaya",
    sourcePath: "/jessicakhulaya",
    legacyFolder: "jessicakhulaya",
    status: "active",
    metadata: {
      title: "Kulaya Ceremony - Jessica Muege",
      subtitle: "KULAYA · INVERNO 2026",
      description:
        "Convite digital imersivo para a Cerimónia de Kulaya. Uma celebração de raízes, dignidade e continuidade cultural.",
      eventDate: "2026-08-01",
      eventType: "Kulaya",
      audio: "uplifting-african",
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
    engine: "lobolo",
    sourcePath: "/lobolojessicaesamuel",
    legacyFolder: "lobolojessicaesamuel",
    status: "draft",
    metadata: {
      title: "Lobolo Ceremony",
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
  "traditional-wedding": {
    slug: "traditional-wedding",
    engine: "traditional",
    sourcePath: "/jessicaesamueltraditionalwedding",
    legacyFolder: "jessicaesamueltraditionalwedding",
    status: "draft",
    metadata: {
      title: "Traditional Wedding",
      subtitle: "Casamento Tradicional · Tema Primavera",
      description:
        "Convite digital para o Casamento Tradicional. Tema Primavera — laranja, dourado e branco.",
      eventDate: "2026-07-25",
      eventType: "DOT / Lobolo",
    },
    admin: {
      clientName: "Jessica & Samuel",
      eventTypeLabel: "Casamento Tradicional",
      adminEventName: "Edition · Casamento Tradicional · Jessica & Samuel",
      envVar: "EDITION_EVENT_JESSICA_TRADITIONAL_ID",
    },
  },
};

/** @deprecated Use INVITATIONS */
export const invitations = INVITATIONS;

export const invitationSlugs = Object.keys(INVITATIONS);

/** Convites publicados — apenas `status: "active"` */
export function getActiveInvitations(): InvitationConfig[] {
  return Object.values(INVITATIONS).filter(
    (invitation) => invitation.status === "active"
  );
}

export const activeInvitationSlugs = getActiveInvitations().map(
  (invitation) => invitation.slug
);

/** Legacy slug redirects — never exposed on public routes */
export const LEGACY_SLUG_REDIRECTS: Record<string, string> = {
  jessicakhulaya: "jessicakulaya",
  "jessica-samuel-traditional": "traditional-wedding",
  "jessica-traditional-wedding": "traditional-wedding",
};
