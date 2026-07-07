export type UpstreamDiagnostics = {
  trustedOidcPresent: boolean;
  upstreamStatus: number;
  upstreamContentType: string | null;
  upstreamRedirected: boolean;
  upstreamFinalHost: string | null;
};

export function readUpstreamDiagnostics(
  response: Response,
  trustedOidcPresent: boolean
): UpstreamDiagnostics {
  let upstreamFinalHost: string | null = null;

  try {
    upstreamFinalHost = new URL(response.url).hostname;
  } catch {
    upstreamFinalHost = null;
  }

  const rawContentType = response.headers.get("content-type");
  const upstreamContentType = rawContentType
    ? rawContentType.split(";")[0]?.trim() || null
    : null;

  return {
    trustedOidcPresent,
    upstreamStatus: response.status,
    upstreamContentType,
    upstreamRedirected: response.redirected,
    upstreamFinalHost,
  };
}
