/**
 * HAXR PLUS MEMORIES — SERVIÇO DE ENGAJAMENTO & SOCIAL PRIVADO
 *
 * Reacções, Comentários Moderados e Favoritos Estritamente Privados
 * com isolamento relacional por event_id + experience_id + media_id + participant_id.
 */

import { getNeonPool } from "@lib/db/neon-client";
import { resolveMemoriesEvent } from "./session-store";

export const ALLOWED_REACTION_TYPES = [
  "love",
  "applause",
  "champagne",
  "elegance",
  "toast",
] as const;

export type ReactionType = (typeof ALLOWED_REACTION_TYPES)[number];

export interface SocialMediaSummary {
  mediaId: string;
  reactionCounts: Record<ReactionType, number>;
  totalReactions: number;
  userReaction: ReactionType | null;
  isFavorite: boolean;
  commentsCount: number;
}

export interface CommentItem {
  id: string;
  mediaId: string;
  participantId: string;
  authorName: string;
  body: string;
  status: "pending" | "approved" | "rejected" | "hidden" | "deleted";
  createdAt: string;
}

export interface ToggleReactionInput {
  slug: string;
  mediaId: string;
  participantId: string;
  reactionType: string;
}

export interface ToggleReactionResult {
  success: boolean;
  action: "added" | "changed" | "idempotent" | "removed";
  reactionType: ReactionType | null;
  reactionCounts: Record<ReactionType, number>;
  totalReactions: number;
  error?: string;
}

export interface FavoriteInput {
  slug: string;
  mediaId: string;
  participantId: string;
}

export interface FavoriteResult {
  success: boolean;
  isFavorite: boolean;
  error?: string;
}

export interface AddCommentInput {
  slug: string;
  mediaId: string;
  participantId: string;
  body: string;
}

export interface AddCommentResult {
  success: boolean;
  comment?: CommentItem;
  error?: string;
}

export interface ListCommentsInput {
  slug: string;
  mediaId: string;
  participantId?: string | null;
  limit?: number;
  offset?: number;
}

/**
 * Normaliza o texto de um comentário removendo caracteres de controlo perigosos e whitespace excessivo.
 * O texto é armazenado em formato canónico simples (plaintext), sem conversão permanente para entidades HTML,
 * sendo a protecção contra XSS garantida nativamente pelo renderer do React.
 */
export function sanitizeCommentBody(raw: string): string {
  if (!raw) return "";
  // 1. Remover caracteres de controlo perigosos (excepto \t e \n)
  let cleaned = raw.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");

  // 2. Normalizar quebras de linha e limitar linhas consecutivas em branco a no máximo 2
  cleaned = cleaned
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return cleaned;
}

/**
 * Verifica se a mídia existe, pertence à experiência e está visível (aprovada).
 */
export async function verifyMediaAccess(
  client: any,
  mediaId: string,
  eventId: string,
  experienceId: string
): Promise<boolean> {
  const res = await client.query(
    `
    SELECT id
    FROM wedding_photos
    WHERE id = $1 AND event_id = $2 AND experience_id = $3 AND moderation_status = 'approved';
    `,
    [mediaId, eventId, experienceId]
  );
  return res.rows.length > 0;
}

/**
 * Regista ou altera uma reacção a uma foto/vídeo de forma determinística e idempotente.
 * Se o participante já tiver esta mesma reacção, mantém-na (idempotência no retry).
 * Se tiver outra reacção diferente, actualiza para a nova (troca determinística).
 * Se não tiver nenhuma, insere.
 */
