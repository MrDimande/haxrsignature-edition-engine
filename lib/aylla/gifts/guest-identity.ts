import { createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";

import { AYLLA_GIFTS_CONFIG } from "./config";

const CHALLENGE_TTL_MS = 10 * 60 * 1000;
const SESSION_TTL_MS = 20 * 60 * 1000;
const MAX_CHALLENGE_ATTEMPTS = 5;
const MAX_VERIFIER_LENGTH = 256;

export const AYLLA_GUEST_SESSION_COOKIE = "haxr_aylla_guest_session";

export type EligibleAyllaGuest = {
  readonly id: string;
  readonly eventId: string;
  readonly rsvpStatus: string;
  readonly source: string;
  readonly archived: boolean;
  readonly deleted: boolean;
  readonly incorrect: boolean;
};

export type AyllaGuestIdentityStore = {
  findEligibleGuestByContact(contact: string): Promise<EligibleAyllaGuest | null>;
  createChallenge(input: {
    readonly id: string;
    readonly eventId: string;
    readonly guestId: string;
    readonly verifierHash: string;
    readonly expiresAt: Date;
    attempts: number;
    readonly maxAttempts: number;
  }): Promise<void>;
  consumeChallengeAtomically(input: {
    readonly challengeId: string;
    readonly verifierHash: string;
    readonly now: Date;
  }): Promise<{ readonly kind: "verified"; readonly guest: EligibleAyllaGuest } | { readonly kind: "denied" }>;
  createSession(input: {
    readonly id: string;
    readonly eventId: string;
    readonly guestId: string;
    readonly secretHash: string;
    readonly expiresAt: Date;
    revokedAt: Date | null;
  }): Promise<void>;
  getSession(input: {
    readonly sessionId: string;
    readonly secretHash: string;
    readonly now: Date;
  }): Promise<({ readonly guest: EligibleAyllaGuest } & {
    readonly id: string;
    readonly eventId: string;
    readonly guestId: string;
    readonly secretHash: string;
    readonly expiresAt: Date;
    readonly revokedAt: Date | null;
  }) | null>;
  revokeSession(input: { readonly sessionId: string; readonly secretHash: string; readonly now: Date }): Promise<void>;
  deliverVerificationCode(input: { readonly contact: string; readonly code: string; readonly expiresAt: Date }): Promise<void>;
};

export type AyllaGuestIdentityOptions = {
  readonly pepper: string;
  readonly now?: () => Date;
  readonly token?: () => string;
  readonly sessionId?: () => string;
};

type VerificationResult =
  | { readonly outcome: "verification_required" }
  | { readonly outcome: "verified"; readonly cookieValue: string };

function isEligibleGuest(guest: EligibleAyllaGuest | null): guest is EligibleAyllaGuest {
  return Boolean(
    guest &&
      guest.eventId === AYLLA_GIFTS_CONFIG.eventId &&
      guest.rsvpStatus === "confirmed" &&
      guest.source === "edition_rsvp" &&
      !guest.archived &&
      !guest.deleted &&
      !guest.incorrect
  );
}

function hashVerifier(value: string, pepper: string): string {
  return createHmac("sha256", pepper).update(value).digest("base64url");
}

function equalHash(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function splitCookie(cookieValue: string): { sessionId: string; secret: string } | null {
  const [sessionId, secret, extra] = cookieValue.split(".");
  if (!sessionId || !secret || extra || secret.length > MAX_VERIFIER_LENGTH) return null;
  return { sessionId, secret };
}

/**
 * Server-only identity adapter. A Core implementation must make challenge
 * consumption and session lookup atomic; browser identifiers are never inputs.
 */
export function createAyllaGuestIdentityService(store: AyllaGuestIdentityStore, options: AyllaGuestIdentityOptions) {
  if (!options.pepper) throw new Error("AYLLA_GUEST_IDENTITY_PEPPER is required");
  const now = options.now ?? (() => new Date());
  const token = options.token ?? (() => randomBytes(32).toString("base64url"));
  const sessionId = options.sessionId ?? randomUUID;

  async function requestVerification(contact: string): Promise<{ readonly outcome: "verification_pending" }> {
    const guest = await store.findEligibleGuestByContact(contact);
    if (!isEligibleGuest(guest)) return { outcome: "verification_pending" };

    const code = token();
    const issuedAt = now();
    await store.createChallenge({
      id: randomUUID(),
      eventId: guest.eventId,
      guestId: guest.id,
      verifierHash: hashVerifier(code, options.pepper),
      expiresAt: new Date(issuedAt.getTime() + CHALLENGE_TTL_MS),
      attempts: 0,
      maxAttempts: MAX_CHALLENGE_ATTEMPTS,
    });
    await store.deliverVerificationCode({ contact, code, expiresAt: new Date(issuedAt.getTime() + CHALLENGE_TTL_MS) });
    return { outcome: "verification_pending" };
  }

  async function verifyChallenge(challengeId: string, code: string): Promise<VerificationResult> {
    if (!challengeId || !code || code.length > MAX_VERIFIER_LENGTH) return { outcome: "verification_required" };
    const result = await store.consumeChallengeAtomically({
      challengeId,
      verifierHash: hashVerifier(code, options.pepper),
      now: now(),
    });
    if (result.kind !== "verified" || !isEligibleGuest(result.guest)) return { outcome: "verification_required" };

    const secret = token();
    const issuedAt = now();
    const id = sessionId();
    await store.createSession({
      id,
      eventId: result.guest.eventId,
      guestId: result.guest.id,
      secretHash: hashVerifier(secret, options.pepper),
      expiresAt: new Date(issuedAt.getTime() + SESSION_TTL_MS),
      revokedAt: null,
    });
    return { outcome: "verified", cookieValue: `${id}.${secret}` };
  }

  async function resolveSession(cookieValue: string): Promise<string | null> {
    const parsed = splitCookie(cookieValue);
    if (!parsed) return null;
    const stored = await store.getSession({
      sessionId: parsed.sessionId,
      secretHash: hashVerifier(parsed.secret, options.pepper),
      now: now(),
    });
    if (!stored || !isEligibleGuest(stored.guest) || stored.eventId !== AYLLA_GIFTS_CONFIG.eventId || stored.guestId !== stored.guest.id) {
      return null;
    }
    return stored.guestId;
  }

  async function revokeSession(cookieValue: string): Promise<void> {
    const parsed = splitCookie(cookieValue);
    if (!parsed) return;
    await store.revokeSession({
      sessionId: parsed.sessionId,
      secretHash: hashVerifier(parsed.secret, options.pepper),
      now: now(),
    });
  }

  return { requestVerification, verifyChallenge, resolveSession, revokeSession };
}

export function getAyllaGuestSessionCookieOptions(isProduction: boolean) {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  };
}

export function isAyllaSameOriginMutation(origin: string | null, host: string | null): boolean {
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function hashesMatchForStorage(left: string, right: string): boolean {
  return equalHash(left, right);
}
