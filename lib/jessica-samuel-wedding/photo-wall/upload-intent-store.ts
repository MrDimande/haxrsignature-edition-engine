import { createAdminClient } from "@lib/supabase/server";

export type PhotoUploadIntentStatus = "pending" | "consumed" | "expired";

export type PhotoUploadIntentRecord = {
  photoId: string;
  slug: string;
  bucketName: string;
  storagePath: string;
  contentType: string;
  declaredFileSizeBytes: number;
  status: PhotoUploadIntentStatus;
  createdAt: string;
  expiresAt: string;
  consumedAt: string | null;
};

export type CreatePhotoUploadIntentRecordInput = {
  photoId: string;
  slug: string;
  bucketName: string;
  storagePath: string;
  contentType: string;
  declaredFileSizeBytes: number;
  expiresAt: string;
};

export type ConsumePhotoUploadIntentInput = {
  photoId: string;
  slug: string;
  bucketName: string;
  nowIso: string;
};

export interface PhotoUploadIntentRepository {
  create(input: CreatePhotoUploadIntentRecordInput): Promise<void>;
  consume(
    input: ConsumePhotoUploadIntentInput
  ): Promise<PhotoUploadIntentRecord | null>;
}

type PhotoUploadIntentRow = {
  id: string;
  invitation_slug: string;
  bucket_name: string;
  storage_path: string;
  content_type: string;
  declared_file_size_bytes: number;
  status: PhotoUploadIntentStatus;
  created_at: string;
  expires_at: string;
  consumed_at: string | null;
};

function mapRow(row: PhotoUploadIntentRow): PhotoUploadIntentRecord {
  return {
    photoId: row.id,
    slug: row.invitation_slug,
    bucketName: row.bucket_name,
    storagePath: row.storage_path,
    contentType: row.content_type,
    declaredFileSizeBytes: Number(row.declared_file_size_bytes),
    status: row.status,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    consumedAt: row.consumed_at,
  };
}

export class SupabasePhotoUploadIntentRepository
  implements PhotoUploadIntentRepository
{
  async create(input: CreatePhotoUploadIntentRecordInput): Promise<void> {
    const supabase = createAdminClient();
    const { error } = await supabase.from("photo_upload_intents").insert({
      id: input.photoId,
      invitation_slug: input.slug,
      bucket_name: input.bucketName,
      storage_path: input.storagePath,
      content_type: input.contentType,
      declared_file_size_bytes: input.declaredFileSizeBytes,
      status: "pending",
      expires_at: input.expiresAt,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  async consume(
    input: ConsumePhotoUploadIntentInput
  ): Promise<PhotoUploadIntentRecord | null> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("photo_upload_intents")
      .update({
        status: "consumed",
        consumed_at: input.nowIso,
      })
      .eq("id", input.photoId)
      .eq("invitation_slug", input.slug)
      .eq("bucket_name", input.bucketName)
      .eq("status", "pending")
      .gt("expires_at", input.nowIso)
      .select(
        "id, invitation_slug, bucket_name, storage_path, content_type, declared_file_size_bytes, status, created_at, expires_at, consumed_at"
      )
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? mapRow(data as PhotoUploadIntentRow) : null;
  }
}

let repository: PhotoUploadIntentRepository =
  new SupabasePhotoUploadIntentRepository();

export function getPhotoUploadIntentRepository(): PhotoUploadIntentRepository {
  return repository;
}

export function __setPhotoUploadIntentRepositoryForTests(
  next: PhotoUploadIntentRepository | null
): void {
  repository = next ?? new SupabasePhotoUploadIntentRepository();
}
