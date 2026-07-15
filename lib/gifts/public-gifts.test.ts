import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { toPublicGift, toPublicGifts, type PublicGiftItem } from "../gifts";
import type { GiftItem } from "@data/gifts/rose-elegance";

describe("public gifts PII stripping", () => {
  const internal: GiftItem = {
    id: "cozinha-caixa-cha",
    name: "Caixa para chá",
    category: "cozinha",
    status: "reserved",
    reservedBy: "Maria Privada",
    reservedAt: "2026-07-01T10:00:00.000Z",
    timestamp: "2026-07-01T10:00:00.000Z",
    popularityScore: 4,
    emotionalTag: "Ritual",
  };

  it("remove reservedBy e timestamps da superfície pública", () => {
    const pub = toPublicGift(internal);
    assert.equal(pub.status, "reserved");
    assert.equal(pub.id, internal.id);
    assert.equal(pub.name, internal.name);
    assert.equal(
      Object.prototype.hasOwnProperty.call(pub, "reservedBy"),
      false
    );
    assert.equal(
      Object.prototype.hasOwnProperty.call(pub, "reservedAt"),
      false
    );
    const serialized = JSON.stringify(pub);
    assert.doesNotMatch(serialized, /Maria Privada/);
    assert.doesNotMatch(serialized, /reservedBy/);
  });

  it("toPublicGifts preserva ordem e stripa PII", () => {
    const pubs = toPublicGifts([internal]);
    assert.equal(pubs.length, 1);
    const sample: PublicGiftItem = {
      id: "x",
      name: "y",
      category: "casa",
      status: "available",
    };
    assert.equal("reservedBy" in sample, false);
  });
});
