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
  maxBytesForContentType,
  toPublicGalleryItem,
  validateCaption,
  validateFileSize,
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

/** Contador de acessos reais a Supabase — só para regressão em testes. */
let supabaseAccessCountForTests = 0;

export function __getPhotoWallSupabaseAccessCountForTests(): number {
  return supabaseAccessCountForTests;
}

export function __resetPhotoWallSupabaseAccessCountForTests(): void {
  supabaseAccessCountForTests = 0;
}

let runtime: PhotoWallRuntime = {
  async download(bucketName, storagePath) {
    supabaseAccessCountForTests += 1;
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(storagePath);
    return error || !data ? null : data;
  },
  async remove(bucketName, storagePaths) {
    supabaseAccessCountForTests += 1;
    const supabase = createAdminClient();
    await supabase.storage.from(bucketName).remove(storagePaths);
  },
  async insertPendingPhoto(input) {
    supabaseAccessCountForTests += 1;
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
    return { success: false, error: "Convite não encontrado.", code: "NOT_FOUND" };
  }

  if (!isPhotoWallOpen()) {
    return {
      success: false,
      error: "A galeria de memórias ainda não está disponível.",
      code: "PHOTO_WALL_CLOSED",
    };
  }

  const bucketName = ctx.photoWallBucket;
  if (!bucketName) {
    return {
      success: false,
      error: "Serviço temporariamente indisponível.",
      code: "SERVICE_UNAVAILABLE",
    };
  }

  const storageSlug = JESSICA_SAMUEL_PHOTO_WALL.invitationSlug;

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
      error: "Serviço temporariamente indisponível.",
      code: "SERVICE_UNAVAILABLE",
    };
  }

  let intent;
  try {
    intent = await getPhotoUploadIntentRepository().consume({
      photoId,
      slug: storageSlug,
      bucketName,
      nowIso: new Date().toISOString(),
    });
  } catch {
    console.error("[PhotoWall] consume intent error");
    return {
      success: false,
      error: "Não foi possível confirmar o envio.",
      code: "INTENT_EXPIRED",
    };
  }

  if (!intent) {
    return { success: false, error: "Pedido de envio expirado.", code: "INTENT_EXPIRED" };
  }

  if (
    intent.slug !== storageSlug ||
    intent.bucketName !== bucketName ||
    !isStoragePathIsolated(storageSlug, intent.storagePath)
  ) {
    return { success: false, error: "Pedido de envio inválido.", code: "INVALID_INTENT" };
  }

  const fileData = await runtime.download(bucketName, intent.storagePath);
  if (!fileData) {
    return {
      success: false,
      error: "Não foi possível confirmar o envio.",
      code: "UPLOAD_MISSING",
    };
  }

  const buffer = new Uint8Array(await fileData.arrayBuffer());
  const sizeError = validateFileSize(buffer.byteLength, intent.contentType);
  if (sizeError || buffer.byteLength > intent.declaredFileSizeBytes) {
    await runtime.remove(bucketName, [intent.storagePath]);
    return {
      success: false,
      error:
        sizeError ??
        `O ficheiro excede o limite de ${Math.round(
          maxBytesForContentType(intent.contentType) / (1024 * 1024)
        )} MB.`,
    };
  }

  if (!matchesMagicBytes(buffer, intent.contentType)) {
    await runtime.remove(bucketName, [intent.storagePath]);
    return {
      success: false,
      error: "Tipo de ficheiro inválido.",
      code: "INVALID_SIGNATURE",
    };
  }

  const originalFilename =
    intent.storagePath.split("/").pop() ?? "original.jpg";

  const inserted = await runtime.insertPendingPhoto({
    id: photoId,
    invitationSlug: storageSlug,
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
      error: "Não foi possível registar a memória.",
      code: "DB_ERROR",
    };
  }

  return { success: true };
}

export async function listApprovedPublicPhotos(slug = "jessica-samuel"): Promise<PublicWeddingPhoto[]> {
  // Gate de feature: com upload/galeria desactivados, zero I/O a Supabase.
  if (!JESSICA_SAMUEL_PHOTO_WALL.enabled) {
    return [];
  }

  const ctx = resolveInvitationContext(slug);
  const galleryEnabled =
    Boolean(ctx?.photoWallEnabled) && JESSICA_SAMUEL_PHOTO_WALL.publicGalleryEnabled;

  if (!galleryEnabled || !isSupabaseConfigured()) {
    return [];
  }

  const bucketName = ctx?.photoWallBucket || JESSICA_SAMUEL_PHOTO_WALL.bucket;
  const invitationSlug = JESSICA_SAMUEL_PHOTO_WALL.invitationSlug;

  supabaseAccessCountForTests += 1;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("wedding_photos")
    .select("id, caption, created_at, storage_path, content_type")
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
        content_type: row.content_type,
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
