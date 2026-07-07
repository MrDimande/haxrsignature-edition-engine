import { createHash } from "node:crypto";
import {
  persistentRateLimit,
  type PersistentRateLimitFn,
} from "@lib/security/persistent-rate-limit";
import { getRequestIp, type RateLimitConfig, type RateLimitResult } from "./rate-limit";

export type PublicMutationScope = "gifts" | "photo-wall";

let rateLimitImpl: PersistentRateLimitFn = persistentRateLimit;

export function requesterFingerprint(request: Request): string {
  const ip = getRequestIp(request);
  const userAgent = request.headers.get("user-agent")?.trim() ?? "";
  return createHash("sha256")
    .update(`${ip}|${userAgent}`)
    .digest("hex")
    .slice(0, 32);
}

export function publicMutationRateLimitKey(input: {
  scope: PublicMutationScope;
  slug: string;
  action: string;
  request: Request;
}): string {
  return [
    "edition",
    "public-mutation",
    input.scope,
    input.slug,
    input.action,
    requesterFingerprint(input.request),
  ].join(":");
}

export async function publicMutationRateLimit(
  input: {
    scope: PublicMutationScope;
    slug: string;
    action: string;
    request: Request;
  },
  config: RateLimitConfig
): Promise<RateLimitResult & { key: string }> {
  const key = publicMutationRateLimitKey(input);
  const result = await rateLimitImpl(key, config);
  return { ...result, key };
}

export function __setPublicMutationRateLimitForTests(
  impl: PersistentRateLimitFn | null
): void {
  rateLimitImpl = impl ?? persistentRateLimit;
}
