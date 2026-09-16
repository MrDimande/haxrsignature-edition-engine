import { NextResponse } from "next/server";
import { getInvitation } from "@data/invitations";
import { resolveMemoriesConfig } from "./config";
import {
  isMemoriesSameOriginMutation,
  readMemoriesCookie,
  readRecapShareCookie,
  hashMemoriesToken,
  isMemoriesToken,
} from "./session-security";
import {
  authorizeMemoriesSession,
  type MemoriesParticipantPermission,
  type MemoriesSessionSnapshot,
  type MemoriesVisibility,
} from "./session-policy";
import {
  resolveMemoriesEvent,
  findSessionByTokenHash,
  type SessionStoreEventInfo,
} from "./session-store";
import { getNeonPool } from "@lib/db/neon-client";
import { memoriesJson, requireMemoriesAdmin } from "./admin-auth";

export interface MemoriesAuthContext {
  isLegacy: boolean;
  event: {
    id: string;
    slug: string;
    active: boolean;
    visibility: MemoriesVisibility;
    uploadsEnabled: boolean;
    competitionEnabled: boolean;
  };
  experience: {
    id: string;
    slug: string;
    accessMode: "legacy" | "session";
  };
  participant: {
    id: string;
    guestId: string | null;
  } | null;
  session: {
    id: string;
    tokenHash: string;
    expiresAt: string;
  } | null;
  permissions: MemoriesParticipantPermission[];
}

export type MemoriesAuthResult =
  | { ok: true; context: MemoriesAuthContext }
  | { ok: false; status: number; error: string; code: string; response: NextResponse };

export interface AuthorizeMemoriesRequestOptions {
  request: Request;
  slug?: string;
  eventId?: string;
  permission: MemoriesParticipantPermission;
  now?: Date;
  requireSameOriginMutation?: boolean;
}

/**
 * Gateway central reutilizável de autorização para o ecossistema Memories.
 * Resolve autoritativamente a identidade no servidor e garante que:
 * 1. Eventos legacy continuam a funcionar sem interrupção.
 * 2. Eventos em session mode NUNCA fazem fallback para legacy em caso de sessão inválida.
 * 3. Rotas e aliases antigos não servem como bypass.
 */
