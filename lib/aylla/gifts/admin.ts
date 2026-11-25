import { AYLLA_GIFTS_CONFIG } from "./config";

export type ServerEstablishedAyllaAdministrator = {
  readonly id: string;
  readonly active: boolean;
  readonly permittedEventIds: readonly string[];
};

export type AyllaGiftAdministrationDecision =
  | { readonly allowed: true; readonly actorId: string }
  | { readonly allowed: false; readonly reason: "access_denied" };

/**
 * This is intentionally a pure guard. The Core adapter must build the
 * administrator from its HttpOnly admin session and persisted event grants;
 * it must never populate this object from a browser request body.
 */
export function canAdministerAyllaGiftReservation(input: {
  readonly administrator: ServerEstablishedAyllaAdministrator | null;
  readonly eventId: string;
}): AyllaGiftAdministrationDecision {
  if (
    !input.administrator ||
    !input.administrator.active ||
    input.eventId !== AYLLA_GIFTS_CONFIG.eventId ||
    !input.administrator.permittedEventIds.includes(input.eventId)
  ) {
    return { allowed: false, reason: "access_denied" };
  }
  return { allowed: true, actorId: input.administrator.id };
}
