import {
  isMemoriesDatabaseConfigured,
  listMemoryGalleryRows,
} from "./database";
import {
  createMemorySignedReadUrl,
  isMemoriesStorageConfigured,
} from "./storage";
import { resolveMemoriesConfig } from "./config";

export type PublicMemoryItem = {
  id: string;
  signedUrl: string;
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
 * Metadados e object storage seguem selectores independentes e seguros:
 * Preview de migração usa Neon + Vercel Blob; os restantes ambientes mantêm
 * Supabase por defeito.
 */
export async function listMemories(slug: string): Promise<PublicMemoryItem[]> {
  const config = resolveMemoriesConfig(slug);
  if (!config) return [];

  if (!isMemoriesDatabaseConfigured() || !isMemoriesStorageConfigured()) {
    return [];
  }

  const bucketName = config.bucket;
  const storageSlug = config.invitationSlug;

  let rows;
  try {
    rows = await listMemoryGalleryRows(storageSlug);
  } catch (error) {
    console.error(
      "[Memories] gallery database error:",
      error instanceof Error ? error.message : error
    );
    return [];
  }

  if (!rows.length) return [];

  const results: PublicMemoryItem[] = [];

  for (const row of rows) {
    let signedUrl: string | null = null;
    try {
      signedUrl = await createMemorySignedReadUrl({
        bucketName,
        storagePath: row.storagePath,
        ttlSeconds: config.signedUrlTtlSeconds,
      });
    } catch (error) {
      console.error(
        "[Memories] gallery storage error:",
        error instanceof Error ? error.message : error
      );
    }

    if (!signedUrl) continue;

    const contentType = row.contentType?.trim() || "image/jpeg";
    const kind = contentType.startsWith("video/") ? "video" : "image";

    results.push({
      id: row.id,
      signedUrl,
      createdAt: row.createdAt,
      contentType,
      kind,
      caption: row.caption,
      guestName: row.guestName,
      challengeId: row.challengeId,
      tableId: row.tableId,
    });
  }

  return results;
}