export async function toggleMediaReaction(
  input: ToggleReactionInput
): Promise<ToggleReactionResult> {
  const trimmedType = input.reactionType?.trim().toLowerCase();
  if (!ALLOWED_REACTION_TYPES.includes(trimmedType as ReactionType)) {
    return {
      success: false,
      action: "removed",
      reactionType: null,
      reactionCounts: { love: 0, applause: 0, champagne: 0, elegance: 0, toast: 0 },
      totalReactions: 0,
      error: "Tipo de reacção inválido.",
    };
  }
  const reactionType = trimmedType as ReactionType;

  const eventInfo = await resolveMemoriesEvent(input.slug);
  if (!eventInfo) {
    return {
      success: false,
      action: "removed",
      reactionType: null,
      reactionCounts: { love: 0, applause: 0, champagne: 0, elegance: 0, toast: 0 },
      totalReactions: 0,
      error: "Evento não encontrado.",
    };
  }

  const pool = getNeonPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN;");
    await client.query("SELECT set_config('haxr.current_participant_id', $1, true);", [
      input.participantId,
    ]);

    // 1. Verificar visibilidade da mídia
    const isAccessible = await verifyMediaAccess(client, input.mediaId, eventInfo.id, eventInfo.experienceId);
    if (!isAccessible) {
      await client.query("ROLLBACK;");
      return {
        success: false,
        action: "removed",
        reactionType: null,
        reactionCounts: { love: 0, applause: 0, champagne: 0, elegance: 0, toast: 0 },
        totalReactions: 0,
        error: "Mídia não encontrada ou indisponível.",
      };
    }

    // 2. Lock no registo de reacção do participante nesta mídia
    const currentRes = await client.query(
      `
      SELECT id, reaction_type
      FROM memory_media_reactions
      WHERE participant_id = $1 AND media_id = $2
      FOR UPDATE;
      `,
      [input.participantId, input.mediaId]
    );

    let action: "added" | "changed" | "idempotent" = "added";
    let activeType: ReactionType = reactionType;

    if (currentRes.rows.length > 0) {
      const existing = currentRes.rows[0];
      if (existing.reaction_type === reactionType) {
        // Idempotência perfeita: retry com a mesma reacção não altera nem duplica
        action = "idempotent";
        activeType = reactionType;
      } else {
        // Trocar de tipo de reacção determinístico
        await client.query(
          `
          UPDATE memory_media_reactions
          SET reaction_type = $1, updated_at = now()
          WHERE id = $2;
          `,
          [reactionType, existing.id]
        );
        action = "changed";
        activeType = reactionType;
      }
    } else {
      // Inserir nova reacção
      await client.query(
        `
        INSERT INTO memory_media_reactions (
          event_id, experience_id, media_id, participant_id, reaction_type
        ) VALUES ($1, $2, $3, $4, $5);
        `,
        [eventInfo.id, eventInfo.experienceId, input.mediaId, input.participantId, reactionType]
      );
      action = "added";
      activeType = reactionType;
    }

    // 3. Obter contagens consolidadas actualizadas da mídia de forma segura e sem expor PII
    const countsRes = await client.query(
      `SELECT reaction_type, count FROM haxr_get_media_reaction_counts(ARRAY[$1]::uuid[]);`,
      [input.mediaId]
    );

    const counts: Record<ReactionType, number> = {
      love: 0,
      applause: 0,
      champagne: 0,
      elegance: 0,
      toast: 0,
    };
    let total = 0;
    for (const row of countsRes.rows) {
      if (row.reaction_type in counts) {
        counts[row.reaction_type as ReactionType] = Number(row.count);
        total += Number(row.count);
      }
    }

    await client.query("COMMIT;");

    return {
      success: true,
      action,
      reactionType: activeType,
      reactionCounts: counts,
      totalReactions: total,
    };
  } catch (err: any) {
    await client.query("ROLLBACK;").catch(() => {});
    console.error("[toggleMediaReaction] Erro:", err.message);
    return {
      success: false,
      action: "removed",
      reactionType: null,
      reactionCounts: { love: 0, applause: 0, champagne: 0, elegance: 0, toast: 0 },
      totalReactions: 0,
      error: err.message,
    };
  } finally {
    client.release();
  }
}

/**
 * Remove expressamente qualquer reacção do participante na mídia.
 */
export async function removeMediaReaction(
  input: { slug: string; mediaId: string; participantId: string }
): Promise<ToggleReactionResult> {
  const eventInfo = await resolveMemoriesEvent(input.slug);
  if (!eventInfo) {
    return {
      success: false,
      action: "removed",
      reactionType: null,
      reactionCounts: { love: 0, applause: 0, champagne: 0, elegance: 0, toast: 0 },
      totalReactions: 0,
      error: "Evento não encontrado.",
    };
  }

  const pool = getNeonPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN;");
    await client.query("SELECT set_config('haxr.current_participant_id', $1, true);", [
      input.participantId,
    ]);

    await client.query(
      `DELETE FROM memory_media_reactions WHERE participant_id = $1 AND media_id = $2;`,
      [input.participantId, input.mediaId]
    );

    // Recalcular contagens de forma segura
    const countsRes = await client.query(
      `SELECT reaction_type, count FROM haxr_get_media_reaction_counts(ARRAY[$1]::uuid[]);`,
      [input.mediaId]
    );

    const counts: Record<ReactionType, number> = {
      love: 0,
      applause: 0,
      champagne: 0,
      elegance: 0,
      toast: 0,
    };
    let total = 0;
    for (const row of countsRes.rows) {
      if (row.reaction_type in counts) {
        counts[row.reaction_type as ReactionType] = Number(row.count);
        total += Number(row.count);
      }
    }

    await client.query("COMMIT;");

    return {
      success: true,
      action: "removed",
      reactionType: null,
      reactionCounts: counts,
      totalReactions: total,
    };
  } catch (err: any) {
    await client.query("ROLLBACK;").catch(() => {});
    return {
      success: false,
      action: "removed",
      reactionType: null,
      reactionCounts: { love: 0, applause: 0, champagne: 0, elegance: 0, toast: 0 },
      totalReactions: 0,
      error: err.message,
    };
  } finally {
    client.release();
  }
}