export async function authorizeMemoriesRequest(
  options: AuthorizeMemoriesRequestOptions
): Promise<MemoriesAuthResult> {
  const { request, permission } = options;
  const now = options.now ?? new Date();

  // 1. Determinar o slug ou ID do evento
  let identifier = options.slug?.trim() || options.eventId?.trim();
  if (!identifier) {
    const url = new URL(request.url);
    identifier = url.searchParams.get("slug")?.trim() || url.searchParams.get("eventId")?.trim();
  }

  if (!identifier) {
    return {
      ok: false,
      status: 400,
      error: "Identificador de convite ou evento em falta.",
      code: "MISSING_IDENTIFIER",
      response: memoriesJson(400, { success: false, error: "Identificador de convite ou evento em falta." }),
    };
  }

  // 2. Verificar se o evento é configurado localmente como legacy
  const localInvitation = getInvitation(identifier);
  const localConfig = resolveMemoriesConfig(identifier);
  const isLocalLegacy = localInvitation?.features?.memories?.accessMode === "legacy" ||
    identifier === "jessicasamuelwedding" ||
    identifier === "jessicaesamueltraditionalwedding" ||
    identifier === "jessica-samuel";

  // 3. Consultar metadados do evento na base de dados
  let eventInfo: SessionStoreEventInfo | null = null;
  try {
    eventInfo = await resolveMemoriesEvent(identifier);
  } catch (err) {
    console.error("[MemoriesGateway] resolveMemoriesEvent error:", err);
  }

  // Se o evento não existe na BD mas está configurado em invitations como legacy
  if (!eventInfo && isLocalLegacy && localConfig) {
    return {
      ok: true,
      context: {
        isLegacy: true,
        event: {
          id: "7cec4447-de0d-40a5-8f03-8d7c87acb3f5",
          slug: localConfig.invitationSlug,
          active: true,
          visibility: "moderated",
          uploadsEnabled: true,
          competitionEnabled: true,
        },
        experience: {
          id: "0559261a-e07c-4f94-8bf6-3230e6731f2f",
          slug: localConfig.invitationSlug,
          accessMode: "legacy",
        },
        participant: null,
        session: null,
        permissions: ["gallery:read", "media:sign", "media:upload", "challenge:submit", "progress:read"],
      },
    };
  }

  if (!eventInfo) {
    return {
      ok: false,
      status: 404,
      error: "Convite ou evento não encontrado.",
      code: "EVENT_NOT_FOUND",
      response: memoriesJson(404, { success: false, error: "Convite ou evento não encontrado." }),
    };
  }

  // 4. Fluxo Legacy (Jessica & Samuel)
  if (eventInfo.accessMode === "legacy" || isLocalLegacy) {
    return {
      ok: true,
      context: {
        isLegacy: true,
        event: {
          id: eventInfo.id,
          slug: eventInfo.slug,
          active: eventInfo.active,
          visibility: eventInfo.visibility,
          uploadsEnabled: eventInfo.uploadsEnabled,
          competitionEnabled: eventInfo.competitionEnabled,
        },
        experience: {
          id: eventInfo.experienceId,
          slug: eventInfo.slug,
          accessMode: "legacy",
        },
        participant: null,
        session: null,
        permissions: ["gallery:read", "media:sign", "media:upload", "challenge:submit", "progress:read"],
      },
    };
  }

  // 5. Fluxo Session Mode: sessão obrigatória e verificada rigorosamente
  if (options.requireSameOriginMutation) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
    if (!isMemoriesSameOriginMutation(request, siteUrl)) {
      return {
        ok: false,
        status: 403,
        error: "Origem da operação não autorizada.",
        code: "CROSS_ORIGIN_DENIED",
        response: memoriesJson(403, { success: false, error: "Origem da operação não autorizada." }),
      };
    }
  }

  // Identificar se o ambiente deve impor prefixo __Host- e Secure
  const isHttps = request.url.startsWith("https://") || process.env.NODE_ENV === "production";
  const token = readMemoriesCookie(request, eventInfo.id, isHttps);

  if (!token || !isMemoriesToken(token)) {
    return {
      ok: false,
      status: 401,
      error: "Sessão de memórias necessária. Aceda através do seu link de convite.",
      code: "SESSION_REQUIRED",
      response: memoriesJson(401, {
        success: false,
        error: "Sessão de memórias necessária. Aceda através do seu link de convite.",
      }),
    };
  }

  const tokenHash = hashMemoriesToken(token, "participant-session");
  let snapshot: MemoriesSessionSnapshot | null = null;
  try {
    snapshot = await findSessionByTokenHash(tokenHash);
  } catch (err) {
    console.error("[MemoriesGateway] findSessionByTokenHash error:", err);
    return {
      ok: false,
      status: 503,
      error: "Serviço de autenticação temporariamente indisponível.",
      code: "DB_ERROR",
      response: memoriesJson(503, { success: false, error: "Serviço de autenticação temporariamente indisponível." }),
    };
  }

  if (!snapshot) {
    return {
      ok: false,
      status: 401,
      error: "Sessão não encontrada ou expirada.",
      code: "SESSION_INVALID",
      response: memoriesJson(401, { success: false, error: "Sessão não encontrada ou expirada." }),
    };
  }

  // Decisão profunda de segurança e contrato de domínio
  const decision = authorizeMemoriesSession(eventInfo.id, snapshot, permission, now);
  if (!decision.ok) {
    switch (decision.reason) {
      case "cross_event":
        return {
          ok: false,
          status: 403,
          error: "Sessão não autorizada para este evento.",
          code: "CROSS_EVENT_DENIED",
          response: memoriesJson(403, { success: false, error: "Sessão não autorizada para este evento." }),
        };
      case "revoked":
        return {
          ok: false,
          status: 401,
          error: "Sessão ou acesso de convidado revogado.",
          code: "SESSION_REVOKED",
          response: memoriesJson(401, { success: false, error: "Sessão ou acesso de convidado revogado." }),
        };
      case "expired":
        return {
          ok: false,
          status: 401,
          error: "A sua sessão de memórias expirou. Aceda novamente pelo convite.",
          code: "SESSION_EXPIRED",
          response: memoriesJson(401, {
            success: false,
            error: "A sua sessão de memórias expirou. Aceda novamente pelo convite.",
          }),
        };
      case "forbidden":
        return {
          ok: false,
          status: 403,
          error: "Esta acção não está permitida nas definições actuais do evento.",
          code: "ACTION_FORBIDDEN",
          response: memoriesJson(403, {
            success: false,
            error: "Esta acção não está permitida nas definições actuais do evento.",
          }),
        };
      default:
        return {
          ok: false,
          status: 401,
          error: "Sessão inválida.",
          code: "SESSION_INVALID",
          response: memoriesJson(401, { success: false, error: "Sessão inválida." }),
        };
    }
  }

  return {
    ok: true,
    context: {
      isLegacy: false,
      event: snapshot.event,
      experience: {
        id: eventInfo.experienceId,
        slug: snapshot.event.slug,
        accessMode: "session",
      },
      participant: {
        id: snapshot.participant.id,
        guestId: snapshot.participant.guestId,
      },
      session: {
        id: snapshot.session.id,
        tokenHash,
        expiresAt: snapshot.session.expiresAt,
      },
      permissions: [permission],
    },
  };
}

/**
 * Resolve o contexto autoritativo de acesso ao Recap no servidor.
 * Não aceita participantId vindo de inputs do cliente.
 * Suporta Admin, Sessão de Participante, Share Link ou Acesso Público anónimo.
 */
