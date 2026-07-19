export type WeddingPhotoModerationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "deleted";

/** Public gallery item — no storage paths, no guest PII by default. */
export type PublicWeddingPhoto = {
  id: string;
  caption: string | null;
  signedUrl: string;
  createdAt: string;
  contentType: string;
  kind: "image" | "video";
};

export type WeddingPhotoUploadIntentInput = {
  slug: string;
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
  guestName?: string;
  caption?: string;
};

export type WeddingPhotoUploadIntentResult =
  | {
      success: true;
      photoId: string;
      uploadUrl: string;
      storagePath: string;
      expiresAt: string;
    }
  | { success: false; error: string; code?: string; retryAfterSeconds?: number };

export type WeddingPhotoCompleteInput = {
  slug: string;
  photoId: string;
  guestName?: string;
  caption?: string;
};

export type AdminWeddingPhoto = {
  id: string;
  storagePath: string;
  originalFilename: string;
  contentType: string;
  fileSizeBytes: number;
  guestName: string | null;
  caption: string | null;
  moderationStatus: WeddingPhotoModerationStatus;
  createdAt: string;
  approvedAt: string | null;
  rejectedAt: string | null;
  signedPreviewUrl: string | null;
};
