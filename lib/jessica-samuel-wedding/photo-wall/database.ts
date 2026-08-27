import { getDatabaseBackend } from "@lib/database/backend";
import { getNeonSql } from "@lib/neon/server";
import { createAdminClient } from "@lib/supabase/server";

export type ApprovedPhotoWallRow = {
  id: string;
  caption: string | null;
  createdAt: string;
  storagePath: string;
  contentType: string;
};

function toIso(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

export async function listApprovedPhotoWallRows(
  invitationSlug: string
): Promise<ApprovedPhotoWallRow[]> {
  if (getDatabaseBackend() !== "neon") {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("wedding_photos")
      .select("id, caption, created_at, storage_path, content_type")
      .eq("invitation_slug", invitationSlug)
      .eq("moderation_status", "approved")
      .order("created_at", { ascending: false })
      .limit(60);

    if (error) throw new Error(error.message);

    return (data ?? []).map((row) => ({
      id: row.id,
      caption: row.caption,
      createdAt: row.created_at,
      storagePath: row.storage_path,
      contentType: row.content_type,
    }));
  }

  const sql = getNeonSql();
  const rows = (await sql`
    SELECT id, caption, created_at, storage_path, content_type
    FROM public.wedding_photos
    WHERE invitation_slug = ${invitationSlug}
      AND moderation_status = 'approved'
    ORDER BY created_at DESC
    LIMIT 60
  `) as Array<{
    id: string;
    caption: string | null;
    created_at: string | Date;
    storage_path: string;
    content_type: string;
  }>;

  return rows.map((row) => ({
    id: row.id,
    caption: row.caption,
    createdAt: toIso(row.created_at),
    storagePath: row.storage_path,
    contentType: row.content_type,
  }));
}
