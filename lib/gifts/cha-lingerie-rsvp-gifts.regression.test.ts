import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
  buildEditionGiftStorageKey,
  buildEditionRsvpStorageKey,
  buildLegacyRsvpStorageKey,
  LEGACY_GLOBAL_GIFT_STORAGE_KEY,
} from "../rsvp/storage-keys";
import { isFarewellRsvpDeadlinePassed } from "../farewell/event-details";
import { validateGiftReservationPayload } from "../../core/contracts/gifts.contract";
import { validateLocalRsvpPayload } from "../rsvp/validate-local";
import { resolveRsvpClientOutcome } from "../rsvp/client-outcome";

describe("cha lingerie — mobile form accessibility guard", () => {
  it("does not apply select-none on the rose experience root (iOS Safari input bug)", () => {
    const source = readFileSync(
      join(
        process.cwd(),
        "engines/true-theme/profiles/rose-elegance/RoseEleganceExperience.tsx"
      ),
      "utf8"
    );
    assert.doesNotMatch(
      source,
      /className="[^"]*\bselect-none\b/,
      "select-none on the experience root blocks iOS Safari text inputs"
    );
    assert.match(
      source,
      /\[&_input\]:select-text/,
      "form controls must explicitly allow text selection"
    );
  });
});

describe("cha lingerie — RSVP regression", () => {
  it("keeps RSVP open before the farewell deadline", () => {
    assert.equal(
      isFarewellRsvpDeadlinePassed(
        new Date("2026-07-18T12:00:00+02:00"),
        "2026-07-20"
      ),
      false
    );
  });

  it("accepts presence Sim with +258 phone", () => {
    const result = validateLocalRsvpPayload({
      name: "Convidada Teste",
      phone: "+258841234567",
      attending: true,
      guests: 1,
      slug: "jessicachadelingerie",
      honeypot: "",
    });
    assert.equal(result.ok, true);
  });

  it("accepts presence Não with phone", () => {
    const result = validateLocalRsvpPayload({
      name: "Convidada Teste",
      phone: "841234567",
      attending: false,
      guests: 0,
      slug: "jessicachadelingerie",
      honeypot: "",
    });
    assert.equal(result.ok, true);
  });

  it("treats autofilled honeypot as client error, not success", () => {
    const result = validateLocalRsvpPayload({
      name: "Bot",
      phone: "+258841234567",
      attending: true,
      guests: 1,
      slug: "jessicachadelingerie",
      honeypot: "filled-by-autofill",
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      const outcome = resolveRsvpClientOutcome(true, result.body);
      assert.equal(outcome.kind, "error");
    }
  });

  it("scopes RSVP localStorage per slug", () => {
    assert.equal(
      buildEditionRsvpStorageKey("jessicachadelingerie"),
      "haxr:edition:jessicachadelingerie:rsvp:v1"
    );
    assert.equal(
      buildLegacyRsvpStorageKey("jessicachadelingerie"),
      "haxr_rsvp_jessicachadelingerie"
    );
  });
});

describe("cha lingerie — gift selection regression", () => {
  it("accepts GiftRegistry legacy payload giftId/reservedBy", () => {
    const result = validateGiftReservationPayload(
      {
        giftId: "cozinha-jogo-facas",
        reservedBy: "Convidada Teste",
      },
      { requiresPhone: false }
    );
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.sanitized.itemId, "cozinha-jogo-facas");
      assert.equal(result.sanitized.guestName, "Convidada Teste");
    }
  });

  it("scopes gift reservation lock per slug and keeps legacy global key named", () => {
    assert.equal(
      buildEditionGiftStorageKey("jessicachadelingerie"),
      "haxr:edition:jessicachadelingerie:gifts:v1"
    );
    assert.notEqual(
      buildEditionGiftStorageKey("jessicachadelingerie"),
      buildEditionGiftStorageKey("jessicasamuelwedding")
    );
    assert.equal(LEGACY_GLOBAL_GIFT_STORAGE_KEY, "haxr_reserved_gift_id");
  });

  it("GiftRegistry persists selection with slug-scoped key", () => {
    const source = readFileSync(
      join(
        process.cwd(),
        "engines/true-theme/profiles/rose-elegance/GiftRegistry.tsx"
      ),
      "utf8"
    );
    assert.match(source, /buildEditionGiftStorageKey/);
    assert.doesNotMatch(
      source,
      /localStorage\.(get|set)Item\(\s*["']haxr_reserved_gift_id["']/
    );
  });

  it("rejects empty gift catalog selection payload", () => {
    const result = validateGiftReservationPayload(
      { reservedBy: "Convidada" },
      { requiresPhone: false }
    );
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 400);
    }
  });

  it("gifts context exists only for jessicachadelingerie, not cha-de-lingerie stub", async () => {
    const { resolveInvitationContext } = await import("../context-resolver");
    assert.equal(
      resolveInvitationContext("jessicachadelingerie")?.giftsRegistryKey,
      "rose-elegance"
    );
    assert.equal(resolveInvitationContext("cha-de-lingerie"), null);
  });
});
