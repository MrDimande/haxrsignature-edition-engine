import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getAyllaGiftProxySecret,
  getEditionProxySecret,
  isProxyRsvpBackend,
  validateProxyConfig,
} from "./config";

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

  it("getAyllaGiftProxySecret lê exclusivamente HAXR_AYLLA_GIFT_PROXY_SECRET sem afetar getEditionProxySecret", () => {
    const previousAylla = process.env.HAXR_AYLLA_GIFT_PROXY_SECRET;
    const previousGlobal = process.env.HAXR_EDITION_PROXY_SECRET;
    const previousCore = process.env.HAXR_CORE_API_BASE_URL;
    const previousVercelEnv = process.env.VERCEL_ENV;

    try {
      process.env.VERCEL_ENV = "production";
      process.env.HAXR_EDITION_PROXY_SECRET = "global-rsvp-only-secret";
      process.env.HAXR_CORE_API_BASE_URL = "https://www.haxrsignature.com";
      delete process.env.HAXR_AYLLA_GIFT_PROXY_SECRET;

      // Global secret alone does not configure Baby Aylla Gift proxy secret
      assert.equal(getAyllaGiftProxySecret(), undefined);
      assert.equal(getEditionProxySecret(), "global-rsvp-only-secret");
      assert.equal(validateProxyConfig().ok, true);

      // Dedicated secret does not leak into global getEditionProxySecret
      delete process.env.HAXR_EDITION_PROXY_SECRET;
      process.env.HAXR_AYLLA_GIFT_PROXY_SECRET = "  aylla-dedicated-secret  ";
      assert.equal(getAyllaGiftProxySecret(), "aylla-dedicated-secret");
      assert.equal(getEditionProxySecret(), undefined);
      const globalConfig = validateProxyConfig();
      assert.equal(globalConfig.ok, false);
      if (!globalConfig.ok) {
        assert.ok(globalConfig.missing.includes("HAXR_EDITION_PROXY_SECRET"));
      }
    } finally {
      if (previousAylla === undefined) delete process.env.HAXR_AYLLA_GIFT_PROXY_SECRET;
      else process.env.HAXR_AYLLA_GIFT_PROXY_SECRET = previousAylla;
      if (previousGlobal === undefined) delete process.env.HAXR_EDITION_PROXY_SECRET;
      else process.env.HAXR_EDITION_PROXY_SECRET = previousGlobal;
      if (previousCore === undefined) delete process.env.HAXR_CORE_API_BASE_URL;
      else process.env.HAXR_CORE_API_BASE_URL = previousCore;
      if (previousVercelEnv === undefined) delete process.env.VERCEL_ENV;
      else process.env.VERCEL_ENV = previousVercelEnv;
    }
  });
});
