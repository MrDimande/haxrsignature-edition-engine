import { createAdminClient, isSupabaseConfigured } from "@lib/supabase/server";
import { resolveInvitationContext, type InvitationContext } from "@lib/context-resolver";
import { publicMutationRateLimit } from "@lib/security/mutation-rate-limit";
import { RATE_LIMITS } from "@lib/security/rate-limit";
import { JESSICA_SAMUEL_PHOTO_WALL } from "./config";
import type { PublicWeddingPhoto } from "./types";
import { getPhotoUploadIntentRepository } from "./upload-intent-store";
import {
  isPhotoWallOpen,
  matchesMagicBytes,
  toPublicGalleryItem,
  validateCaption,
  validateGuestName,
} from "./validation";

type CompletePhotoUploadMetadata = {
  guestName?: string;
  caption?: string;
};

type PhotoWallRuntime = {
  download(bucketName: string, storagePath: string): Promise<Blob | null>;
  remove(bucketName: string, storagePaths: string[]): Promise<void>;
  insertPendingPhoto(input: {
    id: string;
    invitationSlug: string;
    storagePath: string;
    originalFilename: string;
    contentType: string;
    fileSizeBytes: number;
    guestName: string | null;
    caption: string | null;
  }): Promise<boolean>;
};

let runtime: PhotoWallRuntime = {
  async download(bucketName, storagePath) {
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(storagePath);
    return error || !data ? null : data;
  },
  async remove(bucketName, storagePaths) {
    const supabase = createAdminClient();
    await supabase.storage.from(bucketName).remove(storagePaths);
  },
  async insertPendingPhoto(input) {
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
      moderation_status: "pending",
    });
    return !error;
  },
};

function resolvePhotoWallContext(slug: string): InvitationContext | null {
  const ctx = resolveInvitationContext(slug);
  if (!ctx?.photoWallEnabled) return null;
  return ctx;
}

function isStoragePathIsolated(slug: string, storagePath: string): boolean {
  return storagePath.startsWith(`${slug}/`) && !storagePath.includes("..");
}

