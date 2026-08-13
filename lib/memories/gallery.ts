import { createAdminClient, isSupabaseConfigured } from "@lib/supabase/server";
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
 * O `invitation_slug` na DB isola cada evento automaticamente.
 */
export async function listMemories(slug: string): Promise<PublicMemoryItem[]> {
  const config = resolveMemoriesConfig(slug);
  if (!config) return [];

  if (!isSupabaseConfigured()) return [];

  const supabase = createAdminClient();
  const bucketName = config.bucket;
  const storageSlug = config.invitationSlug;

  const { data, error } = await supabase
    .from("wedding_photos")
    .select("id, caption, guest_name, challenge_id, table_id, created_at, storage_path, content_type")
    .eq("invitation_slug", storageSlug)
    .neq("moderation_status", "rejected")
    .order("created_at", { ascending: false })
    .limit(100);

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
    });
  }

  return results;
}
