/**
 * Optional Vercel Deployment Protection bypass for Preview-only Core calls.
 * Never used in production. Does not replace HAXR Authorization Bearer.
 */

export const VERCEL_PROTECTION_BYPASS_HEADER = "x-vercel-protection-bypass";

const AUTHORIZED_VERCEL_APP_HOST_SUFFIX = ".vercel.app";

export type ProtectionBypassDecision =
  | { apply: false; reason: "not_preview" | "missing_secret" | "unauthorized_host" }
  | { apply: true; headerName: typeof VERCEL_PROTECTION_BYPASS_HEADER; headerValue: string };

function readBypassSecret(): string | undefined {
  const value = process.env.HAXR_CORE_VERCEL_BYPASS_SECRET?.trim();
  return value || undefined;
}

/**
 * Host must be an exact *.vercel.app deployment host (no production custom domains).
 */
export function isAuthorizedVercelAppCoreHost(hostname: string): boolean {
  const host = hostname.trim().toLowerCase();
  if (!host || host.includes("/") || host.includes(":") || host.includes(" ")) {
    return false;
  }
  if (host === "vercel.app" || !host.endsWith(AUTHORIZED_VERCEL_APP_HOST_SUFFIX)) {
    return false;
  }
  const label = host.slice(0, -AUTHORIZED_VERCEL_APP_HOST_SUFFIX.length);
  return label.length > 0 && !label.includes(".");
}

export function resolveCoreProtectionBypassHeader(
  coreBaseUrl: string,
  options?: {
    vercelEnv?: string | undefined;
    bypassSecret?: string | undefined;
  }
): ProtectionBypassDecision {
  const vercelEnv = (options?.vercelEnv ?? process.env.VERCEL_ENV)?.trim().toLowerCase();
  if (vercelEnv !== "preview") {
    return { apply: false, reason: "not_preview" };
  }

  const secret = options?.bypassSecret ?? readBypassSecret();
  if (!secret) {
    return { apply: false, reason: "missing_secret" };
  }

  let hostname: string;
  try {
    hostname = new URL(coreBaseUrl).hostname;
  } catch {
    return { apply: false, reason: "unauthorized_host" };
  }

  if (!isAuthorizedVercelAppCoreHost(hostname)) {
    return { apply: false, reason: "unauthorized_host" };
  }

  return {
    apply: true,
    headerName: VERCEL_PROTECTION_BYPASS_HEADER,
    headerValue: secret,
  };
}

export function applyCoreProtectionBypassHeader(
  headers: Record<string, string>,
  coreBaseUrl: string,
  options?: {
    vercelEnv?: string | undefined;
    bypassSecret?: string | undefined;
  }
): ProtectionBypassDecision {
  const decision = resolveCoreProtectionBypassHeader(coreBaseUrl, options);
  if (decision.apply) {
    headers[decision.headerName] = decision.headerValue;
  }
  return decision;
}

/** Strip secrets from arbitrary strings before logging. */
export function redactProtectionBypassSecret(
  text: string,
  secret: string | undefined = readBypassSecret()
): string {
  if (!secret || !text) return text;
  return text.split(secret).join("[REDACTED]");
}
