import type { DatabaseProviderName } from './types';

export function resolveDatabaseProviderName(): DatabaseProviderName {
  const envVal = (process.env.DATABASE_PROVIDER || '').trim().toLowerCase();
  
  // Se ausente, padrão seguro de rollback é supabase
  if (!envVal) {
    return 'supabase';
  }

  if (envVal === 'neon') {
    const dbUrl = (process.env.DATABASE_URL || '').trim();
    if (!dbUrl) {
      throw new Error('[DatabaseProvider] Fail-closed: DATABASE_PROVIDER=neon configurado, mas DATABASE_URL está em falta.');
    }
    return 'neon';
  }

  if (envVal === 'supabase') {
    return 'supabase';
  }

  throw new Error(`[DatabaseProvider] Fail-closed: Provedor de base de dados desconhecido: ${envVal}`);
}
