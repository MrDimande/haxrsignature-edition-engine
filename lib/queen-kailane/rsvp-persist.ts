/**
 * Queen Kailane RSVP — regras de UI isoladas.
 * Preview/Production exigem persisted === true.
 * Desenvolvimento pode aceitar success local autorizado.
 * Nunca inventar EDITION_EVENT_QUEEN_KAILANE_ID.
 */

export type QueenKailaneRsvpResponseShape = {
  success?: boolean;
  persisted?: boolean;
  error?: string;
  message?: string;
};

export const QUEEN_KAILANE_RSVP_NOT_PERSISTED_MESSAGE =
  "A confirmação ainda não foi guardada. É necessário configurar o evento no admin (EDITION_EVENT_QUEEN_KAILANE_ID)." as const;

export function isQueenKailaneRsvpStrictPersistMode(
  nodeEnv: string | undefined = process.env.NODE_ENV
): boolean {
  return nodeEnv !== "development";
}

export function isQueenKailaneRsvpPersistConfirmed(
  data: QueenKailaneRsvpResponseShape
): boolean {
  return data.success === true && data.persisted === true;
}

export function shouldAcceptQueenKailaneRsvpSuccess(
  data: QueenKailaneRsvpResponseShape,
  options?: { strict?: boolean; nodeEnv?: string }
): boolean {
  const strict =
    options?.strict ??
    isQueenKailaneRsvpStrictPersistMode(
      options?.nodeEnv ?? process.env.NODE_ENV
    );

  if (isQueenKailaneRsvpPersistConfirmed(data)) return true;

  if (!strict && data.success === true) {
    return true;
  }

  return false;
}
