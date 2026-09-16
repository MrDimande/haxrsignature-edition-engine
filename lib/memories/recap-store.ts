/**
 * HAXR PLUS MEMORIES 2.0 — FASE 8: STORE DO RECAP PÓS-EVENTO
 *
 * Projecção editorial determinística sobre o Media Core canónico (wedding_photos).
 * Zero duplicação de media, integridade multi-tenant em profundidade,
 * precedência activa de moderação e concorrência optimista via lock_version.
 */

import { getNeonPool } from "@lib/db/neon-client";
import { getMemoriesStorageProvider } from "./storage";
import { isCanonicalPublicMemory } from "./publication";
import {
  isMemoriesUuid,
  createMemoriesToken,
  hashMemoriesToken,
} from "./session-security";
import {
  type RecapPublicationStatus,
  type RecapAccessLevel,
  type RecapItemSection,
  type RecapConfiguration,
  type RecapAccessContext,
  type RecapMediaItem,
  type RecapStageSection,
  type RecapMissionHighlight,
  type SafeExplorerRankEntry,
  type SafeRecapCommentItem,
  type RecapNarrativePayload,
  sanitizePlaintext,
  sanitizeRecapConfiguration,
  isRecapAccessAuthorized,
  MAX_RECAP_TITLE_LENGTH,
  MAX_RECAP_MESSAGE_LENGTH,
  MAX_RECAP_CAPTION_LENGTH,
} from "./recap-policy";
import { listStages } from "./stage-store";

// Helper para assinar URLs em batches limitados para evitar N+1
async function signBatchUrls(
  paths: Array<{ id: string; thumbPath: string | null; medPath: string | null; posterPath: string | null; origPath: string }>,
  ttlSeconds = 3600
): Promise<Map<string, { thumbUrl: string; medUrl: string; posterUrl: string | null }>> {
  const provider = getMemoriesStorageProvider();
  const resultMap = new Map<string, { thumbUrl: string; medUrl: string; posterUrl: string | null }>();

  // Processar em chunks de 20 para controlo estrito de concorrência de I/O
  const chunkSize = 20;
  for (let i = 0; i < paths.length; i += chunkSize) {
    const chunk = paths.slice(i, i + chunkSize);
    await Promise.all(
      chunk.map(async (item) => {
        try {
          const effectiveThumbPath = item.thumbPath || item.medPath || item.origPath;
          const effectiveMedPath = item.medPath || item.thumbPath || item.origPath;

          const [thumbRes, medRes, posterRes] = await Promise.all([
            provider.createSignedDownloadUrl({ storagePath: effectiveThumbPath, expiresInSeconds: ttlSeconds }),
            provider.createSignedDownloadUrl({ storagePath: effectiveMedPath, expiresInSeconds: ttlSeconds }),
            item.posterPath
              ? provider.createSignedDownloadUrl({ storagePath: item.posterPath, expiresInSeconds: ttlSeconds })
              : Promise.resolve(null),
          ]);

          resultMap.set(item.id, {
            thumbUrl: thumbRes.downloadUrl,
            medUrl: medRes.downloadUrl,
            posterUrl: posterRes ? posterRes.downloadUrl : null,
          });

        } catch (err) {
          console.error(`[signBatchUrls] Erro ao assinar item ${item.id}:`, err);
        }
      })
    );
  }

  return resultMap;
}

/**
 * Consulta a narrativa pós-evento oficial publicada para o evento.
 * Garante:
 * 1. Precedência de moderação: media oculta ou rejeitada após publicação desaparece.
 * 2. Isolamento de favoritos: apenas o participante autenticado vê os seus favoritos.
 * 3. Hero com fallback seguro se for apagado/ocultado.
 * 4. Exploradores sem serialização de UUIDs.
 */
