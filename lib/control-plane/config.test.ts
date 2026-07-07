import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isProxyFallbackEnabled,
  isProxyRsvpBackend,
  resolveApiBackend,
} from "./config";

describe("resolveApiBackend", () => {
  it("default seguro é local", () => {
    const prev = process.env.HAXR_API_BACKEND;
    delete process.env.HAXR_API_BACKEND;
    assert.equal(resolveApiBackend(), "local");
    if (prev) process.env.HAXR_API_BACKEND = prev;
  });

  it("aceita proxy", () => {
    const prev = process.env.HAXR_API_BACKEND;
    process.env.HAXR_API_BACKEND = "proxy";
    assert.equal(resolveApiBackend(), "proxy");
    if (prev) process.env.HAXR_API_BACKEND = prev;
    else delete process.env.HAXR_API_BACKEND;
  });

  it("valores inválidos caem para local", () => {
    const prev = process.env.HAXR_API_BACKEND;
    process.env.HAXR_API_BACKEND = "invalid";
    assert.equal(resolveApiBackend(), "local");
    if (prev) process.env.HAXR_API_BACKEND = prev;
    else delete process.env.HAXR_API_BACKEND;
  });
});

describe("isProxyFallbackEnabled", () => {
  it("default é false", () => {
    const prev = process.env.HAXR_PROXY_FALLBACK;
    delete process.env.HAXR_PROXY_FALLBACK;
    assert.equal(isProxyFallbackEnabled(), false);
    if (prev) process.env.HAXR_PROXY_FALLBACK = prev;
  });
});

describe("isProxyRsvpBackend", () => {
  it("reflects proxy mode", () => {
    const prev = process.env.HAXR_API_BACKEND;
    process.env.HAXR_API_BACKEND = "proxy";
    assert.equal(isProxyRsvpBackend(), true);
    if (prev) process.env.HAXR_API_BACKEND = prev;
    else delete process.env.HAXR_API_BACKEND;
  });
});
