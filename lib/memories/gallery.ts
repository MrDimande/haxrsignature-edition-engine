import { getEditionDatabaseProvider } from "@lib/db";
import { resolveMemoriesConfig } from "./config";
import { getMemoriesStorageProvider } from "./storage";
import { isPublishedMemoryForEvent } from "./publication";

export type PublicMemoryItem = {
  id: string;
  signedUrl: string;
  thumbnailUrl?: string | null;
  mediumUrl?: string | null;
  posterUrl?: string | null;
  hasDerivatives?: boolean;
  createdAt: string;
  contentType: string;
  kind: "image" | "video";
  caption: string | null;
  guestName: string | null;
  challengeId: string | null;
  tableId: string | null;
};

/**
 * Lista memórias públicas para qualquer convite com memories activadas.
 * O `invitation_slug` na DB isola cada evento automaticamente.
 */
export async function listMemories(slug: string): Promise<PublicMemoryItem[]> {
  const config = resolveMemoriesConfig(slug);
  if (!config || !config.publicGalleryEnabled) return [];

  const db = getEditionDatabaseProvider();
  if (!db.isConfigured()) throw new Error("Serviço de memórias indisponível.");

  const storageSlug = config.invitationSlug;

  const data = await db.listMemoriesPhotos(storageSlug, 100);

  if (!data?.length) return [];

  const results: PublicMemoryItem[] = [];
  const provider = getMemoriesStorageProvider();

  for (const row of data) {
    if (!isPublishedMemoryForEvent(row, storageSlug)) continue;
    let signedUrl: string | null = null;
    let thumbnailUrl: string | null = null;
    let mediumUrl: string | null = null;
    let posterUrl: string | null = null;

    try {
      const signed = await provider.createSignedDownloadUrl({
        storagePath: row.storage_path,
        expiresInSeconds: config.signedUrlTtlSeconds,
      });
      signedUrl = signed.downloadUrl;

      // Assinar medium se disponível
      if (row.medium_storage_path) {
        try {
          const signedMedium = await provider.createSignedDownloadUrl({
            storagePath: row.medium_storage_path,
            expiresInSeconds: config.signedUrlTtlSeconds,
          });
          mediumUrl = signedMedium.downloadUrl;
        } catch {
          mediumUrl = signedUrl;
        }
      } else {
        mediumUrl = signedUrl;
      }

      // Assinar thumbnail se disponível
      if (row.thumbnail_storage_path) {
        try {
          const signedThumb = await provider.createSignedDownloadUrl({
            storagePath: row.thumbnail_storage_path,
            expiresInSeconds: config.signedUrlTtlSeconds,
          });
          thumbnailUrl = signedThumb.downloadUrl;
        } catch {
          thumbnailUrl = mediumUrl || signedUrl;
        }
      } else {
        thumbnailUrl = mediumUrl || signedUrl;
      }

      // Assinar poster para vídeos
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
    } catch {
      throw new Error("Não foi possível carregar as memórias. Tente novamente.");
    }

    if (!signedUrl) continue;

    const contentType = row.content_type?.trim() || "image/jpeg";
    const kind = contentType.startsWith("video/") ? "video" : "image";

    results.push({
      id: row.id,
      signedUrl,
      thumbnailUrl,
      mediumUrl,
      posterUrl,
      hasDerivatives: Boolean(row.has_derivatives || row.thumbnail_storage_path),
      createdAt: row.created_at,
      contentType,
      kind,
      caption: row.caption,
      guestName: row.guest_name,
      challengeId: row.challenge_id,
      tableId: row.table_id,
    });
  }

  return results;
}
