import { getNeonPool } from './neon-client';
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

export class NeonDatabaseProvider implements EditionDatabaseProvider {
  readonly name = 'neon' as const;

  isConfigured(): boolean {
    return Boolean((process.env.DATABASE_URL || '').trim());
  }

  async listMemoriesPhotos(slug: string, limit = 100): Promise<PublicMemoryPhotoRow[]> {
    const pool = getNeonPool();
    const query = `
      SELECT id, caption, guest_name, challenge_id, table_id, created_at, storage_path, content_type
      FROM wedding_photos
      WHERE invitation_slug = $1
        AND moderation_status != 'rejected'
      ORDER BY created_at DESC
      LIMIT $2
    `;
    const res = await pool.query(query, [slug, limit]);
    return res.rows.map((r: any) => ({
      id: r.id,
      caption: r.caption,
      guest_name: r.guest_name,
      challenge_id: r.challenge_id,
      table_id: r.table_id,
      created_at: typeof r.created_at === 'object' && r.created_at ? r.created_at.toISOString() : String(r.created_at),
      storage_path: r.storage_path,
      content_type: r.content_type,
    }));
  }

  async insertPendingPhoto(input: InsertPendingPhotoInput): Promise<boolean> {
    const pool = getNeonPool();
    const query = `
      INSERT INTO wedding_photos (
        id, invitation_slug, storage_path, original_filename, content_type,
        file_size_bytes, guest_name, caption, challenge_id, table_id,
        participant_id, moderation_status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending'
      )
    `;
    const values = [
      input.id,
      input.invitationSlug,
      input.storagePath,
      input.originalFilename,
      input.contentType,
      input.fileSizeBytes,
      input.guestName?.trim() || null,
      input.caption?.trim() || null,
      input.challengeId?.trim() || null,
      input.tableId?.trim() || null,
      input.participantId?.trim() || null,
    ];
    try {
      await pool.query(query, values);
      return true;
    } catch (err) {
      console.error('[NeonDatabaseProvider] insertPendingPhoto error:', err);
      return false;
    }
  }

  async createUploadIntent(input: CreatePhotoUploadIntentRecordInput): Promise<void> {
    const pool = getNeonPool();
    const query = `
      INSERT INTO photo_upload_intents (
        id, invitation_slug, bucket_name, storage_path, content_type,
        declared_file_size_bytes, status, expires_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, 'pending', $7
      )
    `;
    await pool.query(query, [
      input.photoId,
      input.slug,
      input.bucketName,
      input.storagePath,
      input.contentType,
      input.declaredFileSizeBytes,
      input.expiresAt,
    ]);
  }

