import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildEditionGiftStorageKey,
  buildEditionRsvpStorageKey,
  buildLegacyRsvpStorageKey,
} from "./storage-keys";

describe("edition client storage keys", () => {
  it("isola RSVP por slug com chave versionada", () => {
    assert.equal(
      buildEditionRsvpStorageKey("jessicachadelingerie"),
      "haxr:edition:jessicachadelingerie:rsvp:v1"
    );
    assert.notEqual(
      buildEditionRsvpStorageKey("jessicachadelingerie"),
      buildEditionRsvpStorageKey("jessicakulaya")
    );
  });

  it("isola presentes por slug com chave versionada", () => {
    assert.equal(
      buildEditionGiftStorageKey("jessicachadelingerie"),
      "haxr:edition:jessicachadelingerie:gifts:v1"
    );
    assert.notEqual(
      buildEditionGiftStorageKey("jessicachadelingerie"),
      buildEditionGiftStorageKey("jessicasamuelwedding")
    );
  });

  it("mantém acesso explícito apenas à chave legada de RSVP do mesmo slug", () => {
    assert.equal(
      buildLegacyRsvpStorageKey("jessicachadelingerie"),
      "haxr_rsvp_jessicachadelingerie"
    );
  });
});
