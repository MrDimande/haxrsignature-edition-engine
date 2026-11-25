import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canTransitionAyllaGiftReservation,
  evaluateAyllaGiftReservationRequest,
  planAyllaGiftReservation,
  resolveAyllaGiftEditorialState,
  type AyllaGiftOperationalItem,
  type AyllaGiftReservationRecord,
} from "../aylla/gifts/reservations";
import { AYLLA_GIFTS_CONFIG } from "../aylla/gifts/config";

const eligibleSession = {
  verified: true,
  guestId: "guest-aylla",
  eventId: AYLLA_GIFTS_CONFIG.eventId,
} as const;

const eligibleGuest = {
  id: "guest-aylla",
  eventId: AYLLA_GIFTS_CONFIG.eventId,
  status: "confirmed",
  source: "edition_rsvp",
  archived: false,
  deleted: false,
  incorrect: false,
} as const;

const readyItem: AyllaGiftOperationalItem = {
  id: "dream-cot-sheets",
  eventId: AYLLA_GIFTS_CONFIG.eventId,
  approvedByFamily: true,
  enabled: true,
  approvedQuantity: 2,
  specificationsComplete: true,
  childSafetyValidated: true,
};

describe("Baby Aylla Gift Registry — Phase C reservation safeguards", () => {
  it("keeps even an otherwise eligible reservation closed while the registry is disabled", () => {
    assert.deepEqual(
      evaluateAyllaGiftReservationRequest({
        session: eligibleSession,
        guest: eligibleGuest,
        item: readyItem,
        invitationStatus: "draft",
        requestedQuantity: 1,
      }),
      { allowed: false, reason: "registry_closed" }
    );
  });

  it("allows only the auditable forward reservation transitions", () => {
    assert.equal(canTransitionAyllaGiftReservation("reserved", "purchased"), true);
    assert.equal(canTransitionAyllaGiftReservation("purchased", "delivered"), true);
    assert.equal(canTransitionAyllaGiftReservation("reserved", "cancelled"), true);
    assert.equal(canTransitionAyllaGiftReservation("delivered", "reserved"), false);
    assert.equal(canTransitionAyllaGiftReservation("cancelled", "purchased"), false);
  });

  it("does not expose a reserving state before the registry is operational", () => {
    assert.deepEqual(resolveAyllaGiftEditorialState({ registryEnabled: false }), {
      mode: "registry-closed",
      message: "Os pequenos mimos da Aylla serão revelados em breve.",
    });
  });

  it("keeps a reservation record free of browser-supplied personal data", () => {
    const record: AyllaGiftReservationRecord = {
      id: "reservation-1",
      eventId: AYLLA_GIFTS_CONFIG.eventId,
      giftId: readyItem.id,
      guestId: eligibleGuest.id,
      quantity: 1,
      status: "reserved",
      idempotencyKey: "request-1",
      createdAt: "2026-11-22T00:00:00.000Z",
      updatedAt: "2026-11-22T00:00:00.000Z",
    };

    assert.equal("guestName" in record, false);
    assert.equal("email" in record, false);
    assert.equal("phone" in record, false);
  });

  it("makes the same trusted idempotency key a no-op instead of consuming another unit", () => {
    const existing: AyllaGiftReservationRecord = {
      id: "reservation-existing",
      eventId: AYLLA_GIFTS_CONFIG.eventId,
      giftId: readyItem.id,
      guestId: eligibleGuest.id,
      quantity: 1,
      status: "reserved",
      idempotencyKey: "same-request",
      createdAt: "2026-11-22T00:00:00.000Z",
      updatedAt: "2026-11-22T00:00:00.000Z",
    };

    assert.deepEqual(
      planAyllaGiftReservation({
        item: readyItem,
        existingReservations: [existing],
        guestId: eligibleGuest.id,
        eventId: AYLLA_GIFTS_CONFIG.eventId,
        requestedQuantity: 1,
        idempotencyKey: "same-request",
      }),
      { ok: true, kind: "idempotent", reservation: existing }
    );
  });

  it("rejects reuse of an idempotency key for a different reservation intent", () => {
    const existing: AyllaGiftReservationRecord = {
      id: "reservation-existing",
      eventId: AYLLA_GIFTS_CONFIG.eventId,
      giftId: readyItem.id,
      guestId: eligibleGuest.id,
      quantity: 1,
      status: "reserved",
      idempotencyKey: "same-request",
      createdAt: "2026-11-22T00:00:00.000Z",
      updatedAt: "2026-11-22T00:00:00.000Z",
    };

    assert.deepEqual(
      planAyllaGiftReservation({
        item: { ...readyItem, id: "dream-blankets" },
        existingReservations: [existing],
        guestId: eligibleGuest.id,
        eventId: AYLLA_GIFTS_CONFIG.eventId,
        requestedQuantity: 1,
        idempotencyKey: "same-request",
      }),
      { ok: false, reason: "idempotency_conflict" }
    );
  });

  it("refuses a second reservation that would consume the final available unit", () => {
    const existing: AyllaGiftReservationRecord = {
      id: "reservation-existing",
      eventId: AYLLA_GIFTS_CONFIG.eventId,
      giftId: readyItem.id,
      guestId: "another-confirmed-guest",
      quantity: 2,
      status: "reserved",
      idempotencyKey: "request-a",
      createdAt: "2026-11-22T00:00:00.000Z",
      updatedAt: "2026-11-22T00:00:00.000Z",
    };

    assert.deepEqual(
      planAyllaGiftReservation({
        item: readyItem,
        existingReservations: [existing],
        guestId: eligibleGuest.id,
        eventId: AYLLA_GIFTS_CONFIG.eventId,
        requestedQuantity: 1,
        idempotencyKey: "request-b",
      }),
      { ok: false, reason: "insufficient_quantity" }
    );
  });

  it("does not count cancelled reservations against availability", () => {
    const cancelled: AyllaGiftReservationRecord = {
      id: "reservation-cancelled",
      eventId: AYLLA_GIFTS_CONFIG.eventId,
      giftId: readyItem.id,
      guestId: "another-confirmed-guest",
      quantity: 2,
      status: "cancelled",
      idempotencyKey: "request-a",
      createdAt: "2026-11-22T00:00:00.000Z",
      updatedAt: "2026-11-22T00:00:00.000Z",
    };

    assert.deepEqual(
      planAyllaGiftReservation({
        item: readyItem,
        existingReservations: [cancelled],
        guestId: eligibleGuest.id,
        eventId: AYLLA_GIFTS_CONFIG.eventId,
        requestedQuantity: 2,
        idempotencyKey: "request-b",
      }),
      { ok: true, kind: "new", remainingQuantity: 0 }
    );
  });
});
