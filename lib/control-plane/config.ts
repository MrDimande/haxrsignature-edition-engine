import {
  canUseLocalProxyFallback,
  decideRsvpBackend,
  isLocalRsvpExplicitlyAllowed,
  isVercelProduction,
} from "@lib/control-plane/rsvp-backend";

export type ApiBackendMode = "local" | "proxy" | "unconfigured";

const DEFAULT_CORE_BASE = "https://www.haxrsignature.com";
const DEFAULT_PROXY_TIMEOUT_MS = 28_000;

/**
 * Resolves the active RSVP backend.
 * Production never silently defaults to local — use decideRsvpBackend() for guards.
 */
export function resolveApiBackend(): ApiBackendMode {
  const decision = decideRsvpBackend();
  if (decision.mode === "proxy") return "proxy";
  if (decision.mode === "local") return "local";
  return "unconfigured";
}

export function isProxyRsvpBackend(): boolean {
  return resolveApiBackend() === "proxy";
}

/** @deprecated Prefer canUseLocalProxyFallback — Production always false. */
export function isProxyFallbackEnabled(): boolean {
  return canUseLocalProxyFallback();
}

export function getCoreApiBaseUrl(): string {
  return (
    process.env.HAXR_CORE_API_BASE_URL?.trim().replace(/\/$/, "") ||
    DEFAULT_CORE_BASE
  );
}

export function getEditionProxySecret(): string | undefined {
  return process.env.HAXR_EDITION_PROXY_SECRET?.trim() || undefined;
}

export function getProxyTimeoutMs(): number {
  const parsed = Number(process.env.HAXR_PROXY_TIMEOUT_MS);
  if (!Number.isFinite(parsed) || parsed < 5_000) {
    return DEFAULT_PROXY_TIMEOUT_MS;
  }
  return parsed;
}

export function getEditionSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    "https://edition.haxrsignature.com"
  );
}

export type ProxyConfigValidation =
  | { ok: true }
  | { ok: false; missing: string[] };

export function validateProxyConfig(): ProxyConfigValidation {
  const missing: string[] = [];

  if (!getEditionProxySecret()) {
    missing.push("HAXR_EDITION_PROXY_SECRET");
  }
  if (!process.env.HAXR_CORE_API_BASE_URL?.trim()) {
    missing.push("HAXR_CORE_API_BASE_URL");
  }

  if (missing.length > 0) {
    return { ok: false, missing };
  }

  return { ok: true };
}

/** Fail-closed when proxy mode is enabled without required secrets */
export function assertProxyReadyOrThrow(): void {
  if (!isProxyRsvpBackend()) return;
  const config = validateProxyConfig();
  if (!config.ok) {
    throw new Error(
      `[edition/proxy] fail-closed: missing ${config.missing.join(",")}`
    );
  }
}

export const MAX_PROXY_RSVP_BODY_BYTES = 16_384;

export {
  canUseLocalProxyFallback,
  decideRsvpBackend,
  isLocalRsvpExplicitlyAllowed,
  isVercelProduction,
};
