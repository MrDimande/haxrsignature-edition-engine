import { getNeonPool } from "@lib/db/neon-client";
import { getInvitation } from "@data/invitations";
import {
  createMemoriesToken,
  hashMemoriesToken,
  isMemoriesUuid,
} from "./session-security";
import {
  mayExchangeMemoriesLink,
  type MemoriesAccessLinkSnapshot,
} from "./access-link-policy";
import type { MemoriesSessionSnapshot, MemoriesVisibility } from "./session-policy";

export interface ExchangeAccessLinkResult {
  ok: boolean;
  error?: string;
  sessionToken?: string;
  expiresAt?: Date;
  eventId?: string;
  participantId?: string;
  tableId?: string | null;
  guestId?: string | null;
}

export interface SessionStoreEventInfo {
  id: string;
  slug: string;
  experienceId: string;
  accessMode: "legacy" | "session";
  active: boolean;
  visibility: MemoriesVisibility;
  uploadsEnabled: boolean;
  competitionEnabled: boolean;
}

/**
 * Resolve o evento operacional e a experiência Memories a partir de slug ou ID.
 */
export async function resolveMemoriesEvent(identifier: string): Promise<SessionStoreEventInfo | null> {
  const pool = getNeonPool();
  const isUuid = isMemoriesUuid(identifier);

  const invitation = !isUuid ? getInvitation(identifier) : null;
  const registryKey = invitation?.admin?.expectedRegistryKey ?? null;

  const query = `
    SELECT
      e.id AS event_id,
      e.is_active AS event_active,
      me.id AS experience_id,
      me.event_slug,
      me.invitation_slug,
      COALESCE(me.access_mode, 'legacy') AS access_mode,
      COALESCE(me.visibility, 'moderated') AS visibility,
      COALESCE(me.uploads_enabled, true) AS uploads_enabled,
      COALESCE(me.competition_enabled, true) AS competition_enabled
    FROM memory_experiences me
    JOIN events e ON e.id = me.event_id
    WHERE ${
      isUuid
        ? "e.id = $1 OR me.id = $1"
        : "me.event_slug = $1 OR me.invitation_slug = $1 OR ($2::text IS NOT NULL AND (me.event_slug = $2 OR me.invitation_slug = $2 OR e.edition_registry_key = $2))"
    }
    LIMIT 1
  `;

  const res = isUuid
    ? await pool.query(query, [identifier])
    : await pool.query(query, [identifier, registryKey]);

  if (res.rows.length === 0) return null;

  const row = res.rows[0];
  return {
    id: row.event_id,
    slug: invitation?.slug || row.invitation_slug || row.event_slug,
    experienceId: row.experience_id,
    accessMode: row.access_mode as "legacy" | "session",
    active: Boolean(row.event_active),
    visibility: row.visibility as MemoriesVisibility,
    uploadsEnabled: Boolean(row.uploads_enabled),
    competitionEnabled: Boolean(row.competition_enabled),
  };
}

/**
 * Consulta o snapshot completo da sessão por hash do token opaco.
 */