export async function getPublishedRecapSnapshot(
  context: RecapAccessContext
): Promise<{ ok: boolean; status: number; payload?: RecapNarrativePayload; error?: string }> {
  const pool = getNeonPool();

  // 1. Obter a publicação oficial com status = 'published'
  const pubRes = await pool.query(
    `
    SELECT
      p.id,
      p.event_id,
      p.experience_id,
      p.version,
      p.lock_version,
      p.status,
      p.title,
      p.welcome_message,
      p.closing_message,
      p.access_level,
      p.configuration,
      p.published_at,
      p.created_at,
      p.updated_at
    FROM memory_recap_publications p
    WHERE p.experience_id = $1 AND p.event_id = $2 AND p.status = 'published'
    LIMIT 1;
    `,
    [context.experienceId, context.eventId]
  );

  if (pubRes.rows.length === 0) {
    return { ok: false, status: 404, error: "Nenhuma narrativa de Recap publicada para esta celebração." };
  }

  const pubRow = pubRes.rows[0];

  // 2. Verificar autorização com base no nível de acesso
  if (!isRecapAccessAuthorized(pubRow, context)) {
    return {
      ok: false,
      status: 403,
      error: "Acesso restrito ao Recap desta celebração. É necessária uma chave ou sessão válida.",
    };
  }

  const config: RecapConfiguration = pubRow.configuration || {};

  // 3. Consultar todos os itens curados da publicação associados ao Media Core
  const itemsRes = await pool.query(
    `
    SELECT
      ri.id AS item_id,
      ri.section,
      ri.stage_id,
      ri.position,
      ri.editorial_caption,
      wp.id AS media_id,
      wp.media_type,
      wp.storage_path,
      wp.thumbnail_storage_path,
      wp.medium_storage_path,
      wp.poster_storage_path,
      wp.caption,
      wp.guest_name,
      wp.moderation_status,
      wp.invitation_slug,
      wp.created_at AS media_created_at
    FROM memory_recap_items ri
    JOIN wedding_photos wp
      ON wp.id = ri.media_id
     AND wp.event_id = ri.event_id
     AND wp.experience_id = ri.experience_id
    WHERE ri.publication_id = $1
      AND wp.moderation_status = 'approved'
    ORDER BY ri.position ASC, ri.created_at ASC;
    `,
    [pubRow.id]
  );

  // 4. Filtragem adicional em memória via predicado canónico de moderação / path security
  const eligibleRows = itemsRes.rows.filter((row) =>
    isCanonicalPublicMemory(
      {
        id: row.media_id,
        storage_path: row.storage_path,
        moderation_status: row.moderation_status,
        invitation_slug: row.invitation_slug,
      },
      context.invitationSlug || undefined
    )
  );

  // 5. Agregações sociais para os itens elegíveis
  const mediaIds = eligibleRows.map((r) => r.media_id);
  const reactionsMap = new Map<string, { reactions: Record<string, number>; total: number }>();
  const commentsCountMap = new Map<string, number>();

  if (mediaIds.length > 0) {
    const rxRes = await pool.query(
      `
      SELECT media_id, reaction_type, count(*)::int as count
      FROM memory_media_reactions
      WHERE media_id = ANY($1::uuid[])
      GROUP BY media_id, reaction_type;
      `,
      [mediaIds]
    );

    for (const r of rxRes.rows) {
      if (!reactionsMap.has(r.media_id)) {
        reactionsMap.set(r.media_id, { reactions: {}, total: 0 });
      }
      const entry = reactionsMap.get(r.media_id)!;
      entry.reactions[r.reaction_type] = r.count;
      entry.total += r.count;
    }

    const cmRes = await pool.query(
      `
      SELECT media_id, count(*)::int as count
      FROM memory_media_comments
      WHERE media_id = ANY($1::uuid[]) AND status = 'approved'
      GROUP BY media_id;
      `,
      [mediaIds]
    );

    for (const c of cmRes.rows) {
      commentsCountMap.set(c.media_id, c.count);
    }
  }

  // 6. Assinatura em lote de URLs
  const pathsToSign = eligibleRows.map((r) => ({
    id: r.media_id,
    thumbPath: r.thumbnail_storage_path,
    medPath: r.medium_storage_path,
    posterPath: r.poster_storage_path,
    origPath: r.storage_path,
  }));

  const signedUrls = await signBatchUrls(pathsToSign);

  // 7. Mapear para entidades RecapMediaItem
  const mediaItems: RecapMediaItem[] = eligibleRows
    .filter((r) => signedUrls.has(r.media_id))
    .map((r) => {
      const urls = signedUrls.get(r.media_id)!;
      const rx = reactionsMap.get(r.media_id) || { reactions: {}, total: 0 };
      return {
        id: r.media_id,
        kind: r.media_type === "video" ? "video" : "image",
        thumbnailUrl: urls.thumbUrl,
        mediumUrl: urls.medUrl,
        posterUrl: urls.posterUrl,
        caption: r.caption,
        guestName: r.guest_name,
        stageId: r.stage_id,
        section: r.section,
        position: r.position,
        editorialCaption: r.editorial_caption,
        reactions: rx.reactions,
        totalReactions: rx.total,
        approvedCommentsCount: commentsCountMap.get(r.media_id) || 0,
        createdAt: new Date(r.media_created_at).toISOString(),
      };
    });

  // 8. Resolução do Hero (com fallback seguro se tiver sido ocultado ou eliminado)
  let heroItem = mediaItems.find((m) => m.section === "hero") || null;
  if (!heroItem && mediaItems.length > 0 && config.showHero !== false) {
    // Fallback gracioso: primeiro momento ou foto de story
    heroItem = mediaItems.find((m) => m.section === "moments" || m.section === "story") || mediaItems[0];
  }

  // 9. Organização da Secção "O Nosso Dia" (Stages dinâmicos)
  const stagesList = await listStages(context.experienceId, context.eventId);
  const storySections: RecapStageSection[] = [];

  if (config.showStory !== false) {
    for (const stage of stagesList) {
      const stageItems = mediaItems.filter((m) => m.section === "story" && m.stageId === stage.id);
      if (stageItems.length > 0) {
        storySections.push({
          stageId: stage.id,
          stageSlug: stage.slug,
          stageLabel: stage.label,
          orderIndex: stage.orderIndex,
          items: stageItems,
        });
      }
    }
  }

  // 10. Secção "Momentos"
  const momentsItems = config.showMoments !== false
    ? mediaItems.filter((m) => m.section === "moments")
    : [];

  // 11. Secção "Eu Espio" (Missões com submissões aprovadas)
  const missionsHighlights: RecapMissionHighlight[] = [];
  if (config.showMissions !== false) {
    const missionsRes = await pool.query(
      `
      SELECT
        m.id,
        m.title,
        m.category,
        m.points,
        count(s.id)::int as submissions_count
      FROM memory_missions m
      LEFT JOIN memory_mission_submissions s
        ON s.mission_id = m.id AND s.status = 'accepted'
      WHERE m.experience_id = $1 AND m.is_active = true
      GROUP BY m.id, m.title, m.category, m.points, m.sort_order
      ORDER BY m.sort_order ASC;
      `,
      [context.experienceId]
    );

    const missionIds = missionsRes.rows.map((r) => r.id);
    if (missionIds.length > 0) {
      const featuredItems = mediaItems.filter((m) => m.section === "missions");
      for (const m of missionsRes.rows) {
        missionsHighlights.push({
          missionId: m.id,
          missionTitle: m.title,
          missionCategory: m.category,
          points: Number(m.points),
          submissionsCount: Number(m.submissions_count),
          featuredMedia: featuredItems.slice(0, 4),
        });
      }
    }
  }

  // 12. Secção "Exploradores" (Ranking Determinístico SEM UUIDs)
  const explorersLeaderboard: SafeExplorerRankEntry[] = [];
  if (config.showExplorers !== false) {
    const expRes = await pool.query(
      `
      SELECT
        s.participant_id,
        s.total_points,
        s.missions_completed,
        s.last_awarded_at,
        COALESCE(p.display_name, g.name, 'Convidado') as display_name
      FROM memory_participant_scores s
      JOIN memory_participants p ON p.id = s.participant_id
      LEFT JOIN guests g ON g.id = p.guest_id
      WHERE s.experience_id = $1 AND s.total_points > 0
      ORDER BY s.total_points DESC, s.last_awarded_at ASC, s.participant_id ASC
      LIMIT 50;
      `,
      [context.experienceId]
    );

    explorersLeaderboard.push(
      ...expRes.rows.map((row, index) => ({
        rank: index + 1,
        displayName: row.display_name,
        points: Number(row.total_points),
        missionsCompleted: Number(row.missions_completed),
        // Hardening 13: Nunca serializar o participant_id UUID, apenas flag booleana para o utilizador actual
        isCurrentParticipant: Boolean(
          context.authenticatedParticipant && context.authenticatedParticipant.id === row.participant_id
        ),
      }))
    );
  }

  // 13. Secção "Os Meus Favoritos" (Estritamente Privados do Participante Autenticado)
  const favoritesItems: RecapMediaItem[] = [];
  if (context.authenticatedParticipant && config.showFavorites !== false) {
    const favRes = await pool.query(
      `
      SELECT
        wp.id AS media_id,
        wp.media_type,
        wp.storage_path,
        wp.thumbnail_storage_path,
        wp.medium_storage_path,
        wp.poster_storage_path,
        wp.caption,
        wp.guest_name,
        wp.moderation_status,
        wp.invitation_slug,
        wp.created_at AS media_created_at
      FROM memory_media_favorites f
      JOIN wedding_photos wp
        ON wp.id = f.media_id
       AND wp.event_id = f.event_id
       AND wp.experience_id = f.experience_id
      WHERE f.participant_id = $1
        AND f.experience_id = $2
        AND wp.moderation_status = 'approved'
      ORDER BY f.created_at DESC;
      `,
      [context.authenticatedParticipant.id, context.experienceId]
    );

    const favEligible = favRes.rows.filter((r) =>
      isCanonicalPublicMemory(
        {
          id: r.media_id,
          storage_path: r.storage_path,
          moderation_status: r.moderation_status,
          invitation_slug: r.invitation_slug,
        },
        context.invitationSlug || undefined
      )
    );

    if (favEligible.length > 0) {
      const favPaths = favEligible.map((r) => ({
        id: r.media_id,
        thumbPath: r.thumbnail_storage_path,
        medPath: r.medium_storage_path,
        posterPath: r.poster_storage_path,
        origPath: r.storage_path,
      }));
      const favSigned = await signBatchUrls(favPaths);

      for (const r of favEligible) {
        if (favSigned.has(r.media_id)) {
          const urls = favSigned.get(r.media_id)!;
          const rx = reactionsMap.get(r.media_id) || { reactions: {}, total: 0 };
          favoritesItems.push({
            id: r.media_id,
            kind: r.media_type === "video" ? "video" : "image",
            thumbnailUrl: urls.thumbUrl,
            mediumUrl: urls.medUrl,
            posterUrl: urls.posterUrl,
            caption: r.caption,
            guestName: r.guest_name,
            stageId: null,
            section: "moments",
            position: 0,
            editorialCaption: null,
            reactions: rx.reactions,
            totalReactions: rx.total,
            approvedCommentsCount: commentsCountMap.get(r.media_id) || 0,
            createdAt: new Date(r.media_created_at).toISOString(),
          });
        }
      }
    }
  }

  // 14. Agregados sociais e comentários aprovados recentes
  let totalPhotos = mediaItems.length;
  let totalReactions = 0;
  const reactionAggregates: Record<string, number> = {};

  for (const m of mediaItems) {
    totalReactions += m.totalReactions;
    for (const [t, cnt] of Object.entries(m.reactions)) {
      reactionAggregates[t] = (reactionAggregates[t] || 0) + cnt;
    }
  }

  const recentComments: SafeRecapCommentItem[] = [];
  if (config.showComments !== false) {
    const commRes = await pool.query(
      `
      SELECT
        c.id,
        c.media_id,
        c.body,
        c.created_at,
        COALESCE(p.display_name, 'Convidado') as author_name
      FROM memory_media_comments c
      JOIN memory_participants p ON p.id = c.participant_id
      WHERE c.experience_id = $1 AND c.status = 'approved'
      ORDER BY c.created_at DESC
      LIMIT 20;
      `,
      [context.experienceId]
    );

    recentComments.push(
      ...commRes.rows.map((row) => ({
        id: row.id,
        mediaId: row.media_id,
        authorName: row.author_name,
        body: row.body,
        createdAt: new Date(row.created_at).toISOString(),
      }))
    );
  }

  const payload: RecapNarrativePayload = {
    publication: {
      id: pubRow.id,
      version: pubRow.version,
      title: pubRow.title,
      welcomeMessage: pubRow.welcome_message,
      closingMessage: pubRow.closing_message,
      publishedAt: pubRow.published_at ? new Date(pubRow.published_at).toISOString() : null,
      accessLevel: pubRow.access_level,
      configuration: config,
    },
    hero: heroItem,
    story: storySections,
    moments: momentsItems,
    missions: missionsHighlights,
    explorers: explorersLeaderboard,
    favorites: favoritesItems,
    social: {
      totalPhotos,
      totalReactions,
      reactionAggregates,
      recentComments,
    },
    closing: {
      message: pubRow.closing_message,
      signOffDate: pubRow.published_at ? new Date(pubRow.published_at).toISOString() : null,
    },
    viewer: {
      isAuthenticated: Boolean(context.authenticatedParticipant),
      displayName: context.authenticatedParticipant?.displayName || null,
      hasFavorites: favoritesItems.length > 0,
    },
  };

  return { ok: true, status: 200, payload };
}

