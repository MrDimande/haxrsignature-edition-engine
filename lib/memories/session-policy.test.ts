import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { authorizeMemoriesSession, maySignMemoriesMedia, type MemoriesSessionSnapshot } from "./session-policy";
import { createMemoriesToken, hashMemoriesToken, isMemoriesToken, isMemoriesSameOriginMutation,
  memoriesCookieName, memoriesSessionCookie, readMemoriesCookie } from "./session-security";
import { mayExchangeMemoriesLink, type MemoriesAccessLinkSnapshot } from "./access-link-policy";
import { decideUploadCompletion, type BoundUploadIntent } from "./upload-completion-policy";
import { getInvitation } from "@data/invitations";

const eventId = "11111111-1111-4111-8111-111111111111";
const otherId = "22222222-2222-4222-8222-222222222222";
const participantId = "33333333-3333-4333-8333-333333333333";
const sessionId = "44444444-4444-4444-8444-444444444444";
const linkId = "55555555-5555-4555-8555-555555555555";
const now = new Date("2026-09-10T10:00:00Z");
const expiresAt = "2026-09-10T11:00:00Z";
function snapshot(): MemoriesSessionSnapshot {
  return {
    event: { id: eventId, slug: "example", active: true, visibility: "moderated", uploadsEnabled: true, competitionEnabled: true },
    participant: { id: participantId, eventId, guestId: null, revokedAt: null },
    session: { id: sessionId, eventId, participantId, accessLinkId: linkId, expiresAt, revokedAt: null },
    accessLink: { id: linkId, eventId, expiresAt, revokedAt: null },
  };
}

describe("contratos de sessão (sem persistência simulada como prova de Neon)", () => {
  it("mantém os dois eventos reais em legacy", () => {
    for (const slug of ["jessicasamuelwedding", "jessicaesamueltraditionalwedding"])
      assert.equal(getInvitation(slug)?.features?.memories?.accessMode, "legacy");
  });
  it("gera credenciais opacas distintas e hashes separados por finalidade", () => {
    const token = createMemoriesToken();
    assert.ok(isMemoriesToken(token));
    assert.notEqual(token, createMemoriesToken());
    assert.equal(hashMemoriesToken(token, "participant-session").length, 64);
    assert.notEqual(hashMemoriesToken(token, "access-link"), hashMemoriesToken(token, "participant-session"));
    for (const value of [null, "", participantId, token + "=", "a".repeat(43)]) assert.equal(isMemoriesToken(value), false);
  });
  it("isola cookies por evento e recusa duplicados, URL e Bearer", () => {
    const token = createMemoriesToken();
    const name = memoriesCookieName(eventId, true);
    const req = new Request("https://example.test?token=" + token, { headers: { cookie: `${name}=${token}` } });
    assert.equal(readMemoriesCookie(req, eventId, true), token);
    assert.equal(readMemoriesCookie(req, otherId, true), null);
    assert.equal(readMemoriesCookie(new Request(req.url, { headers: { authorization: `Bearer ${token}` } }), eventId, true), null);
    assert.equal(readMemoriesCookie(new Request(req.url, { headers: { cookie: `${name}=${token}; ${name}=${token}` } }), eventId, true), null);
    const cookie = memoriesSessionCookie({ eventId, token, now, expiresAt: new Date(expiresAt), secure: true });
    for (const flag of ["__Host-", "Path=/", "HttpOnly", "SameSite=Lax", "Secure", "Max-Age=3600"]) assert.ok(cookie.includes(flag));
    assert.ok(!cookie.includes("Domain="));
    assert.throws(() => memoriesSessionCookie({ eventId, token, now, expiresAt: now, secure: true }));
  });
  it("exige origem configurada e JSON em mutações", () => {
    const req = (origin: string, site = "same-origin", type = "application/json") => new Request("https://example.test", { method: "POST", headers: { origin, "sec-fetch-site": site, "content-type": type } });
    assert.equal(isMemoriesSameOriginMutation(req("https://example.test"), "https://example.test"), true);
    assert.equal(isMemoriesSameOriginMutation(req("https://evil.test"), "https://example.test"), false);
    assert.equal(isMemoriesSameOriginMutation(req("https://example.test", "cross-site"), "https://example.test"), false);
    assert.equal(isMemoriesSameOriginMutation(req("https://example.test", "same-origin", "text/plain"), "https://example.test"), false);
    assert.equal(isMemoriesSameOriginMutation(req("http://example.test"), "http://example.test"), false);
  });
  it("autoriza um participante anónimo válido sem o confundir com convidado Core", () => {
    assert.equal(authorizeMemoriesSession(eventId, snapshot(), "media:upload", now).ok, true);
    assert.equal(authorizeMemoriesSession(eventId, null, "media:upload", now).ok, false);
  });
  for (const relation of ["event", "participant", "session", "accessLink"] as const) {
    it(`recusa troca de evento em ${relation}`, () => {
      const s = snapshot();
      if (relation === "event") s.event.id = otherId;
      else s[relation].eventId = otherId;
      assert.equal(authorizeMemoriesSession(eventId, s, "media:upload", now).ok, false);
    });
  }
  for (const relation of ["participant", "session", "accessLink"] as const) {
    it(`revogação de ${relation} impede autorização imediata`, () => {
      const s = snapshot(); s[relation].revokedAt = now.toISOString();
      assert.equal(authorizeMemoriesSession(eventId, s, "media:upload", now).ok, false);
    });
  }
  it("recusa expiração exacta, data inválida e vínculo a outro participante", () => {
    for (const expiry of [now.toISOString(), "invalid"]) {
      const s = snapshot(); s.session.expiresAt = expiry;
      assert.equal(authorizeMemoriesSession(eventId, s, "media:upload", now).ok, false);
    }
    const s = snapshot(); s.session.participantId = otherId;
    assert.equal(authorizeMemoriesSession(eventId, s, "media:upload", now).ok, false);
  });
  it("aprovação não concede leitura de media privada ou de outro evento", () => {
    const media = { eventId, moderationStatus: "approved", visibility: "moderated" as const };
    assert.equal(maySignMemoriesMedia(eventId, snapshot(), media, now), true);
    for (const patch of [{ eventId: otherId }, { moderationStatus: "pending" }, { visibility: "private_to_couple" as const }])
      assert.equal(maySignMemoriesMedia(eventId, snapshot(), { ...media, ...patch }, now), false);
    const s = snapshot(); s.event.visibility = "private_to_couple";
    assert.equal(maySignMemoriesMedia(eventId, s, media, now), false);
    assert.equal(authorizeMemoriesSession(eventId, s, "media:upload", now).ok, true);
  });
  it("evento desactivado ou uploads bloqueados não autorizam escrita", () => {
    const s = snapshot(); s.event.active = false;
    assert.equal(authorizeMemoriesSession(eventId, s, "media:upload", now).ok, false);
    s.event.active = true; s.event.uploadsEnabled = false;
    assert.equal(authorizeMemoriesSession(eventId, s, "challenge:submit", now).ok, false);
  });
});

