import { AYLLA_GIFTS_CONFIG, canBabyAyllaGiftRegistryReserve, type BabyAyllaGiftInvitationStatus } from "./config";
import {
  evaluateBabyAyllaGiftEligibility,
  type AyllaGiftGuestEligibilityRecord,
  type VerifiedAyllaGiftSession,
} from "./eligibility";

export type AyllaGiftReservationStatus = "reserved" | "purchased" | "delivered" | "cancelled";

/**
 * This contract is server-side only. Its identifiers must come from the
 * verified session and the Core guest record, never from a browser payload.
 */
export type AyllaGiftReservationRecord = {
  readonly id: string;
  readonly eventId: string;
  readonly giftId: string;
  readonly guestId: string;
  readonly quantity: number;
  readonly status: AyllaGiftReservationStatus;
  readonly idempotencyKey: string;
  readonly createdAt: string;
  readonly updatedAt: string;
};

/** Operational inventory fields are deliberately distinct from family approval. */
export type AyllaGiftOperationalItem = {
  readonly id: string;
  readonly eventId: string;
  readonly approvedByFamily: boolean;
  readonly enabled: boolean;
  readonly approvedQuantity: number | null;
  readonly specificationsComplete: boolean;
  readonly childSafetyValidated: boolean;
};

export type AyllaGiftReservationDeniedReason =
  | "registry_closed"
  | "access_denied"
  | "gift_not_found"
  | "gift_not_approved"
  | "gift_disabled"
  | "quantity_pending"
  | "specifications_pending"
  | "safety_review_pending"
  | "invalid_quantity";

export type AyllaGiftReservationEligibility =
  | { readonly allowed: true; readonly guestId: string }
  | { readonly allowed: false; readonly reason: AyllaGiftReservationDeniedReason };

export function evaluateAyllaGiftReservationRequest(input: {
  readonly session: VerifiedAyllaGiftSession | null;
  readonly guest: AyllaGiftGuestEligibilityRecord | null;
  readonly item: AyllaGiftOperationalItem | null;
  readonly invitationStatus: BabyAyllaGiftInvitationStatus;
  readonly requestedQuantity: number;
}): AyllaGiftReservationEligibility {
  // This check remains first so no browser payload can be used to probe a
  // draft registry or reveal an item's future operational state.
  if (!canBabyAyllaGiftRegistryReserve({ invitationStatus: input.invitationStatus })) {
    return { allowed: false, reason: "registry_closed" };
  }

  const guestEligibility = evaluateBabyAyllaGiftEligibility({
    session: input.session,
    guest: input.guest,
  });
  if (!guestEligibility.allowed) return { allowed: false, reason: "access_denied" };

  const { item } = input;
  if (!item || item.eventId !== AYLLA_GIFTS_CONFIG.eventId) {
    return { allowed: false, reason: "gift_not_found" };
  }
  if (!item.approvedByFamily) return { allowed: false, reason: "gift_not_approved" };
  if (!item.enabled) return { allowed: false, reason: "gift_disabled" };
  if (item.approvedQuantity === null) return { allowed: false, reason: "quantity_pending" };
  if (!item.specificationsComplete) return { allowed: false, reason: "specifications_pending" };
  if (!item.childSafetyValidated) return { allowed: false, reason: "safety_review_pending" };
  if (
    !Number.isSafeInteger(input.requestedQuantity) ||
    input.requestedQuantity < 1 ||
    input.requestedQuantity > item.approvedQuantity
  ) {
    return { allowed: false, reason: "invalid_quantity" };
  }

  return { allowed: true, guestId: guestEligibility.guestId };
}

const ALLOWED_RESERVATION_TRANSITIONS: Readonly<Record<AyllaGiftReservationStatus, readonly AyllaGiftReservationStatus[]>> = {
  reserved: ["purchased", "cancelled"],
  purchased: ["delivered"],
  delivered: [],
  cancelled: [],
};

export function canTransitionAyllaGiftReservation(
  from: AyllaGiftReservationStatus,
  to: AyllaGiftReservationStatus
): boolean {
  return ALLOWED_RESERVATION_TRANSITIONS[from].includes(to);
}

