import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { toPublicGift, toPublicGifts, type PublicGiftItem } from "../gifts";
import type { GiftItem } from "@data/gifts/rose-elegance";
import {
  getEditionProxySecret,
  isProxyRsvpBackend,
  validateProxyConfig,
} from "@lib/control-plane/config";

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
    assert.equal(
      Object.prototype.hasOwnProperty.call(pub, "timestamp"),
      false
    );
    const serialized = JSON.stringify(toPublicGifts([internal]));
    assert.doesNotMatch(serialized, /Maria Privada/);
    assert.doesNotMatch(serialized, /reservedBy/);
  });

  it("PublicGiftItem não declara campos de PII", () => {
    const sample: PublicGiftItem = {
      id: "x",
      name: "Y",
      category: "casa",
      status: "available",
    };
    assert.equal("reservedBy" in sample, false);
  });
});

describe("edition proxy config fail-closed", () => {
  it("validateProxyConfig falha sem secret", () => {
    const previousBackend = process.env.HAXR_API_BACKEND;
    const previousSecret = process.env.HAXR_EDITION_PROXY_SECRET;
    const previousCore = process.env.HAXR_CORE_API_BASE_URL;

    try {
      process.env.HAXR_API_BACKEND = "proxy";
      delete process.env.HAXR_EDITION_PROXY_SECRET;
      delete process.env.HAXR_CORE_API_BASE_URL;

      assert.equal(isProxyRsvpBackend(), true);
      assert.equal(getEditionProxySecret(), undefined);
      const result = validateProxyConfig();
      assert.equal(result.ok, false);
      if (!result.ok) {
        assert.ok(result.missing.includes("HAXR_EDITION_PROXY_SECRET"));
        assert.ok(result.missing.includes("HAXR_CORE_API_BASE_URL"));
      }
    } finally {
      if (previousBackend === undefined) delete process.env.HAXR_API_BACKEND;
      else process.env.HAXR_API_BACKEND = previousBackend;
      if (previousSecret === undefined) delete process.env.HAXR_EDITION_PROXY_SECRET;
      else process.env.HAXR_EDITION_PROXY_SECRET = previousSecret;
      if (previousCore === undefined) delete process.env.HAXR_CORE_API_BASE_URL;
      else process.env.HAXR_CORE_API_BASE_URL = previousCore;
    }
  });

  it("validateProxyConfig passa com secret e base URL", () => {
    const previousBackend = process.env.HAXR_API_BACKEND;
    const previousSecret = process.env.HAXR_EDITION_PROXY_SECRET;
    const previousCore = process.env.HAXR_CORE_API_BASE_URL;

    try {
      process.env.HAXR_API_BACKEND = "proxy";
      process.env.HAXR_EDITION_PROXY_SECRET = "test-secret-not-real";
      process.env.HAXR_CORE_API_BASE_URL = "https://www.haxrsignature.com";
      const result = validateProxyConfig();
      assert.equal(result.ok, true);
      assert.equal(getEditionProxySecret(), "test-secret-not-real");
    } finally {
      if (previousBackend === undefined) delete process.env.HAXR_API_BACKEND;
      else process.env.HAXR_API_BACKEND = previousBackend;
      if (previousSecret === undefined) delete process.env.HAXR_EDITION_PROXY_SECRET;
      else process.env.HAXR_EDITION_PROXY_SECRET = previousSecret;
      if (previousCore === undefined) delete process.env.HAXR_CORE_API_BASE_URL;
      else process.env.HAXR_CORE_API_BASE_URL = previousCore;
    }
  });
});