export async function completePhotoUpload(
  slug: string,
  photoId: string,
  request: Request,
  metadata: CompletePhotoUploadMetadata = {}
): Promise<{ success: boolean; error?: string; code?: string; retryAfterSeconds?: number }> {
  const ctx = resolvePhotoWallContext(slug);
  if (!ctx) {
    return { success: false, error: "Convite nÃ£o encontrado.", code: "NOT_FOUND" };
  }

  if (!isPhotoWallOpen()) {
    return {
      success: false,
      error: "A galeria de memÃ³rias ainda nÃ£o estÃ¡ disponÃ­vel.",
      code: "PHOTO_WALL_CLOSED",
    };
  }

  const bucketName = ctx.photoWallBucket;
  if (!bucketName) {
    return {
      success: false,
      error: "ServiÃ§o temporariamente indisponÃ­vel.",
      code: "SERVICE_UNAVAILABLE",
    };
  }

  const nameError = validateGuestName(metadata.guestName);
  if (nameError) return { success: false, error: nameError };

  const captionError = validateCaption(metadata.caption);
  if (captionError) return { success: false, error: captionError };

  const limit = await publicMutationRateLimit(
    {
      scope: "photo-wall",
      slug: ctx.slug,
      action: "complete",
      request,
    },
    RATE_LIMITS.jessicaSamuelPhotoComplete
  );
  if (!limit.allowed) {
    return {
      success: false,
      error: "Demasiados pedidos. Aguarde alguns minutos e tente novamente.",
      code: "RATE_LIMITED",
      retryAfterSeconds: limit.retryAfterSeconds,
    };
  }

  if (!photoId.trim()) {
    return { success: false, error: "Pedido de envio expirado.", code: "INTENT_EXPIRED" };
  }

  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error: "ServiÃ§o temporariamente indisponÃ­vel.",
      code: "SERVICE_UNAVAILABLE",
    };
  }

  let intent;
  try {
    intent = await getPhotoUploadIntentRepository().consume({
      photoId,
      slug: ctx.slug,
      bucketName,
      nowIso: new Date().toISOString(),
    });
  } catch {
    console.error("[PhotoWall] consume intent error");
    return {
      success: false,
      error: "NÃ£o foi possÃ­vel confirmar o envio.",
      code: "INTENT_EXPIRED",
    };
  }

  if (!intent) {
    return { success: false, error: "Pedido de envio expirado.", code: "INTENT_EXPIRED" };
  }

  if (
    intent.slug !== ctx.slug ||
    intent.bucketName !== bucketName ||
    !isStoragePathIsolated(ctx.slug, intent.storagePath)
  ) {
    return { success: false, error: "Pedido de envio invÃ¡lido.", code: "INVALID_INTENT" };
  }

  const fileData = await runtime.download(bucketName, intent.storagePath);
  if (!fileData) {
    return {
      success: false,
      error: "NÃ£o foi possÃ­vel confirmar o envio.",
      code: "UPLOAD_MISSING",
    };
  }

  const buffer = new Uint8Array(await fileData.arrayBuffer());
  if (
    buffer.byteLength > JESSICA_SAMUEL_PHOTO_WALL.maxFileSizeBytes ||
    buffer.byteLength > intent.declaredFileSizeBytes
  ) {
    await runtime.remove(bucketName, [intent.storagePath]);
    return { success: false, error: "A imagem excede o limite de 5 MB." };
  }

  if (!matchesMagicBytes(buffer, intent.contentType)) {
    await runtime.remove(bucketName, [intent.storagePath]);
    return {
      success: false,
      error: "Tipo de ficheiro invÃ¡lido.",
      code: "INVALID_SIGNATURE",
    };
  }

  const originalFilename =
    intent.storagePath.split("/").pop() ?? "original.jpg";

  const inserted = await runtime.insertPendingPhoto({
    id: photoId,
    invitationSlug: ctx.slug,
    storagePath: intent.storagePath,
    originalFilename,
    contentType: intent.contentType,
    fileSizeBytes: buffer.byteLength,
    guestName: metadata.guestName?.trim() || null,
    caption: metadata.caption?.trim() || null,
  });

  if (!inserted) {
    console.error("[PhotoWall] insert error");
    return {
      success: false,
      error: "NÃ£o foi possÃ­vel registar a memÃ³ria.",
      code: "DB_ERROR",
    };
  }

  return { success: true };
}

export async function listApprovedPublicPhotos(slug = "jessica-samuel"): Promise<PublicWeddingPhoto[]> {
  const ctx = resolveInvitationContext(slug);
  const galleryEnabled = ctx?.photoWallEnabled ?? JESSICA_SAMUEL_PHOTO_WALL.publicGalleryEnabled;

  if (
    !galleryEnabled ||
    !isSupabaseConfigured()
  ) {
    return [];
  }

  const bucketName = ctx?.photoWallBucket || JESSICA_SAMUEL_PHOTO_WALL.bucket;
  const invitationSlug = ctx?.slug || JESSICA_SAMUEL_PHOTO_WALL.invitationSlug;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("wedding_photos")
    .select("id, caption, created_at, storage_path")
    .eq("invitation_slug", invitationSlug)
    .eq("moderation_status", "approved")
    .order("created_at", { ascending: false })
    .limit(60);

  if (error || !data?.length) return [];

  const results: PublicWeddingPhoto[] = [];
  for (const row of data) {
    const { data: signed } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(
        row.storage_path,
        JESSICA_SAMUEL_PHOTO_WALL.signedUrlTtlSeconds
      );
    if (!signed?.signedUrl) continue;
    results.push(
      toPublicGalleryItem({
        id: row.id,
        caption: row.caption,
        created_at: row.created_at,
        signedUrl: signed.signedUrl,
      })
    );
  }
  return results;
}

export function __setPhotoWallRuntimeForTests(next: PhotoWallRuntime | null): void {
  runtime =
    next ??
    {
      async download(bucketName, storagePath) {
        const supabase = createAdminClient();
        const { data, error } = await supabase.storage
          .from(bucketName)
          .download(storagePath);
        return error || !data ? null : data;
      },
      async remove(bucketName, storagePaths) {
        const supabase = createAdminClient();
        await supabase.storage.from(bucketName).remove(storagePaths);
      },
      async insertPendingPhoto(input) {
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
          moderation_status: "pending",
        });
        return !error;
      },
    };
}
