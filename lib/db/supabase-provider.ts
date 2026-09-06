import { createAdminClient, isSupabaseConfigured } from '@lib/supabase/server';
import type {
  EditionDatabaseProvider,
  PublicMemoryPhotoRow,
  InsertPendingPhotoInput,
  CreatePhotoUploadIntentRecordInput,
  ConsumePhotoUploadIntentInput,
  PhotoUploadIntentRecord,
  RateLimitCheckResult,
  LeaderboardPhotoRow,
  GiftReservationRow,
  ReserveGiftResult,
} from './types';

export class SupabaseDatabaseProvider implements EditionDatabaseProvider {
  readonly name = 'supabase' as const;

  isConfigured(): boolean {
    return isSupabaseConfigured();
  }

  async listMemoriesPhotos(slug: string, limit = 100): Promise<PublicMemoryPhotoRow[]> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('wedding_photos')
      .select('id, caption, guest_name, challenge_id, table_id, created_at, storage_path, content_type')
      .eq('invitation_slug', slug)
      .neq('moderation_status', 'rejected')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return data as PublicMemoryPhotoRow[];
  }

  async insertPendingPhoto(input: InsertPendingPhotoInput): Promise<boolean> {
    const supabase = createAdminClient();
    const { error } = await supabase.from('wedding_photos').insert({
      id: input.id,
      invitation_slug: input.invitationSlug,
      storage_path: input.storagePath,
      original_filename: input.originalFilename,
      content_type: input.contentType,
      file_size_bytes: input.fileSizeBytes,
      guest_name: input.guestName?.trim() || null,
      caption: input.caption?.trim() || null,
      challenge_id: input.challengeId?.trim() || null,
      table_id: input.tableId?.trim() || null,
      participant_id: input.participantId?.trim() || null,
      moderation_status: 'pending',
    });
    return !error;
  }

  async createUploadIntent(input: CreatePhotoUploadIntentRecordInput): Promise<void> {
    const supabase = createAdminClient();
    const { error } = await supabase.from('photo_upload_intents').insert({
      id: input.photoId,
      invitation_slug: input.slug,
      bucket_name: input.bucketName,
      storage_path: input.storagePath,
      content_type: input.contentType,
      declared_file_size_bytes: input.declaredFileSizeBytes,
      status: 'pending',
      expires_at: input.expiresAt,
    });
    if (error) {
      throw new Error(error.message);
    }
  }

  async consumeUploadIntent(input: ConsumePhotoUploadIntentInput): Promise<PhotoUploadIntentRecord | null> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('photo_upload_intents')
      .update({
        status: 'consumed',
        consumed_at: input.nowIso,
      })
      .eq('id', input.photoId)
      .eq('invitation_slug', input.slug)
      .eq('bucket_name', input.bucketName)
      .eq('status', 'pending')
      .gt('expires_at', input.nowIso)
      .select(
        'id, invitation_slug, bucket_name, storage_path, content_type, declared_file_size_bytes, status, created_at, expires_at, consumed_at'
      )
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }
    if (!data) return null;
    const r = data as any;
    return {
      photoId: r.id,
      slug: r.invitation_slug,
      bucketName: r.bucket_name,
      storagePath: r.storage_path,
      contentType: r.content_type,
      declaredFileSizeBytes: Number(r.declared_file_size_bytes),
      status: r.status,
      createdAt: r.created_at,
      expiresAt: r.expires_at,
      consumedAt: r.consumed_at,
    };
  }

  async checkApiRateLimit(bucketKey: string, maxRequests: number, windowSeconds: number): Promise<RateLimitCheckResult> {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc('check_api_rate_limit', {
      p_bucket_key: bucketKey,
      p_max_requests: maxRequests,
      p_window_seconds: windowSeconds,
    });
    if (error || !data || typeof data !== 'object') {
      return { allowed: true, remaining: maxRequests, retryAfterSeconds: 0 };
    }
    const row = data as any;
    return {
      allowed: Boolean(row.allowed),
      remaining: Number(row.remaining ?? 0),
      retryAfterSeconds: Number(row.retry_after_seconds ?? 0),
    };
  }

  async getLeaderboardPhotos(slug: string): Promise<LeaderboardPhotoRow[]> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('wedding_photos')
      .select('id, invitation_slug, participant_id, guest_name, challenge_id, created_at, moderation_status')
      .eq('invitation_slug', slug)
      .not('participant_id', 'is', null);

    if (error || !data) return [];
    return data as LeaderboardPhotoRow[];
  }

  async getParticipantPhotos(slug: string, participantId: string): Promise<LeaderboardPhotoRow[]> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('wedding_photos')
      .select('id, invitation_slug, participant_id, guest_name, challenge_id, created_at, moderation_status')
      .eq('invitation_slug', slug)
      .eq('participant_id', participantId);

    if (error || !data) return [];
    return data as LeaderboardPhotoRow[];
  }

  async updateModerationStatus(id: string, slug: string, status: 'approved' | 'rejected'): Promise<boolean> {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('wedding_photos')
      .update({ moderation_status: status })
      .eq('id', id)
      .eq('invitation_slug', slug);

    return !error;
  }
  async listGiftReservations(registryKey: string): Promise<GiftReservationRow[]> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('edition_gift_reservations')
      .select('gift_id, reserved_by, created_at')
      .eq('registry_key', registryKey)
      .order('created_at', { ascending: true });

    if (error || !data) return [];
    return data.map((r: any) => ({
      gift_id: r.gift_id,
      reserved_by: r.reserved_by,
      created_at: r.created_at,
    }));
  }

  async reserveGift(
    registryKey: string,
    giftId: string,
    reservedBy: string,
    giftName = ''
  ): Promise<ReserveGiftResult> {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc('reserve_edition_gift', {
      p_registry_key: registryKey,
      p_gift_id: giftId,
      p_reserved_by: reservedBy.trim(),
      p_gift_name: giftName,
    });

    if (error || !data || typeof data !== 'object') {
      return { ok: false, error: 'Ocorreu um erro interno ao processar a reserva.' };
    }
    const payload = data as any;
    return {
      ok: Boolean(payload.ok),
      error: payload.error,
      reservedBy: payload.reservedBy,
      timestamp: payload.timestamp,
    };
  }
}
