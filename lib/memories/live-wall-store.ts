import { getNeonPool } from "@lib/db/neon-client";
import { getMemoriesStorageProvider } from "./storage";
import { resolveMemoriesConfig } from "./config";
import { getBatchSocialSummary, sanitizeCommentBody } from "./social-store";
import { listExplorersLeaderboard } from "./mission-store";
import { isMemoriesUuid } from "./session-security";

export interface LiveWallConfig {
  enabled: boolean;
  mode: "spotlight" | "mosaic" | "moments";
  autoAdvanceSeconds: number;
  showReactions: boolean;
  showComments: boolean;
  showExplorers: boolean;
  showMissions: boolean;
  stageFilterId: string | null;
  moderationDelaySeconds: number;
  maxWallItems: number;
}

export interface LiveWallCommentItem {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export interface LiveWallMediaItem {
  id: string;
  kind: "image" | "video";
  mediumUrl: string;
  thumbnailUrl: string;
  posterUrl: string | null;
  caption: string | null;
  guestName: string | null;
  stageId: string | null;
  challengeId: string | null;
  createdAt: string;
  reactions: Record<string, number>;
  totalReactions: number;
  comments: LiveWallCommentItem[];
}

export interface LiveWallExplorerItem {
  participantId: string;
  displayName: string;
  totalPoints: number;
  completedMissionsCount: number;
  rank: number;
}

export interface LiveWallSnapshotResult {
  ok: boolean;
  error?: string;
  code?: string;
  config?: LiveWallConfig;
  cursor?: number;
  media?: LiveWallMediaItem[];
  explorers?: LiveWallExplorerItem[];
}

export interface LiveWallEventItem {
  id: string;
  sequenceNo: number;
  eventType: string;
  subjectMediaId: string | null;
  subjectStageId?: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface LiveWallEventsResult {
  ok: boolean;
  error?: string;
  resyncRequired?: boolean;
  events?: LiveWallEventItem[];
}

/**
 * Consulta de Snapshot Atómica e Coerente com High-Water Mark (cursor sequence_no).
 * Respeita:
 * 1. Configuração por experiência em memory_experiences (live_wall_enabled).
 * 2. Somente mídias aprovadas (moderation_status = 'approved') e não ocultas.
 * 3. Política de derivados da Fase 5: prioriza WebP medium (1280px) e thumbnail (320px),
 *    evitando originais pesados de 8-15 MB.
 * 4. Bounded snapshot: limitado a maxWallItems (default 100).
 * 5. Agregações sociais e Explorers sem PII.
 */
export async function getLiveWallSnapshot(input: {
  eventId: string;
  experienceId: string;
  eventSlug: string;
  limit?: number;
}): Promise<LiveWallSnapshotResult> {
  const { eventId, experienceId, eventSlug } = input;
  if (!isMemoriesUuid(eventId) || !isMemoriesUuid(experienceId)) {
    return { ok: false, error: "Identificadores inválidos.", code: "INVALID_IDENTIFIERS" };
  }

  const pool = getNeonPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;");

    // 1. Obter configuração da experiência
    const expRes = await client.query(
      `SELECT
         live_wall_enabled,
         live_wall_mode,
         auto_advance_seconds,
         show_reactions,
         show_comments,
         show_explorers,
         show_missions,
         stage_filter_id,
         moderation_delay_seconds,
         max_wall_items
       FROM memory_experiences
       WHERE id = $1 AND event_id = $2
       LIMIT 1;`,
      [experienceId, eventId]
    );

    if (expRes.rows.length === 0) {
      await client.query("ROLLBACK;");
      return { ok: false, error: "Experiência não encontrada.", code: "EXPERIENCE_NOT_FOUND" };
    }

    const expRow = expRes.rows[0];
    const config: LiveWallConfig = {
      enabled: Boolean(expRow.live_wall_enabled),
      mode: (expRow.live_wall_mode || "spotlight") as LiveWallConfig["mode"],
      autoAdvanceSeconds: Math.max(Number(expRow.auto_advance_seconds ?? 10), 3),
      showReactions: Boolean(expRow.show_reactions),
      showComments: Boolean(expRow.show_comments),
      showExplorers: Boolean(expRow.show_explorers),
      showMissions: Boolean(expRow.show_missions),
      stageFilterId: expRow.stage_filter_id || null,
      moderationDelaySeconds: Math.max(Number(expRow.moderation_delay_seconds ?? 0), 0),
      maxWallItems: Math.min(Math.max(Number(expRow.max_wall_items ?? 100), 10), 200),
    };

    if (!config.enabled) {
      await client.query("ROLLBACK;");
      return {
        ok: false,
        error: "O Live Wall encontra-se desactivado para esta experiência.",
        code: "LIVE_WALL_DISABLED",
        config,
      };
    }

    // 2. Obter o High-Water Mark actual do stream na mesma transacção
    const streamRes = await client.query(
      `SELECT COALESCE(last_sequence_no, 0)::bigint as seq
       FROM memory_live_stream_state
       WHERE event_id = $1 AND experience_id = $2;`,
      [eventId, experienceId]
    );
    const cursor = Number(streamRes.rows[0]?.seq ?? 0);

    // 3. Consultar mídias elegíveis aprovadas
    const wallLimit = input.limit ? Math.min(input.limit, config.maxWallItems) : config.maxWallItems;

    let mediaQuery = `
      SELECT
        id,
        storage_path,
        thumbnail_storage_path,
        medium_storage_path,
        poster_storage_path,
        has_derivatives,
        derivatives_status,
        file_size_bytes,
        media_type,
        caption,
        guest_name,
        stage_id,
        challenge_id,
        created_at
      FROM wedding_photos
      WHERE event_id = $1
        AND experience_id = $2
        AND moderation_status = 'approved'
    `;
    const queryParams: any[] = [eventId, experienceId];

    if (config.stageFilterId) {
      queryParams.push(config.stageFilterId);
      mediaQuery += ` AND stage_id = $${queryParams.length}`;
    }

    if (config.moderationDelaySeconds > 0) {
      queryParams.push(config.moderationDelaySeconds);
      mediaQuery += ` AND created_at <= (now() - ($${queryParams.length} || ' seconds')::interval)`;
    }

    // Requisito de Derivados (Fase 7, Hardening 10):
    // Prioriza mídias com derivados prontos. Mídias pesadas sem derivados são retidas até ficarem prontas.
    mediaQuery += `
      AND (
        has_derivatives = true
        OR derivatives_status = 'ready'
        OR (file_size_bytes <= 2097152 AND derivatives_status != 'failed')
      )
    `;

    queryParams.push(wallLimit);
    mediaQuery += ` ORDER BY created_at DESC LIMIT $${queryParams.length};`;

    const mediaRes = await client.query(mediaQuery, queryParams);
    await client.query("COMMIT;");

    const storageProvider = getMemoriesStorageProvider();
    const appConfig = resolveMemoriesConfig(eventSlug);
    const ttlSeconds = appConfig?.signedUrlTtlSeconds ?? 3600;

    const mediaRows = mediaRes.rows;
    const mediaIds = mediaRows.map((r: any) => r.id);

    // 4. Carregar agregações sociais em lote (zero N+1)
    let socialMap = new Map();
    if (config.showReactions && mediaIds.length > 0) {
      socialMap = await getBatchSocialSummary(mediaIds);
    }

    // 5. Carregar comentários aprovados em lote para as mídias visíveis
    const commentsByMedia = new Map<string, LiveWallCommentItem[]>();
    if (config.showComments && mediaIds.length > 0) {
      const commRes = await pool.query(
        `SELECT
           c.id,
           c.media_id,
           c.body,
           c.created_at,
           p.display_name as author_name
         FROM memory_media_comments c
         JOIN memory_participants p ON p.id = c.participant_id
         WHERE c.event_id = $1
           AND c.experience_id = $2
           AND c.media_id = ANY($3::uuid[])
           AND c.status = 'approved'
         ORDER BY c.created_at ASC;`,
        [eventId, experienceId, mediaIds]
      );

      for (const cr of commRes.rows) {
        const list = commentsByMedia.get(cr.media_id) || [];
        if (list.length < 3) {
          list.push({
            id: cr.id,
            authorName: cr.author_name || "Convidado",
            body: sanitizeCommentBody(cr.body).slice(0, 120), // Truncado seguro
            createdAt: cr.created_at,
          });
          commentsByMedia.set(cr.media_id, list);
        }
      }
    }

    // 6. Assinatura de URLs seguras dos derivados WebP
    const mediaItems: LiveWallMediaItem[] = [];
    for (const r of mediaRows) {
      let mediumUrl: string | null = null;
      let thumbnailUrl: string | null = null;
      let posterUrl: string | null = null;

      const mediumPath = r.medium_storage_path || r.storage_path;
      const thumbPath = r.thumbnail_storage_path || r.storage_path;

      try {
        const signedMedium = await storageProvider.createSignedDownloadUrl({
          storagePath: mediumPath,
          expiresInSeconds: ttlSeconds,
        });
        mediumUrl = signedMedium.downloadUrl;

        const signedThumb = await storageProvider.createSignedDownloadUrl({
          storagePath: thumbPath,
          expiresInSeconds: ttlSeconds,
        });
        thumbnailUrl = signedThumb.downloadUrl;

        if (r.poster_storage_path) {
          const signedPoster = await storageProvider.createSignedDownloadUrl({
            storagePath: r.poster_storage_path,
            expiresInSeconds: ttlSeconds,
          });
          posterUrl = signedPoster.downloadUrl;
        }
      } catch (signErr) {
        console.error(`[live-wall-store] Erro ao assinar URL para foto ${r.id}:`, signErr);
        continue;
      }

      const social = socialMap.get(r.id);
      mediaItems.push({
        id: r.id,
        kind: r.media_type === "video" ? "video" : "image",
        mediumUrl: mediumUrl || "",
        thumbnailUrl: thumbnailUrl || "",
        posterUrl,
        caption: r.caption || null,
        guestName: r.guest_name || null,
        stageId: r.stage_id || null,
        challengeId: r.challenge_id || null,
        createdAt: r.created_at,
        reactions: social?.reactionCounts || { love: 0, applause: 0, champagne: 0, elegance: 0, toast: 0 },
        totalReactions: social?.totalReactions || 0,
        comments: commentsByMedia.get(r.id) || [],
      });
    }

    // 7. Explorers Leaderboard público (Top 5 sem PII)
    let explorers: LiveWallExplorerItem[] = [];
    if (config.showExplorers) {
      try {
        const leadRes = await listExplorersLeaderboard(eventSlug);
        if (leadRes.success && Array.isArray(leadRes.leaderboard)) {
          explorers = leadRes.leaderboard.slice(0, 5).map((e: any) => ({
            participantId: e.participantId,
            displayName: e.displayName,
            totalPoints: e.totalPoints,
            completedMissionsCount: e.completedMissionsCount,
            rank: e.rank,
          }));
        }
      } catch (leadErr) {
        console.error("[live-wall-store] Erro ao carregar explorers:", leadErr);
      }
    }

    return {
      ok: true,
      config,
      cursor,
      media: mediaItems,
      explorers,
    };
  } catch (err: any) {
    await client.query("ROLLBACK;").catch(() => {});
    console.error("[live-wall-store] getLiveWallSnapshot error:", err?.message || err);
    return { ok: false, error: "Não foi possível carregar o snapshot do Live Wall.", code: "DB_ERROR" };
  } finally {
    client.release();
  }
}

/**
 * Consulta de Eventos Incrementais SSE a partir de um Cursor Monotónico.
 * Detecta se o cursor foi podado pela janela de retenção e devolve `resyncRequired = true`.
 */
export async function getLiveEventsSince(input: {
  eventId: string;
  experienceId: string;
  cursor: number;
  limit?: number;
}): Promise<LiveWallEventsResult> {
  const { eventId, experienceId, cursor } = input;
  const limit = Math.min(Math.max(input.limit ?? 50, 1), 100);

  const pool = getNeonPool();
  try {
    // 1. Verificar se o cursor fornecido ficou aquém da janela de retenção
    const rangeRes = await pool.query(
      `SELECT
         MIN(sequence_no) as min_seq,
         MAX(sequence_no) as max_seq
       FROM memory_live_events
       WHERE event_id = $1 AND experience_id = $2;`,
      [eventId, experienceId]
    );

    const minSeq = rangeRes.rows[0]?.min_seq ? Number(rangeRes.rows[0].min_seq) : null;
    if (minSeq !== null && minSeq > 1 && cursor < minSeq - 1) {
      // O cursor foi podado pela janela de retenção -> Cliente deve reconstruir estado via Snapshot
      return { ok: true, resyncRequired: true, events: [] };
    }

    // 2. Buscar eventos sequenciais com sequence_no > cursor
    const eventsRes = await pool.query(
      `SELECT
         id::text,
         sequence_no::bigint,
         event_type,
         subject_media_id::text,
         subject_stage_id::text,
         payload,
         created_at
       FROM memory_live_events
       WHERE event_id = $1
         AND experience_id = $2
         AND sequence_no > $3
       ORDER BY sequence_no ASC
       LIMIT $4;`,
      [eventId, experienceId, cursor, limit]
    );

    const events: LiveWallEventItem[] = eventsRes.rows.map((r: any) => ({
      id: r.id,
      sequenceNo: Number(r.sequence_no),
      eventType: r.event_type,
      subjectMediaId: r.subject_media_id ? String(r.subject_media_id) : null,
      subjectStageId: r.subject_stage_id ? String(r.subject_stage_id) : null,
      payload: r.payload || {},
      createdAt: r.created_at,
    }));

    return { ok: true, resyncRequired: false, events };
  } catch (err: any) {
    console.error("[live-wall-store] getLiveEventsSince error:", err?.message || err);
    return { ok: false, error: "Erro ao consultar eventos em tempo real." };
  }
}

/**
 * Renovação atómica de URLs assinadas da Cloudflare R2 para mídias activas no Live Wall.
 * Revalida que cada mídia continua aprovada e pertencente ao evento antes de assinar.
 */
export async function refreshLiveWallUrls(input: {
  eventId: string;
  experienceId: string;
  eventSlug: string;
  mediaIds: string[];
}): Promise<{ ok: boolean; urls?: Record<string, { mediumUrl: string; thumbnailUrl: string; posterUrl: string | null }>; error?: string }> {
  const { eventId, experienceId, eventSlug, mediaIds } = input;
  if (!mediaIds || mediaIds.length === 0) {
    return { ok: true, urls: {} };
  }

  const cleanIds = mediaIds.filter(isMemoriesUuid).slice(0, 100);
  if (cleanIds.length === 0) {
    return { ok: true, urls: {} };
  }

  const pool = getNeonPool();
  try {
    const res = await pool.query(
      `SELECT
         id,
         storage_path,
         thumbnail_storage_path,
         medium_storage_path,
         poster_storage_path
       FROM wedding_photos
       WHERE id = ANY($1::uuid[])
         AND event_id = $2
         AND experience_id = $3
         AND moderation_status = 'approved';`,
      [cleanIds, eventId, experienceId]
    );

    const storageProvider = getMemoriesStorageProvider();
    const appConfig = resolveMemoriesConfig(eventSlug);
    const ttlSeconds = appConfig?.signedUrlTtlSeconds ?? 3600;

    const urls: Record<string, { mediumUrl: string; thumbnailUrl: string; posterUrl: string | null }> = {};

    for (const r of res.rows) {
      const mediumPath = r.medium_storage_path || r.storage_path;
      const thumbPath = r.thumbnail_storage_path || r.storage_path;

      try {
        const signedMedium = await storageProvider.createSignedDownloadUrl({
          storagePath: mediumPath,
          expiresInSeconds: ttlSeconds,
        });
        const signedThumb = await storageProvider.createSignedDownloadUrl({
          storagePath: thumbPath,
          expiresInSeconds: ttlSeconds,
        });
        let posterUrl: string | null = null;
        if (r.poster_storage_path) {
          const signedPoster = await storageProvider.createSignedDownloadUrl({
            storagePath: r.poster_storage_path,
            expiresInSeconds: ttlSeconds,
          });
          posterUrl = signedPoster.downloadUrl;
        }

        urls[r.id] = {
          mediumUrl: signedMedium.downloadUrl,
          thumbnailUrl: signedThumb.downloadUrl,
          posterUrl,
        };
      } catch (signErr) {
        console.error(`[live-wall-store] refreshLiveWallUrls sign error for ${r.id}:`, signErr);
      }
    }

    return { ok: true, urls };
  } catch (err: any) {
    console.error("[live-wall-store] refreshLiveWallUrls error:", err?.message || err);
    return { ok: false, error: "Erro ao renovar URLs de mídia." };
  }
}
