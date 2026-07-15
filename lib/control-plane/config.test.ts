import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  isProxyFallbackEnabled,
  isProxyRsvpBackend,
  resolveApiBackend,
} from "./config";

const ENV_KEYS = [
  "VERCEL_ENV",
  "NODE_ENV",
  "HAXR_API_BACKEND",
  "HAXR_ALLOW_LOCAL_RSVP",
  "HAXR_PROXY_FALLBACK",
] as const;

type EnvBag = Record<string, string | undefined>;

function envBag(): EnvBag {
  return process.env as unknown as EnvBag;
}

function setEnv(key: (typeof ENV_KEYS)[number], value: string | undefined): void {
  const env = envBag();
  if (value === undefined) delete env[key];
  else env[key] = value;
}

const saved: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>> =
  {};

function snapshotEnv(): void {
  for (const key of ENV_KEYS) {
    saved[key] = process.env[key];
  }
}

function restoreEnv(): void {
  for (const key of ENV_KEYS) {
    setEnv(key, saved[key]);
  }
}

describe("resolveApiBackend", () => {
  snapshotEnv();
  afterEach(restoreEnv);

  it("ausente → unconfigured (fail-closed, sem default local)", () => {
    setEnv("HAXR_API_BACKEND", undefined);
    setEnv("VERCEL_ENV", undefined);
    setEnv("NODE_ENV", "test");
    assert.equal(resolveApiBackend(), "unconfigured");
  });

  it("aceita proxy", () => {
    setEnv("HAXR_API_BACKEND", "proxy");
    assert.equal(resolveApiBackend(), "proxy");
  });

  it("valores inválidos → unconfigured", () => {
    setEnv("VERCEL_ENV", "production");
    setEnv("HAXR_API_BACKEND", "invalid");
    assert.equal(resolveApiBackend(), "unconfigured");
  });

  it("local explícito em test → local", () => {
    setEnv("VERCEL_ENV", undefined);
    setEnv("NODE_ENV", "test");
    setEnv("HAXR_API_BACKEND", "local");
    assert.equal(resolveApiBackend(), "local");
  });
});

describe("isProxyFallbackEnabled", () => {
  snapshotEnv();
  afterEach(restoreEnv);

  it("default é false", () => {
    setEnv("HAXR_PROXY_FALLBACK", undefined);
    setEnv("VERCEL_ENV", undefined);
    setEnv("NODE_ENV", "test");
    setEnv("HAXR_API_BACKEND", "local");
    assert.equal(isProxyFallbackEnabled(), false);
  });

  it("Production ignora HAXR_PROXY_FALLBACK=true", () => {
    setEnv("VERCEL_ENV", "production");
    setEnv("HAXR_API_BACKEND", "local");
    setEnv("HAXR_ALLOW_LOCAL_RSVP", "true");
    setEnv("HAXR_PROXY_FALLBACK", "true");
    assert.equal(isProxyFallbackEnabled(), false);
  });
});

describe("isProxyRsvpBackend", () => {
  snapshotEnv();
  afterEach(restoreEnv);

  it("reflects proxy mode", () => {
    setEnv("HAXR_API_BACKEND", "proxy");
    assert.equal(isProxyRsvpBackend(), true);
  });
});
