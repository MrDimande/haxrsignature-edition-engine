import { Pool } from 'pg';

let poolInstance: Pool | null = null;

export function getNeonPool(): Pool {
  if (poolInstance) {
    return poolInstance;
  }

  const connectionString = (process.env.DATABASE_URL || '').trim();
  if (!connectionString) {
    throw new Error('[NeonClient] Fail-closed: DATABASE_URL em falta.');
  }

  const pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
    max: 10,
    idleTimeoutMillis: 15000,
    connectionTimeoutMillis: 10000,
    keepAlive: true,
  });

  pool.on('error', (err) => {
    console.warn('[NeonClient] Unexpected error on idle client:', err?.message || err);
  });

  poolInstance = pool;
  return poolInstance;
}

export async function closeNeonPool(): Promise<void> {
  if (poolInstance) {
    await poolInstance.end();
    poolInstance = null;
  }
}
