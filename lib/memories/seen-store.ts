import { getNeonPool } from "@lib/db/neon-client";

export interface RecordMediaViewInput {
  eventId: string;
  experienceId: string;
  mediaId: string;
  participantId: string;
  sessionId?: string | null;
  progress?: number;
}

export interface MediaViewRecord {
  id: string;
  eventId: string;
  experienceId: string;
  mediaId: string;
  participantId: string;
  sessionId: string | null;
  seenAt: string;
  lastProgress: number;
}

/**
 * Regista ou actualiza o estado de visualização de uma mídia por um participante.
 * Operação estritamente idempotente (ON CONFLICT participante + mídia) protegida por RLS
 * através de contexto seguro de transacção (haxr.current_participant_id).
 */
export async function recordMediaView(
  input: RecordMediaViewInput
): Promise<{ success: boolean; error?: string }> {
  const pool = getNeonPool();
  const progress = Math.min(Math.max(input.progress ?? 1.0, 0.0), 1.0);

  const query = `
    INSERT INTO memory_media_views (
      event_id,
      experience_id,
      media_id,
      participant_id,
      session_id,
      seen_at,
      last_progress
    )
    VALUES ($1, $2, $3, $4, $5, now(), $6)
    ON CONFLICT (participant_id, media_id)
    DO UPDATE SET
      seen_at = now(),
      last_progress = GREATEST(memory_media_views.last_progress, EXCLUDED.last_progress),
      session_id = COALESCE(EXCLUDED.session_id, memory_media_views.session_id)
    RETURNING id;
  `;

  const client = await pool.connect();
  try {
    await client.query("BEGIN;");
    await client.query("SELECT set_config('haxr.current_participant_id', $1, true);", [
      input.participantId,
    ]);
    const res = await client.query(query, [
      input.eventId,
      input.experienceId,
      input.mediaId,
      input.participantId,
      input.sessionId || null,
      progress,
    ]);
    await client.query("COMMIT;");
    return { success: res.rows.length > 0 };
  } catch (err: any) {
    await client.query("ROLLBACK;").catch(() => {});
    console.error("Erro ao registar visualização de mídia:", err.message);
    return { success: false, error: err.message };
  } finally {
    client.release();
  }
}

/**
 * Obtém o conjunto de IDs de mídias já visualizadas por um participante no evento,
 * com protecção RLS no PostgreSQL via contexto da transacção.
 */
export async function getSeenMediaIdsForParticipant(
  participantId: string,
  eventId: string
): Promise<Set<string>> {
  if (!participantId) return new Set();

  const pool = getNeonPool();
  const query = `
    SELECT media_id
    FROM memory_media_views
    WHERE participant_id = $1 AND event_id = $2;
  `;

  const client = await pool.connect();
  try {
    await client.query("BEGIN;");
    await client.query("SELECT set_config('haxr.current_participant_id', $1, true);", [
      participantId,
    ]);
    const res = await client.query<{ media_id: string }>(query, [participantId, eventId]);
    await client.query("COMMIT;");
    return new Set(res.rows.map((r) => r.media_id));
  } catch (err: any) {
    await client.query("ROLLBACK;").catch(() => {});
    console.warn("Erro ao obter seenMediaIds:", err.message);
    return new Set();
  } finally {
    client.release();
  }
}
