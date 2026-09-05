/**
 * Abstracção de Storage para Memórias de Convidados (HAXR Signature Edition)
 *
 * Suporta Supabase Storage (comportamento canónico actual) e Cloudflare R2 / S3
 * de forma desacoplada, preservando a semântica estrita de fail-closed e segurança.
 */

export type SupportedStorageProvider = "supabase" | "r2-s3";

export type SignedUploadUrlOptions = {
  storagePath: string;
  contentType: string;
  expiresInSeconds: number;
};

export type SignedUploadUrlResult = {
  uploadUrl: string;
};

export type SignedDownloadUrlOptions = {
  storagePath: string;
  expiresInSeconds: number;
};

export type SignedDownloadUrlResult = {
  downloadUrl: string;
};

export type ObjectInfo = {
  exists: boolean;
  contentLength?: number;
  contentType?: string;
  etag?: string;
};

export interface MemoriesStorageProvider {
  readonly providerName: SupportedStorageProvider;

  /** Gera URL assinada para upload directo pelo browser via PUT */
  createSignedUploadUrl(options: SignedUploadUrlOptions): Promise<SignedUploadUrlResult>;

  /** Gera URL assinada de leitura para a galeria pública */
  createSignedDownloadUrl(options: SignedDownloadUrlOptions): Promise<SignedDownloadUrlResult>;

  /** Obtém metadados de existência e tamanho sem descarregar o corpo */
  getObjectInfo(storagePath: string): Promise<ObjectInfo>;

  /** Leitura de prefixo de bytes delimitado (range) para validação de magic bytes */
  readObjectPrefix(storagePath: string, maxBytes: number): Promise<Uint8Array | null>;

  /** Elimina fisicamente um objecto exacto do balde */
  remove(storagePath: string): Promise<void>;
}
