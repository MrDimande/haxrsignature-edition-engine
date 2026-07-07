export type ApiBackendMode = "local" | "proxy";

const DEFAULT_CORE_BASE = "https://www.haxrsignature.com";
const DEFAULT_PROXY_TIMEOUT_MS = 28_000;

export function resolveApiBackend(): ApiBackendMode {
  const raw = process.env.HAXR_API_BACKEND?.trim().toLowerCase();
  if (raw === "proxy") return "proxy";
  return "local";
}

export function isProxyRsvpBackend(): boolean {
  return resolveApiBackend() === "proxy";
}

export function isProxyFallbackEnabled(): boolean {
  return process.env.HAXR_PROXY_FALLBACK?.trim().toLowerCase() === "true";
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
