import { createAdminClient } from "@lib/supabase/server";
import type {
  MemoriesStorageProvider,
  ObjectInfo,
  SignedDownloadUrlOptions,
  SignedDownloadUrlResult,
  SignedUploadUrlOptions,
  SignedUploadUrlResult,
} from "./types";
import { assertCanonicalStoragePath } from "./path-security";

export const SUPABASE_MEMORIES_BUCKET = "wedding-photos";

export class SupabaseMemoriesStorageProvider implements MemoriesStorageProvider {
  readonly providerName = "supabase" as const;
  private readonly bucketName = SUPABASE_MEMORIES_BUCKET;

  async createSignedUploadUrl(options: SignedUploadUrlOptions): Promise<SignedUploadUrlResult> {
    assertCanonicalStoragePath(options.storagePath);
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
      .from(this.bucketName)
      .createSignedUploadUrl(options.storagePath);

    if (error || !data?.signedUrl) {
      throw new Error(
        `[SupabaseStorageProvider] Falha ao gerar URL assinada de upload: ${error?.message || "Sem URL gerada"}`
      );
    }

    return { uploadUrl: data.signedUrl };
  }

  async createSignedDownloadUrl(options: SignedDownloadUrlOptions): Promise<SignedDownloadUrlResult> {
    assertCanonicalStoragePath(options.storagePath);
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
      .from(this.bucketName)
      .createSignedUrl(options.storagePath, options.expiresInSeconds);

    if (error || !data?.signedUrl) {
      throw new Error(
        `[SupabaseStorageProvider] Falha ao gerar URL assinada de download: ${error?.message || "Sem URL gerada"}`
      );
    }

    return { downloadUrl: data.signedUrl };
  }

  async getObjectInfo(storagePath: string): Promise<ObjectInfo> {
    assertCanonicalStoragePath(storagePath);
    const supabase = createAdminClient();
    const segments = storagePath.split("/");
    const folder = segments.slice(0, -1).join("/");
    const filename = segments[segments.length - 1];

    const { data, error } = await supabase.storage
      .from(this.bucketName)
      .list(folder, { limit: 100, search: filename });

    if (error) {
      throw new Error(`[SupabaseStorageProvider] Erro ao consultar metadados: ${error.message}`);
    }

    const match = data?.find((item) => item.name === filename);
    if (!match || !match.metadata) {
      return { exists: false };
    }

    return {
      exists: true,
      contentLength: match.metadata.size,
      contentType: match.metadata.mimetype,
    };
  }

  async readObjectPrefix(storagePath: string, maxBytes: number): Promise<Uint8Array | null> {
    assertCanonicalStoragePath(storagePath);
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
      .from(this.bucketName)
      .download(storagePath);

    if (error || !data) {
      return null;
    }

    const buffer = new Uint8Array(await data.arrayBuffer());
    return buffer.slice(0, Math.min(buffer.length, maxBytes));
  }

  async remove(storagePath: string): Promise<void> {
    assertCanonicalStoragePath(storagePath);
    const supabase = createAdminClient();
    const { error } = await supabase.storage.from(this.bucketName).remove([storagePath]);
    if (error) {
      console.error(`[SupabaseStorageProvider] Falha ao eliminar '${storagePath}': ${error.message}`);
    }
  }
}
