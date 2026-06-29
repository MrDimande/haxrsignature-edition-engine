import { getVercelOidcToken } from "@vercel/oidc";

export const CORE_TRUSTED_OIDC_HEADER = "x-vercel-trusted-oidc-idp-token";

/**
 * Token OIDC oficial da Edition para Trusted Sources (Vercel → Vercel).
 * Fonte única: getVercelOidcToken() — resolve contexto de Function ou dev refresh.
 * Localhost sem token: undefined (sem falhar).
 */
export async function resolveEditionCoreOidcToken(): Promise<string | undefined> {
  try {
    const token = await getVercelOidcToken();
    const trimmed = token?.trim();
    return trimmed ? trimmed : undefined;
  } catch {
    return undefined;
  }
}

export function applyTrustedOidcHeader(
  headers: Record<string, string>,
  token: string | undefined
): void {
  if (!token) return;
  headers[CORE_TRUSTED_OIDC_HEADER] = token;
}

/** true apenas quando getVercelOidcToken() devolveu token não vazio. */
export function isTrustedOidcPresent(token: string | undefined): boolean {
  return Boolean(token?.trim());
}