export async function findSessionByTokenHash(tokenHash: string): Promise<MemoriesSessionSnapshot | null> {
  const pool = getNeonPool();

  const query = `
    SELECT
      s.id AS session_id,
      s.event_id,
      s.participant_id,
      s.access_link_id,
      s.expires_at AS session_expires_at,
      s.revoked_at AS session_revoked_at,
      p.guest_id,
      p.revoked_at AS participant_revoked_at,
      l.expires_at AS link_expires_at,
      l.revoked_at AS link_revoked_at,
      e.is_active AS event_active,
      me.event_slug,
      COALESCE(me.visibility, 'moderated') AS visibility,
      COALESCE(me.uploads_enabled, true) AS uploads_enabled,
      COALESCE(me.competition_enabled, true) AS competition_enabled
    FROM memory_sessions s
    JOIN memory_participants p ON p.id = s.participant_id
    JOIN events e ON e.id = s.event_id
    JOIN memory_experiences me ON me.id = s.experience_id
    LEFT JOIN memory_share_links l ON l.id = s.access_link_id
    WHERE s.token_hash = $1
    LIMIT 1
  `;

  const res = await pool.query(query, [tokenHash]);
  if (res.rows.length === 0) return null;

  const row = res.rows[0];
  const accessLinkId = row.access_link_id || "00000000-0000-0000-0000-000000000000";

  return {
    event: {
      id: row.event_id,
      slug: row.event_slug,
      active: Boolean(row.event_active),
      visibility: row.visibility as MemoriesVisibility,
      uploadsEnabled: Boolean(row.uploads_enabled),
      competitionEnabled: Boolean(row.competition_enabled),
    },
    participant: {
      id: row.participant_id,
      eventId: row.event_id,
      guestId: row.guest_id ?? null,
      revokedAt: row.participant_revoked_at
        ? new Date(row.participant_revoked_at).toISOString()
        : null,
    },
    session: {
      id: row.session_id,
      eventId: row.event_id,
      participantId: row.participant_id,
      accessLinkId,
      expiresAt: new Date(row.session_expires_at).toISOString(),
      revokedAt: row.session_revoked_at
        ? new Date(row.session_revoked_at).toISOString()
        : null,
    },
    accessLink: {
      id: accessLinkId,
      eventId: row.event_id,
      expiresAt: row.link_expires_at ? new Date(row.link_expires_at).toISOString() : null,
      revokedAt: row.link_revoked_at ? new Date(row.link_revoked_at).toISOString() : null,
    },
  };
}

/**
 * Cria ou reutiliza um participante funcional para o evento.
 */