  async consumeUploadIntent(input: ConsumePhotoUploadIntentInput): Promise<PhotoUploadIntentRecord | null> {
    const pool = getNeonPool();
    const query = `
      UPDATE photo_upload_intents
      SET status = 'consumed', consumed_at = $4
      WHERE id = $1
        AND invitation_slug = $2
        AND bucket_name = $3
        AND status = 'pending'
        AND expires_at > $4
      RETURNING id, invitation_slug, bucket_name, storage_path, content_type,
                declared_file_size_bytes, status, created_at, expires_at, consumed_at
    `;
    const res = await pool.query(query, [input.photoId, input.slug, input.bucketName, input.nowIso]);
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      photoId: r.id,
      slug: r.invitation_slug,
      bucketName: r.bucket_name,
      storagePath: r.storage_path,
      contentType: r.content_type,
      declaredFileSizeBytes: Number(r.declared_file_size_bytes),
      status: r.status,
      createdAt: typeof r.created_at === 'object' && r.created_at ? r.created_at.toISOString() : String(r.created_at),
      expiresAt: typeof r.expires_at === 'object' && r.expires_at ? r.expires_at.toISOString() : String(r.expires_at),
      consumedAt: r.consumed_at ? (typeof r.consumed_at === 'object' ? r.consumed_at.toISOString() : String(r.consumed_at)) : null,
    };
  }

  async checkApiRateLimit(bucketKey: string, maxRequests: number, windowSeconds: number): Promise<RateLimitCheckResult> {
    const pool = getNeonPool();
    const query = `
      SELECT check_api_rate_limit($1, $2, $3) AS result
    `;
    const res = await pool.query(query, [bucketKey, maxRequests, windowSeconds]);
    if (res.rows.length === 0 || !res.rows[0]?.result) {
      return { allowed: true, remaining: maxRequests, retryAfterSeconds: 0 };
    }
    const r = res.rows[0].result;
    return {
      allowed: Boolean(r.allowed),
      remaining: Number(r.remaining ?? 0),
      retryAfterSeconds: Number(r.retry_after_seconds ?? 0),
    };
  }

  async getLeaderboardPhotos(slug: string): Promise<LeaderboardPhotoRow[]> {
    const pool = getNeonPool();
    const query = `
      SELECT id, invitation_slug, participant_id, guest_name, challenge_id, created_at, moderation_status
      FROM wedding_photos
      WHERE invitation_slug = $1
        AND participant_id IS NOT NULL
    `;
    const res = await pool.query(query, [slug]);
    return res.rows.map((r: any) => ({
      id: r.id,
      invitation_slug: r.invitation_slug,
      participant_id: r.participant_id,
      guest_name: r.guest_name,
      challenge_id: r.challenge_id,
      created_at: typeof r.created_at === 'object' && r.created_at ? r.created_at.toISOString() : String(r.created_at),
      moderation_status: r.moderation_status,
    }));
  }

  async getParticipantPhotos(slug: string, participantId: string): Promise<LeaderboardPhotoRow[]> {
    const pool = getNeonPool();
    const query = `
      SELECT id, invitation_slug, participant_id, guest_name, challenge_id, created_at, moderation_status
      FROM wedding_photos
      WHERE invitation_slug = $1
        AND participant_id = $2
    `;
    const res = await pool.query(query, [slug, participantId]);
    return res.rows.map((r: any) => ({
      id: r.id,
      invitation_slug: r.invitation_slug,
      participant_id: r.participant_id,
      guest_name: r.guest_name,
      challenge_id: r.challenge_id,
      created_at: typeof r.created_at === 'object' && r.created_at ? r.created_at.toISOString() : String(r.created_at),
      moderation_status: r.moderation_status,
    }));
  }

  async updateModerationStatus(id: string, slug: string, status: 'approved' | 'rejected'): Promise<boolean> {
    const pool = getNeonPool();
    const query = `
      UPDATE wedding_photos
      SET moderation_status = $1
      WHERE id = $2
        AND invitation_slug = $3
    `;
    const res = await pool.query(query, [status, id, slug]);
    return (res.rowCount ?? 0) > 0;
  }
  async listGiftReservations(registryKey: string): Promise<GiftReservationRow[]> {
    const pool = getNeonPool();
    const query = `
      SELECT gift_id, reserved_by, created_at
      FROM edition_gift_reservations
      WHERE registry_key = $1
      ORDER BY created_at ASC
    `;
    const res = await pool.query(query, [registryKey]);
    return res.rows.map((r: any) => ({
      gift_id: r.gift_id,
      reserved_by: r.reserved_by,
      created_at: typeof r.created_at === 'object' && r.created_at ? r.created_at.toISOString() : String(r.created_at),
    }));
  }

  async reserveGift(
    registryKey: string,
    giftId: string,
    reservedBy: string,
    giftName = ''
  ): Promise<ReserveGiftResult> {
    const pool = getNeonPool();
    const query = `
      SELECT reserve_edition_gift($1, $2, $3, $4) AS result
    `;
    const res = await pool.query(query, [registryKey, giftId, reservedBy.trim(), giftName]);
    if (res.rows.length === 0 || !res.rows[0]?.result) {
      return { ok: false, error: 'Ocorreu um erro interno ao processar a reserva.' };
    }
    const payload = res.rows[0].result;
    return {
      ok: Boolean(payload.ok),
      error: payload.error,
      reservedBy: payload.reservedBy,
      timestamp: payload.timestamp,
    };
  }
}
