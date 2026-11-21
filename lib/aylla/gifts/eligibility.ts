import { AYLLA_GIFTS_CONFIG } from "./config";

export type VerifiedAyllaGiftSession = {
  readonly verified: boolean;
  readonly guestId: string;
  readonly eventId: string;
};

export type AyllaGiftGuestEligibilityRecord = {
  readonly id: string;
  readonly eventId: string;
  readonly status: string;
  readonly source: string;
  readonly archived: boolean;
  readonly deleted: boolean;
  readonly incorrect: boolean;
};

export type AyllaGiftEligibilityResult =
  | { readonly allowed: true; readonly guestId: string }
  | { readonly allowed: false; readonly reason: "access_denied" };

/**
 * Pure domain gate. The Phase B server adapter must source both records from
 * its HttpOnly session and Neon; browser-provided guest IDs are never input.
 */
export function evaluateBabyAyllaGiftEligibility(input: {
  session: VerifiedAyllaGiftSession | null;
  guest: AyllaGiftGuestEligibilityRecord | null;
}): AyllaGiftEligibilityResult {
  const { session, guest } = input;
  if (
    !session?.verified ||
    !guest ||
    session.eventId !== AYLLA_GIFTS_CONFIG.eventId ||
    guest.eventId !== AYLLA_GIFTS_CONFIG.eventId ||
    session.guestId !== guest.id ||
    guest.status !== "confirmed" ||
    guest.source !== "edition_rsvp" ||
    guest.archived ||
    guest.deleted ||
    guest.incorrect
  ) {
    return { allowed: false, reason: "access_denied" };
  }

  return { allowed: true, guestId: guest.id };
}