/**
 * Consulta ou cria o rascunho de curadoria administrativa para a experiência.
 */
export async function getCurationDraft(
  experienceIdOrOptions: string | { experienceId: string; eventId: string },
  eventIdArg?: string
): Promise<{ ok: boolean; draft?: any; candidates?: any[]; error?: string }> {
  const experienceId = typeof experienceIdOrOptions === "object"
    ? experienceIdOrOptions.experienceId
    : experienceIdOrOptions;
  const eventId = typeof experienceIdOrOptions === "object"
    ? experienceIdOrOptions.eventId
    : eventIdArg || "";

  if (!isMemoriesUuid(experienceId) || !isMemoriesUuid(eventId)) {
    return { ok: false, error: "Identificadores inválidos." };
  }

  const pool = getNeonPool();

  // 1. Procurar rascunho existente
  let draftRes = await pool.query(
    `
    SELECT *
    FROM memory_recap_publications
    WHERE experience_id = $1 AND event_id = $2 AND status = 'draft'
    LIMIT 1;
    `,
    [experienceId, eventId]
  );

  let draft = draftRes.rows[0];

  // Se não existir draft, criar um novo automaticamente
  if (!draft) {
    // Determinar próxima versão
    const maxVerRes = await pool.query(
      `SELECT COALESCE(MAX(version), 0) + 1 AS next_version FROM memory_recap_publications WHERE experience_id = $1;`,
      [experienceId]
    );
    const nextVer = maxVerRes.rows[0].next_version;

    const insertDraft = await pool.query(
      `
      INSERT INTO memory_recap_publications (
        event_id, experience_id, version, lock_version, status, title, configuration
      ) VALUES ($1, $2, $3, 1, 'draft', 'O Nosso Álbum de Memórias', '{}'::jsonb)
      RETURNING *;
      `,
      [eventId, experienceId, nextVer]
    );
    draft = insertDraft.rows[0];
  }

  // 2. Obter itens associados ao rascunho
  const itemsRes = await pool.query(
    `
    SELECT
      ri.id,
      ri.media_id,
      ri.section,
      ri.stage_id,
      ri.position,
      ri.editorial_caption,
      wp.caption,
      wp.guest_name,
      wp.thumbnail_storage_path,
      wp.medium_storage_path,
      wp.storage_path,
      wp.moderation_status
    FROM memory_recap_items ri
    JOIN wedding_photos wp ON wp.id = ri.media_id
    WHERE ri.publication_id = $1
    ORDER BY ri.position ASC;
    `,
    [draft.id]
  );

  // 3. Obter candidatos automáticos determinísticos (media aprovada, ordenada por reacções e tempo)
  const candidatesRes = await pool.query(
    `
    SELECT
      wp.id,
      wp.media_type,
      wp.caption,
      wp.guest_name,
      wp.stage_id,
      wp.thumbnail_storage_path,
      wp.medium_storage_path,
      wp.storage_path,
      wp.created_at,
      count(r.id)::int as reaction_count
    FROM wedding_photos wp
    LEFT JOIN memory_media_reactions r ON r.media_id = wp.id
    WHERE wp.experience_id = $1 AND wp.event_id = $2 AND wp.moderation_status = 'approved'
    GROUP BY wp.id, wp.media_type, wp.caption, wp.guest_name, wp.stage_id,
             wp.thumbnail_storage_path, wp.medium_storage_path, wp.storage_path, wp.created_at
    ORDER BY reaction_count DESC, wp.created_at ASC, wp.id ASC
    LIMIT 60;
    `,
    [experienceId, eventId]
  );

  return {
    ok: true,
    draft: {
      ...draft,
      items: itemsRes.rows,
    },
    candidates: candidatesRes.rows,
  };
}

