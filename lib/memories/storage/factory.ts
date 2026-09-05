import type { MemoriesStorageProvider, SupportedStorageProvider } from "./types";
import { SupabaseMemoriesStorageProvider } from "./supabase-provider";
import { R2MemoriesStorageProvider } from "./r2-provider";

export const STORAGE_PROVIDER_ENV = "STORAGE_PROVIDER";

export class UnsupportedStorageProviderError extends Error {
  constructor(provider: string) {
    super(
      `Provedor de armazenamento não suportado: '${provider}'. Provedores válidos: 'supabase', 'r2-s3'.`
    );
    this.name = "UnsupportedStorageProviderError";
  }
}

export function resolveStorageProviderName(): SupportedStorageProvider {
  const raw = process.env[STORAGE_PROVIDER_ENV]?.trim();
  if (!raw || raw === "supabase") {
    return "supabase";
  }
  if (raw === "r2-s3") {
    return "r2-s3";
  }
  throw new UnsupportedStorageProviderError(raw);
}

let testProviderOverride: MemoriesStorageProvider | null = null;

export function getMemoriesStorageProvider(): MemoriesStorageProvider {
  if (testProviderOverride) {
    return testProviderOverride;
  }

  const name = resolveStorageProviderName();
  if (name === "r2-s3") {
    return new R2MemoriesStorageProvider();
  }
  return new SupabaseMemoriesStorageProvider();
}

export function __setMemoriesStorageProviderForTests(
  override: MemoriesStorageProvider | null
): void {
  testProviderOverride = override;
}
