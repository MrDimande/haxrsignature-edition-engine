import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { POST as reserveGiftPost } from "../../app/api/gifts/reserve/route";
import { GET as getGifts } from "../../app/api/gifts/route";
import {
  AYLLA_GIFTS_CONFIG,
  canBabyAyllaGiftRegistryReserve,
} from "../aylla/gifts/config";
import {
  AYLLA_GIFT_CATEGORIES,
  AYLLA_GIFT_CATALOG,
  getBabyAyllaPublicGiftCatalog,
} from "../../data/gifts/baby-aylla";
import { evaluateBabyAyllaGiftEligibility } from "../aylla/gifts/eligibility";
import { resolveBabyAyllaGiftPresentation } from "../aylla/gifts/presentation";

describe("Baby Aylla Gift Registry — Phase A safety contract", () => {
  it("keeps the registry disabled and structurally scoped to the canonical event", () => {
    assert.equal(AYLLA_GIFTS_CONFIG.slug, "babyaylla");
    assert.equal(AYLLA_GIFTS_CONFIG.registryKey, "baby-aylla-couture");
    assert.equal(AYLLA_GIFTS_CONFIG.enabled, false);
    assert.equal(AYLLA_GIFTS_CONFIG.allowDraftReservations, false);
    assert.equal(canBabyAyllaGiftRegistryReserve({ invitationStatus: "draft" }), false);
    assert.equal(canBabyAyllaGiftRegistryReserve({ invitationStatus: "active" }), false);
  });

  it("publishes only the seven approved structural categories while the family catalog is pending", () => {
    assert.equal(AYLLA_GIFT_CATEGORIES.length, 7);
    assert.equal(AYLLA_GIFT_CATEGORIES[0].id, "cantinho-dos-sonhos");
    assert.equal(AYLLA_GIFT_CATALOG.length, 0);
    assert.deepEqual(getBabyAyllaPublicGiftCatalog(), []);
  });

  it("requires a verified session bound to a confirmed RSVP from this event", () => {
    const eligible = evaluateBabyAyllaGiftEligibility({
      session: { verified: true, guestId: "guest-aylla", eventId: AYLLA_GIFTS_CONFIG.eventId },
      guest: {
        id: "guest-aylla",
        eventId: AYLLA_GIFTS_CONFIG.eventId,
        status: "confirmed",
        source: "edition_rsvp",
        archived: false,
        deleted: false,
        incorrect: false,
      },
    });
    assert.deepEqual(eligible, { allowed: true, guestId: "guest-aylla" });

    assert.equal(
      evaluateBabyAyllaGiftEligibility({
        session: { verified: true, guestId: "guest-other", eventId: AYLLA_GIFTS_CONFIG.eventId },
        guest: {
          id: "guest-other",
          eventId: "another-event",
          status: "confirmed",
          source: "edition_rsvp",
          archived: false,
          deleted: false,
          incorrect: false,
        },
      }).allowed,
      false
    );

    for (const input of [
      {
        session: { verified: false, guestId: "guest-aylla", eventId: AYLLA_GIFTS_CONFIG.eventId },
        guest: {
          id: "guest-aylla", eventId: AYLLA_GIFTS_CONFIG.eventId, status: "confirmed", source: "edition_rsvp",
          archived: false, deleted: false, incorrect: false,
        },
      },
      {
        session: { verified: true, guestId: "guest-someone-else", eventId: AYLLA_GIFTS_CONFIG.eventId },
        guest: {
          id: "guest-aylla", eventId: AYLLA_GIFTS_CONFIG.eventId, status: "confirmed", source: "edition_rsvp",
          archived: false, deleted: false, incorrect: false,
        },
      },
      {
        session: { verified: true, guestId: "guest-aylla", eventId: AYLLA_GIFTS_CONFIG.eventId },
        guest: {
          id: "guest-aylla", eventId: AYLLA_GIFTS_CONFIG.eventId, status: "declined", source: "edition_rsvp",
          archived: false, deleted: false, incorrect: false,
        },
      },
      {
        session: { verified: true, guestId: "guest-aylla", eventId: AYLLA_GIFTS_CONFIG.eventId },
        guest: {
          id: "guest-aylla", eventId: AYLLA_GIFTS_CONFIG.eventId, status: "confirmed", source: "import",
          archived: false, deleted: false, incorrect: false,
        },
      },
    ]) {
      assert.deepEqual(evaluateBabyAyllaGiftEligibility(input), { allowed: false, reason: "access_denied" });
    }
  });

  it("rejects reservations for the draft disabled registry before a public name can be used", async () => {
    const response = await reserveGiftPost(
      new Request("https://example.test/api/gifts/reserve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          slug: "babyaylla",
          itemId: "aylla-pijamas",
          guestName: "Não deve ser usado",
        }),
      })
    );

    assert.equal(response.status, 403);
    assert.deepEqual(await response.json(), {
      success: false,
      code: "GIFT_REGISTRY_CLOSED",
      error: "A lista de presentes da Aylla ainda não está disponível.",
    });
  });

  it("serves an isolated no-store structural catalog and never falls back to rose-elegance", async () => {
    const response = await getGifts(new Request("https://example.test/api/gifts?slug=babyaylla"));

    assert.equal(response.status, 200);
    assert.match(response.headers.get("cache-control") ?? "", /no-store/);
    assert.deepEqual(await response.json(), {
      success: true,
      registry: { key: "baby-aylla-couture", enabled: false, reservationsEnabled: false },
      categories: AYLLA_GIFT_CATEGORIES,
      gifts: [],
    });
  });

  it("shows an inspiration-only editorial state while catalog activation is pending", () => {
    assert.deepEqual(resolveBabyAyllaGiftPresentation({ invitationStatus: "draft" }), {
      mode: "inspiration",
      canReserve: false,
      message: "A reserva fica disponível depois da confirmação de presença e validação do contacto.",
    });
  });
});
