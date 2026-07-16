import { NextResponse } from "next/server";

export const RSVP_BACKEND_NOT_CONFIGURED = "rsvp_backend_not_configured" as const;
export const RSVP_SLUG_NOT_ALLOWED = "rsvp_slug_not_allowed" as const;
export const RSVP_BINDING_MISSING = "rsvp_binding_missing" as const;

export type RsvpBackendDecision =
  | { mode: "proxy" }
  | { mode: "local" }
  | { mode: "blocked"; code: typeof RSVP_BACKEND_NOT_CONFIGURED; reason: string };

/** Prefer Vercel deploy env; NODE_ENV alone is production on all Vercel deploys. */
export function isVercelProduction(): boolean {
  return process.env.VERCEL_ENV === "production";
}

/**
 * Local RSVP handler is opt-in only.
 * Requires HAXR_API_BACKEND=local plus HAXR_ALLOW_LOCAL_RSVP=true
 * (including Production — never a silent default).
 */
export function isLocalRsvpExplicitlyAllowed(): boolean {
  const backend = process.env.HAXR_API_BACKEND?.trim().toLowerCase();
  if (backend !== "local") return false;

  const allow = process.env.HAXR_ALLOW_LOCAL_RSVP?.trim().toLowerCase();
  if (allow === "true" || allow === "1") return true;

  // Production never silently allows local without the explicit flag.
  if (isVercelProduction()) return false;

  if (process.env.NODE_ENV === "test") return true;
  if (process.env.VERCEL_ENV === "development") return true;

  // Local `next dev` without VERCEL_ENV.
  if (!process.env.VERCEL_ENV && process.env.NODE_ENV !== "production") {
    return true;
  }

  return false;
}

export function resolveRawApiBackend(): string | undefined {
  const raw = process.env.HAXR_API_BACKEND?.trim().toLowerCase();
  return raw || undefined;
}

export function decideRsvpBackend(): RsvpBackendDecision {
  const raw = resolveRawApiBackend();

  if (raw === "proxy") {
    return { mode: "proxy" };
  }

  if (raw === "local") {
    if (isLocalRsvpExplicitlyAllowed()) {
      return { mode: "local" };
    }
    return {
      mode: "blocked",
      code: RSVP_BACKEND_NOT_CONFIGURED,
      reason: isVercelProduction()
        ? "local_not_explicitly_allowed"
        : "local_not_explicitly_allowed",
    };
  }

  // Absent or invalid — never default to local (fail closed).
  return {
    mode: "blocked",
    code: RSVP_BACKEND_NOT_CONFIGURED,
    reason: raw ? "invalid_backend" : "backend_absent",
  };
}

/** PROXY_FALLBACK must never activate local handling in Production. */
export function canUseLocalProxyFallback(): boolean {
  if (isVercelProduction()) return false;
  if (!isLocalRsvpExplicitlyAllowed()) return false;
  return process.env.HAXR_PROXY_FALLBACK?.trim().toLowerCase() === "true";
}

/**
 * Parse HAXR_LOCAL_RSVP_ALLOWED_SLUGS (comma-separated).
 * Empty in Production ⇒ no slug may use local RSVP.
 */
export function parseLocalRsvpAllowedSlugs(
  raw: string | undefined = process.env.HAXR_LOCAL_RSVP_ALLOWED_SLUGS
): Set<string> {
  if (!raw?.trim()) return new Set();
  return new Set(
    raw
      .split(",")
      .map((part) => part.trim().toLowerCase())
      .filter(Boolean)
  );
}

/**
 * Production: allowlist required and must contain the slug.
 * Non-production: if allowlist is set, enforce it; if empty, allow (dev/test).
 */
export function isLocalRsvpSlugAllowed(slug: string): boolean {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return false;

  const allowed = parseLocalRsvpAllowedSlugs();

  if (isVercelProduction()) {
    return allowed.has(normalized);
  }

  if (allowed.size === 0) return true;
  return allowed.has(normalized);
}

export type RsvpNotificationMode = "disabled" | "enabled";

/** Default seguro: disabled. */
export function resolveRsvpNotificationMode(
  raw: string | undefined = process.env.HAXR_RSVP_NOTIFICATION_MODE
): RsvpNotificationMode {
  return raw?.trim().toLowerCase() === "enabled" ? "enabled" : "disabled";
}

export function areRsvpNotificationsEnabled(): boolean {
  return resolveRsvpNotificationMode() === "enabled";
}

export function rsvpBackendNotConfiguredResponse(
  requestId?: string
): NextResponse {
  if (requestId) {
    console.info(
      JSON.stringify({
        scope: "edition/rsvp/guard",
        requestId,
        stage: "backend_guard",
        outcome: RSVP_BACKEND_NOT_CONFIGURED,
        httpStatus: 503,
      })
    );
  }

  return NextResponse.json(
    {
      success: false,
      error: "Ocorreu um erro ao processar o seu RSVP.",
      code: RSVP_BACKEND_NOT_CONFIGURED,
      persisted: false,
    },
    { status: 503 }
  );
}

export function rsvpSlugNotAllowedResponse(
  requestId: string,
  slug?: string
): NextResponse {
  console.info(
    JSON.stringify({
      scope: "edition/rsvp/guard",
      requestId,
      slug,
      stage: "slug_allowlist",
      outcome: RSVP_SLUG_NOT_ALLOWED,
      httpStatus: 403,
    })
  );

  return NextResponse.json(
    {
      success: false,
      error: "Ocorreu um erro ao processar o seu RSVP.",
      code: RSVP_SLUG_NOT_ALLOWED,
      persisted: false,
    },
    { status: 403 }
  );
}

export function rsvpBindingMissingResponse(
  requestId: string,
  slug?: string
): NextResponse {
  console.info(
    JSON.stringify({
      scope: "edition/rsvp/guard",
      requestId,
      slug,
      stage: "binding_guard",
      outcome: RSVP_BINDING_MISSING,
      httpStatus: 503,
    })
  );

  return NextResponse.json(
    {
      success: false,
      error: "Ocorreu um erro ao processar o seu RSVP.",
      code: RSVP_BINDING_MISSING,
      persisted: false,
    },
    { status: 503 }
  );
}
