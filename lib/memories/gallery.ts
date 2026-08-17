import { createAdminClient, isSupabaseConfigured } from "@lib/supabase/server";
import { resolveMemoriesConfigAsync } from "./config";
import { isValidPhaseId } from "./phases";

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
  phaseId: string | null;
};

export function filterMemoriesByPhase(
  memories: readonly PublicMemoryItem[],
  phaseId: string | null
): PublicMemoryItem[] {
  if (!phaseId) return [...memories];
  return memories.filter((memory) => memory.phaseId === phaseId);
}

/**
 * Lista memórias públicas para qualquer convite com memories activadas.
 * O `invitation_slug` na DB isola cada evento automaticamente.
 */
export async function listMemories(
  slug: string,
  phaseId?: string
): Promise<PublicMemoryItem[]> {
  const config = await resolveMemoriesConfigAsync(slug);
  if (!config) return [];
  if (phaseId && !isValidPhaseId(phaseId, config.phases)) return [];

  if (!isSupabaseConfigured()) return [];

  const supabase = createAdminClient();
  const bucketName = config.bucket;
  const storageSlug = config.storageSlug;

  let query = supabase
    .from("wedding_photos")
    .select("id, caption, guest_name, challenge_id, table_id, phase_id, created_at, storage_path, content_type")
    .eq("invitation_slug", storageSlug)
    .neq("moderation_status", "rejected")
    .order("created_at", { ascending: false });

  if (phaseId) query = query.eq("phase_id", phaseId);
  const { data, error } = await query.limit(100);

  if (error || !data?.length) return [];

  const results: PublicMemoryItem[] = [];

  for (const row of data) {
    const { data: signed } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(row.storage_path, config.signedUrlTtlSeconds);

    if (!signed?.signedUrl) continue;

    const contentType = row.content_type?.trim() || "image/jpeg";
    const kind = contentType.startsWith("video/") ? "video" : "image";

    results.push({
      id: row.id,
      signedUrl: signed.signedUrl,
      createdAt: row.created_at,
      contentType,
      kind,
      caption: row.caption,
      guestName: row.guest_name,
      challengeId: row.challenge_id,
      tableId: row.table_id,
      phaseId: row.phase_id,
    });
  }

  return results;
}
