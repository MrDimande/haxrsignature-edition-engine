/**
 * Helpers de isolamento para testes OIDC.
 * Não alteram o runtime de produção — só process.env do processo de teste.
 */

/** Chaves que @vercel/oidc lê ou injecta durante refresh local. */
export const OIDC_POLLUTION_ENV_KEYS = [
  "VERCEL_OIDC_TOKEN",
  "VERCEL_OIDC_TOKEN_EXPIRES_AT",
] as const;

export type OidcPollutionEnvKey = (typeof OIDC_POLLUTION_ENV_KEYS)[number];

export type OidcEnvSnapshot = Partial<
  Record<OidcPollutionEnvKey, string | undefined>
>;

/** Presença booleana das chaves (nunca valores). */
export function oidcEnvPresence(): Record<OidcPollutionEnvKey, boolean> {
  const presence = {} as Record<OidcPollutionEnvKey, boolean>;
  for (const key of OIDC_POLLUTION_ENV_KEYS) {
    presence[key] = Boolean(process.env[key]?.trim());
  }
  return presence;
}

export function snapshotOidcEnv(): OidcEnvSnapshot {
  const snapshot: OidcEnvSnapshot = {};
  for (const key of OIDC_POLLUTION_ENV_KEYS) {
    snapshot[key] = process.env[key];
  }
  return snapshot;
}

export function clearOidcEnv(): void {
  for (const key of OIDC_POLLUTION_ENV_KEYS) {
    delete process.env[key];
  }
}

export function restoreOidcEnv(snapshot: OidcEnvSnapshot): void {
  for (const key of OIDC_POLLUTION_ENV_KEYS) {
    const value = snapshot[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

/**
 * Executa `fn` com env OIDC limpo e restaura o snapshot no finally.
 * Útil para regressões de ordem / herança sem depender do estado da máquina.
 */
export async function withClearedOidcEnv<T>(
  fn: () => T | Promise<T>
): Promise<T> {
  const snapshot = snapshotOidcEnv();
  clearOidcEnv();
  try {
    return await fn();
  } finally {
    restoreOidcEnv(snapshot);
  }
}

/**
 * Injecção sintética de JWT/env para provar isolamento (valor nunca logado).
 */
export async function withPoisonedOidcEnv<T>(
  fn: () => T | Promise<T>,
  poison: Partial<Record<OidcPollutionEnvKey, string>> = {
    VERCEL_OIDC_TOKEN:
      "eyJhbGciOiJub25lIn0.eyJzdWIiOiJvaWRjLXRlc3QtcG9pc29uIn0.sig",
  }
): Promise<T> {
  const snapshot = snapshotOidcEnv();
  clearOidcEnv();
  for (const [key, value] of Object.entries(poison)) {
    if (value !== undefined) {
      process.env[key] = value;
    }
  }
  try {
    return await fn();
  } finally {
    restoreOidcEnv(snapshot);
  }
}
