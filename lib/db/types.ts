export type DatabaseProviderName = 'neon' | 'supabase';

export type PublicMemoryPhotoRow = {
  id: string;
  caption: string | null;
  guest_name: string | null;
  challenge_id: string | null;
  table_id: string | null;
  created_at: string;
  storage_path: string;
  content_type: string;
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

export type PhotoUploadIntentRecord = {
  photoId: string;
  slug: string;
  bucketName: string;
  storagePath: string;
  contentType: string;
  declaredFileSizeBytes: number;
  status: 'pending' | 'consumed' | 'expired';
  createdAt: string;
  expiresAt: string;
  consumedAt: string | null;
};

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
  checkApiRateLimit(bucketKey: string, maxRequests: number, windowSeconds: number): Promise<RateLimitCheckResult>;
  getLeaderboardPhotos(slug: string): Promise<LeaderboardPhotoRow[]>;
  getParticipantPhotos(slug: string, participantId: string): Promise<LeaderboardPhotoRow[]>;
  updateModerationStatus(id: string, slug: string, status: 'approved' | 'rejected'): Promise<boolean>;
}
