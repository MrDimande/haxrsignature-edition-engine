/**
 * HAXR PLUS MEMORIES — HAXR MOMENTS & STORY ENGINE
 * 
 * Lógica canónica de agregação de etapas, mídias derivadas e estado de visualização
 * para a experiência de alta-costura digital de stories e feed de momentos.
 */

import { getEditionDatabaseProvider } from "@lib/db";
import { resolveMemoriesConfig } from "./config";
import { getMemoriesStorageProvider } from "./storage";
import { listStages, ensureDefaultStages } from "./stage-store";
import { getSeenMediaIdsForParticipant } from "./seen-store";
import { resolveMemoriesEvent } from "./session-store";
import type { MemoryStage } from "./stage-policy";
import { getBatchSocialSummary } from "./social-store";
import { isPublishedMemoryForEvent } from "./publication";

export interface MomentItem {
  id: string;
  stageId: string | null;
  stageSlug: string | null;
  stageLabel: string | null;
  mediaType: 'image' | 'video';
  originalUrl: string;
  thumbnailUrl: string;
  mediumUrl?: string | null;
  hasDerivatives?: boolean;
  posterUrl: string | null;
  width: number | null;
  height: number | null;
  orientation: 'portrait' | 'landscape' | 'square' | null;
  durationSeconds: number | null;
  capturedAt: string | null;
  createdAt: string;
  caption: string | null;
  guestName: string | null;
  challengeId: string | null;
  isSeen: boolean;
  // Phase 4: Social
  reactionCounts?: Record<string, number>;
  totalReactions?: number;
  userReaction?: string | null;
  isFavorite?: boolean;
  commentsCount?: number;
}

export interface StageStoryGroup {
  id: string;
  slug: string;
  label: string;
  orderIndex: number;
  isActive: boolean;
  totalCount: number;
  unseenCount: number;
  coverThumbnailUrl: string | null;
  items: MomentItem[];
}

export interface MomentsFeedResult {
  stages: StageStoryGroup[];
  allMoments: MomentItem[];
  totalMoments: number;
  totalUnseen: number;
}

/**
 * Carrega o feed de momentos estruturado por etapas (stages) com URLs assinados e estado de visualização.
 */
