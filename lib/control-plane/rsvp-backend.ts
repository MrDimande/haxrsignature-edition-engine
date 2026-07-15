import { NextResponse } from "next/server";

export const RSVP_BACKEND_NOT_CONFIGURED = "rsvp_backend_not_configured" as const;

export type RsvpBackendDecision =
  | { mode: "proxy" }
  | { mode: "local" }
  | { mode: "blocked"; code: typeof RSVP_BACKEND_NOT_CONFIGURED; reason: string };

/** Prefer Vercel deploy env; NODE_ENV alone is production on all Vercel deploys. */
export function isVercelProduction(): boolean {
  return process.env.VERCEL_ENV === "production";
}

/**
 * Local RSVP handler is opt-in only outside Production.
 * Requires HAXR_API_BACKEND=local plus an explicit allow signal.
 */
export function isLocalRsvpExplicitlyAllowed(): boolean {
  if (isVercelProduction()) return false;

  const backend = process.env.HAXR_API_BACKEND?.trim().toLowerCase();
  if (backend !== "local") return false;

  const allow = process.env.HAXR_ALLOW_LOCAL_RSVP?.trim().toLowerCase();
  if (allow === "true" || allow === "1") return true;

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
        ? "local_forbidden_in_production"
        : "local_not_explicitly_allowed",
    };
  }

  // Absent or invalid — never default to local in Production (fail closed).
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
    },
    { status: 503 }
  );
}
