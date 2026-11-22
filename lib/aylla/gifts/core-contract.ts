import type { AyllaGiftReservationRecord } from "./reservations";

/** Public-safe outcomes. Neither IDs nor eligibility reasons reveal guest data. */
export type AyllaGiftCoreOutcome =
  | "verification_required"
  | "access_denied"
  | "registry_closed"
  | "item_unavailable"
  | "quantity_unconfirmed"
  | "reservation_confirmed"
  | "session_expired"
  | "service_unavailable";

export type AyllaGiftReservationRequest = {
  readonly itemId: string;
  readonly quantity: number;
  readonly idempotencyKey: string;
  readonly csrfToken: string;
};

export type AyllaGiftReservationResponse =
  | { readonly outcome: "reservation_confirmed"; readonly reservation: Pick<AyllaGiftReservationRecord, "id" | "giftId" | "quantity" | "status"> }
  | { readonly outcome: Exclude<AyllaGiftCoreOutcome, "reservation_confirmed"> };

/**
 * Edition calls this server-to-server. Core is the sole authority for session
 * resolution, guest eligibility, inventory writes and audit records.
 */
export interface AyllaGiftCoreClient {
  reserve(input: AyllaGiftReservationRequest): Promise<AyllaGiftReservationResponse>;
  cancel(input: { readonly reservationId: string; readonly csrfToken: string }): Promise<AyllaGiftReservationResponse>;
}
