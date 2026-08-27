import { createAdminClient, isSupabaseConfigured } from "@lib/supabase/server";
import {
  isMemoriesDatabaseConfigured,
  listMemoryGalleryRows,
} from "./database";
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
 * Metadados seguem o backend DB seleccionado; nesta fase os ficheiros continuam
 * no Supabase Storage e recebem URLs assinadas de curta duração.
 */
export async function listMemories(slug: string): Promise<PublicMemoryItem[]> {
  const config = resolveMemoriesConfig(slug);
  if (!config) return [];

  if (!isMemoriesDatabaseConfigured() || !isSupabaseConfigured()) return [];

  const supabase = createAdminClient();
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
    const { data: signed } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(row.storagePath, config.signedUrlTtlSeconds);

    if (!signed?.signedUrl) continue;

    const contentType = row.contentType?.trim() || "image/jpeg";
    const kind = contentType.startsWith("video/") ? "video" : "image";

    results.push({
      id: row.id,
      signedUrl: signed.signedUrl,
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
