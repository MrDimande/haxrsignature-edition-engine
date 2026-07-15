import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  applyTrustedOidcHeader,
  isTrustedOidcPresent,
  resolveEditionCoreOidcToken,
} from "@lib/control-plane/core-trusted-oidc";
import {
  getCoreApiBaseUrl,
  getEditionProxySecret,
  getEditionSiteUrl,
  getProxyTimeoutMs,
  isProxyFallbackEnabled,
  MAX_PROXY_RSVP_BODY_BYTES,
  validateProxyConfig,
} from "@lib/control-plane/config";
import { logProxyRsvp, type ProxyLogFields } from "@lib/control-plane/logging";
import { handleLocalRsvpPost } from "@lib/rsvp/handle-local";
import { getRequestIp } from "@lib/security/rate-limit";
import { readUpstreamDiagnostics } from "@lib/control-plane/upstream-diagnostics";
import {
  applyCoreProtectionBypassHeader,
  redactProtectionBypassSecret,
} from "@lib/control-plane/vercel-protection-bypass";

const CORE_RSVP_PATH = "/api/v1/edition/rsvp";

function proxyConfigErrorResponse(requestId: string, missing: string[]) {
  logProxyRsvp({
    requestId,
    backend: "proxy",
    outcome: "config_error",
  });
  console.error(
    `[edition/rsvp/proxy] configuração incompleta requestId=${requestId} missing=${missing.join(",")}`
  );
  return NextResponse.json(
    {
      success: false,
      error: "Ocorreu um erro ao processar o seu RSVP.",
    },
    { status: 500 }
  );
}

function proxyFailureResponse(
  requestId: string,
  outcome: "timeout" | "network_error" | "invalid_core_response",
  fields?: Partial<ProxyLogFields>
) {
  logProxyRsvp({ requestId, backend: "proxy", outcome, ...fields });
  return NextResponse.json(
    {
      success: false,
      error: "Ocorreu um erro ao processar o seu RSVP.",
    },
    { status: 500 }
  );
}

function readSlug(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const slug = (body as Record<string, unknown>).slug;
  return typeof slug === "string" ? slug : undefined;
}

function readAttending(body: unknown): boolean | undefined {
  if (!body || typeof body !== "object") return undefined;
  const attending = (body as Record<string, unknown>).attending;
  return typeof attending === "boolean" ? attending : undefined;
}

export async function proxyRsvpToCore(
  request: Request
): Promise<NextResponse> {
  const requestId = randomUUID();
  const config = validateProxyConfig();

  if (!config.ok) {
    return proxyConfigErrorResponse(requestId, config.missing);
  }

  const secret = getEditionProxySecret()!;
  const coreBase = getCoreApiBaseUrl();
  const clientIp = getRequestIp(request);
  const rawBody = await request.text();

  if (Buffer.byteLength(rawBody, "utf8") > MAX_PROXY_RSVP_BODY_BYTES) {
    logProxyRsvp({
      requestId,
      backend: "proxy",
      outcome: "config_error",
    });
    return NextResponse.json(
      {
        success: false,
        error: "Pedido demasiado grande.",
      },
      { status: 413 }
    );
  }

  let parsedBody: unknown = null;
  try {
    parsedBody = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    parsedBody = null;
  }

  const slug = readSlug(parsedBody);
  const attending = readAttending(parsedBody);
  const started = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), getProxyTimeoutMs());

    const coreHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
      "X-Request-Id": requestId,
      "X-Forwarded-For": clientIp,
      "X-HAXR-Proxy-Origin": "edition",
      "X-HAXR-Edition-Site": getEditionSiteUrl(),
    };

    const trustedOidcToken = await resolveEditionCoreOidcToken();
    const trustedOidcPresent = isTrustedOidcPresent(trustedOidcToken);
    applyTrustedOidcHeader(coreHeaders, trustedOidcToken);
    // Preview-only: Vercel Deployment Protection bypass (never replaces HAXR Bearer).
    applyCoreProtectionBypassHeader(coreHeaders, coreBase);

    const response = await fetch(`${coreBase}${CORE_RSVP_PATH}`, {
      method: "POST",
      headers: coreHeaders,
      body: rawBody,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const proxyLatencyMs = Date.now() - started;
    const upstream = readUpstreamDiagnostics(response, trustedOidcPresent);
    const diagnosticLog: Partial<ProxyLogFields> = {
      slug,
      attending,
      proxyLatencyMs,
      ...upstream,
    };

    const responseText = await response.text();
    let json: unknown;

    try {
      json = responseText ? JSON.parse(responseText) : null;
    } catch {
      if (isProxyFallbackEnabled()) {
        return handleLocalRsvpPost(request, { rawBody, requestId });
      }

      return proxyFailureResponse(requestId, "invalid_core_response", {
        ...diagnosticLog,
      });
    }

    logProxyRsvp({
      requestId,
      backend: "proxy",
      outcome: "forwarded",
      ...diagnosticLog,
    });

    if (response.status === 401) {
      console.error(
        `[edition/rsvp/proxy] core rejeitou autenticação proxy requestId=${requestId}`
      );
      return NextResponse.json(
        {
          success: false,
          error: "Ocorreu um erro ao processar o seu RSVP.",
        },
        { status: 500 }
      );
    }

    const headers: HeadersInit = {};
    const retryAfter = response.headers.get("retry-after");
    if (retryAfter) {
      headers["Retry-After"] = retryAfter;
    }

    return NextResponse.json(json, {
      status: response.status,
      headers,
    });
  } catch (error) {
    const isTimeout =
      error instanceof Error && error.name === "AbortError";
    const outcome = isTimeout ? "timeout" : "network_error";
    const proxyLatencyMs = Date.now() - started;
    const safeError =
      error instanceof Error
        ? redactProtectionBypassSecret(error.message)
        : "unknown";

    logProxyRsvp({
      requestId,
      slug,
      attending,
      backend: "proxy",
      proxyLatencyMs,
      outcome,
    });

    if (isProxyFallbackEnabled()) {
      console.warn(
        `[edition/rsvp/proxy] fallback local activo requestId=${requestId} outcome=${outcome} err=${safeError}`
      );
      return handleLocalRsvpPost(request, { rawBody, requestId });
    }
    logProxyRsvp({
      requestId,
      slug,
      attending,
      backend: "proxy",
      proxyLatencyMs,
      outcome: "fallback_disabled",
    });

    return proxyFailureResponse(requestId, outcome, {
      slug,
      attending,
      proxyLatencyMs,
    });
  }
}
