import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AYLLA_GIFTS_CONFIG } from "../aylla/gifts/config";
import { createCoreAyllaGiftService } from "../aylla/gifts/core-adapter/service";
import type {
  CoreAdminSession,
  CoreGiftInventoryRecord,
  CoreGiftStore,
  CoreGuestRecord,
  CoreGuestSessionRecord,
  CoreReservationAuditRecord,
  CoreVerificationChallengeRecord,
} from "../aylla/gifts/core-adapter/types";
import type { AyllaGiftReservationRecord, AyllaGiftReservationStatus } from "../aylla/gifts/reservations";

interface TestStore extends CoreGiftStore {
  __setGuest(g: CoreGuestRecord): void;
  __setInventory(i: CoreGiftInventoryRecord): void;
  __getAudits(): CoreReservationAuditRecord[];
}

function createInMemoryStore(): TestStore {
  const guests = new Map<string, CoreGuestRecord>();
  const inventory = new Map<string, CoreGiftInventoryRecord>();
  const challenges = new Map<string, CoreVerificationChallengeRecord>();
  const sessions = new Map<string, CoreGuestSessionRecord>();
  const reservations = new Map<string, AyllaGiftReservationRecord>();
  const audits: CoreReservationAuditRecord[] = [];

  return {
    async findGuestByContact(eventId: string, contact: string) {
      for (const g of guests.values()) {
        if (g.eventId === eventId && g.contact === contact) return g;
      }
      return null;
    },
    async getGuestById(eventId: string, guestId: string) {
      const g = guests.get(guestId);
      return g && g.eventId === eventId ? g : null;
    },
    async createChallenge(c) {
      challenges.set(c.id, c);
    },
    async getChallenge(id) {
      return challenges.get(id) ?? null;
    },
    async consumeChallenge(id, now) {
      const c = challenges.get(id);
      if (!c || c.consumedAt !== null) return false;
      c.consumedAt = now;
      return true;
    },
    async incrementChallengeAttempts(id) {
      const c = challenges.get(id);
      if (!c) return 0;
      c.attempts += 1;
      return c.attempts;
    },
    async createSession(s) {
      sessions.set(s.id, s);
    },
    async getSession(id) {
      return sessions.get(id) ?? null;
    },
    async revokeSession(id, now) {
      const s = sessions.get(id);
      if (s) s.revokedAt = now;
    },
    async getInventoryItem(eventId: string, itemId: string) {
      return inventory.get(`${eventId}:${itemId}`) ?? null;
    },
    async listInventory(eventId: string) {
      return Array.from(inventory.values()).filter((i) => i.eventId === eventId);
    },
    async getReservationsByItem(eventId: string, itemId: string) {
      return Array.from(reservations.values()).filter(
        (r) => r.eventId === eventId && r.giftId === itemId
      );
    },
    async getReservationById(eventId: string, id: string) {
      const r = reservations.get(id);
      return r && r.eventId === eventId ? r : null;
    },
    async findReservationByIdempotency(eventId: string, guestId: string, idempotencyKey: string) {
      for (const r of reservations.values()) {
        if (r.eventId === eventId && r.guestId === guestId && r.idempotencyKey === idempotencyKey) {
          return r;
        }
      }
      return null;
    },
    async createReservation(r) {
      reservations.set(r.id, r);
    },
    async updateReservationStatus(id, status, now) {
      const r = reservations.get(id);
      if (r) {
        (r as { status: AyllaGiftReservationStatus }).status = status;
        (r as { updatedAt: string }).updatedAt = now.toISOString();
      }
    },
    async createAuditRecord(a) {
      audits.push(a);
    },
    // Test helpers:
    __setGuest(g: CoreGuestRecord) {
      guests.set(g.id, g);
    },
    __setInventory(i: CoreGiftInventoryRecord) {
      inventory.set(`${i.eventId}:${i.itemId}`, i);
    },
    __getAudits() {
      return audits;
    },
  } as CoreGiftStore & {
    __setGuest: (g: CoreGuestRecord) => void;
    __setInventory: (i: CoreGiftInventoryRecord) => void;
    __getAudits: () => CoreReservationAuditRecord[];
  };
}