/**
 * Adiciona uma mídia aos favoritos privados de forma estritamente idempotente.
 */
export async function addMediaFavorite(input: FavoriteInput): Promise<FavoriteResult> {
  const eventInfo = await resolveMemoriesEvent(input.slug);
  if (!eventInfo) {
    return { success: false, isFavorite: false, error: "Evento não encontrado." };
  }

  const pool = getNeonPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN;");
    await client.query("SELECT set_config('haxr.current_participant_id', $1, true);", [
      input.participantId,
    ]);

    const isAccessible = await verifyMediaAccess(client, input.mediaId, eventInfo.id, eventInfo.experienceId);
    if (!isAccessible) {
      await client.query("ROLLBACK;");
      return { success: false, isFavorite: false, error: "Mídia não encontrada ou indisponível." };
    }

    await client.query(
      `
      INSERT INTO memory_media_favorites (
        event_id, experience_id, media_id, participant_id
      ) VALUES ($1, $2, $3, $4)
      ON CONFLICT (participant_id, media_id) DO NOTHING;
      `,
      [eventInfo.id, eventInfo.experienceId, input.mediaId, input.participantId]
    );

    await client.query("COMMIT;");
    return { success: true, isFavorite: true };
  } catch (err: any) {
    await client.query("ROLLBACK;").catch(() => {});
    console.error("[addMediaFavorite] Erro:", err.message);
    return { success: false, isFavorite: false, error: err.message };
  } finally {
    client.release();
  }
}

/**
 * Remove uma mídia dos favoritos de forma estritamente idempotente.
 */
export async function removeMediaFavorite(input: FavoriteInput): Promise<FavoriteResult> {
  const pool = getNeonPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN;");
    await client.query("SELECT set_config('haxr.current_participant_id', $1, true);", [
      input.participantId,
    ]);

    await client.query(
      `DELETE FROM memory_media_favorites WHERE participant_id = $1 AND media_id = $2;`,
      [input.participantId, input.mediaId]
    );

    await client.query("COMMIT;");
    return { success: true, isFavorite: false };
  } catch (err: any) {
    await client.query("ROLLBACK;").catch(() => {});
    return { success: false, isFavorite: false, error: err.message };
  } finally {
    client.release();
  }
}

/**
 * Alterna o estado de favorito de uma mídia para o participante autenticado.
 * Operação 100% privada.
 */
export async function toggleMediaFavorite(
  input: FavoriteInput
): Promise<FavoriteResult> {
  const eventInfo = await resolveMemoriesEvent(input.slug);
  if (!eventInfo) {
    return { success: false, isFavorite: false, error: "Evento não encontrado." };
  }

  const pool = getNeonPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN;");
    await client.query("SELECT set_config('haxr.current_participant_id', $1, true);", [
      input.participantId,
    ]);

    const isAccessible = await verifyMediaAccess(client, input.mediaId, eventInfo.id, eventInfo.experienceId);
    if (!isAccessible) {
      await client.query("ROLLBACK;");
      return { success: false, isFavorite: false, error: "Mídia não encontrada ou indisponível." };
    }

    const checkRes = await client.query(
      `
      SELECT id
      FROM memory_media_favorites
      WHERE participant_id = $1 AND media_id = $2
      FOR UPDATE;
      `,
      [input.participantId, input.mediaId]
    );

    let isFav = false;
    if (checkRes.rows.length > 0) {
      await client.query(
        `DELETE FROM memory_media_favorites WHERE id = $1;`,
        [checkRes.rows[0].id]
      );
      isFav = false;
    } else {
      await client.query(
        `
        INSERT INTO memory_media_favorites (
          event_id, experience_id, media_id, participant_id
        ) VALUES ($1, $2, $3, $4)
        ON CONFLICT (participant_id, media_id) DO NOTHING;
        `,
        [eventInfo.id, eventInfo.experienceId, input.mediaId, input.participantId]
      );
      isFav = true;
    }

    await client.query("COMMIT;");
    return { success: true, isFavorite: isFav };
  } catch (err: any) {
    await client.query("ROLLBACK;").catch(() => {});
    console.error("[toggleMediaFavorite] Erro:", err.message);
    return { success: false, isFavorite: false, error: err.message };
  } finally {
    client.release();
  }
}