export interface SaveCurationDraftInput {
  experienceId: string;
  eventId: string;
  publicationId: string;
  expectedLockVersion: number;
  title?: string | null;
  welcomeMessage?: string | null;
  closingMessage?: string | null;
  accessLevel?: RecapAccessLevel;
  configuration?: RecapConfiguration;
  items: Array<{
    mediaId: string;
    section: RecapItemSection;
    stageId?: string | null;
    position: number;
    editorialCaption?: string | null;
  }>;
}

/**
 * Grava alterações no rascunho com optimistic locking estrito via lock_version.
 */
export async function saveCurationDraft(
  input: SaveCurationDraftInput
): Promise<{ ok: boolean; status: number; publication?: any; error?: string }> {
  const pool = getNeonPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN;");

    // 1. Lock e verificação de concorrência optimista
    const pubRes = await client.query(
      `
      SELECT id, status, lock_version
      FROM memory_recap_publications
      WHERE id = $1 AND experience_id = $2 AND event_id = $3
      FOR UPDATE;
      `,
      [input.publicationId, input.experienceId, input.eventId]
    );

    if (pubRes.rows.length === 0) {
      await client.query("ROLLBACK;");
      return { ok: false, status: 404, error: "Publicação de rascunho não encontrada." };
    }

    const current = pubRes.rows[0];
    if (current.status !== "draft") {
      await client.query("ROLLBACK;");
      return { ok: false, status: 400, error: "Apenas rascunhos podem ser editados directamente." };
    }

    // Hardening 5: Detecção determinística de conflito de concorrência
    if (Number(current.lock_version) !== Number(input.expectedLockVersion)) {
      await client.query("ROLLBACK;");
      return {
        ok: false,
        status: 409,
        error: "Conflito de edição concorrente. Outro administrador gravou alterações mais recentes.",
      };
    }

    // 2. Sanitização dos campos editoriais
    const cleanTitle = sanitizePlaintext(input.title, MAX_RECAP_TITLE_LENGTH);
    const cleanWelcome = sanitizePlaintext(input.welcomeMessage, MAX_RECAP_MESSAGE_LENGTH);
    const cleanClosing = sanitizePlaintext(input.closingMessage, MAX_RECAP_MESSAGE_LENGTH);
    const cleanConfig = sanitizeRecapConfiguration(input.configuration);
    const accessLevel = input.accessLevel && ["guests_only", "share_link_only", "public"].includes(input.accessLevel)
      ? input.accessLevel
      : "guests_only";

    // 3. Actualizar metadados da publicação e incrementar lock_version
    const updatePub = await client.query(
      `
      UPDATE memory_recap_publications
      SET
        title = $1,
        welcome_message = $2,
        closing_message = $3,
        access_level = $4,
        configuration = $5,
        lock_version = lock_version + 1,
        updated_at = now()
      WHERE id = $6
      RETURNING *;
      `,
      [cleanTitle, cleanWelcome, cleanClosing, accessLevel, cleanConfig, input.publicationId]
    );

    // 4. Actualizar itens: remover itens existentes do rascunho e reinserir curadoria validada
    await client.query(`DELETE FROM memory_recap_items WHERE publication_id = $1;`, [input.publicationId]);

    // Hardening 2: Garantir que há no máximo 1 item com section = 'hero'
    let heroCount = 0;

    for (const item of input.items) {
      if (!isMemoriesUuid(item.mediaId)) continue;
      if (item.section === "hero") {
        heroCount++;
        if (heroCount > 1) {
          await client.query("ROLLBACK;");
          return { ok: false, status: 400, error: "Apenas uma fotografia pode ser designada como Hero." };
        }
      }

      const caption = sanitizePlaintext(item.editorialCaption, MAX_RECAP_CAPTION_LENGTH);
      const stageId = item.stageId && isMemoriesUuid(item.stageId) ? item.stageId : null;

      await client.query(
        `
        INSERT INTO memory_recap_items (
          publication_id, event_id, experience_id, media_id,
          section, stage_id, position, editorial_caption
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
        `,
        [
          input.publicationId,
          input.eventId,
          input.experienceId,
          item.mediaId,
          item.section,
          stageId,
          item.position || 0,
          caption,
        ]
      );
    }

    await client.query("COMMIT;");
    return { ok: true, status: 200, publication: updatePub.rows[0] };
  } catch (err: any) {
    await client.query("ROLLBACK;").catch(() => {});
    console.error("[saveCurationDraft] Erro ao gravar rascunho:", err);
    return { ok: false, status: 500, error: err.message };
  } finally {
    client.release();
  }
}