export async function getOrCreateParticipant(
  client: { query: (q: string, p?: any[]) => Promise<any> },
  eventId: string,
  experienceId: string,
  guestId?: string | null,
  assignedTableId?: string | null,
  displayName?: string | null
): Promise<string> {
  if (guestId && isMemoriesUuid(guestId)) {
    const existing = await client.query(
      `SELECT id FROM memory_participants WHERE event_id = $1 AND guest_id = $2 LIMIT 1`,
      [eventId, guestId]
    );
    if (existing.rows.length > 0) {
      return existing.rows[0].id;
    }
  }

  const insert = await client.query(
    `INSERT INTO memory_participants (
       event_id, experience_id, guest_id, assigned_table_id, display_name
     ) VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [
      eventId,
      experienceId,
      guestId || null,
      assignedTableId || null,
      displayName || null,
    ]
  );
  return insert.rows[0].id;
}

/**
 * Troca atómica de Access Link por Sessão Revogável com Cookie Seguro.
 */
export async function exchangeAccessLink(input: {
  tokenOrCode: string;
  now?: Date;
  sessionTtlSeconds?: number;
}): Promise<ExchangeAccessLinkResult> {
  const pool = getNeonPool();
  const now = input.now ?? new Date();
  const ttlSeconds = input.sessionTtlSeconds ?? 7 * 86400; // 7 dias por omissão

  let tokenHash: string | null = null;
  try {
    tokenHash = hashMemoriesToken(input.tokenOrCode, "access-link");
  } catch {
    // Se não for um token opaco de 43 caracteres, pode ser um short_code
    tokenHash = null;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const query = `
      SELECT
        l.id, l.event_id, l.experience_id, l.short_code, l.token_hash,
        l.scope_type, l.scope_guest_id, l.scope_table_id,
        l.max_uses, l.uses, l.expires_at, l.revoked_at, l.enabled,
        g.id AS guest_id, g.event_id AS guest_event_id,
        e.is_active AS event_active
      FROM memory_share_links l
      JOIN events e ON e.id = l.event_id
      LEFT JOIN guests g ON g.id = l.scope_guest_id
      WHERE (l.token_hash = $1 OR l.short_code = $2)
        AND l.enabled = true
      FOR UPDATE OF l
    `;

    const res = await client.query(query, [tokenHash, input.tokenOrCode]);
    if (res.rows.length === 0) {
      await client.query("ROLLBACK");
      return { ok: false, error: "Link de acesso não encontrado ou inactivo." };
    }

    const row = res.rows[0];

    // Montar o snapshot do link para validação estrita de contrato
    const linkSnapshot: MemoriesAccessLinkSnapshot = {
      id: row.id,
      eventId: row.event_id,
      revokedAt: row.revoked_at ? new Date(row.revoked_at).toISOString() : null,
      expiresAt: row.expires_at
        ? new Date(row.expires_at).toISOString()
        : new Date(now.getTime() + 365 * 86400 * 1000).toISOString(),
      uses: Number(row.uses),
      maxUses: row.max_uses ? Number(row.max_uses) : null,
      scope:
        row.scope_type === "guest" && row.guest_id
          ? { kind: "guest", guestId: row.guest_id, guestEventId: row.guest_event_id }
          : row.scope_type === "table" && row.scope_table_id
          ? { kind: "table", tableId: row.scope_table_id, tableEventId: row.event_id }
          : { kind: "general" },
    };

    if (!row.event_active || !mayExchangeMemoriesLink(row.event_id, linkSnapshot, now)) {
      await client.query("ROLLBACK");
      return { ok: false, error: "Link de acesso inválido, esgotado ou revogado." };
    }

    // Resolver participante no servidor
    const participantId = await getOrCreateParticipant(
      client,
      row.event_id,
      row.experience_id,
      row.guest_id,
      row.scope_table_id,
      null
    );

    // Gerar credencial de sessão opaca e hash persistido
    const sessionToken = createMemoriesToken();
    const sessionHash = hashMemoriesToken(sessionToken, "participant-session");
    const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

    // Criar registo de sessão persistida
    await client.query(
      `INSERT INTO memory_sessions (
         token_hash, participant_id, event_id, experience_id,
         access_link_id, expires_at
       ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        sessionHash,
        participantId,
        row.event_id,
        row.experience_id,
        row.id,
        expiresAt.toISOString(),
      ]
    );

    // Incrementar usos do link
    await client.query(
      `UPDATE memory_share_links SET uses = uses + 1, updated_at = now() WHERE id = $1`,
      [row.id]
    );

    await client.query("COMMIT");

    return {
      ok: true,
      sessionToken,
      expiresAt,
      eventId: row.event_id,
      participantId,
      tableId: row.scope_table_id,
      guestId: row.guest_id,
    };
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("[SessionStore] exchangeAccessLink error:", err?.message || err);
    return { ok: false, error: "Não foi possível validar o link de acesso." };
  } finally {
    client.release();
  }
}

/**
 * Revoga uma sessão imediatamente.
 */
export async function revokeSession(sessionId: string): Promise<boolean> {
  const pool = getNeonPool();
  const res = await pool.query(
    `UPDATE memory_sessions SET revoked_at = now() WHERE id = $1 AND revoked_at IS NULL`,
    [sessionId]
  );
  return (res.rowCount ?? 0) > 0;
}

/**
 * Revoga um participante e todas as suas sessões imediatamente.
 */
export async function revokeParticipant(participantId: string): Promise<boolean> {
  const pool = getNeonPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `UPDATE memory_participants SET revoked_at = now() WHERE id = $1 AND revoked_at IS NULL`,
      [participantId]
    );
    await client.query(
      `UPDATE memory_sessions SET revoked_at = now() WHERE participant_id = $1 AND revoked_at IS NULL`,
      [participantId]
    );
    await client.query("COMMIT");
    return true;
  } catch (err) {
    await client.query("ROLLBACK");
    return false;
  } finally {
    client.release();
  }
}

/**
 * Revoga um Access Link e cancela novas sessões.
 */
export async function revokeAccessLink(linkId: string): Promise<boolean> {
  const pool = getNeonPool();
  const res = await pool.query(
    `UPDATE memory_share_links SET revoked_at = now(), enabled = false WHERE id = $1 AND revoked_at IS NULL`,
    [linkId]
  );
  return (res.rowCount ?? 0) > 0;
}
