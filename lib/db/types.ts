export type DatabaseProviderName = 'neon' | 'supabase';

export type PublicMemoryPhotoRow = {
  id: string;
  invitation_slug: string;
  moderation_status: string;
  caption: string | null;
  guest_name: string | null;
  challenge_id: string | null;
  table_id: string | null;
  created_at: string;
  storage_path: string;
  content_type: string;
  // Phase 2: Media Core & Derivatives
  stage_id?: string | null;
  captured_at?: string | null;
  width?: number | null;
  height?: number | null;
  orientation?: string | null;
  duration_seconds?: number | null;
  media_type?: 'image' | 'video';
  thumbnail_storage_path?: string | null;
  poster_storage_path?: string | null;
  // Phase 5: Media Derivatives Pipeline
  medium_storage_path?: string | null;
  derivatives_status?: 'pending' | 'processing' | 'ready' | 'failed';
  has_derivatives?: boolean;
  derivatives_error?: string | null;
  derivatives_attempts?: number;
  derivatives_processed_at?: string | null;
};

export type InsertPendingPhotoInput = {
  id: string;
  invitationSlug: string;
  storagePath: string;
  originalFilename: string;
  contentType: string;
  fileSizeBytes: number;
  guestName?: string | null;
  caption?: string | null;
  challengeId?: string | null;
  tableId?: string | null;
  participantId?: string | null;
  eventId?: string | null;
  experienceId?: string | null;
  stageId?: string | null;
  capturedAt?: string | null;
  width?: number | null;
  height?: number | null;
  orientation?: string | null;
  durationSeconds?: number | null;
  mediaType?: 'image' | 'video';
  thumbnailStoragePath?: string | null;
  posterStoragePath?: string | null;
  mediumStoragePath?: string | null;
  derivativesStatus?: 'pending' | 'processing' | 'ready' | 'failed';
  hasDerivatives?: boolean;
};

export type CreatePhotoUploadIntentRecordInput = {
  photoId: string;
  slug: string;
  bucketName: string;
  storagePath: string;
  contentType: string;
  declaredFileSizeBytes: number;
  expiresAt: string;
  clientUploadId?: string | null;
  eventId?: string | null;
  participantId?: string | null;
  sessionId?: string | null;
  experienceId?: string | null;
  stageId?: string | null;
  capturedAt?: string | null;
  width?: number | null;
  height?: number | null;
  durationSeconds?: number | null;
  thumbnailStoragePath?: string | null;
  posterStoragePath?: string | null;
};

export type ConsumePhotoUploadIntentInput = {
  photoId: string;
  slug: string;
  bucketName: string;
  nowIso: string;
};

export type PhotoUploadIntentRecord = {
  photoId: string;
  slug: string;
  bucketName: string;
  storagePath: string;
  contentType: string;
  declaredFileSizeBytes: number;
  status: 'pending' | 'consumed' | 'expired' | 'completed' | 'cancelled';
  createdAt: string;
  expiresAt: string;
  consumedAt: string | null;
  clientUploadId?: string | null;
  completedMediaId?: string | null;
  eventId?: string | null;
  participantId?: string | null;
  experienceId?: string | null;
  stageId?: string | null;
  capturedAt?: string | null;
  width?: number | null;
  height?: number | null;
  durationSeconds?: number | null;
  thumbnailStoragePath?: string | null;
  posterStoragePath?: string | null;
};

export type TransactionalCompleteIntentInput = {
  photoId: string;
  slug: string;
  actualSizeBytes: number;
  originalFilename?: string;
  guestName?: string | null;
  caption?: string | null;
  challengeId?: string | null;
  tableId?: string | null;
  participantId?: string | null;
  stageId?: string | null;
  capturedAt?: string | null;
  width?: number | null;
  height?: number | null;
  orientation?: string | null;
  durationSeconds?: number | null;
  mediaType?: 'image' | 'video';
  thumbnailStoragePath?: string | null;
  posterStoragePath?: string | null;
  clientUploadId?: string | null;
  context?: {
    eventId: string;
    experienceId?: string;
    participantId: string;
    sessionId: string;
  } | null;
};

export type TransactionalCompleteIntentResult =
  | { success: true; mediaId: string; replayed?: boolean }
  | { success: false; error: string; code: string };

export type RateLimitCheckResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export type LeaderboardPhotoRow = {
  id: string;
  invitation_slug: string;
  participant_id: string | null;
  guest_name: string | null;
  challenge_id: string | null;
  created_at: string;
  moderation_status: string;
};

export interface EditionDatabaseProvider {
  readonly name: DatabaseProviderName;
  isConfigured(): boolean;
  listMemoriesPhotos(slug: string, limit?: number): Promise<PublicMemoryPhotoRow[]>;
  insertPendingPhoto(input: InsertPendingPhotoInput): Promise<boolean>;
  createUploadIntent(input: CreatePhotoUploadIntentRecordInput): Promise<void>;
  consumeUploadIntent(input: ConsumePhotoUploadIntentInput): Promise<PhotoUploadIntentRecord | null>;
  findUploadIntentByClientIdempotency?(eventId: string, experienceId: string, participantId: string, clientUploadId: string): Promise<PhotoUploadIntentRecord | null>;
  completePhotoUploadTransaction?(input: TransactionalCompleteIntentInput): Promise<TransactionalCompleteIntentResult>;
  checkApiRateLimit(bucketKey: string, maxRequests: number, windowSeconds: number): Promise<RateLimitCheckResult>;
  getLeaderboardPhotos(slug: string): Promise<LeaderboardPhotoRow[]>;
  getParticipantPhotos(slug: string, participantId: string): Promise<LeaderboardPhotoRow[]>;
  updateModerationStatus(id: string, slug: string, status: 'approved' | 'rejected'): Promise<boolean>;
  listGiftReservations(registryKey: string): Promise<GiftReservationRow[]>;
  reserveGift(registryKey: string, giftId: string, reservedBy: string, giftName?: string): Promise<ReserveGiftResult>;
}

export type GiftReservationRow = {
  gift_id: string;
  reserved_by: string;
  created_at: string;
};

export type ReserveGiftResult = {
  ok: boolean;
  error?: string;
  reservedBy?: string;
  timestamp?: string;
};