/**
 * Publicação Idempotente do Recap.
 * Promove o rascunho para status = 'published', arquivando qualquer versão publicada anterior.
 */
export async function publishRecap(input: {
  experienceId: string;
  eventId: string;
  publicationId: string;
  expectedLockVersion: number;
}): Promise<{ ok: boolean; status: number; publication?: any; error?: string }> {
  const pool = getNeonPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN;");

    const pubRes = await client.query(
      `
      SELECT id, status, lock_version, version
      FROM memory_recap_publications
      WHERE id = $1 AND experience_id = $2 AND event_id = $3
      FOR UPDATE;
      `,
      [input.publicationId, input.experienceId, input.eventId]
    );

    if (pubRes.rows.length === 0) {
      await client.query("ROLLBACK;");
      return { ok: false, status: 404, error: "Publicação não encontrada." };
    }

    const current = pubRes.rows[0];

    // Hardening 6: Idempotência de publicação sob retry de rede
    if (current.status === "published") {
      await client.query("COMMIT;");
      return { ok: true, status: 200, publication: current };
    }

    if (current.status !== "draft") {
      await client.query("ROLLBACK;");
      return { ok: false, status: 400, error: "Apenas publicações em rascunho podem ser publicadas." };
    }

    if (Number(current.lock_version) !== Number(input.expectedLockVersion)) {
      await client.query("ROLLBACK;");
      return {
        ok: false,
        status: 409,
        error: "Conflito de publicação. O rascunho foi modificado concorrentemente.",
      };
    }

    // 1. Arquivar publicação publicada anterior desta experiência
    await client.query(
      `
      UPDATE memory_recap_publications
      SET status = 'archived', updated_at = now()
      WHERE experience_id = $1 AND status = 'published';
      `,
      [input.experienceId]
    );

    // 2. Promover o rascunho para published
    const publishRes = await client.query(
      `
      UPDATE memory_recap_publications
      SET
        status = 'published',
        published_at = now(),
        lock_version = lock_version + 1,
        updated_at = now()
      WHERE id = $1
      RETURNING *;
      `,
      [input.publicationId]
    );

    await client.query("COMMIT;");
    return { ok: true, status: 200, publication: publishRes.rows[0] };
  } catch (err: any) {
    await client.query("ROLLBACK;").catch(() => {});
    console.error("[publishRecap] Erro na publicação:", err);
    return { ok: false, status: 500, error: err.message };
  } finally {
    client.release();
  }
}

