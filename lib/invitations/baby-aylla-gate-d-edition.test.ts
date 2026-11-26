import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";
import { GET as legacyPublicGiftsHandler } from "../../app/api/gifts/route";
import { GET as ayllaCatalogHandler } from "../../app/api/gifts/aylla/catalog/route";
import { POST as challengeHandler } from "../../app/api/gifts/aylla/challenge/route";
import { POST as verifyHandler } from "../../app/api/gifts/aylla/verify/route";
import { POST as reserveHandler } from "../../app/api/gifts/aylla/reserve/route";
import { POST as cancelHandler } from "../../app/api/gifts/aylla/cancel/route";
import { callCoreGiftApi } from "../../lib/aylla/gifts/core-adapter/client";
import {
  AYLLA_GIFT_CANDIDATES,
  AYLLA_GIFT_CATEGORIES,
} from "../../data/gifts/baby-aylla";
import { getBabyAyllaEditorialGalleryItems } from "../../lib/aylla/gifts/editorial-gallery";
import {
  AYLLA_GIFTS_CONFIG,
  CANONICAL_BABY_AYLLA_EVENT_ID,
  resolveAyllaGiftEventId,
} from "../../lib/aylla/gifts/config";
import {
  isAyllaEditionRealDeliveryStagingEnabled,
  isAyllaEditionRegistryOperational,
  isAyllaEditionTestActivationEnabled,
} from "../../lib/aylla/gifts/test-activation";

const originalFetch = globalThis.fetch;
const trackedEnvKeys = [
  "HAXR_CORE_API_BASE_URL",
  "HAXR_EDITION_PROXY_SECRET",
  "HAXR_AYLLA_GIFT_STAGING_TEST_ACTIVATION",
  "HAXR_AYLLA_GIFT_STAGING_REAL_DELIVERY",
  "HAXR_AYLLA_GIFT_SYNTHETIC_DELIVERY",
  "VERCEL_ENV",
  "NEXT_PUBLIC_VERCEL_ENV",
  "VERCEL_TARGET_ENV",
] as const;

