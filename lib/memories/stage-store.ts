import { getNeonPool } from "@lib/db/neon-client";
import { CANONICAL_WEDDING_STAGES, type MemoryStage } from "./stage-policy";

interface StageDbRow {
  id: string;
  experience_id: string;
  event_id: string;
  slug: string;
  label: string;
  order_index: number;
  is_active: boolean;
  starts_at: Date | string | null;
  ends_at: Date | string | null;
  config: Record<string, unknown> | null;
  created_at: Date | string;
  updated_at: Date | string;
}

function mapStageRow(row: StageDbRow): MemoryStage {
  return {
    id: row.id,
    experienceId: row.experience_id,
    eventId: row.event_id,
    slug: row.slug,
    label: row.label,
    orderIndex: row.order_index,
    isActive: Boolean(row.is_active),
    startsAt: row.starts_at ? new Date(row.starts_at).toISOString() : null,
    endsAt: row.ends_at ? new Date(row.ends_at).toISOString() : null,
    config: row.config || {},
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

/**
 * Lista todas as etapas de uma experiência com isolamento rigoroso por evento.
 */
export async function listStages(
  experienceId: string,
  eventId: string
): Promise<MemoryStage[]> {
  const pool = getNeonPool();
  const query = `
    SELECT
      id,
      experience_id,
      event_id,
      slug,
      label,
      order_index,
      is_active,
      starts_at,
      ends_at,
      config,
      created_at,
      updated_at
    FROM memory_stages
    WHERE experience_id = $1 AND event_id = $2
    ORDER BY order_index ASC;
  `;

  const res = await pool.query<StageDbRow>(query, [experienceId, eventId]);
  return res.rows.map(mapStageRow);
}

/**
 * Obtém uma etapa específica garantindo integridade de evento.
 */
export async function getStageById(
  stageId: string,
  eventId: string
): Promise<MemoryStage | null> {
  const pool = getNeonPool();
  const query = `
    SELECT
      id,
      experience_id,
      event_id,
      slug,
      label,
      order_index,
      is_active,
      starts_at,
      ends_at,
      config,
      created_at,
      updated_at
    FROM memory_stages
    WHERE id = $1 AND event_id = $2
    LIMIT 1;
  `;

  const res = await pool.query<StageDbRow>(query, [stageId, eventId]);
  if (res.rows.length === 0) return null;
  return mapStageRow(res.rows[0]);
}

/**
 * Garante que os stages canónicos padrão existem para uma experiência.
 */
export async function ensureDefaultStages(
  experienceId: string,
  eventId: string
): Promise<MemoryStage[]> {
  const existing = await listStages(experienceId, eventId);
  if (existing.length > 0) {
    return existing;
  }

  const pool = getNeonPool();
  for (const s of CANONICAL_WEDDING_STAGES) {
    await pool.query(
      `
      INSERT INTO memory_stages (experience_id, event_id, slug, label, order_index, is_active)
      VALUES ($1, $2, $3, $4, $5, true)
      ON CONFLICT (experience_id, slug) DO NOTHING;
      `,
      [experienceId, eventId, s.slug, s.label, s.orderIndex]
    );
  }

  return listStages(experienceId, eventId);
}
