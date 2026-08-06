/**
 * Regras de UI para o RSVP Nian — isolado a lib/nian.
 * Preview/Production exigem persisted === true.
 * Desenvolvimento (next:dev) pode aceitar success local autorizado.
 */

export type NianRsvpResponseShape = {
  success?: boolean;
  persisted?: boolean;
  error?: string;
  message?: string;
};

export const NIAN_RSVP_NOT_PERSISTED_MESSAGE =
  "A confirmação ainda não foi guardada. Tenta novamente dentro de instantes." as const;

/**
 * Modo estrito: Preview, Production e `next start` (NODE_ENV=production).
 * Em `next:dev` (development) o fallback local continua autorizado.
 * Flag de revisão visual (Playwright): window.__NIAN_FORCE_STRICT_RSVP__
 */
export function isNianRsvpStrictPersistMode(
  nodeEnv: string | undefined = process.env.NODE_ENV
): boolean {
  if (typeof window !== "undefined") {
    const forced = (
      window as Window & { __NIAN_FORCE_STRICT_RSVP__?: boolean }
    ).__NIAN_FORCE_STRICT_RSVP__;
    if (forced === true) return true;
  }
  return nodeEnv !== "development";
}

export function isNianRsvpPersistConfirmed(
  data: NianRsvpResponseShape
): boolean {
  return data.success === true && data.persisted === true;
}

/**
 * Decide se a UI Nian pode mostrar MISSÃO CONFIRMADA / mensagem recebida.
 * Respostas antigas sem `persisted` → false em modo estrito.
 */
export function shouldAcceptNianRsvpSuccess(
  data: NianRsvpResponseShape,
  options?: { strict?: boolean; nodeEnv?: string }
): boolean {
  const strict =
    options?.strict ??
    isNianRsvpStrictPersistMode(options?.nodeEnv ?? process.env.NODE_ENV);

  if (isNianRsvpPersistConfirmed(data)) return true;

  if (!strict && data.success === true) {
    return true;
  }

  return false;
}