describe("Baby Aylla — Edition Gate D Couture UI & Proxy Integration", () => {
  beforeEach(() => {
    process.env.HAXR_CORE_API_BASE_URL = "https://core.internal.haxrsignature.test";
    process.env.HAXR_EDITION_PROXY_SECRET = "test-edition-proxy-secret";
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    for (const key of trackedEnvKeys) {
      delete (process.env as Record<string, string | undefined>)[key];
    }
  });

  it("enforces zero banned icons and keeps 52 editorial items safe without internal flags", () => {
    const componentSource = readFileSync(
      resolve(process.cwd(), "engines/true-theme/profiles/baby-aylla-couture/BabyAyllaGifts.tsx"),
      "utf8"
    );
    assert.doesNotMatch(componentSource, /\b(Sparkles|Star|Zap|Rocket|Trophy)\b/);

    const items = getBabyAyllaEditorialGalleryItems();
    assert.equal(items.length, 52);
    assert.equal(AYLLA_GIFT_CANDIDATES.length, 52);
    assert.equal(AYLLA_GIFT_CATEGORIES.length, 7);
    assert.equal("reviewFlags" in items[0], false);
    assert.equal("familyApproval" in items[0], false);
    assert.equal("approvedQuantity" in items[0], false);
  });

  it("keeps public /api/gifts?slug=babyaylla locked and /api/gifts/aylla/catalog fail-closed by default", async () => {
    assert.equal(isAyllaEditionTestActivationEnabled(), false);
    assert.equal(isAyllaEditionRegistryOperational(), false);

    const legacyRes = await legacyPublicGiftsHandler(
      new Request("http://localhost:3000/api/gifts?slug=babyaylla")
    );
    assert.equal(legacyRes.status, 200);
    const legacyJson = await legacyRes.json();
    assert.equal(legacyJson.registry.enabled, false);
    assert.equal(legacyJson.gifts.length, 0);

    const catalogRes = await ayllaCatalogHandler(
      new Request("http://localhost:3000/api/gifts/aylla/catalog")
    );
    assert.equal(catalogRes.status, 200);
    const catalogJson = await catalogRes.json();
    assert.equal(catalogJson.registryEnabled, false);
    assert.equal(catalogJson.editorialItems.length, 52);
    assert.equal(catalogJson.inventoryItems.length, 0);
    assert.equal(catalogJson.stagingTestItems.length, 0);

    const closedChallenge = await challengeHandler(
      new Request("http://localhost:3000/api/gifts/aylla/challenge", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ contact: "+258840000001" }),
      })
    );
    assert.equal(closedChallenge.status, 403);
    assert.equal((await closedChallenge.json()).outcome, "registry_closed");

    const closedVerify = await verifyHandler(
      new Request("http://localhost:3000/api/gifts/aylla/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: "123456" }),
      })
    );
    assert.equal(closedVerify.status, 403);
    assert.equal((await closedVerify.json()).outcome, "registry_closed");

    const closedCancel = await cancelHandler(
      new Request("http://localhost:3000/api/gifts/aylla/cancel", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reservationId: "res-1" }),
      })
    );
    assert.equal(closedCancel.status, 403);
    assert.equal((await closedCancel.json()).outcome, "registry_closed");
  });

  it("refuses test activation in Vercel Production regardless of flags", async () => {
    process.env.HAXR_AYLLA_GIFT_STAGING_TEST_ACTIVATION = "true";
    process.env.HAXR_AYLLA_GIFT_SYNTHETIC_DELIVERY = "true";
    (process.env as Record<string, string | undefined>).VERCEL_ENV = "production";

    assert.equal(isAyllaEditionTestActivationEnabled(), false);
    assert.equal(isAyllaEditionRegistryOperational(), false);

    const catalogRes = await ayllaCatalogHandler(
      new Request("http://localhost:3000/api/gifts/aylla/catalog")
    );
    const catalogJson = await catalogRes.json();
    assert.equal(catalogJson.registryEnabled, false);
    assert.equal(catalogJson.stagingTestItems.length, 0);
  });

  it("binds challengeId inside HttpOnly cookie without JSON exposure and cleans stale cookies on 401", async () => {
    process.env.HAXR_AYLLA_GIFT_STAGING_TEST_ACTIVATION = "true";
    process.env.HAXR_AYLLA_GIFT_SYNTHETIC_DELIVERY = "true";

    globalThis.fetch = async (url, init) => {
      const path = new URL(url.toString()).pathname;
      const body = init?.body ? JSON.parse(String(init.body)) : {};

      if (path === "/api/v1/edition/gifts/aylla/challenge") {
        return new Response(
          JSON.stringify({
            success: true,
            outcome: "verification_pending",
            challengeId: "chal-uuid-hidden-1",
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        );
      }

      if (path === "/api/v1/edition/gifts/aylla/verify") {
        assert.equal(body.challengeId, "chal-uuid-hidden-1");
        assert.equal(body.code, "654321");
        return new Response(
          JSON.stringify({
            success: true,
            outcome: "verified",
            sessionToken: "sess-abc.secret-xyz",
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        );
      }

      if (path === "/api/v1/edition/gifts/aylla/reserve") {
        return new Response(
          JSON.stringify({ success: false, outcome: "session_expired" }),
          { status: 401, headers: { "content-type": "application/json" } }
        );
      }

      if (path === "/api/v1/edition/gifts/aylla/cancel") {
        return new Response(
          JSON.stringify({ success: false, outcome: "access_denied" }),
          { status: 403, headers: { "content-type": "application/json" } }
        );
      }

      return new Response("{}", { status: 404 });
    };

    // 1. Challenge hides challengeId in JSON & sets HttpOnly cookie
    const challengeRes = await challengeHandler(
      new Request("http://localhost:3000/api/gifts/aylla/challenge", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ contact: "+258840000001" }),
      })
    );
    assert.equal(challengeRes.status, 200);
    const challengeJson = await challengeRes.json();
    assert.equal(challengeJson.challengeId, undefined);
    const challengeCookie = challengeRes.headers.get("set-cookie") || "";
    assert.ok(challengeCookie.includes("haxr_aylla_challenge=chal-uuid-hidden-1"));
    assert.ok(challengeCookie.toLowerCase().includes("httponly"));

    // 2. Verify reads challengeId cleanly from cookie without browser needing to pass it
    const verifyRes = await verifyHandler(
      new Request("http://localhost:3000/api/gifts/aylla/verify", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: "haxr_aylla_challenge=chal-uuid-hidden-1",
        },
        body: JSON.stringify({ code: "654321" }),
      })
    );
    assert.equal(verifyRes.status, 200);
    const verifyJson = await verifyRes.json();
    assert.equal(verifyJson.sessionToken, undefined);
    const setCookies = verifyRes.headers.get("set-cookie") || "";
    assert.ok(setCookies.includes("haxr_aylla_guest_session=sess-abc.secret-xyz"));
    assert.ok(setCookies.includes("haxr_aylla_challenge=;"));

    // 3. Reserve 401 clears stale session cookie & humanizes error message
    const reserveRes = await reserveHandler(
      new Request("http://localhost:3000/api/gifts/aylla/reserve", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: "haxr_aylla_guest_session=sess-abc.secret-xyz",
        },
        body: JSON.stringify({
          itemId: "synthetic-staging-aylla-item-qty2",
          quantity: 1,
          idempotencyKey: "idem-1",
        }),
      })
    );
    assert.equal(reserveRes.status, 401);
    const reserveJson = await reserveRes.json();
    assert.match(reserveJson.error, /sessão de convidado expirou/i);
    assert.ok((reserveRes.headers.get("set-cookie") || "").includes("haxr_aylla_guest_session=;"));

    // 4. Cancel 403 returns humanized error
    const cancelRes = await cancelHandler(
      new Request("http://localhost:3000/api/gifts/aylla/cancel", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: "haxr_aylla_guest_session=sess-abc.secret-xyz",
        },
        body: JSON.stringify({ reservationId: "res-1" }),
      })
    );
    assert.equal(cancelRes.status, 403);
    const cancelJson = await cancelRes.json();
    assert.match(cancelJson.error, /validar o acesso/i);
  });

  it("enforces bounded proxy deadline (504 CORE_TIMEOUT), propagates x-request-id, and separates reserve confirmation from catalog sync", async () => {
    process.env.HAXR_AYLLA_GIFT_STAGING_TEST_ACTIVATION = "true";
    process.env.HAXR_AYLLA_GIFT_SYNTHETIC_DELIVERY = "true";

    // Even if underlying fetch stalls ignoring AbortSignal, deadline race must settle as 504 CORE_TIMEOUT
    globalThis.fetch = async () => new Promise<Response>(() => {});

    const startedAt = Date.now();
    const timeoutResult = await callCoreGiftApi({
      method: "POST",
      path: "/api/v1/edition/gifts/aylla/reserve",
      requestId: "req-timeout-test-1",
      timeoutMs: 80,
      body: { sessionToken: "sess", itemId: "item", quantity: 1, idempotencyKey: "k1" },
    });
    const elapsed = Date.now() - startedAt;
    assert.equal(timeoutResult.ok, false);
    assert.equal(timeoutResult.status, 504);
    assert.equal(timeoutResult.code, "CORE_TIMEOUT");
    assert.equal(timeoutResult.requestId, "req-timeout-test-1");
    assert.ok(elapsed < 1000, `Expected bounded 80ms timeout to return promptly, took ${elapsed}ms`);

    // Propagates incoming x-request-id on /reserve responses
    globalThis.fetch = async (_url, init) => {
      const headers = new Headers(init?.headers);
      assert.equal(headers.get("x-request-id"), "req-reserve-corr-2");
      return new Response(
        JSON.stringify({
          success: true,
          outcome: "reservation_confirmed",
          reservation: { id: "res-2", giftId: "synthetic-staging-aylla-item-qty2", quantity: 1, status: "reserved" },
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    };

    const reserveRes = await reserveHandler(
      new Request("http://localhost:3000/api/gifts/aylla/reserve", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-request-id": "req-reserve-corr-2",
          cookie: "haxr_aylla_guest_session=sess-abc.secret-xyz",
        },
        body: JSON.stringify({
          itemId: "synthetic-staging-aylla-item-qty2",
          quantity: 1,
          idempotencyKey: "idem-2",
        }),
      })
    );
    assert.equal(reserveRes.status, 200);
    assert.equal(reserveRes.headers.get("x-request-id"), "req-reserve-corr-2");

    // Visual confirmation in BabyAyllaGifts.tsx must not await fetchCatalog() before showing "confirmed"
    const componentSource = readFileSync(
      resolve(process.cwd(), "engines/true-theme/profiles/baby-aylla-couture/BabyAyllaGifts.tsx"),
      "utf8"
    );
    assert.match(componentSource, /kind:\s*"confirmed"[\s\S]{0,300}void fetchCatalog\(\)/);
    assert.doesNotMatch(componentSource, /await fetchCatalog\(\);\s*setStatusMessage\(`O mimo/);
  });

  it("parameterizes canonical Baby Aylla event UUID safely and blocks canary/synthetic leakage in production", async () => {
    assert.equal(resolveAyllaGiftEventId({}), CANONICAL_BABY_AYLLA_EVENT_ID);
    assert.equal(AYLLA_GIFTS_CONFIG.eventId, CANONICAL_BABY_AYLLA_EVENT_ID);
    assert.throws(
      () => resolveAyllaGiftEventId({ EDITION_EVENT_AYLLA_ID: "cc608a8d-3cb9-47f0-955d-8d1be3f30faf" }),
      /canary/i
    );
    assert.throws(
      () => resolveAyllaGiftEventId({ EDITION_EVENT_AYLLA_ID: "invalid-uuid" }),
      /valid UUID/i
    );

    process.env.VERCEL_ENV = "production";
    process.env.HAXR_AYLLA_GIFT_STAGING_TEST_ACTIVATION = "true";
    process.env.HAXR_AYLLA_GIFT_SYNTHETIC_DELIVERY = "true";

    const res = await ayllaCatalogHandler(
      new Request("https://edition.haxrsignature.com/api/gifts/aylla/catalog")
    );
    assert.equal(res.status, 200);
    const body = (await res.json()) as {
      registryEnabled: boolean;
      testActivation: boolean;
      stagingTestItems: unknown[];
      editorialItems: unknown[];
    };
    assert.equal(body.registryEnabled, false);
    assert.equal(body.testActivation, false);
    assert.deepEqual(body.stagingTestItems, []);
    assert.equal(body.editorialItems.length, 52);
  });

  it("exposes email-only OTP metadata cleanly, guides RSVP guests, and preserves QR pass & multichannel UI compatibility", async () => {
    process.env.HAXR_AYLLA_GIFT_STAGING_TEST_ACTIVATION = "true";
    process.env.HAXR_AYLLA_GIFT_SYNTHETIC_DELIVERY = "true";

    globalThis.fetch = async (url) => {
      const path = new URL(String(url)).pathname;
      if (path === "/api/v1/edition/gifts/aylla/catalog") {
        return new Response(
          JSON.stringify({
            success: true,
            registryEnabled: true,
            otpChannels: { email: true, phone: false },
            items: [],
            myReservations: [],
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        );
      }
      return new Response("{}", { status: 404 });
    };

    const res = await ayllaCatalogHandler(new Request("http://localhost:3000/api/gifts/aylla/catalog"));
    assert.equal(res.status, 200);
    const body = (await res.json()) as { otpChannels?: { email: boolean; phone: boolean } };
    assert.deepEqual(body.otpChannels, { email: true, phone: false });

    const giftsSource = readFileSync(
      resolve(process.cwd(), "engines/true-theme/profiles/baby-aylla-couture/BabyAyllaGifts.tsx"),
      "utf8"
    );
    assert.match(giftsSource, /isEmailOnlyOtp/);
    assert.match(giftsSource, /E-mail confirmado no RSVP/);
    assert.match(giftsSource, /isEmailOnlyOtp \? "email" : "text"/);

    const rsvpSource = readFileSync(
      resolve(process.cwd(), "engines/true-theme/profiles/baby-aylla-couture/BabyAyllaRsvp.tsx"),
      "utf8"
    );
    assert.match(rsvpSource, /!phone\.trim\(\)/);
    assert.match(rsvpSource, /!email\.trim\(\)/);
    assert.match(rsvpSource, /BabyAyllaDigitalPass/);
    assert.match(rsvpSource, /Lista de Presentes/);
  });

  it("supports isolated real-delivery staging gate outside Production without synthetic flags", () => {
    process.env.HAXR_AYLLA_GIFT_STAGING_TEST_ACTIVATION = "true";
    process.env.HAXR_AYLLA_GIFT_STAGING_REAL_DELIVERY = "true";

    assert.equal(isAyllaEditionTestActivationEnabled(), false);
    assert.equal(isAyllaEditionRealDeliveryStagingEnabled(), true);
    assert.equal(isAyllaEditionRegistryOperational(), true);

    process.env.VERCEL_ENV = "production";
    assert.equal(isAyllaEditionRealDeliveryStagingEnabled(), false);
    assert.equal(isAyllaEditionRegistryOperational(), false);
  });
});