/**
 * Despublica o Recap activo, transitando-o para 'archived'.
 */
export async function unpublishRecap(input: {
  experienceId: string;
  eventId: string;
  publicationId: string;
}): Promise<{ ok: boolean; status: number; error?: string }> {
  const pool = getNeonPool();

  const res = await pool.query(
    `
    UPDATE memory_recap_publications
    SET
      status = 'archived',
      lock_version = lock_version + 1,
      updated_at = now()
    WHERE id = $1 AND experience_id = $2 AND event_id = $3 AND status = 'published'
    RETURNING id;
    `,
    [input.publicationId, input.experienceId, input.eventId]
  );

  if (res.rows.length === 0) {
    return { ok: false, status: 404, error: "Nenhuma publicação activa encontrada para despublicar." };
  }

  return { ok: true, status: 200 };
}

/**
 * Cria ou obtém um share link com scope 'recap:view' estritamente vinculado à experiência.
 */
export async function createRecapShareLink(input: {
  eventId: string;
  experienceId: string;
  eventSlug: string;
  invitationSlug?: string | null;
  label?: string;
  expiresInDays?: number;
}): Promise<{ ok: boolean; shareLink?: any; token?: string; error?: string }> {
  const pool = getNeonPool();
  const token = createMemoriesToken();
  const tokenHash = hashMemoriesToken(token, "access-link");
  const shortCode = createMemoriesToken().slice(0, 8);
  const expiresAt = new Date(Date.now() + (input.expiresInDays || 30) * 86400 * 1000);

  try {
    const res = await pool.query(
      `
      INSERT INTO memory_share_links (
        id, event_id, experience_id, event_slug, invitation_slug,
        short_code, token_hash, scope_type, label, expires_at, enabled
      ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, 'recap:view', $7, $8, true)
      RETURNING id, short_code, scope_type, expires_at, created_at;

      `,
      [
        input.eventId,
        input.experienceId,
        input.eventSlug,
        input.invitationSlug || null,
        shortCode,
        tokenHash,
        input.label || "Link de Acesso ao Recap",
        expiresAt,
      ]
    );

    return {
      ok: true,
      shareLink: res.rows[0],
      token,
    };
  } catch (err: any) {
    console.error("[createRecapShareLink] Erro:", err);
    return { ok: false, error: err.message };
  }
}

