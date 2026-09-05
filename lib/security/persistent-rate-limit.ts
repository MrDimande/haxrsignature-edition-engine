import { getEditionDatabaseProvider } from "@lib/db";
import {
  rateLimit,
  type RateLimitConfig,
  type RateLimitResult,
} from "@lib/security/rate-limit";

export type PersistentRateLimitFn = (
  key: string,
  config: RateLimitConfig
) => Promise<RateLimitResult>;

/** Rate limit persistente via Edition Database Provider (Neon / Supabase); fallback em memória se RPC indisponível. */
export async function persistentRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const db = getEditionDatabaseProvider();
  if (!db.isConfigured()) {
    return rateLimit(key, config);
  }

  try {
    const windowSeconds = Math.max(1, Math.ceil(config.windowMs / 1000));
    const res = await db.checkApiRateLimit(key, config.max, windowSeconds);
    return res;
  } catch (err) {
    console.warn("[rate-limit] fallback em memória:", err);
  }

  return rateLimit(key, config);
}
