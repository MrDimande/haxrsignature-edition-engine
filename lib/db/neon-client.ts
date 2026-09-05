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

  poolInstance = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
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
