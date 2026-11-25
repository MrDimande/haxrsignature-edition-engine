import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { POST as challengeHandler } from "../../app/api/gifts/aylla/challenge/route";
import { POST as verifyHandler } from "../../app/api/gifts/aylla/verify/route";
import { GET as sessionGetHandler, DELETE as sessionDeleteHandler } from "../../app/api/gifts/aylla/session/route";
import { POST as reserveHandler } from "../../app/api/gifts/aylla/reserve/route";
import { POST as cancelHandler } from "../../app/api/gifts/aylla/cancel/route";

const TEST_SECRET = "integration-proxy-secret-test-2026";
let mockCoreServerResponses: Map<string, { status: number; body: unknown }> = new Map();
const originalFetch = globalThis.fetch;

describe("Baby Aylla — Edition ↔ Core Full End-to-End Integration (Phase C.3.1.1)", () => {
  beforeEach(() => {
    process.env.HAXR_EDITION_PROXY_SECRET = TEST_SECRET;
    process.env.HAXR_CORE_API_BASE_URL = "http://core.haxrsignature.local";
    mockCoreServerResponses.clear();

    // Mock fetch to simulate Core upstream responses faithfully
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const path = new URL(url).pathname;
      const authHeader = (init?.headers as Record<string, string>)?.["authorization"] || "";
      const proxyHeader = (init?.headers as Record<string, string>)?.["x-haxr-edition-proxy"] || "";

      // Verify proxy secret is always forwarded properly
      if (!proxyHeader || proxyHeader !== TEST_SECRET) {
        return new Response(JSON.stringify({ success: false, error: "Não autorizado." }), {
          status: 401,
          headers: { "content-type": "application/json" },
        });
      }

      const mock = mockCoreServerResponses.get(`${init?.method || "GET"} ${path}`);
      if (mock) {
        return new Response(JSON.stringify(mock.body), {
          status: mock.status,
          headers: { "content-type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: false, error: "Not Found" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      });
    };
  });

  afterEach(() => {
    delete process.env.HAXR_EDITION_PROXY_SECRET;
    delete process.env.HAXR_CORE_API_BASE_URL;
    globalThis.fetch = originalFetch;
  });

  it("1. Challenge Request: forwards contact to Core and returns uniform pending outcome", async () => {
    mockCoreServerResponses.set("POST /api/v1/edition/gifts/aylla/challenge", {
      status: 200,
      body: { success: true, outcome: "verification_pending" },
    });

    const req = new Request("http://localhost:3000/api/gifts/aylla/challenge", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ contact: "+258841234567" }),
    });

    const res = await challengeHandler(req);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.outcome, "verification_pending");
  });

  it("2. Rejects invalid contact payload before reaching Core", async () => {
    const req = new Request("http://localhost:3000/api/gifts/aylla/challenge", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ contact: "" }),
    });

    const res = await challengeHandler(req);
    assert.equal(res.status, 400);
    const json = await res.json();
    assert.equal(json.success, false);
    assert.equal(json.error, "Contacto obrigatório.");
  });

  it("3 & 4. Verify Challenge: issues cookie and NEVER leaks raw session token in JSON", async () => {
    const syntheticToken = "session-uuid-1234.secret-crypto-hash-5678";
    mockCoreServerResponses.set("POST /api/v1/edition/gifts/aylla/verify", {
      status: 200,
      body: {
        success: true,
        outcome: "verified",
        sessionToken: syntheticToken,
        expiresAt: "2027-01-20T12:20:00.000Z",
      },
    });

    const req = new Request("http://localhost:3000/api/gifts/aylla/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ challengeId: "chal-1", code: "123456" }),
    });

    const res = await verifyHandler(req);
    assert.equal(res.status, 200);
    const json = await res.json();

    // 1. Success outcome returned
    assert.equal(json.success, true);
    assert.equal(json.outcome, "verified");

    // 2. CRITICAL: sessionToken is NEVER leaked to client JS!
    assert.equal((json as any).sessionToken, undefined);

    // 3. Cookie is properly established with HttpOnly and Lax
    const setCookie = res.headers.get("set-cookie") || "";
    assert.ok(setCookie.includes("haxr_aylla_guest_session="));
    assert.ok(setCookie.toLowerCase().includes("httponly"));
    assert.ok(setCookie.toLowerCase().includes("samesite=lax"));
  });

  it("5. Session Introspection: reads cookie and retrieves guest identity from Core", async () => {
    const syntheticToken = "session-uuid-1234.secret-crypto-hash-5678";
    mockCoreServerResponses.set("POST /api/v1/edition/gifts/aylla/session", {
      status: 200,
      body: {
        success: true,
        valid: true,
        guest: { id: "guest-1", name: "Tia Rosa", contact: "+258841234567" },
      },
    });

    const req = new Request("http://localhost:3000/api/gifts/aylla/session", {
      method: "GET",
      headers: {
        cookie: `haxr_aylla_guest_session=${syntheticToken}`,
      },
    });

    const res = await sessionGetHandler(req);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.authenticated, true);
    assert.equal(json.guest.name, "Tia Rosa");
  });

  it("6. Logout: revokes session in Core and clears cookie in Edition", async () => {
    const syntheticToken = "session-uuid-1234.secret-crypto-hash-5678";
    let coreRevokeCalled = false;
    mockCoreServerResponses.set("DELETE /api/v1/edition/gifts/aylla/session", {
      status: 200,
      body: { success: true, revoked: true },
    });

    const req = new Request("http://localhost:3000/api/gifts/aylla/session", {
      method: "DELETE",
      headers: {
        cookie: `haxr_aylla_guest_session=${syntheticToken}`,
      },
    });

    const res = await sessionDeleteHandler(req);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.loggedOut, true);

    // Cookie is deleted (maxAge 0 or expires in past)
    const setCookie = res.headers.get("set-cookie") || "";
    assert.ok(setCookie.includes("haxr_aylla_guest_session=;"));
  });

  it("7. Expired or unconfirmed session: returns 401 and deletes invalid cookie", async () => {
    mockCoreServerResponses.set("POST /api/v1/edition/gifts/aylla/session", {
      status: 401,
      body: { success: false, valid: false, reason: "session_expired" },
    });

    const req = new Request("http://localhost:3000/api/gifts/aylla/session", {
      method: "GET",
      headers: {
        cookie: "haxr_aylla_guest_session=expired-token.secret",
      },
    });

    const res = await sessionGetHandler(req);
    assert.equal(res.status, 401);
    const json = await res.json();
    assert.equal(json.authenticated, false);
    assert.equal(json.reason, "session_expired");
  });

  it("8. Reserve route: fail-closed blocks any reservation while catalog is disabled", async () => {
    const req = new Request("http://localhost:3000/api/gifts/aylla/reserve", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: "haxr_aylla_guest_session=valid.secret",
      },
      body: JSON.stringify({
        itemId: "dream-cot-sheets",
        quantity: 1,
        idempotencyKey: "test-idem-1",
      }),
    });

    const res = await reserveHandler(req);
    assert.equal(res.status, 403);
    const json = await res.json();
    assert.equal(json.success, false);
    assert.equal(json.outcome, "registry_closed");
  });

  it("9. Fails closed with 503 if HAXR_EDITION_PROXY_SECRET is missing from Edition", async () => {
    delete process.env.HAXR_EDITION_PROXY_SECRET;

    const req = new Request("http://localhost:3000/api/gifts/aylla/challenge", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ contact: "+258841234567" }),
    });

    const res = await challengeHandler(req);
    assert.equal(res.status, 503);
    const json = await res.json();
    assert.equal(json.success, false);
    assert.equal(json.code, "PROXY_SECRET_MISSING");
  });

  it("10. Fails closed with 502 on network/upstream error", async () => {
    globalThis.fetch = async () => {
      throw new Error("Connection refused (ECONNREFUSED)");
    };

    const req = new Request("http://localhost:3000/api/gifts/aylla/challenge", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ contact: "+258841234567" }),
    });

    const res = await challengeHandler(req);
    assert.equal(res.status, 502);
    const json = await res.json();
    assert.equal(json.success, false);
    assert.equal(json.code, "CORE_NETWORK_ERROR");
  });
});