/**
 * Valida um share token de Recap e realiza o exchange para sessão via cookie.
 */
export async function validateAndExchangeRecapToken(input: {
  slug: string;
  rawTokenOrCode: string;
}): Promise<{
  valid: boolean;
  eventId?: string;
  experienceId?: string;
  token?: string;
  expiresAt?: Date;
  reason?: "invalid" | "expired" | "revoked" | "cross_tenant" | "not_found";
}> {
  const tokenOrCode = input.rawTokenOrCode.trim();
  if (!tokenOrCode) return { valid: false, reason: "invalid" };

  let tokenHash: string | null = null;
  try {
    tokenHash = hashMemoriesToken(tokenOrCode, "access-link");
  } catch {
    tokenHash = null;
  }

  const pool = getNeonPool();

  // Buscar evento e experiência pela slug
  const expRes = await pool.query(
    `
    SELECT event_id, id as experience_id
    FROM memory_experiences
    WHERE event_slug = $1 OR invitation_slug = $1 OR id::text = $1
    LIMIT 1;
    `,
    [input.slug]
  );

  if (expRes.rows.length === 0) {
    return { valid: false, reason: "not_found" };
  }

  const { event_id: eventId, experience_id: experienceId } = expRes.rows[0];

  const linkRes = await pool.query(
    `
    SELECT id, event_id, experience_id, scope_type, max_uses, uses, expires_at, revoked_at, enabled
    FROM memory_share_links
    WHERE (token_hash = $1 OR short_code = $2)
      AND enabled = true
    LIMIT 1;
    `,
    [tokenHash, tokenOrCode]
  );

  if (linkRes.rows.length === 0) {
    return { valid: false, reason: "not_found" };
  }

  const link = linkRes.rows[0];

  // Hardening: Validação estrita de Tenant
  if (link.event_id !== eventId || link.experience_id !== experienceId) {
    return { valid: false, reason: "cross_tenant" };
  }

  if (link.revoked_at !== null) {
    return { valid: false, reason: "revoked" };
  }

  if (link.expires_at && Date.parse(link.expires_at) <= Date.now()) {
    return { valid: false, reason: "expired" };
  }

  if (link.scope_type !== "recap:view" && link.scope_type !== "general") {
    return { valid: false, reason: "invalid" };
  }

  return {
    valid: true,
    eventId,
    experienceId,
    token: tokenOrCode,
    expiresAt: link.expires_at ? new Date(link.expires_at) : new Date(Date.now() + 30 * 86400 * 1000),
  };
}