export type AyllaGiftReservationPlan =
  | { readonly ok: true; readonly kind: "idempotent"; readonly reservation: AyllaGiftReservationRecord }
  | { readonly ok: true; readonly kind: "new"; readonly remainingQuantity: number }
  | { readonly ok: false; readonly reason: "insufficient_quantity" | "invalid_quantity" | "item_scope_mismatch" };

/**
 * Pure counterpart of the future Neon transaction. It is used to prove the
 * inventory rules locally; persistence must run the equivalent SQL while the
 * inventory row is locked, never by a separate read-then-write sequence.
 */
export function planAyllaGiftReservation(input: {
  readonly item: AyllaGiftOperationalItem;
  readonly existingReservations: readonly AyllaGiftReservationRecord[];
  readonly eventId: string;
  readonly guestId: string;
  readonly requestedQuantity: number;
  readonly idempotencyKey: string;
}): AyllaGiftReservationPlan {
  if (
    input.item.eventId !== input.eventId ||
    !Number.isSafeInteger(input.requestedQuantity) ||
    input.requestedQuantity < 1
  ) {
    return { ok: false, reason: input.item.eventId !== input.eventId ? "item_scope_mismatch" : "invalid_quantity" };
  }

  const sameRequest = input.existingReservations.find(
    (reservation) =>
      reservation.eventId === input.eventId &&
      reservation.guestId === input.guestId &&
      reservation.idempotencyKey === input.idempotencyKey
  );
  if (sameRequest) return { ok: true, kind: "idempotent", reservation: sameRequest };

  const consumedQuantity = input.existingReservations
    .filter(
      (reservation) =>
        reservation.eventId === input.eventId &&
        reservation.giftId === input.item.id &&
        reservation.status !== "cancelled"
    )
    .reduce((sum, reservation) => sum + reservation.quantity, 0);
  const approvedQuantity = input.item.approvedQuantity;
  if (approvedQuantity === null || input.requestedQuantity > approvedQuantity - consumedQuantity) {
    return { ok: false, reason: "insufficient_quantity" };
  }

  return { ok: true, kind: "new", remainingQuantity: approvedQuantity - consumedQuantity - input.requestedQuantity };
}

export type AyllaGiftEditorialState = {
  readonly mode:
    | "registry-closed"
    | "rsvp-required"
    | "identity-required"
    | "catalog-available"
    | "gift-reserved"
    | "gift-unavailable"
    | "reservation-success"
    | "temporary-error"
    | "session-expired";
  readonly message: string;
};

/** Editorial copy is intentionally declarative: it performs no reservation. */
export function resolveAyllaGiftEditorialState(input: {
  readonly registryEnabled: boolean;
  readonly hasConfirmedRsvp?: boolean;
  readonly hasVerifiedIdentity?: boolean;
  readonly sessionExpired?: boolean;
  readonly giftUnavailable?: boolean;
  readonly reservationSucceeded?: boolean;
  readonly temporaryError?: boolean;
}): AyllaGiftEditorialState {
  if (!input.registryEnabled) {
    return { mode: "registry-closed", message: "Os pequenos mimos da Aylla serão revelados em breve." };
  }
  if (input.sessionExpired) {
    return { mode: "session-expired", message: "A sua sessão terminou. Por favor, valide novamente o seu acesso." };
  }
  if (!input.hasConfirmedRsvp) {
    return { mode: "rsvp-required", message: "Confirme a sua presença para aceder à lista da Aylla." };
  }
  if (!input.hasVerifiedIdentity) {
    return { mode: "identity-required", message: "Confirme a sua identidade para continuar com discrição e segurança." };
  }
  if (input.temporaryError) {
    return { mode: "temporary-error", message: "Não foi possível concluir este gesto agora. Por favor, tente novamente." };
  }
  if (input.giftUnavailable) {
    return { mode: "gift-unavailable", message: "Este mimo já não está disponível." };
  }
  if (input.reservationSucceeded) {
    return { mode: "reservation-success", message: "O seu gesto para a Aylla foi registado com carinho." };
  }
  return { mode: "catalog-available", message: "Escolha um pequeno mimo para a Aylla." };
}
