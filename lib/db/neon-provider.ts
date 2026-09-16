import { getNeonPool } from './neon-client';
import type {
  EditionDatabaseProvider,
  PublicMemoryPhotoRow,
  InsertPendingPhotoInput,
  CreatePhotoUploadIntentRecordInput,
  ConsumePhotoUploadIntentInput,
  PhotoUploadIntentRecord,
  TransactionalCompleteIntentInput,
  TransactionalCompleteIntentResult,
  RateLimitCheckResult,
  LeaderboardPhotoRow,
  GiftReservationRow,
  ReserveGiftResult,
} from './types';

export class NeonDatabaseProvider implements EditionDatabaseProvider {
  readonly name = 'neon' as const;

  /**
   * Executa queries com retry apenas para leituras estritamente idempotentes
   * ou instruções com cláusula ON CONFLICT DO NOTHING comprovadamente seguras.
   *
   * PROIBIÇÃO ESTRITA:
   * Transacções com side effects ou estado de commit desconhecido após desconexão
   * (ex: completePhotoUploadTransaction) NUNCA devem usar queryWithRetry.
   * A recuperação de falhas de rede no commit deve ocorrer exclusivamente através
   * do contrato de idempotência (client_upload_id / intent).
   */
  private async queryWithRetry<T extends any = any>(query: string, params?: any[]): Promise<any> {
    const pool = getNeonPool();
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await pool.query(query, params);
      } catch (err: any) {
        const isTransient =
          err?.message?.includes('Connection terminated unexpectedly') ||
          err?.code === 'ECONNRESET' ||
          err?.code === '57P01' ||
          err?.message?.includes('socket hang up');
        if (isTransient && attempt < 2) {
          await new Promise((r) => setTimeout(r, 200 * (attempt + 1)));
          continue;
        }
        throw err;
      }
    }
    return await pool.query(query, params);
  }

  isConfigured(): boolean {
    return Boolean((process.env.DATABASE_URL || '').trim());
  }

  async listMemoriesPhotos(slug: string, limit = 100): Promise<PublicMemoryPhotoRow[]> {
    const pool = getNeonPool();
    const query = `
      SELECT id, invitation_slug, moderation_status, caption, guest_name, challenge_id, table_id, created_at, storage_path, content_type,
             stage_id, captured_at, width, height, orientation, duration_seconds, media_type, thumbnail_storage_path, poster_storage_path,
             medium_storage_path, has_derivatives, derivatives_status
      FROM wedding_photos
      WHERE invitation_slug = $1
        AND moderation_status = 'approved'
      ORDER BY created_at DESC, id DESC
      LIMIT $2
    `;
    const res = await pool.query<Omit<PublicMemoryPhotoRow, "created_at" | "captured_at"> & { created_at: Date | string; captured_at?: Date | string | null }>(query, [slug, limit]);
    return res.rows.map((r) => ({
      id: r.id,
      invitation_slug: r.invitation_slug,
      moderation_status: r.moderation_status,
      caption: r.caption,
      guest_name: r.guest_name,
      challenge_id: r.challenge_id,
      table_id: r.table_id,
      created_at: typeof r.created_at === 'object' && r.created_at ? r.created_at.toISOString() : String(r.created_at),
      storage_path: r.storage_path,
      content_type: r.content_type,
      stage_id: r.stage_id || null,
      captured_at: r.captured_at ? (typeof r.captured_at === 'object' ? r.captured_at.toISOString() : String(r.captured_at)) : null,
      width: r.width ? Number(r.width) : null,
      height: r.height ? Number(r.height) : null,
      orientation: r.orientation || null,
      duration_seconds: r.duration_seconds ? Number(r.duration_seconds) : null,
      media_type: (r.media_type as 'image' | 'video') || 'image',
      thumbnail_storage_path: r.thumbnail_storage_path || null,
      poster_storage_path: r.poster_storage_path || null,
      medium_storage_path: r.medium_storage_path || null,
      has_derivatives: Boolean(r.has_derivatives),
      derivatives_status: r.derivatives_status || 'pending',
    }));
  }

  async insertPendingPhoto(input: InsertPendingPhotoInput): Promise<boolean> {
    const pool = getNeonPool();
    const query = `
      INSERT INTO wedding_photos (
        id, invitation_slug, storage_path, original_filename, content_type,
        file_size_bytes, guest_name, caption, challenge_id, table_id,
        participant_id, moderation_status, event_id, experience_id,
        stage_id, captured_at, width, height, orientation, duration_seconds,
        media_type, thumbnail_storage_path, poster_storage_path
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending', $12, $13,
        $14, $15, $16, $17, $18, $19, $20, $21, $22
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
      input.eventId || null,
      input.experienceId || null,
      input.stageId || null,
      input.capturedAt || null,
      input.width || null,
      input.height || null,
      input.orientation || null,
      input.durationSeconds || null,
      input.mediaType || 'image',
      input.thumbnailStoragePath || null,
      input.posterStoragePath || null,
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
    if (input.clientUploadId && input.eventId && input.experienceId && input.participantId) {
      const query = `
        INSERT INTO photo_upload_intents (
          id, invitation_slug, bucket_name, storage_path, content_type,
          declared_file_size_bytes, status, expires_at,
          event_id, participant_id, session_id, experience_id,
          stage_id, captured_at, width, height, duration_seconds,
          thumbnail_storage_path, poster_storage_path, client_upload_id
        ) VALUES (
          $1, $2, $3, $4, $5, $6, 'pending', $7, $8, $9, $10, $11,
          $12, $13, $14, $15, $16, $17, $18, $19
        )
        ON CONFLICT (event_id, experience_id, participant_id, client_upload_id) WHERE client_upload_id IS NOT NULL
        DO NOTHING
      `;
      await this.queryWithRetry(query, [
        input.photoId,
        input.slug,
        input.bucketName,
        input.storagePath,
        input.contentType,
        input.declaredFileSizeBytes,
        input.expiresAt,
        input.eventId,
        input.participantId,
        input.sessionId || null,
        input.experienceId,
        input.stageId || null,
        input.capturedAt || null,
        input.width || null,
        input.height || null,
        input.durationSeconds || null,
        input.thumbnailStoragePath || null,
        input.posterStoragePath || null,
        input.clientUploadId,
      ]);
      return;
    }

    const query = `
      INSERT INTO photo_upload_intents (
        id, invitation_slug, bucket_name, storage_path, content_type,
        declared_file_size_bytes, status, expires_at,
        event_id, participant_id, session_id, experience_id,
        stage_id, captured_at, width, height, duration_seconds,
        thumbnail_storage_path, poster_storage_path, client_upload_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, 'pending', $7, $8, $9, $10, $11,
        $12, $13, $14, $15, $16, $17, $18, $19
      )
    `;
    await this.queryWithRetry(query, [
      input.photoId,
      input.slug,
      input.bucketName,
      input.storagePath,
      input.contentType,
      input.declaredFileSizeBytes,
      input.expiresAt,
      input.eventId || null,
      input.participantId || null,
      input.sessionId || null,
      input.experienceId || null,
      input.stageId || null,
      input.capturedAt || null,
      input.width || null,
      input.height || null,
      input.durationSeconds || null,
      input.thumbnailStoragePath || null,
      input.posterStoragePath || null,
      input.clientUploadId || null,
    ]);
  }

  async findUploadIntentByClientIdempotency(
    eventId: string,
    experienceId: string,
    participantId: string,
    clientUploadId: string
  ): Promise<PhotoUploadIntentRecord | null> {
    const query = `
      SELECT id, invitation_slug, bucket_name, storage_path, content_type,
             declared_file_size_bytes, status, created_at, expires_at, consumed_at,
             client_upload_id, completed_media_id, stage_id, captured_at, width, height,
             duration_seconds, thumbnail_storage_path, poster_storage_path,
             event_id, participant_id, experience_id
      FROM photo_upload_intents
      WHERE event_id = $1
        AND experience_id = $2
        AND participant_id = $3
        AND client_upload_id = $4
      LIMIT 1
    `;
    const res = await this.queryWithRetry(query, [eventId, experienceId, participantId, clientUploadId]);
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
      clientUploadId: r.client_upload_id,
      completedMediaId: r.completed_media_id,
      eventId: r.event_id,
      participantId: r.participant_id,
      experienceId: r.experience_id,
      stageId: r.stage_id || null,
      capturedAt: r.captured_at ? (typeof r.captured_at === 'object' ? r.captured_at.toISOString() : String(r.captured_at)) : null,
      width: r.width ? Number(r.width) : null,
      height: r.height ? Number(r.height) : null,
      durationSeconds: r.duration_seconds ? Number(r.duration_seconds) : null,
      thumbnailStoragePath: r.thumbnail_storage_path || null,
      posterStoragePath: r.poster_storage_path || null,
    };
  }

  async renewUploadIntent(
    photoId: string,
    newExpiresAt: string
  ): Promise<boolean> {
    const res = await this.queryWithRetry(
      `UPDATE photo_upload_intents SET expires_at = $1 WHERE id = $2 AND status = 'pending'`,
      [newExpiresAt, photoId]
    );
    return (res.rowCount ?? 0) > 0;
  }

  async consumeUploadIntent(input: ConsumePhotoUploadIntentInput): Promise<PhotoUploadIntentRecord | null> {
    const query = `
      UPDATE photo_upload_intents
      SET status = 'consumed', consumed_at = $4
      WHERE id = $1
        AND invitation_slug = $2
        AND bucket_name = $3
        AND status = 'pending'
        AND expires_at > $4
      RETURNING id, invitation_slug, bucket_name, storage_path, content_type,
                declared_file_size_bytes, status, created_at, expires_at, consumed_at,
                stage_id, captured_at, width, height, duration_seconds,
                thumbnail_storage_path, poster_storage_path
    `;
    const res = await this.queryWithRetry(query, [input.photoId, input.slug, input.bucketName, input.nowIso]);
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
      stageId: r.stage_id || null,
      capturedAt: r.captured_at ? (typeof r.captured_at === 'object' ? r.captured_at.toISOString() : String(r.captured_at)) : null,
      width: r.width ? Number(r.width) : null,
      height: r.height ? Number(r.height) : null,
      durationSeconds: r.duration_seconds ? Number(r.duration_seconds) : null,
      thumbnailStoragePath: r.thumbnail_storage_path || null,
      posterStoragePath: r.poster_storage_path || null,
    };
  }

  async completePhotoUploadTransaction(
    input: TransactionalCompleteIntentInput
  ): Promise<TransactionalCompleteIntentResult> {
    const pool = getNeonPool();
    const client = await pool.connect();
    const now = new Date();
    try {
      await client.query("BEGIN");

      // Obter o intent com bloqueio pessimista (FOR UPDATE)
      const query = `
        SELECT id, event_id, participant_id, session_id, storage_path, content_type,
               declared_file_size_bytes, status, expires_at, completed_media_id,
               invitation_slug, experience_id, stage_id, captured_at, width, height,
               duration_seconds, thumbnail_storage_path, poster_storage_path,
               client_upload_id
        FROM photo_upload_intents
        WHERE id = $1 AND invitation_slug = $2
        FOR UPDATE
      `;
      const res = await client.query(query, [input.photoId, input.slug]);
      if (res.rows.length === 0) {
        await client.query("ROLLBACK");
        return { success: false, error: "Pedido de envio não encontrado.", code: "INTENT_NOT_FOUND" };
      }

      const intent = res.rows[0];

      // Revalidar propriedade de sessão se fornecida pelo contexto
      if (input.context) {
        if (intent.event_id && intent.event_id !== input.context.eventId) {
          await client.query("ROLLBACK");
          return { success: false, error: "Sessão não autorizada para este intent.", code: "OWNERSHIP_MISMATCH" };
        }
        if (intent.participant_id && intent.participant_id !== input.context.participantId) {
          await client.query("ROLLBACK");
          return { success: false, error: "Participante não autorizado para este intent.", code: "OWNERSHIP_MISMATCH" };
        }
        if (intent.session_id && intent.session_id !== input.context.sessionId) {
          await client.query("ROLLBACK");
          return { success: false, error: "Sessão expirada ou diferente da emissão do intent.", code: "OWNERSHIP_MISMATCH" };
        }
      }

      // Idempotência determinística sob concorrência: se já concluído, retorna a media existente
      if (intent.status === "completed" || (intent.status === "consumed" && intent.completed_media_id)) {
        await client.query("COMMIT");
        return {
          success: true,
          mediaId: intent.completed_media_id || intent.id,
          replayed: true,
        };
      }

      if (intent.status === "cancelled") {
        await client.query("ROLLBACK");
        return { success: false, error: "Pedido de envio cancelado.", code: "INTENT_CANCELLED" };
      }

      if (intent.status !== "pending") {
        await client.query("ROLLBACK");
        return { success: false, error: "Pedido de envio já processado ou inválido.", code: "INTENT_INVALID" };
      }

      const expiresAt = new Date(intent.expires_at).getTime();
      if (expiresAt <= now.getTime()) {
        await client.query("ROLLBACK");
        return { success: false, error: "Pedido de envio expirado.", code: "INTENT_EXPIRED" };
      }

      const photoId = intent.id;
      const originalFilename = input.originalFilename || intent.storage_path.split("/").pop() || "original.jpg";
      const eventId = input.context?.eventId || intent.event_id || null;
      const participantId = input.context?.participantId || input.participantId || intent.participant_id || null;
      const experienceId = input.context?.experienceId || intent.experience_id || null;
      const stageId = input.stageId || intent.stage_id || null;
      const capturedAt = input.capturedAt || intent.captured_at || null;
      const width = input.width || (intent.width ? Number(intent.width) : null);
      const height = input.height || (intent.height ? Number(intent.height) : null);
      const orientation = input.orientation || (width && height ? (width > height ? 'landscape' : width < height ? 'portrait' : 'square') : null);
      const durationSeconds = input.durationSeconds || (intent.duration_seconds ? Number(intent.duration_seconds) : null);
      const mediaType = input.mediaType || (intent.content_type?.startsWith('video/') ? 'video' : 'image');
      const thumbnailStoragePath = input.thumbnailStoragePath || intent.thumbnail_storage_path || null;
      const posterStoragePath = input.posterStoragePath || intent.poster_storage_path || null;
      // Regra 6: o client_upload_id gravado em wedding_photos vem ESTRITAMENTE do intent server-side
      const clientUploadId = intent.client_upload_id || null;

      const insertPhotoQuery = `
        INSERT INTO wedding_photos (
          id, event_id, invitation_slug, storage_path, original_filename,
          content_type, file_size_bytes, guest_name, caption, challenge_id,
          table_id, participant_id, experience_id, moderation_status,
          stage_id, captured_at, width, height, orientation, duration_seconds,
          media_type, thumbnail_storage_path, poster_storage_path,
          client_upload_id
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'pending',
          $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
        )
        ON CONFLICT (id) DO NOTHING
        RETURNING id
      `;

      const insertValues = [
        photoId,
        eventId,
        input.slug,
        intent.storage_path,
        originalFilename,
        intent.content_type,
        input.actualSizeBytes,
        input.guestName?.trim() || null,
        input.caption?.trim() || null,
        input.challengeId?.trim() || null,
        input.tableId?.trim() || null,
        participantId,
        experienceId,
        stageId,
        capturedAt,
        width,
        height,
        orientation,
        durationSeconds,
        mediaType,
        thumbnailStoragePath,
        posterStoragePath,
        clientUploadId,
      ];

      await client.query("SAVEPOINT before_insert_photo");
      let wasAlreadyInserted = false;
      try {
        const insertRes = await client.query(insertPhotoQuery, insertValues);
        if (insertRes.rows.length === 0) {
          wasAlreadyInserted = true;
        }
        await client.query("RELEASE SAVEPOINT before_insert_photo");
      } catch (insertErr: any) {
        await client.query("ROLLBACK TO SAVEPOINT before_insert_photo");
        if (
          insertErr?.code === '23505' &&
          (insertErr?.constraint === 'wedding_photos_client_upload_id_idx' ||
           insertErr?.message?.includes('wedding_photos_client_upload_id') ||
           insertErr?.detail?.includes('client_upload_id')) &&
          clientUploadId
        ) {
          // Idempotência por client_upload_id já existente na tabela de fotos (convergência para o registo canónico)
          const existingMedia = await client.query(
            `SELECT id FROM wedding_photos
             WHERE event_id = $1 AND experience_id = $2 AND participant_id = $3 AND client_upload_id = $4
             LIMIT 1`,
            [eventId, experienceId, participantId, clientUploadId]
          );
          if (existingMedia.rows.length > 0) {
            const existingId = existingMedia.rows[0].id;
            // Se outro intent já possui completed_media_id apontando para existingId,
            // marcamos este intent como completed sem duplicar a chave única photo_upload_intents_completed_media_uidx.
            const alreadyAssigned = await client.query(
              `SELECT id FROM photo_upload_intents WHERE completed_media_id = $1 LIMIT 1`,
              [existingId]
            );
            if (alreadyAssigned.rows.length > 0 && alreadyAssigned.rows[0].id !== photoId) {
              await client.query(
                `UPDATE photo_upload_intents SET status = 'completed', consumed_at = $1 WHERE id = $2`,
                [now.toISOString(), photoId]
              );
            } else {
              await client.query(
                `UPDATE photo_upload_intents SET status = 'completed', consumed_at = $1, completed_media_id = $2 WHERE id = $3`,
                [now.toISOString(), existingId, photoId]
              );
            }
            await client.query("COMMIT");
            return { success: true, mediaId: existingId, replayed: true };
          }
        }
        throw insertErr;
      }

      const updateIntentQuery = `
        UPDATE photo_upload_intents
        SET status = 'completed',
            consumed_at = $1,
            completed_media_id = $2
        WHERE id = $3
      `;
      await client.query(updateIntentQuery, [now.toISOString(), photoId, photoId]);

      await client.query("COMMIT");
      return { success: true, mediaId: photoId, replayed: wasAlreadyInserted };
    } catch (err: any) {
      await client.query("ROLLBACK");
      console.error("[NeonDatabaseProvider] completePhotoUploadTransaction error:", err?.message || err);
      return { success: false, error: "Não foi possível registar a memória.", code: "DB_ERROR" };
    } finally {
      client.release();
    }
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