/**
 * Submete um comentário para uma mídia, respeitando a política da experiência
 * (aprovação automática ou moderação prévia manual).
 */
export async function addMediaComment(
  input: AddCommentInput
): Promise<AddCommentResult> {
  const trimmed = input.body?.trim();
  if (!trimmed || trimmed.length < 1) {
    return { success: false, error: "O comentário não pode estar vazio." };
  }
  if (input.body.length > 500) {
    return { success: false, error: "O comentário excede o limite máximo de 500 caracteres." };
  }

  const sanitized = sanitizeCommentBody(input.body);
  if (!sanitized || sanitized.length < 1) {
    return { success: false, error: "O comentário não pode estar vazio após sanitização." };
  }

  const eventInfo = await resolveMemoriesEvent(input.slug);
  if (!eventInfo) {
    return { success: false, error: "Evento não encontrado." };
  }

  const pool = getNeonPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN;");
    await client.query("SELECT set_config('haxr.current_participant_id', $1, true);", [
      input.participantId,
    ]);

    const isAccessible = await verifyMediaAccess(client, input.mediaId, eventInfo.id, eventInfo.experienceId);
    if (!isAccessible) {
      await client.query("ROLLBACK;");
      return { success: false, error: "Mídia não encontrada ou indisponível." };
    }

    // 1. Verificar política de aprovação de comentários na experiência
    const expRes = await client.query(
      `SELECT comments_auto_approve FROM memory_experiences WHERE id = $1;`,
      [eventInfo.experienceId]
    );
    const autoApprove = expRes.rows[0]?.comments_auto_approve !== false;
    const initialStatus = autoApprove ? "approved" : "pending";

    // 2. Inserir comentário (o trigger da BD reforça a consistência)
    const insertRes = await client.query(
      `
      INSERT INTO memory_media_comments (
        event_id, experience_id, media_id, participant_id, body, status
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, created_at, status;
      `,
      [eventInfo.id, eventInfo.experienceId, input.mediaId, input.participantId, sanitized, initialStatus]
    );

    // 3. Obter nome do participante
    const partRes = await client.query(
      `SELECT display_name FROM memory_participants WHERE id = $1;`,
      [input.participantId]
    );
    const authorName = partRes.rows[0]?.display_name || "Convidado";

    await client.query("COMMIT;");

    const row = insertRes.rows[0];
    return {
      success: true,
      comment: {
        id: row.id,
        mediaId: input.mediaId,
        participantId: input.participantId,
        authorName,
        body: sanitized,
        status: row.status,
        createdAt: row.created_at,
      },
    };
  } catch (err: any) {
    await client.query("ROLLBACK;").catch(() => {});
    console.error("[addMediaComment] Erro:", err.message);
    return { success: false, error: err.message };
  } finally {
    client.release();
  }
}

/**
 * Lista comentários paginados de uma mídia.
 * Exibe comentários aprovados e, se autenticado o participante, também os pendentes do próprio participante.
 * Valida que a mídia é visível e acessível antes de expor comentários.
 */
