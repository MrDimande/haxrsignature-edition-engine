/**
 * HAXR PLUS MEMORIES 2.0 — FASE 8: POLÍTICA DE DOMÍNIO & REGRAS DO RECAP
 *
 * Contratos de tipos, transições de estado, precedência de moderação
 * e redacção estrita de segurança e privacidade.
 */

import { isCanonicalPublicMemory } from "./publication";
import { isMemoriesUuid } from "./session-security";

export const MAX_RECAP_TITLE_LENGTH = 120;
export const MAX_RECAP_MESSAGE_LENGTH = 1000;
export const MAX_RECAP_CAPTION_LENGTH = 300;

export type RecapPublicationStatus = "draft" | "published" | "archived";
export type RecapAccessLevel = "guests_only" | "share_link_only" | "public";
export type RecapItemSection = "hero" | "story" | "moments" | "missions" | "closing";

export interface RecapConfiguration {
  showHero?: boolean;
  showStory?: boolean;
  showMoments?: boolean;
  showMissions?: boolean;
  showExplorers?: boolean;
  showFavorites?: boolean;
  showSocial?: boolean;
  showComments?: boolean;
  showClosing?: boolean;
}

export interface RecapItemDbRow {
  id: string;
  publication_id: string;
  event_id: string;
  experience_id: string;
  media_id: string;
  section: RecapItemSection;
  stage_id: string | null;
  position: number;
  editorial_caption: string | null;
  created_at: string | Date;
}

export interface RecapPublicationDbRow {
  id: string;
  event_id: string;
  experience_id: string;
  version: number;
  lock_version: number;
  status: RecapPublicationStatus;
  title: string | null;
  welcome_message: string | null;
  closing_message: string | null;
  access_level: RecapAccessLevel;
  configuration: RecapConfiguration;
  published_at: string | Date | null;
  created_at: string | Date;
  updated_at: string | Date;
}

/**
 * Contexto de acesso resolvido autoritativamente no servidor pelo Gateway.
 * O participantId NUNCA é recebido como autoridade a partir do cliente.
 */
export interface RecapAccessContext {
  eventId: string;
  experienceId: string;
  eventSlug: string;
  invitationSlug: string | null;
  authenticatedParticipant: {
    id: string;
    guestId: string | null;
    displayName?: string | null;
  } | null;
  accessScope: "public" | "guest_session" | "share_link" | "admin";
  shareLinkId?: string | null;
}

export interface RecapMediaItem {
  id: string;
  kind: "image" | "video";
  thumbnailUrl: string;
  mediumUrl: string;
  posterUrl: string | null;
  caption: string | null;
  guestName: string | null;
  stageId: string | null;
  section: RecapItemSection;
  position: number;
  editorialCaption: string | null;
  reactions: Record<string, number>;
  totalReactions: number;
  approvedCommentsCount: number;
  createdAt: string;
}

export interface RecapStageSection {
  stageId: string;
  stageSlug: string;
  stageLabel: string;
  orderIndex: number;
  items: RecapMediaItem[];
}

export interface RecapMissionHighlight {
  missionId: string;
  missionTitle: string;
  missionCategory: string;
  points: number;
  submissionsCount: number;
  featuredMedia: RecapMediaItem[];
}

export interface SafeExplorerRankEntry {
  rank: number;
  displayName: string;
  points: number;
  missionsCompleted: number;
  isCurrentParticipant: boolean;
}

export interface SafeRecapCommentItem {
  id: string;
  mediaId: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export interface RecapNarrativePayload {
  publication: {
    id: string;
    version: number;
    title: string | null;
    welcomeMessage: string | null;
    closingMessage: string | null;
    publishedAt: string | null;
    accessLevel: RecapAccessLevel;
    configuration: RecapConfiguration;
  };
  hero: RecapMediaItem | null;
  story: RecapStageSection[];
  moments: RecapMediaItem[];
  missions: RecapMissionHighlight[];
  explorers: SafeExplorerRankEntry[];
  favorites: RecapMediaItem[];
  social: {
    totalPhotos: number;
    totalReactions: number;
    reactionAggregates: Record<string, number>;
    recentComments: SafeRecapCommentItem[];
  };
  closing: {
    message: string | null;
    signOffDate: string | null;
  };
  viewer: {
    isAuthenticated: boolean;
    displayName: string | null;
    hasFavorites: boolean;
  };
}

/**
 * Sanitiza texto simples garantindo que não contém HTML ou caracteres de controlo perigosos.
 * O React escapa naturalmente o texto no render; aqui garantimos ausência de payloads gigantes e controlo.
 */
export function sanitizePlaintext(input: unknown, maxLength: number): string | null {
  if (typeof input !== "string") return null;
  // Remover caracteres de controlo (excepto \n, \r, \t)
  const cleaned = input
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim();
  if (!cleaned) return null;
  return cleaned.slice(0, maxLength);
}

/**
 * Valida a configuração do Recap contra o schema restrito de booleanos.
 */
export function sanitizeRecapConfiguration(raw: unknown): RecapConfiguration {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  const obj = raw as Record<string, unknown>;
  const clean: RecapConfiguration = {};
  const booleanKeys: (keyof RecapConfiguration)[] = [
    "showHero",
    "showStory",
    "showMoments",
    "showMissions",
    "showExplorers",
    "showFavorites",
    "showSocial",
    "showComments",
    "showClosing",
  ];
  for (const k of booleanKeys) {
    if (typeof obj[k] === "boolean") {
      clean[k] = obj[k];
    }
  }
  return clean;
}

/**
 * State machine canónica de transições de publicação.
 * draft -> published
 * published -> archived
 */
export function isValidPublicationTransition(
  currentStatus: RecapPublicationStatus,
  newStatus: RecapPublicationStatus
): boolean {
  if (currentStatus === newStatus) return true; // idempotente
  if (currentStatus === "draft" && newStatus === "published") return true;
  if (currentStatus === "published" && newStatus === "archived") return true;
  return false;
}

/**
 * Avalia autorização de leitura da publicação com base no nível de acesso e contexto do visitante.
 */
export function isRecapAccessAuthorized(
  publication: { status: RecapPublicationStatus; access_level: RecapAccessLevel },
  context: RecapAccessContext
): boolean {
  // Administradores autorizados têm sempre acesso de leitura
  if (context.accessScope === "admin") return true;

  // Apenas publicações publicadas são acessíveis a não-admins
  if (publication.status !== "published") return false;

  switch (publication.access_level) {
    case "public":
      // Acesso aberto a qualquer visitante (anónimo, share link ou participante)
      return true;
    case "guests_only":
      // Estritamente para participante autenticado daquela experiência (sessão de convidado)
      // Mero share link recap:view NÃO autoriza acesso se a publicação for guests_only
      return context.accessScope === "guest_session" && context.authenticatedParticipant !== null;
    case "share_link_only":
      // Estritamente através de share link válido recap:view scoped à experiência
      // Sessão de participante sem esse share scope NÃO tem acesso a share_link_only
      return context.accessScope === "share_link";
    default:
      return false;
  }
}

/**
 * Precedência de moderação: verifica se uma media específica continua elegível para o Recap.
 * Reutiliza a política canónica central de publication.ts.
 */
export function isRecapMediaEligible(
  row: { id: string; storage_path: string; moderation_status: string; invitation_slug?: string | null },
  slug?: string
): boolean {
  return isCanonicalPublicMemory(row, slug);
}