describe("contratos de troca de link e conclusão de upload", () => {
  const link = (): MemoriesAccessLinkSnapshot => ({ id: linkId, eventId, revokedAt: null, expiresAt, uses: 0, maxUses: 1, scope: { kind: "general" } });
  it("recusa link revogado, esgotado, expirado ou de outro evento", () => {
    assert.equal(mayExchangeMemoriesLink(eventId, link(), now), true);
    for (const patch of [{ revokedAt: now.toISOString() }, { uses: 1 }, { expiresAt: now.toISOString() }, { eventId: otherId }])
      assert.equal(mayExchangeMemoriesLink(eventId, { ...link(), ...patch }, now), false);
  });
  it("scope de convidado ou mesa exige relação com o evento", () => {
    assert.equal(mayExchangeMemoriesLink(eventId, { ...link(), scope: { kind: "guest", guestId: participantId, guestEventId: otherId } }, now), false);
    assert.equal(mayExchangeMemoriesLink(eventId, { ...link(), scope: { kind: "table", tableId: otherId, tableEventId: eventId } }, now), true);
    assert.equal(mayExchangeMemoriesLink(eventId, { ...link(), scope: { kind: "table", tableId: otherId, tableEventId: otherId } }, now), false);
  });
  const context = { eventId, participantId, sessionId };
  const intent = (): BoundUploadIntent => ({ id: linkId, ...context, storagePath: "server-generated-path", expiresAt, status: "pending", mediaId: null });
  it("conclusão repetida devolve a mesma media mesmo após expirar o intent", () => {
    assert.deepEqual(decideUploadCompletion(intent(), context, now), { action: "verify-and-insert" });
    assert.deepEqual(decideUploadCompletion({ ...intent(), status: "completed", mediaId: otherId, expiresAt: now.toISOString() }, context, now), { action: "replay", mediaId: otherId });
  });
  for (const key of ["eventId", "participantId", "sessionId"] as const) {
    it(`replay não atravessa ${key}`, () => {
      assert.deepEqual(decideUploadCompletion({ ...intent(), status: "completed", mediaId: otherId }, { ...context, [key]: otherId }, now), { action: "reject", reason: "ownership" });
    });
  }
  it("recusa intent expirado, cancelado ou receipt inconsistente", () => {
    for (const patch of [{ expiresAt: now.toISOString() }, { status: "cancelled" as const }, { status: "completed" as const }, { mediaId: otherId }])
      assert.equal(decideUploadCompletion({ ...intent(), ...patch }, context, now).action, "reject");
  });
});
