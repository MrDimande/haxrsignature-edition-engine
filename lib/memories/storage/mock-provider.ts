/**
 * HAXR PLUS MEMORIES — PROVEDOR DE STORAGE EM MEMÓRIA / MOCK DE TESTE
 *
 * Utilizado para validações determinísticas de pipeline, testes de derivados,
 * concorrência de workers e ambientes isolados onde credenciais reais de R2
 * não estão configuradas (Directiva de Segurança: Não escrever em baldes de produção).
 */

import type {
  MemoriesStorageProvider,
  ObjectInfo,
  SignedDownloadUrlOptions,
  SignedDownloadUrlResult,
  SignedUploadUrlOptions,
  SignedUploadUrlResult,
  SupportedStorageProvider,
} from "./types";
import { assertCanonicalStoragePath } from "./path-security";

export interface MockStoredObject {
  data: Uint8Array;
  contentType: string;
  etag: string;
  updatedAt: number;
}

export class MockMemoriesStorageProvider implements MemoriesStorageProvider {
  readonly providerName: SupportedStorageProvider = "r2-s3";
  private objects = new Map<string, MockStoredObject>();

  async createSignedUploadUrl(options: SignedUploadUrlOptions): Promise<SignedUploadUrlResult> {
    assertCanonicalStoragePath(options.storagePath);
    const expiresAt = Date.now() + options.expiresInSeconds * 1000;
    const uploadUrl = `https://mock-storage.haxrsignature.internal/upload?path=${encodeURIComponent(
      options.storagePath
    )}&exp=${expiresAt}`;
    return { uploadUrl };
  }

  async createSignedDownloadUrl(options: SignedDownloadUrlOptions): Promise<SignedDownloadUrlResult> {
    assertCanonicalStoragePath(options.storagePath);
    const expiresAt = Date.now() + options.expiresInSeconds * 1000;
    const downloadUrl = `https://mock-storage.haxrsignature.internal/download?path=${encodeURIComponent(
      options.storagePath
    )}&exp=${expiresAt}`;
    return { downloadUrl };
  }

  async getObjectInfo(storagePath: string): Promise<ObjectInfo> {
    assertCanonicalStoragePath(storagePath);
    const obj = this.objects.get(storagePath);
    if (!obj) {
      return { exists: false };
    }
    return {
      exists: true,
      contentLength: obj.data.length,
      contentType: obj.contentType,
      etag: obj.etag,
    };
  }

  async readObjectPrefix(storagePath: string, maxBytes: number): Promise<Uint8Array | null> {
    assertCanonicalStoragePath(storagePath);
    const obj = this.objects.get(storagePath);
    if (!obj) return null;
    return obj.data.slice(0, Math.min(obj.data.length, maxBytes));
  }

  async readObject(storagePath: string): Promise<Uint8Array | null> {
    assertCanonicalStoragePath(storagePath);
    const obj = this.objects.get(storagePath);
    if (!obj) return null;
    return obj.data;
  }

  async putObject(storagePath: string, data: Uint8Array | Buffer, contentType: string): Promise<void> {
    assertCanonicalStoragePath(storagePath);
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    this.objects.set(storagePath, {
      data: bytes,
      contentType,
      etag: `etag-${Date.now()}-${bytes.length}`,
      updatedAt: Date.now(),
    });
  }

  async remove(storagePath: string): Promise<void> {
    assertCanonicalStoragePath(storagePath);
    this.objects.delete(storagePath);
  }

  clear(): void {
    this.objects.clear();
  }

  has(storagePath: string): boolean {
    return this.objects.has(storagePath);
  }

  listKeys(): string[] {
    return Array.from(this.objects.keys());
  }
}
