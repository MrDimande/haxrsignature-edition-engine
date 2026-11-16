import { Pool } from 'pg';

let poolInstance: Pool | null = null;

export function normalizeNeonConnectionString(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return trimmed;
  try {
    const url = new URL(trimmed);
    const sslmode = url.searchParams.get('sslmode');
    if (sslmode === 'require' || sslmode === 'prefer' || sslmode === 'verify-ca') {
      url.searchParams.set('sslmode', 'verify-full');
    }
    return url.toString();
  } catch {
    return trimmed.replace(
      /([?&]sslmode=)(require|prefer|verify-ca)(?=[&#]|$)/,
      '$1verify-full'
    );
  }
}

export function getNeonPool(): Pool {
  if (poolInstance) {
    return poolInstance;
  }

  const rawConnectionString = (process.env.DATABASE_URL || '').trim();
  if (!rawConnectionString) {
    throw new Error('[NeonClient] Fail-closed: DATABASE_URL em falta.');
  }

  const connectionString = normalizeNeonConnectionString(rawConnectionString);

  poolInstance = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: true,
    },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  return poolInstance;
}

export async function closeNeonPool(): Promise<void> {
  if (poolInstance) {
    await poolInstance.end();
    poolInstance = null;
  }
}