export async function resolveRecapAccessContext(
  request: Request,
  slugOrId: string
): Promise<{ ok: boolean; context?: import("./recap-policy").RecapAccessContext; status?: number; error?: string }> {
  const eventInfo = await resolveMemoriesEvent(slugOrId);
  if (!eventInfo) {
    return { ok: false, status: 404, error: "Evento não encontrado." };
  }

  // 1. Verificar se é um acesso administrativo
  const adminCheck = requireMemoriesAdmin(request);
  if (adminCheck.ok) {
    return {
      ok: true,
      context: {
        eventId: eventInfo.id,
        experienceId: eventInfo.experienceId,
        eventSlug: eventInfo.slug,
        invitationSlug: eventInfo.slug,
        authenticatedParticipant: null,
        accessScope: "admin",
      },
    };
  }

  // 2. Verificar sessão de participante existente via cookie seguro
  const token = readMemoriesCookie(request, eventInfo.id, true) || readMemoriesCookie(request, eventInfo.id, false);

  if (token && isMemoriesToken(token)) {
    const tokenHash = hashMemoriesToken(token, "participant-session");
    const snapshot = await findSessionByTokenHash(tokenHash);

    if (
      snapshot &&
      snapshot.event.id === eventInfo.id &&
      snapshot.participant.revokedAt === null &&
      snapshot.session.revokedAt === null &&
      Date.parse(snapshot.session.expiresAt) > Date.now()
    ) {
      // Obter nome de exibição do participante
      const pool = getNeonPool();
      const pRes = await pool.query(
        `SELECT COALESCE(p.display_name, g.name) as display_name FROM memory_participants p LEFT JOIN guests g ON g.id = p.guest_id WHERE p.id = $1;`,
        [snapshot.participant.id]
      );
      const displayName = pRes.rows[0]?.display_name || null;

      return {
        ok: true,
        context: {
          eventId: eventInfo.id,
          experienceId: eventInfo.experienceId,
          eventSlug: eventInfo.slug,
          invitationSlug: eventInfo.slug,
          authenticatedParticipant: {
            id: snapshot.participant.id,
            guestId: snapshot.participant.guestId,
            displayName,
          },
          accessScope: "guest_session",
        },
      };
    }
  }

  // 3. Verificar se foi fornecido um share token específico para o Recap (cookie, header ou query)
  const url = new URL(request.url);
  const isSecureEnv = process.env.NODE_ENV === "production";
  const cookieToken = readRecapShareCookie(request, eventInfo.id, isSecureEnv);
  const shareTokenOrCode =
    cookieToken ||
    request.headers.get("x-recap-token")?.trim() ||
    url.searchParams.get("token")?.trim() ||
    url.searchParams.get("code")?.trim();

  if (shareTokenOrCode) {
    let tokenHash: string | null = null;
    try {
      tokenHash = hashMemoriesToken(shareTokenOrCode, "access-link");
    } catch {
      tokenHash = null;
    }

    const pool = getNeonPool();
    const linkRes = await pool.query(
      `
      SELECT id, event_id, experience_id, scope_type, max_uses, uses, expires_at, revoked_at, enabled
      FROM memory_share_links
      WHERE (token_hash = $1 OR short_code = $2)
        AND enabled = true
      LIMIT 1;
      `,
      [tokenHash, shareTokenOrCode]
    );

    if (linkRes.rows.length > 0) {
      const link = linkRes.rows[0];
      const now = Date.now();
      const isUnexpired = !link.expires_at || Date.parse(link.expires_at) > now;
      const isUnderLimit = link.max_uses === null || link.uses < link.max_uses;

      // Hardening 10: O link DEVE pertencer à mesma experiência e evento
      if (
        link.event_id === eventInfo.id &&
        link.experience_id === eventInfo.experienceId &&
        link.revoked_at === null &&
        isUnexpired &&
        isUnderLimit &&
        (link.scope_type === "recap:view" || link.scope_type === "general")
      ) {
        // Hardening 11: Share link dá apenas scope 'share_link' sem participante completo
        return {
          ok: true,
          context: {
            eventId: eventInfo.id,
            experienceId: eventInfo.experienceId,
            eventSlug: eventInfo.slug,
            invitationSlug: eventInfo.slug,
            authenticatedParticipant: null,
            accessScope: "share_link",
            shareLinkId: link.id,
          },
        };
      }
    }
  }

  // 4. Se não houver sessão nem share link, assume scope "public" anónimo
  return {
    ok: true,
    context: {
      eventId: eventInfo.id,
      experienceId: eventInfo.experienceId,
      eventSlug: eventInfo.slug,
      invitationSlug: eventInfo.slug,
      authenticatedParticipant: null,
      accessScope: "public",
    },
  };
}

