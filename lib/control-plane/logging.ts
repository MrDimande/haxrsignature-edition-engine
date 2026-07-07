type ProxyLogFields = {
  requestId: string;
  slug?: string;
  backend: "proxy";
  proxyLatencyMs?: number;
  outcome:
    | "forwarded"
    | "config_error"
    | "timeout"
    | "network_error"
    | "invalid_core_response"
    | "fallback_disabled";
  attending?: boolean;
  trustedOidcPresent?: boolean;
  upstreamStatus?: number;
  upstreamContentType?: string | null;
  upstreamRedirected?: boolean;
  upstreamFinalHost?: string | null;
};

export function logProxyRsvp(fields: ProxyLogFields): void {
  const payload = {
    scope: "edition/rsvp/proxy",
    ...fields,
  };
  console.info(JSON.stringify(payload));
}

export type { ProxyLogFields };
