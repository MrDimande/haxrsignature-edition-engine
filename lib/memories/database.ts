import { getDatabaseBackend } from "@lib/database/backend";
import { getNeonSql, isNeonConfigured } from "@lib/neon/server";
import { createAdminClient, isSupabaseConfigured } from "@lib/supabase/server";
import { getPhotoUploadIntentRepository } from "@lib/jessica-samuel-wedding/photo-wall/upload-intent-store";

export type MemoryUploadIntentRecord = {
  photoId: string;
  slug: string;
  bucketName: string;
  storagePath: string;
  contentType: string;
  declaredFileSizeBytes: number;
  status: "pending" | "consumed" | "expired";
  createdAt: string;
  expiresAt: string;
  consumedAt: string | null;
};

export type CreateMemoryUploadIntentRecordInput = {
  photoId: string;
  slug: string;
  bucketName: string;
  storagePath: string;
  contentType: string;
  declaredFileSizeBytes: number;
  expiresAt: string;
};

export type ConsumeMemoryUploadIntentRecordInput = {
  photoId: string;
  slug: string;
  bucketName: string;
  nowIso: string;
};

export type InsertMemoryPhotoInput = {
  id: string;
  invitationSlug: string;
  storagePath: string;
  originalFilename: string;
  contentType: string;
  fileSizeBytes: number;
  guestName: string | null;
  caption: string | null;
  challengeId: string | null;
  tableId: string | null;
  participantId: string | null;
};

export type MemoryGalleryRow = {
  id: string;
  caption: string | null;
  guestName: string | null;
  challengeId: string | null;
  tableId: string | null;
  createdAt: string;
  storagePath: string;
  contentType: string;
};

type NeonIntentRow = {
  id: string;
  invitation_slug: string;
  bucket_name: string;
  storage_path: string;
  content_type: string;
  declared_file_size_bytes: number;
  status: "pending" | "consumed" | "expired";
  created_at: string | Date;
  expires_at: string | Date;
  consumed_at: string | Date | null;
};

function toIso(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

function mapNeonIntent(row: NeonIntentRow): MemoryUploadIntentRecord {
  return {
    photoId: row.id,
    slug: row.invitation_slug,
    bucketName: row.bucket_name,
    storagePath: row.storage_path,
    contentType: row.content_type,
    declaredFileSizeBytes: Number(row.declared_file_size_bytes),
    status: row.status,
    createdAt: toIso(row.created_at),
    expiresAt: toIso(row.expires_at),
    consumedAt: row.consumed_at ? toIso(row.consumed_at) : null,
  };
}

export function isMemoriesDatabaseConfigured(): boolean {
  return getDatabaseBackend() === "neon"
    ? isNeonConfigured()
    : isSupabaseConfigured();
}

export async function createMemoryUploadIntentRecord(
  input: CreateMemoryUploadIntentRecordInput
): Promise<void> {
  if (getDatabaseBackend() !== "neon") {
    await getPhotoUploadIntentRepository().create(input);
    return;
  }

  const sql = getNeonSql();
  await sql`
    INSERT INTO public.photo_upload_intents (
      id,
      invitation_slug,
      bucket_name,
      storage_path,
      content_type,
      declared_file_size_bytes,
      status,
      expires_at
    ) VALUES (
      ${input.photoId}::uuid,
      ${input.slug},
      ${input.bucketName},
      ${input.storagePath},
      ${input.contentType},
      ${input.declaredFileSizeBytes},
      'pending',
      ${input.expiresAt}::timestamptz
    )
  `;
}

export async function consumeMemoryUploadIntentRecord(
  input: ConsumeMemoryUploadIntentRecordInput
): Promise<MemoryUploadIntentRecord | null> {
  if (getDatabaseBackend() !== "neon") {
    return getPhotoUploadIntentRepository().consume(input);
  }

  const sql = getNeonSql();
  const rows = (await sql`
    UPDATE public.photo_upload_intents
    SET
      status = 'consumed',
      consumed_at = ${input.nowIso}::timestamptz
    WHERE id = ${input.photoId}::uuid
      AND invitation_slug = ${input.slug}
      AND bucket_name = ${input.bucketName}
      AND status = 'pending'
      AND expires_at > ${input.nowIso}::timestamptz
    RETURNING
      id,
      invitation_slug,
      bucket_name,
      storage_path,
      content_type,
      declared_file_size_bytes,
      status,
      created_at,
      expires_at,
      consumed_at
  `) as NeonIntentRow[];

  return rows[0] ? mapNeonIntent(rows[0]) : null;
}

export async function insertMemoryPhoto(
  input: InsertMemoryPhotoInput
): Promise<void> {
  if (getDatabaseBackend() !== "neon") {
    const supabase = createAdminClient();
    const { error } = await supabase.from("wedding_photos").insert({
      id: input.id,
      invitation_slug: input.invitationSlug,
      storage_path: input.storagePath,
      original_filename: input.originalFilename,
      content_type: input.contentType,
      file_size_bytes: input.fileSizeBytes,
      guest_name: input.guestName,
      caption: input.caption,
      challenge_id: input.challengeId,
      table_id: input.tableId,
      participant_id: input.participantId,
      moderation_status: "pending",
    });

    if (error) throw new Error(error.message);
    return;
  }

  const sql = getNeonSql();
  await sql`
    INSERT INTO public.wedding_photos (
      id,
      invitation_slug,
      storage_path,
      original_filename,
      content_type,
      file_size_bytes,
      guest_name,
      caption,
      challenge_id,
      table_id,
      participant_id,
      moderation_status
    ) VALUES (
      ${input.id}::uuid,
      ${input.invitationSlug},
      ${input.storagePath},
      ${input.originalFilename},
      ${input.contentType},
      ${input.fileSizeBytes},
      ${input.guestName},
      ${input.caption},
      ${input.challengeId},
      ${input.tableId},
      ${input.participantId}::uuid,
      'pending'
    )
  `;
}

export async function listMemoryGalleryRows(
  invitationSlug: string
): Promise<MemoryGalleryRow[]> {
  if (getDatabaseBackend() !== "neon") {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("wedding_photos")
      .select(
        "id, caption, guest_name, challenge_id, table_id, created_at, storage_path, content_type"
      )
      .eq("invitation_slug", invitationSlug)
      .neq("moderation_status", "rejected")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw new Error(error.message);

    return (data ?? []).map((row) => ({
      id: row.id,
      caption: row.caption,
      guestName: row.guest_name,
      challengeId: row.challenge_id,
      tableId: row.table_id,
      createdAt: row.created_at,
      storagePath: row.storage_path,
      contentType: row.content_type,
    }));
  }

  const sql = getNeonSql();
  const rows = (await sql`
    SELECT
      id,
      caption,
      guest_name,
      challenge_id,
      table_id,
      created_at,
      storage_path,
      content_type
    FROM public.wedding_photos
    WHERE invitation_slug = ${invitationSlug}
      AND moderation_status <> 'rejected'
    ORDER BY created_at DESC
    LIMIT 100
  `) as Array<{
    id: string;
    caption: string | null;
    guest_name: string | null;
    challenge_id: string | null;
    table_id: string | null;
    created_at: string | Date;
    storage_path: string;
    content_type: string;
  }>;

  return rows.map((row) => ({
    id: row.id,
    caption: row.caption,
    guestName: row.guest_name,
    challengeId: row.challenge_id,
    tableId: row.table_id,
    createdAt: toIso(row.created_at),
    storagePath: row.storage_path,
    contentType: row.content_type,
  }));
}
