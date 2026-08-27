import { neon } from "@neondatabase/serverless";

let cachedDatabaseUrl: string | null = null;
let cachedSql: ReturnType<typeof neon> | null = null;

export function isNeonConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function getNeonSql(): ReturnType<typeof neon> {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured for Neon.");
  }

  if (!cachedSql || cachedDatabaseUrl !== databaseUrl) {
    cachedSql = neon(databaseUrl);
    cachedDatabaseUrl = databaseUrl;
  }

  return cachedSql;
}