export async function listMediaComments(
  input: ListCommentsInput
): Promise<{ success: boolean; comments: CommentItem[]; error?: string }> {
  const eventInfo = await resolveMemoriesEvent(input.slug);
  if (!eventInfo) {
    return { success: false, comments: [], error: "Evento não encontrado." };
  }

  const limit = Math.min(Math.max(input.limit ?? 50, 1), 100);
  const offset = Math.max(input.offset ?? 0, 0);

  const pool = getNeonPool();
  const client = await pool.connect();

  try {
    // 1. Validar visibilidade da mídia
    const isAccessible = await verifyMediaAccess(client, input.mediaId, eventInfo.id, eventInfo.experienceId);
    if (!isAccessible) {
      return { success: false, comments: [], error: "Mídia não encontrada ou indisponível." };
    }

    if (input.participantId) {
      await client.query("SELECT set_config('haxr.current_participant_id', $1, true);", [
        input.participantId,
      ]);
    }

    const res = await client.query(
      `
      SELECT
        c.id,
        c.media_id,
        c.participant_id,
        c.body,
        c.status,
        c.created_at,
        p.display_name as author_name
      FROM memory_media_comments c
      JOIN memory_participants p ON p.id = c.participant_id
      WHERE c.media_id = $1
        AND c.event_id = $2
        AND (c.status = 'approved' OR ($3::uuid IS NOT NULL AND c.participant_id = $3::uuid))
      ORDER BY c.created_at ASC
      LIMIT $4 OFFSET $5;
      `,
      [input.mediaId, eventInfo.id, input.participantId || null, limit, offset]
    );

    const comments: CommentItem[] = res.rows.map((r: any) => ({
      id: r.id,
      mediaId: r.media_id,
      participantId: r.participant_id,
      authorName: r.author_name || "Convidado",
      body: r.body,
      status: r.status,
      createdAt: r.created_at,
    }));

    return { success: true, comments };
  } catch (err: any) {
    console.error("[listMediaComments] Erro:", err.message);
    return { success: false, comments: [], error: err.message };
  } finally {
    client.release();
  }
}

/**
 * Consulta agregada em lote (Set-Based O(1) queries) dos dados sociais de múltiplas mídias.
 * Elimina completamente o problema de N+1 no carregamento de feeds e stories.
 */
export async function getBatchSocialSummary(
  mediaIds: string[],
  participantId?: string | null
): Promise<Map<string, SocialMediaSummary>> {
  const result = new Map<string, SocialMediaSummary>();
  if (!mediaIds || mediaIds.length === 0) return result;

  // Inicializar com zeros
  for (const mid of mediaIds) {
    result.set(mid, {
      mediaId: mid,
      reactionCounts: { love: 0, applause: 0, champagne: 0, elegance: 0, toast: 0 },
      totalReactions: 0,
      userReaction: null,
      isFavorite: false,
      commentsCount: 0,
    });
  }

  const pool = getNeonPool();
  const client = await pool.connect();

  try {
    if (participantId) {
      await client.query("SELECT set_config('haxr.current_participant_id', $1, true);", [
        participantId,
      ]);
    }

    // 1. Agregação segura de reacções por mídia e tipo (zero exposição de participant_ids)
    const reactionsRes = await client.query(
      `SELECT media_id, reaction_type, count FROM haxr_get_media_reaction_counts($1::uuid[]);`,
      [mediaIds]
    );

    for (const row of reactionsRes.rows) {
      const summary = result.get(row.media_id);
      if (summary && row.reaction_type in summary.reactionCounts) {
        summary.reactionCounts[row.reaction_type as ReactionType] = Number(row.count);
        summary.totalReactions += Number(row.count);
      }
    }

    // 2. Contagem de comentários aprovados por mídia
    const commentsRes = await client.query(
      `
      SELECT media_id, count(*)::int as count
      FROM memory_media_comments
      WHERE media_id = ANY($1::uuid[]) AND status = 'approved'
      GROUP BY media_id;
      `,
      [mediaIds]
    );

    for (const row of commentsRes.rows) {
      const summary = result.get(row.media_id);
      if (summary) {
        summary.commentsCount = Number(row.count);
      }
    }

    // 3. Reacções e Favoritos específicos do participante actual (se autenticado)
    if (participantId) {
      const userReactionsRes = await client.query(
        `
        SELECT media_id, reaction_type
        FROM memory_media_reactions
        WHERE media_id = ANY($1::uuid[]) AND participant_id = $2::uuid;
        `,
        [mediaIds, participantId]
      );

      for (const row of userReactionsRes.rows) {
        const summary = result.get(row.media_id);
        if (summary) {
          summary.userReaction = row.reaction_type as ReactionType;
        }
      }

      const userFavsRes = await client.query(
        `
        SELECT media_id
        FROM memory_media_favorites
        WHERE media_id = ANY($1::uuid[]) AND participant_id = $2::uuid;
        `,
        [mediaIds, participantId]
      );

      for (const row of userFavsRes.rows) {
        const summary = result.get(row.media_id);
        if (summary) {
          summary.isFavorite = true;
        }
      }
    }

    return result;
  } catch (err: any) {
    console.error("[getBatchSocialSummary] Erro ao carregar resumo social:", err.message);
    return result;
  } finally {
    client.release();
  }
}
