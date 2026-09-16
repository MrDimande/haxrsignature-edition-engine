import { getNeonPool } from "@lib/db/neon-client";
import {
  createMemoriesToken,
  hashMemoriesToken,
  isMemoriesToken,
  isMemoriesUuid,
  readDisplayCookie,
} from "./session-security";

export interface DisplaySessionContext {
  id: string;
  eventId: string;
  experienceId: string;
  deviceLabel: string | null;
  expiresAt: string;
}

export type AuthorizeDisplayResult =
  | { ok: true; context: DisplaySessionContext }
  | { ok: false; status: number; error: string; code: string };

export interface CreateDisplaySessionInput {
  eventId: string;
  experienceId: string;
  deviceLabel?: string;
  sessionTtlHours?: number;
}

export interface CreateDisplaySessionResult {
  ok: boolean;
  error?: string;
  sessionToken?: string;
  sessionId?: string;
  expiresAt?: Date;
}

/**
 * Criação atómica de sessão de display pelo painel de administração/atelier.
 * O token em texto limpo é devolvido uma única vez ao solicitante; a BD armazena apenas o hash seguro.
 */
export async function createDisplaySession(
  input: CreateDisplaySessionInput
): Promise<CreateDisplaySessionResult> {
  const { eventId, experienceId, deviceLabel } = input;
  if (!isMemoriesUuid(eventId) || !isMemoriesUuid(experienceId)) {
    return { ok: false, error: "Identificadores de evento ou experiência inválidos." };
  }

  const ttlHours = input.sessionTtlHours ?? 24; // 24 horas por omissão
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlHours * 3600 * 1000);

  const token = createMemoriesToken();
  const tokenHash = hashMemoriesToken(token, "display-session");

  const pool = getNeonPool();
  try {
    const res = await pool.query(
      `INSERT INTO memory_display_sessions (
         event_id, experience_id, token_hash, device_label, expires_at
       ) VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [eventId, experienceId, tokenHash, deviceLabel?.trim() || null, expiresAt.toISOString()]
    );

    return {
      ok: true,
      sessionToken: token,
      sessionId: res.rows[0].id,
      expiresAt,
    };
  } catch (err: any) {
    console.error("[display-security] createDisplaySession error:", err?.message || err);
    return { ok: false, error: "Não foi possível criar a sessão de display." };
  }
}

/**
 * Revogação imediata de uma sessão de display.
 */
export async function revokeDisplaySession(sessionId: string): Promise<boolean> {
  if (!isMemoriesUuid(sessionId)) return false;
  const pool = getNeonPool();
  const res = await pool.query(
    `UPDATE memory_display_sessions
     SET revoked_at = now()
     WHERE id = $1 AND revoked_at IS NULL`,
    [sessionId]
  );
  return (res.rowCount ?? 0) > 0;
}

/**
 * Validação rigorosa de sessão de display no lado do servidor.
 * Protege contra:
 * - Tokens não autorizados ou de propósitos distintos (ex: tokens de participante).
 * - Sessões expiradas ou revogadas.
 * - Desalinhamento entre eventos (cross-event isolation).
 * - Acessos quando o Live Wall se encontra desactivado na experiência.
 */
export async function authorizeDisplayRequest(
  request: Request,
  expectedEventId: string,
  now = new Date()
): Promise<AuthorizeDisplayResult> {
  if (!isMemoriesUuid(expectedEventId)) {
    return { ok: false, status: 400, error: "Evento inválido.", code: "INVALID_EVENT" };
  }

  const isSecure = request.url.startsWith("https:");

  // 1. Tentar ler do cookie de display
  let token = readDisplayCookie(request, expectedEventId, isSecure);

  // 2. Fallback para cabeçalho Authorization: Bearer <token>
  if (!token) {
    const authHeader = request.headers.get("authorization") || "";
    if (authHeader.startsWith("Bearer ")) {
      const candidate = authHeader.slice(7).trim();
      if (isMemoriesToken(candidate)) {
        token = candidate;
      }
    }
  }

  if (!token) {
    return {
      ok: false,
      status: 401,
      error: "Credenciais de display ausentes ou em formato inválido.",
      code: "UNAUTHORIZED_DISPLAY",
    };
  }

  let tokenHash: string;
  try {
    tokenHash = hashMemoriesToken(token, "display-session");
  } catch {
    return {
      ok: false,
      status: 401,
      error: "Token de display inválido.",
      code: "INVALID_TOKEN",
    };
  }

  const pool = getNeonPool();
  const query = `
    SELECT
      ds.id,
      ds.event_id,
      ds.experience_id,
      ds.device_label,
      ds.expires_at,
      ds.revoked_at,
      ds.last_seen_at,
      me.live_wall_enabled,
      e.is_active AS event_active
    FROM memory_display_sessions ds
    JOIN memory_experiences me ON me.id = ds.experience_id AND me.event_id = ds.event_id
    JOIN events e ON e.id = ds.event_id
    WHERE ds.token_hash = $1
    LIMIT 1
  `;

  const res = await pool.query(query, [tokenHash]);
  if (res.rows.length === 0) {
    return {
      ok: false,
      status: 401,
      error: "Sessão de display não encontrada.",
      code: "DISPLAY_SESSION_NOT_FOUND",
    };
  }

  const row = res.rows[0];

  // Isolamento estrito de evento
  if (row.event_id !== expectedEventId) {
    return {
      ok: false,
      status: 403,
      error: "Sessão de display não autorizada para este evento.",
      code: "CROSS_EVENT_FORBIDDEN",
    };
  }

  // Validação de actividade do evento
  if (!row.event_active) {
    return {
      ok: false,
      status: 403,
      error: "O evento associado encontra-se inactivo.",
      code: "EVENT_INACTIVE",
    };
  }

  // Validação de revogação
  if (row.revoked_at !== null) {
    return {
      ok: false,
      status: 401,
      error: "A sessão de display foi revogada.",
      code: "DISPLAY_SESSION_REVOKED",
    };
  }

  // Validação de expiração
  const expiresAt = new Date(row.expires_at);
  if (expiresAt.getTime() <= now.getTime()) {
    return {
      ok: false,
      status: 401,
      error: "A sessão de display expirou.",
      code: "DISPLAY_SESSION_EXPIRED",
    };
  }

  // Validação do estado do Live Wall na experiência
  if (!row.live_wall_enabled) {
    return {
      ok: false,
      status: 403,
      error: "O Live Wall encontra-se actualmente desactivado para este evento.",
      code: "LIVE_WALL_DISABLED",
    };
  }

  // Actualização throttled de last_seen_at (máximo 1 vez a cada 5 minutos)
  const lastSeen = row.last_seen_at ? new Date(row.last_seen_at).getTime() : 0;
  if (now.getTime() - lastSeen > 5 * 60 * 1000) {
    pool.query(
      `UPDATE memory_display_sessions SET last_seen_at = $1 WHERE id = $2`,
      [now.toISOString(), row.id]
    ).catch(() => {});
  }

  return {
    ok: true,
    context: {
      id: row.id,
      eventId: row.event_id,
      experienceId: row.experience_id,
      deviceLabel: row.device_label,
      expiresAt: row.expires_at,
    },
  };
}

export interface DisplaySessionStatus {
  active: boolean;
  code?: "DISPLAY_SESSION_REVOKED" | "DISPLAY_SESSION_EXPIRED" | "DISPLAY_SESSION_NOT_FOUND" | "LIVE_WALL_DISABLED";
}

/**
 * Revalidação periódica e ultraleve de sessão de display activa durante stream SSE aberto.
 * Consulta apenas as colunas de estado de revogação/expiração por PK da sessão.
 */
export async function verifyDisplaySessionActive(
  sessionId: string,
  expectedEventId: string,
  now = new Date()
): Promise<DisplaySessionStatus> {
  if (!isMemoriesUuid(sessionId) || !isMemoriesUuid(expectedEventId)) {
    return { active: false, code: "DISPLAY_SESSION_NOT_FOUND" };
  }

  const pool = getNeonPool();
  try {
    const res = await pool.query(
      `SELECT ds.revoked_at, ds.expires_at, me.live_wall_enabled
       FROM memory_display_sessions ds
       JOIN memory_experiences me ON me.id = ds.experience_id AND me.event_id = ds.event_id
       WHERE ds.id = $1 AND ds.event_id = $2
       LIMIT 1`,
      [sessionId, expectedEventId]
    );

    if (res.rows.length === 0) {
      return { active: false, code: "DISPLAY_SESSION_NOT_FOUND" };
    }

    const row = res.rows[0];
    if (row.revoked_at !== null) {
      return { active: false, code: "DISPLAY_SESSION_REVOKED" };
    }

    if (new Date(row.expires_at).getTime() <= now.getTime()) {
      return { active: false, code: "DISPLAY_SESSION_EXPIRED" };
    }

    if (!row.live_wall_enabled) {
      return { active: false, code: "LIVE_WALL_DISABLED" };
    }

    return { active: true };
  } catch (err) {
    console.error("[display-security] verifyDisplaySessionActive error:", err);
    return { active: true };
  }
}