export async function getMomentsFeed(
  slug: string,
  participantId?: string | null
): Promise<MomentsFeedResult> {
  const config = resolveMemoriesConfig(slug);
  if (!config || !config.publicGalleryEnabled) {
    return { stages: [], allMoments: [], totalMoments: 0, totalUnseen: 0 };
  }

  const eventInfo = await resolveMemoriesEvent(slug);
  if (!eventInfo) {
    return { stages: [], allMoments: [], totalMoments: 0, totalUnseen: 0 };
  }

  const db = getEditionDatabaseProvider();
  if (!db.isConfigured()) {
    throw new Error("Serviço de memórias indisponível.");
  }

  // 1. Obter ou inicializar etapas (stages)
  let stages: MemoryStage[] = [];
  try {
    stages = await ensureDefaultStages(eventInfo.experienceId, eventInfo.id);
  } catch (err) {
    console.error("[MomoriesFeed] Erro ao carregar stages:", err);
  }

  // 2. Obter conjunto de mídias visualizadas pelo participante
  let seenMediaIds = new Set<string>();
  if (participantId) {
    try {
      seenMediaIds = await getSeenMediaIdsForParticipant(participantId, eventInfo.id);
    } catch (err) {
      console.warn("[MomentsFeed] Erro ao obter seenMediaIds:", err);
    }
  }

  // 3. Obter fotos aprovadas da DB
  const rawPhotos = await db.listMemoriesPhotos(config.invitationSlug, 300);
  const provider = getMemoriesStorageProvider();

  // 4. Mapear mídias com URLs assinados para derivados e originais
  const moments: MomentItem[] = [];
  const stageMap = new Map<string, MemoryStage>(stages.map((s) => [s.id, s]));
  const defaultStage = stages.find((s) => s.slug === 'recepcao') || stages[0] || null;

  for (const row of rawPhotos) {
    if (!isPublishedMemoryForEvent(row, config.invitationSlug)) continue;

    let originalUrl: string | null = null;
    let thumbnailUrl: string | null = null;
    let mediumUrl: string | null = null;
    let posterUrl: string | null = null;

    try {
      // URL original para visualização fullscreen / fallback seguro
      const signedOriginal = await provider.createSignedDownloadUrl({
        storagePath: row.storage_path,
        expiresInSeconds: config.signedUrlTtlSeconds,
      });
      originalUrl = signedOriginal.downloadUrl;

      // URL de derivado medium/preview (alta qualidade em WebP para Story Viewer)
      if (row.medium_storage_path) {
        try {
          const signedMedium = await provider.createSignedDownloadUrl({
            storagePath: row.medium_storage_path,
            expiresInSeconds: config.signedUrlTtlSeconds,
          });
          mediumUrl = signedMedium.downloadUrl;
        } catch {
          mediumUrl = originalUrl;
        }
      } else {
        mediumUrl = originalUrl;
      }

      // URL de thumbnail de baixa largura de banda
      if (row.thumbnail_storage_path) {
        try {
          const signedThumb = await provider.createSignedDownloadUrl({
            storagePath: row.thumbnail_storage_path,
            expiresInSeconds: config.signedUrlTtlSeconds,
          });
          thumbnailUrl = signedThumb.downloadUrl;
        } catch {
          thumbnailUrl = mediumUrl || originalUrl;
        }
      } else {
        // Fallback para mídias legadas sem thumbnail dedicado
        thumbnailUrl = mediumUrl || originalUrl;
      }

      // URL de poster de vídeo
      if (row.media_type === 'video' && row.poster_storage_path) {
        try {
          const signedPoster = await provider.createSignedDownloadUrl({
            storagePath: row.poster_storage_path,
            expiresInSeconds: config.signedUrlTtlSeconds,
          });
          posterUrl = signedPoster.downloadUrl;
        } catch {
          posterUrl = null;
        }
      }
    } catch (err) {
      console.warn(`[MomentsFeed] Erro ao assinar URL para foto ${row.id}:`, err);
      continue;
    }

    if (!originalUrl || !thumbnailUrl) continue;

    // Resolução de stage associado
    const assignedStage = (row.stage_id ? stageMap.get(row.stage_id) : null) || defaultStage;
    const isSeen = seenMediaIds.has(row.id);

    moments.push({
      id: row.id,
      stageId: assignedStage ? assignedStage.id : null,
      stageSlug: assignedStage ? assignedStage.slug : null,
      stageLabel: assignedStage ? assignedStage.label : 'Geral',
      mediaType: row.media_type || (row.content_type?.startsWith('video/') ? 'video' : 'image'),
      originalUrl,
      thumbnailUrl,
      mediumUrl,
      posterUrl,
      hasDerivatives: Boolean(row.has_derivatives || row.thumbnail_storage_path),
      width: row.width || null,
      height: row.height || null,
      orientation: (row.orientation as any) || null,
      durationSeconds: row.duration_seconds || null,
      capturedAt: row.captured_at || null,
      createdAt: row.created_at,
      caption: row.caption,
      guestName: row.guest_name,
      challengeId: row.challenge_id,
      isSeen,
    });
  }

  // 4.1 Enriquecimento social em lote (O(1) consultas set-based, sem N+1)
  const mediaIds = moments.map((m) => m.id);
  const socialMap = await getBatchSocialSummary(mediaIds, participantId);
  for (const m of moments) {
    const s = socialMap.get(m.id);
    if (s) {
      m.reactionCounts = s.reactionCounts;
      m.totalReactions = s.totalReactions;
      m.userReaction = s.userReaction;
      m.isFavorite = s.isFavorite;
      m.commentsCount = s.commentsCount;
    }
  }

  // 5. Agrupar em Story Groups por Etapa
  const stageGroups: StageStoryGroup[] = stages
    .filter((s) => s.isActive)
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((s) => {
      // Ordenação cronológica ascendente dentro do story (começo do momento -> fim)
      const stageItems = moments
        .filter((m) => m.stageId === s.id)
        .sort((a, b) => {
          const timeA = new Date(a.capturedAt || a.createdAt).getTime();
          const timeB = new Date(b.capturedAt || b.createdAt).getTime();
          return timeA - timeB;
        });

      const unseenCount = stageItems.filter((m) => !m.isSeen).length;
      const coverThumbnailUrl = stageItems.length > 0 ? stageItems[stageItems.length - 1].thumbnailUrl : null;

      return {
        id: s.id,
        slug: s.slug,
        label: s.label,
        orderIndex: s.orderIndex,
        isActive: s.isActive,
        totalCount: stageItems.length,
        unseenCount,
        coverThumbnailUrl,
        items: stageItems,
      };
    });

  const totalMoments = moments.length;
  const totalUnseen = moments.filter((m) => !m.isSeen).length;

  return {
    stages: stageGroups,
    allMoments: moments,
    totalMoments,
    totalUnseen,
  };
}
