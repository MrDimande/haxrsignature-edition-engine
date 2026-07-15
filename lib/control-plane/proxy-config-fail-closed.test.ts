import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
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
});