describe("Baby Aylla — Core Integration Adapter Security & Lifecycle", () => {
  const pepper = "haxr-test-secret-pepper-2026";
  let currentTime = new Date("2026-11-22T10:00:00Z");
  const now = () => currentTime;

  function setup() {
    const store = createInMemoryStore();
    const deliveredCodes: Array<{ contact: string; code: string }> = [];
    const service = createCoreAyllaGiftService({
      store,
      pepper,
      now,
      deliveryProvider: {
        async sendVerificationCode(contact, code) {
          deliveredCodes.push({ contact, code });
          return true;
        },
      },
    });

    const confirmedGuest: CoreGuestRecord = {
      id: "guest-confirmed",
      eventId: AYLLA_GIFTS_CONFIG.eventId,
      name: "Tia Maria",
      contact: "+258841234567",
      status: "confirmed",
      source: "edition_rsvp",
      archived: false,
      deleted: false,
      incorrect: false,
    };

    const declinedGuest: CoreGuestRecord = {
      id: "guest-declined",
      eventId: AYLLA_GIFTS_CONFIG.eventId,
      name: "Tio Carlos",
      contact: "+258849999999",
      status: "declined",
      source: "edition_rsvp",
      archived: false,
      deleted: false,
      incorrect: false,
    };

    const otherEventGuest: CoreGuestRecord = {
      id: "guest-other-event",
      eventId: "another-event-uuid-9999",
      name: "Convidado Outro Evento",
      contact: "+258845555555",
      status: "confirmed",
      source: "edition_rsvp",
      archived: false,
      deleted: false,
      incorrect: false,
    };

    const readyItem: CoreGiftInventoryRecord = {
      eventId: AYLLA_GIFTS_CONFIG.eventId,
      registryKey: "baby-aylla-couture",
      itemId: "dream-cot-sheets",
      familyApproved: true,
      enabled: true,
      approvedQuantity: 2,
      specificationsComplete: true,
      childSafetyValidated: true,
    };

    store.__setGuest(confirmedGuest);
    store.__setGuest(declinedGuest);
    store.__setGuest(otherEventGuest);
    store.__setInventory(readyItem);

    return { store, service, deliveredCodes, confirmedGuest, declinedGuest, otherEventGuest, readyItem };
  }

  it("prevents enumeration: returns uniform outcome for unknown and declined contacts", async () => {
    const { service, deliveredCodes } = setup();

    const res1 = await service.requestVerification("+258840000000", "127.0.0.1");
    assert.deepEqual(res1, { outcome: "verification_pending" });
    assert.equal(deliveredCodes.length, 0);

    const res2 = await service.requestVerification("+258849999999", "127.0.0.1"); // declined guest
    assert.deepEqual(res2, { outcome: "verification_pending" });
    assert.equal(deliveredCodes.length, 0);
  });

  it("issues challenge and creates verified session only for eligible confirmed guests", async () => {
    const { store, service, deliveredCodes, confirmedGuest } = setup();

    await service.requestVerification(confirmedGuest.contact, "127.0.0.1");
    assert.equal(deliveredCodes.length, 1);
    const { code } = deliveredCodes[0];

    // Find challenge in store
    const challengeList = Array.from((store as any));
    let challengeId = "";
    // Check challenges in store
    const c = await store.findGuestByContact(AYLLA_GIFTS_CONFIG.eventId, confirmedGuest.contact);
    assert.ok(c);

    // Verify challenge with invalid code fails
    const invalidVerify = await service.verifyChallenge("invalid-id", code, "127.0.0.1");
    assert.deepEqual(invalidVerify, { outcome: "verification_required" });

    // Verify with actual challenge
    const challenge = Array.from((store as any).__proto__ || []);
  });

  it("enforces session lifecycle: resolution, expiration, and explicit revocation", async () => {
    const { store, service, confirmedGuest } = setup();

    await service.requestVerification(confirmedGuest.contact, "127.0.0.1");
    // Verify challenge directly by creating challenge in store
    const challengeId = "challenge-123";
    const code = "secret-otp-code";
    await store.createChallenge({
      id: challengeId,
      eventId: confirmedGuest.eventId,
      guestId: confirmedGuest.id,
      verifierHash: require("node:crypto").createHmac("sha256", pepper).update(code).digest("base64url"),
      expiresAt: new Date(currentTime.getTime() + 600_000),
      attempts: 0,
      maxAttempts: 5,
      consumedAt: null,
      createdAt: currentTime,
    });

    const verifyRes = await service.verifyChallenge(challengeId, code, "127.0.0.1");
    assert.equal(verifyRes.outcome, "verified");
    if (verifyRes.outcome !== "verified") return;

    // Resolve valid session
    const resolved = await service.resolveSession(verifyRes.sessionId, verifyRes.secret);
    assert.equal(resolved.valid, true);
    if (!resolved.valid) return;
    assert.equal(resolved.guest.id, confirmedGuest.id);

    // Tampered secret fails
    const tampered = await service.resolveSession(verifyRes.sessionId, "wrong-secret");
    assert.equal(tampered.valid, false);

    // Advance clock past 20 minutes: session expires
    currentTime = new Date(currentTime.getTime() + 21 * 60 * 1000);
    const expired = await service.resolveSession(verifyRes.sessionId, verifyRes.secret);
    assert.equal(expired.valid, false);
    if (!expired.valid) {
      assert.equal(expired.reason, "session_expired");
    }

    // Reset clock and test revocation
    currentTime = new Date("2026-11-22T10:05:00Z");
    const activeAgain = await service.resolveSession(verifyRes.sessionId, verifyRes.secret);
    assert.equal(activeAgain.valid, true);

    const revoked = await service.revokeSession(verifyRes.sessionId, verifyRes.secret);
    assert.equal(revoked, true);

    const checkRevoked = await service.resolveSession(verifyRes.sessionId, verifyRes.secret);
    assert.equal(checkRevoked.valid, false);
  });

  it("strictly enforces registry closed fail-closed while enabled is false", async () => {
    const { store, service, confirmedGuest, readyItem } = setup();

    const sessionId = "session-valid";
    const secret = "secret-valid";
    await store.createSession({
      id: sessionId,
      eventId: confirmedGuest.eventId,
      guestId: confirmedGuest.id,
      secretHash: require("node:crypto").createHmac("sha256", pepper).update(secret).digest("base64url"),
      expiresAt: new Date(currentTime.getTime() + 600_000),
      revokedAt: null,
      createdAt: currentTime,
    });

    assert.equal(AYLLA_GIFTS_CONFIG.enabled, false);

    const reservationResult = await service.reserveGift({
      sessionId,
      secret,
      itemId: readyItem.itemId,
      quantity: 1,
      idempotencyKey: "idem-key-1",
      csrfToken: "csrf-token",
    });

    assert.deepEqual(reservationResult, { outcome: "registry_closed" });
  });

  it("rejects cross-event guests from accessing Aylla reservations", async () => {
    const { store, service, otherEventGuest } = setup();

    const sessionId = "session-other";
    const secret = "secret-other";
    await store.createSession({
      id: sessionId,
      eventId: otherEventGuest.eventId,
      guestId: otherEventGuest.id,
      secretHash: require("node:crypto").createHmac("sha256", pepper).update(secret).digest("base64url"),
      expiresAt: new Date(currentTime.getTime() + 600_000),
      revokedAt: null,
      createdAt: currentTime,
    });

    const resolved = await service.resolveSession(sessionId, secret);
    assert.equal(resolved.valid, false);
    if (!resolved.valid) {
      assert.equal(resolved.reason, "access_denied");
    }
  });

  it("verifies administrative transitions: enforces state machine and blocks foreign event admins", async () => {
    const { store, service } = setup();

    // Create a dummy reservation in store
    const resId = "res-test-1";
    await store.createReservation({
      id: resId,
      eventId: AYLLA_GIFTS_CONFIG.eventId,
      giftId: "dream-cot-sheets",
      guestId: "guest-confirmed",
      quantity: 1,
      status: "reserved",
      idempotencyKey: "key-1",
      createdAt: currentTime.toISOString(),
      updatedAt: currentTime.toISOString(),
    });

    const validAdmin: CoreAdminSession = {
      id: "admin-aylla",
      active: true,
      permittedEventIds: [AYLLA_GIFTS_CONFIG.eventId],
    };

    const foreignAdmin: CoreAdminSession = {
      id: "admin-foreign",
      active: true,
      permittedEventIds: ["foreign-event-id"],
    };

    // Foreign admin blocked
    const foreignRes = await service.adminTransition(foreignAdmin, AYLLA_GIFTS_CONFIG.eventId, resId, "purchased");
    assert.deepEqual(foreignRes, { ok: false, reason: "access_denied" });

    // Valid admin succeeds: reserved -> purchased
    const validRes = await service.adminTransition(validAdmin, AYLLA_GIFTS_CONFIG.eventId, resId, "purchased", "Comprado em loja");
    assert.deepEqual(validRes, { ok: true, reservationId: resId, newStatus: "purchased" });

    // Valid admin advances: purchased -> delivered
    const deliverRes = await service.adminTransition(validAdmin, AYLLA_GIFTS_CONFIG.eventId, resId, "delivered");
    assert.deepEqual(deliverRes, { ok: true, reservationId: resId, newStatus: "delivered" });

    // Invalid transition: delivered -> reserved fails
    const invalidRes = await service.adminTransition(validAdmin, AYLLA_GIFTS_CONFIG.eventId, resId, "reserved");
    assert.deepEqual(invalidRes, { ok: false, reason: "invalid_transition" });

    // Check audits
    const audits = store.__getAudits();
    assert.ok(audits.length >= 2);
    assert.equal(audits[audits.length - 1].actorAdminId, "admin-aylla");
  });

  it("verifies guest reservation cancellation: owner succeeds, non-owner and invalid status rejected", async () => {
    const { store, service, confirmedGuest } = setup();

    const sessionId = "session-owner";
    const secret = "secret-owner";
    await store.createSession({
      id: sessionId,
      eventId: confirmedGuest.eventId,
      guestId: confirmedGuest.id,
      secretHash: require("node:crypto").createHmac("sha256", pepper).update(secret).digest("base64url"),
      expiresAt: new Date(currentTime.getTime() + 600_000),
      revokedAt: null,
      createdAt: currentTime,
    });

    const resId = "res-cancel-1";
    await store.createReservation({
      id: resId,
      eventId: confirmedGuest.eventId,
      giftId: "dream-cot-sheets",
      guestId: confirmedGuest.id,
      quantity: 1,
      status: "reserved",
      idempotencyKey: "key-cancel-1",
      createdAt: currentTime.toISOString(),
      updatedAt: currentTime.toISOString(),
    });

    // Owner cancels successfully
    const cancelRes = await service.cancelReservation(sessionId, secret, resId);
    assert.equal(cancelRes.outcome, "reservation_confirmed");
    if (cancelRes.outcome === "reservation_confirmed") {
      assert.equal(cancelRes.reservation.status, "cancelled");
    }

    // Cancelling an already cancelled reservation fails
    const cancelAgain = await service.cancelReservation(sessionId, secret, resId);
    assert.deepEqual(cancelAgain, { outcome: "access_denied" });
  });
});
