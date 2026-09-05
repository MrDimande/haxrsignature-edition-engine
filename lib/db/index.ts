import { resolveDatabaseProviderName } from './config';
import { NeonDatabaseProvider } from './neon-provider';
import { SupabaseDatabaseProvider } from './supabase-provider';
import type { EditionDatabaseProvider } from './types';

export * from './types';
export * from './config';

let cachedProvider: EditionDatabaseProvider | null = null;
let testProviderOverride: EditionDatabaseProvider | null = null;

export function getEditionDatabaseProvider(): EditionDatabaseProvider {
  if (testProviderOverride) {
    return testProviderOverride;
  }

  const providerName = resolveDatabaseProviderName();

  if (cachedProvider && cachedProvider.name === providerName) {
    return cachedProvider;
  }

  if (providerName === 'neon') {
    cachedProvider = new NeonDatabaseProvider();
    return cachedProvider;
  }

  if (providerName === 'supabase') {
    cachedProvider = new SupabaseDatabaseProvider();
    return cachedProvider;
  }

  throw new Error(`[getEditionDatabaseProvider] Fail-closed: Provedor não suportado: ${providerName}`);
}

export function __setEditionDatabaseProviderForTests(provider: EditionDatabaseProvider | null): void {
  testProviderOverride = provider;
  if (!provider) {
    cachedProvider = null;
  }
}
