import { getDatabaseBackend } from "@lib/database/backend";
import { getNeonSql, isNeonConfigured } from "@lib/neon/server";
import { createAdminClient, isSupabaseConfigured } from "@lib/supabase/server";
import {
  rateLimit,
  type RateLimitConfig,
  type RateLimitResult,
} from "@lib/security/rate-limit";

type RpcRateLimitRow = {
  allowed: boolean;
  remaining: number;
  retry_after_seconds: number;
};

export type PersistentRateLimitFn = (
  key: string,
  config: RateLimitConfig
) => Promise<RateLimitResult>;

function parseRpcResult(data: unknown): RateLimitResult | null {
  if (!data || typeof data !== "object") return null;
  const row = data as RpcRateLimitRow;
  if (typeof row.allowed !== "boolean") return null;

  return {
    allowed: row.allowed,
    remaining: Number(row.remaining ?? 0),
    retryAfterSeconds: Number(row.retry_after_seconds ?? 0),
  };
}

async function neonPersistentRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult | null> {
  if (!isNeonConfigured()) return null;

  const windowSeconds = Math.max(1, Math.ceil(config.windowMs / 1000));
  const sql = getNeonSql();
  const rows = (await sql`
    SELECT public.check_api_rate_limit(
      ${key},
      ${config.max},
      ${windowSeconds}
    ) AS result
  `) as Array<{ result: unknown }>;

  return parseRpcResult(rows[0]?.result);
}

async function supabasePersistentRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = createAdminClient();
  const windowSeconds = Math.max(1, Math.ceil(config.windowMs / 1000));
  const { data, error } = await supabase.rpc("check_api_rate_limit", {
    p_bucket_key: key,
    p_max_requests: config.max,
    p_window_seconds: windowSeconds,
  });

  if (error) throw new Error(error.message);
  return parseRpcResult(data);
}

/** Persistent database rate limit; falls back to memory if the selected backend is unavailable. */
export async function persistentRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  try {
    const persistentResult =
      getDatabaseBackend() === "neon"
        ? await neonPersistentRateLimit(key, config)
        : await supabasePersistentRateLimit(key, config);

    if (persistentResult) return persistentResult;
  } catch (err) {
    console.warn("[rate-limit] fallback em memória:", err);
  }

  return rateLimit(key, config);
}
