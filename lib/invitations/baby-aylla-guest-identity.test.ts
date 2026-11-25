import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createAyllaGuestIdentityService,
  getAyllaGuestSessionCookieOptions,
  isAyllaSameOriginMutation,
  type AyllaGuestIdentityStore,
  type EligibleAyllaGuest,
} from "../aylla/gifts/guest-identity";
import { AYLLA_GIFTS_CONFIG } from "../aylla/gifts/config";

const guest: EligibleAyllaGuest = {
  id: "guest-aylla",
  eventId: AYLLA_GIFTS_CONFIG.eventId,
  rsvpStatus: "confirmed",
  source: "edition_rsvp",
  archived: false,
  deleted: false,
  incorrect: false,
};

function createStore(): AyllaGuestIdentityStore & { deliveries: string[]; lastChallengeId: string | null } {
  const challenges = new Map<string, Parameters<AyllaGuestIdentityStore["createChallenge"]>[0]>();
  const sessions = new Map<string, Parameters<AyllaGuestIdentityStore["createSession"]>[0]>();
  return {
    deliveries: [],
    lastChallengeId: null,
    async findEligibleGuestByContact() { return guest; },
    async createChallenge(input) { challenges.set(input.id, input); this.lastChallengeId = input.id; },
    async consumeChallengeAtomically(input) {
      const challenge = challenges.get(input.challengeId);
      if (!challenge || challenge.expiresAt <= input.now || challenge.attempts >= challenge.maxAttempts) return { kind: "denied" };
      if (challenge.verifierHash !== input.verifierHash) {
        challenge.attempts += 1;
        return { kind: "denied" };
      }
      challenges.delete(input.challengeId);
      return { kind: "verified", guest };
    },
    async createSession(input) { sessions.set(input.id, input); },
    async getSession(input) {
      const session = sessions.get(input.sessionId);
      if (!session || session.secretHash !== input.secretHash || session.expiresAt <= input.now || session.revokedAt) return null;
      return { guest, ...session };
    },
    async revokeSession(input) { const session = sessions.get(input.sessionId); if (session) session.revokedAt = input.now; },
    async deliverVerificationCode(input) { this.deliveries.push(input.code); },
  };
}

describe("Baby Aylla verified guest identity", () => {
  it("does not reveal eligibility when requesting a contact challenge", async () => {
    const store = createStore();
    store.findEligibleGuestByContact = async () => null;
    const service = createAyllaGuestIdentityService(store, { now: () => new Date("2026-11-22T00:00:00Z"), pepper: "test-pepper" });
    assert.deepEqual(await service.requestVerification("unknown@example.test"), { outcome: "verification_pending" });
    assert.equal(store.deliveries.length, 0);
  });

  it("creates a hash-only challenge, one verified server session and revokes it", async () => {
    const store = createStore();
    const service = createAyllaGuestIdentityService(store, { now: () => new Date("2026-11-22T00:00:00Z"), pepper: "test-pepper" });
    assert.deepEqual(await service.requestVerification("aylla@example.test"), { outcome: "verification_pending" });
    const code = store.deliveries[0];
    assert.ok(code);
    assert.ok(store.lastChallengeId);
    const verified = await service.verifyChallenge(store.lastChallengeId, code);
    assert.equal(verified.outcome, "verified");
    if (verified.outcome !== "verified") return;
    assert.equal(await service.resolveSession(verified.cookieValue), "guest-aylla");
    await service.revokeSession(verified.cookieValue);
    assert.equal(await service.resolveSession(verified.cookieValue), null);
  });

  it("rejects a reused or incorrect code without accepting browser guest identifiers", async () => {
    const store = createStore();
    const service = createAyllaGuestIdentityService(store, { now: () => new Date("2026-11-22T00:00:00Z"), pepper: "test-pepper" });
    await service.requestVerification("aylla@example.test");
    assert.ok(store.lastChallengeId);
    const id = store.lastChallengeId;
    assert.deepEqual(await service.verifyChallenge(id, "incorrect"), { outcome: "verification_required" });
    const first = await service.verifyChallenge(id, store.deliveries[0]);
    assert.equal(first.outcome, "verified");
    assert.deepEqual(await service.verifyChallenge(id, store.deliveries[0]), { outcome: "verification_required" });
  });

  it("uses an HttpOnly server session and rejects cross-origin mutations", () => {
    assert.deepEqual(getAyllaGuestSessionCookieOptions(true), {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 1200,
    });
    assert.equal(isAyllaSameOriginMutation("https://edition.example.test", "edition.example.test"), true);
    assert.equal(isAyllaSameOriginMutation("https://attacker.example.test", "edition.example.test"), false);
  });
});
