import { createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { AYLLA_GIFTS_CONFIG } from "../config";
import { canTransitionAyllaGiftReservation, type AyllaGiftReservationRecord, type AyllaGiftReservationStatus } from "../reservations";
import type { AyllaGiftCoreOutcome, AyllaGiftReservationRequest, AyllaGiftReservationResponse } from "../core-contract";
import type {
  CoreAdminSession,
  CoreDeliveryProvider,
  CoreGiftStore,
  CoreGuestRecord,
  CoreRateLimiter,
  CoreReservationAuditRecord,
} from "./types";

const CHALLENGE_TTL_MS = 10 * 60 * 1000;
const SESSION_TTL_MS = 20 * 60 * 1000;
const MAX_CHALLENGE_ATTEMPTS = 5;
const MAX_VERIFIER_LENGTH = 256;

export interface CoreAyllaGiftServiceConfig {
  readonly store: CoreGiftStore;
  readonly pepper: string;
  readonly rateLimiter?: CoreRateLimiter;
  readonly deliveryProvider?: CoreDeliveryProvider;
  readonly now?: () => Date;
  readonly tokenGenerator?: () => string;
}

function hashVerifier(value: string, pepper: string): string {
  return createHmac("sha256", pepper).update(value).digest("base64url");
}

function safeCompareHashes(left: string, right: string): boolean {
  const leftBuf = Buffer.from(left);
  const rightBuf = Buffer.from(right);
  return leftBuf.length === rightBuf.length && timingSafeEqual(leftBuf, rightBuf);
}

function isEligibleGuest(guest: CoreGuestRecord | null): guest is CoreGuestRecord {
  return Boolean(
    guest &&
      guest.eventId === AYLLA_GIFTS_CONFIG.eventId &&
      guest.status === "confirmed" &&
      guest.source === "edition_rsvp" &&
      !guest.archived &&
      !guest.deleted &&
      !guest.incorrect
  );
}

export function createCoreAyllaGiftService(config: CoreAyllaGiftServiceConfig) {
  if (!config.pepper) {
    throw new Error("CoreAyllaGiftService: pepper is required for HMAC verifiers");
  }

  const { store, pepper } = config;
  const now = config.now ?? (() => new Date());
  const tokenGen = config.tokenGenerator ?? (() => randomBytes(32).toString("base64url"));

  async function checkRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
    if (!config.rateLimiter) return true;
    const res = await config.rateLimiter.check(key, limit, windowMs);
    return res.allowed;
  }

  /**
   * 1. Request Verification Challenge
   * Anti-enumeration: returns uniform outcome regardless of contact existence.
   */
  async function requestVerification(contact: string, clientIp: string): Promise<{ readonly outcome: "verification_pending" | "rate_limited" }> {
    const ipAllowed = await checkRateLimit(`rate:gift-verify-ip:${clientIp}`, 10, 60_000);
    const contactAllowed = await checkRateLimit(`rate:gift-verify-contact:${contact.trim().toLowerCase()}`, 5, 300_000);
    if (!ipAllowed || !contactAllowed) {
      return { outcome: "rate_limited" };
    }

    const normalizedContact = contact.trim().toLowerCase();
    const guest = await store.findGuestByContact(AYLLA_GIFTS_CONFIG.eventId, normalizedContact);

    if (isEligibleGuest(guest)) {
      const code = tokenGen();
      const currentTime = now();
      const expiresAt = new Date(currentTime.getTime() + CHALLENGE_TTL_MS);
      const challengeId = randomUUID();

      await store.createChallenge({
        id: challengeId,
        eventId: guest.eventId,
        guestId: guest.id,
        verifierHash: hashVerifier(code, pepper),
        expiresAt,
        attempts: 0,
        maxAttempts: MAX_CHALLENGE_ATTEMPTS,
        consumedAt: null,
        createdAt: currentTime,
      });

      if (config.deliveryProvider) {
        await config.deliveryProvider.sendVerificationCode(guest.contact, code, expiresAt);
      }
    }

    return { outcome: "verification_pending" };
  }

  /**
   * 2. Verify Challenge & Issue Session
   * Atomic consumption, attempts tracking, short session creation.
   */
  async function verifyChallenge(
    challengeId: string,
    code: string,
    clientIp: string
  ): Promise<
    | { readonly outcome: "verified"; readonly sessionId: string; readonly secret: string; readonly cookieValue: string }
    | { readonly outcome: "verification_required" | "rate_limited" }
  > {
    const ipAllowed = await checkRateLimit(`rate:challenge-verify-ip:${clientIp}`, 20, 60_000);
    if (!ipAllowed) return { outcome: "rate_limited" };

    if (!challengeId || !code || code.length > MAX_VERIFIER_LENGTH) {
      return { outcome: "verification_required" };
    }

    const challenge = await store.getChallenge(challengeId);
    const currentTime = now();

    if (!challenge || challenge.consumedAt !== null || challenge.expiresAt <= currentTime || challenge.attempts >= challenge.maxAttempts) {
      return { outcome: "verification_required" };
    }

    const presentedHash = hashVerifier(code, pepper);
    if (!safeCompareHashes(presentedHash, challenge.verifierHash)) {
      await store.incrementChallengeAttempts(challengeId);
      return { outcome: "verification_required" };
    }

    const consumed = await store.consumeChallenge(challengeId, currentTime);
    if (!consumed) {
      return { outcome: "verification_required" };
    }

    const guest = await store.getGuestById(challenge.eventId, challenge.guestId);
    if (!isEligibleGuest(guest)) {
      return { outcome: "verification_required" };
    }

    const sessionId = randomUUID();
    const secret = tokenGen();
    const sessionExpiresAt = new Date(currentTime.getTime() + SESSION_TTL_MS);

    await store.createSession({
      id: sessionId,
      eventId: guest.eventId,
      guestId: guest.id,
      secretHash: hashVerifier(secret, pepper),
      expiresAt: sessionExpiresAt,
      revokedAt: null,
      createdAt: currentTime,
    });

    return {
      outcome: "verified",
      sessionId,
      secret,
      cookieValue: `${sessionId}.${secret}`,
    };
  }

  /**
   * 3. Resolve Active Session
   */
  async function resolveSession(
    sessionId: string,
    secret: string
  ): Promise<{ readonly valid: true; readonly guest: CoreGuestRecord; readonly sessionId: string } | { readonly valid: false; readonly reason: "session_expired" | "access_denied" }> {
    if (!sessionId || !secret || secret.length > MAX_VERIFIER_LENGTH) {
      return { valid: false, reason: "session_expired" };
    }

    const session = await store.getSession(sessionId);
    const currentTime = now();

    if (!session || session.revokedAt !== null || session.expiresAt <= currentTime) {
      return { valid: false, reason: "session_expired" };
    }

    const presentedHash = hashVerifier(secret, pepper);
    if (!safeCompareHashes(presentedHash, session.secretHash)) {
      return { valid: false, reason: "session_expired" };
    }

    if (session.eventId !== AYLLA_GIFTS_CONFIG.eventId) {
      return { valid: false, reason: "access_denied" };
    }

    const guest = await store.getGuestById(session.eventId, session.guestId);
    if (!isEligibleGuest(guest)) {
      return { valid: false, reason: "access_denied" };
    }

    return { valid: true, guest, sessionId: session.id };
  }

  /**
   * 4. Revoke Session
   */
  async function revokeSession(sessionId: string, secret: string): Promise<boolean> {
    const auth = await resolveSession(sessionId, secret);
    if (!auth.valid) return false;
    await store.revokeSession(sessionId, now());
    return true;
  }

  /**
   * 5. Reserve Gift (Fail-Closed Core Execution)
   */
  async function reserveGift(
    input: AyllaGiftReservationRequest & { readonly sessionId: string; readonly secret: string }
  ): Promise<AyllaGiftReservationResponse> {
    // Primary fail-closed guard: catalog must be enabled
    if (!AYLLA_GIFTS_CONFIG.enabled) {
      return { outcome: "registry_closed" };
    }

    const auth = await resolveSession(input.sessionId, input.secret);
    if (!auth.valid) {
      return { outcome: auth.reason === "session_expired" ? "session_expired" : "access_denied" };
    }

    const { guest } = auth;
    const { itemId, quantity, idempotencyKey } = input;

    if (!Number.isSafeInteger(quantity) || quantity < 1) {
      return { outcome: "quantity_unconfirmed" };
    }

    // Idempotency check
    const existing = await store.findReservationByIdempotency(guest.eventId, guest.id, idempotencyKey);
    if (existing) {
      if (existing.giftId !== itemId || existing.quantity !== quantity) {
        return { outcome: "access_denied" };
      }
      return {
        outcome: "reservation_confirmed",
        reservation: {
          id: existing.id,
          giftId: existing.giftId,
          quantity: existing.quantity,
          status: existing.status,
        },
      };
    }

    // Inventory check
    const inventory = await store.getInventoryItem(guest.eventId, itemId);
    if (!inventory || !inventory.familyApproved || !inventory.enabled) {
      return { outcome: "item_unavailable" };
    }

    if (inventory.approvedQuantity === null || !inventory.specificationsComplete || !inventory.childSafetyValidated) {
      return { outcome: "quantity_unconfirmed" };
    }

    // Stock calculation
    const existingReservations = await store.getReservationsByItem(guest.eventId, itemId);
    const activeReserved = existingReservations
      .filter((r) => r.status !== "cancelled")
      .reduce((sum, r) => sum + r.quantity, 0);

    const available = inventory.approvedQuantity - activeReserved;
    if (quantity > available) {
      return { outcome: "item_unavailable" };
    }

    const currentTime = now();
    const reservationRecord: AyllaGiftReservationRecord = {
      id: randomUUID(),
      eventId: guest.eventId,
      giftId: itemId,
      guestId: guest.id,
      quantity,
      status: "reserved",
      idempotencyKey,
      createdAt: currentTime.toISOString(),
      updatedAt: currentTime.toISOString(),
    };

    await store.createReservation(reservationRecord);

    const auditRecord: CoreReservationAuditRecord = {
      id: randomUUID(),
      reservationId: reservationRecord.id,
      eventId: guest.eventId,
      actorGuestId: guest.id,
      actorAdminId: null,
      action: "reserved",
      previousStatus: null,
      nextStatus: "reserved",
      reason: null,
      createdAt: currentTime,
    };
    await store.createAuditRecord(auditRecord);

    return {
      outcome: "reservation_confirmed",
      reservation: {
        id: reservationRecord.id,
        giftId: reservationRecord.giftId,
        quantity: reservationRecord.quantity,
        status: reservationRecord.status,
      },
    };
  }

  /**
   * 6. Cancel Reservation by Guest
   */
  async function cancelReservation(
    sessionId: string,
    secret: string,
    reservationId: string
  ): Promise<AyllaGiftReservationResponse> {
    const auth = await resolveSession(sessionId, secret);
    if (!auth.valid) {
      return { outcome: auth.reason === "session_expired" ? "session_expired" : "access_denied" };
    }

    const { guest } = auth;
    const reservation = await store.getReservationById(guest.eventId, reservationId);
    if (!reservation || reservation.guestId !== guest.id) {
      return { outcome: "access_denied" };
    }

    if (reservation.status !== "reserved") {
      return { outcome: "access_denied" };
    }

    const currentTime = now();
    await store.updateReservationStatus(reservationId, "cancelled", currentTime);

    const auditRecord: CoreReservationAuditRecord = {
      id: randomUUID(),
      reservationId,
      eventId: guest.eventId,
      actorGuestId: guest.id,
      actorAdminId: null,
      action: "cancelled",
      previousStatus: "reserved",
      nextStatus: "cancelled",
      reason: "cancelled_by_guest",
      createdAt: currentTime,
    };
    await store.createAuditRecord(auditRecord);

    return {
      outcome: "reservation_confirmed",
      reservation: {
        id: reservation.id,
        giftId: reservation.giftId,
        quantity: reservation.quantity,
        status: "cancelled",
      },
    };
  }

  /**
   * 7. Admin Transition Reservation Status
   */
  async function adminTransition(
    admin: CoreAdminSession | null,
    eventId: string,
    reservationId: string,
    nextStatus: AyllaGiftReservationStatus,
    reason?: string
  ): Promise<{ readonly ok: true; readonly reservationId: string; readonly newStatus: AyllaGiftReservationStatus } | { readonly ok: false; readonly reason: "access_denied" | "invalid_transition" | "reservation_not_found" }> {
    if (!admin || !admin.active || eventId !== AYLLA_GIFTS_CONFIG.eventId || !admin.permittedEventIds.includes(eventId)) {
      return { ok: false, reason: "access_denied" };
    }

    const reservation = await store.getReservationById(eventId, reservationId);
    if (!reservation) {
      return { ok: false, reason: "reservation_not_found" };
    }

    if (!canTransitionAyllaGiftReservation(reservation.status, nextStatus)) {
      return { ok: false, reason: "invalid_transition" };
    }

    const currentTime = now();
    await store.updateReservationStatus(reservationId, nextStatus, currentTime);

    const auditRecord: CoreReservationAuditRecord = {
      id: randomUUID(),
      reservationId,
      eventId,
      actorGuestId: null,
      actorAdminId: admin.id,
      action: nextStatus,
      previousStatus: reservation.status,
      nextStatus,
      reason: reason ?? null,
      createdAt: currentTime,
    };
    await store.createAuditRecord(auditRecord);

    return { ok: true, reservationId, newStatus: nextStatus };
  }

  return {
    requestVerification,
    verifyChallenge,
    resolveSession,
    revokeSession,
    reserveGift,
    cancelReservation,
    adminTransition,
  };
}
