import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildEditionGiftStorageKey,
  buildEditionRsvpStorageKey,
  buildLegacyRsvpStorageKey,
  LEGACY_GLOBAL_GIFT_STORAGE_KEY,
} from "./storage-keys";

describe("edition storage keys", () => {
  it("builds distinct per-slug RSVP and gift keys", () => {
    assert.match(
      buildEditionRsvpStorageKey("jessicachadelingerie"),
      /jessicachadelingerie:rsvp:v1$/
    );
    assert.match(
      buildEditionGiftStorageKey("jessicachadelingerie"),
      /jessicachadelingerie:gifts:v1$/
    );
    assert.notEqual(
      buildEditionRsvpStorageKey("jessicachadelingerie"),
      buildEditionGiftStorageKey("jessicachadelingerie")
    );
  });

  it("keeps legacy RSVP compatibility key", () => {
    assert.equal(
      buildLegacyRsvpStorageKey("jessicachadelingerie"),
      "haxr_rsvp_jessicachadelingerie"
    );
  });

  it("documents the unsafe legacy global gift key", () => {
    assert.equal(LEGACY_GLOBAL_GIFT_STORAGE_KEY, "haxr_reserved_gift_id");
  });
});
