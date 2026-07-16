import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  RSVP_BACKEND_NOT_CONFIGURED,
  canUseLocalProxyFallback,
  decideRsvpBackend,
  isLocalRsvpExplicitlyAllowed,
  isVercelProduction,
  rsvpBackendNotConfiguredResponse,
} from "./rsvp-backend";

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

function clearBackendEnv(): void {
  setEnv("VERCEL_ENV", undefined);
  setEnv("HAXR_API_BACKEND", undefined);
  setEnv("HAXR_ALLOW_LOCAL_RSVP", undefined);
  setEnv("HAXR_PROXY_FALLBACK", undefined);
}

describe("decideRsvpBackend fail-closed", () => {
  snapshotEnv();
  afterEach(restoreEnv);

  it("Production sem backend → blocked 503 code", () => {
    clearBackendEnv();
    setEnv("VERCEL_ENV", "production");
    setEnv("NODE_ENV", "production");
    const decision = decideRsvpBackend();
    assert.equal(decision.mode, "blocked");
    if (decision.mode === "blocked") {
      assert.equal(decision.code, RSVP_BACKEND_NOT_CONFIGURED);
      assert.equal(decision.reason, "backend_absent");
    }
  });

  it("Production com backend inválido → blocked", () => {
    clearBackendEnv();
    setEnv("VERCEL_ENV", "production");
    setEnv("HAXR_API_BACKEND", "memory");
    const decision = decideRsvpBackend();
    assert.equal(decision.mode, "blocked");
    if (decision.mode === "blocked") {
      assert.equal(decision.code, RSVP_BACKEND_NOT_CONFIGURED);
      assert.equal(decision.reason, "invalid_backend");
    }
  });

  it("Production com HAXR_API_BACKEND=local + allow → local", () => {
    clearBackendEnv();
    setEnv("VERCEL_ENV", "production");
    setEnv("HAXR_API_BACKEND", "local");
    setEnv("HAXR_ALLOW_LOCAL_RSVP", "true");
    const decision = decideRsvpBackend();
    assert.equal(decision.mode, "local");
    assert.equal(isLocalRsvpExplicitlyAllowed(), true);
  });

  it("Production com HAXR_API_BACKEND=local sem allow → blocked", () => {
    clearBackendEnv();
    setEnv("VERCEL_ENV", "production");
    setEnv("HAXR_API_BACKEND", "local");
    setEnv("HAXR_ALLOW_LOCAL_RSVP", undefined);
    const decision = decideRsvpBackend();
    assert.equal(decision.mode, "blocked");
    assert.equal(isLocalRsvpExplicitlyAllowed(), false);
  });

  it("Production com fallback=true ainda bloqueia local", () => {
    clearBackendEnv();
    setEnv("VERCEL_ENV", "production");
    setEnv("HAXR_API_BACKEND", "proxy");
    setEnv("HAXR_PROXY_FALLBACK", "true");
    setEnv("HAXR_ALLOW_LOCAL_RSVP", "true");
    assert.equal(decideRsvpBackend().mode, "proxy");
    assert.equal(canUseLocalProxyFallback(), false);
    assert.equal(isVercelProduction(), true);
  });

  it("Production proxy mode está permitido na decisão", () => {
    clearBackendEnv();
    setEnv("VERCEL_ENV", "production");
    setEnv("HAXR_API_BACKEND", "proxy");
    assert.equal(decideRsvpBackend().mode, "proxy");
  });

  it("Preview com local explícito + allow → local", () => {
    clearBackendEnv();
    setEnv("VERCEL_ENV", "preview");
    setEnv("NODE_ENV", "production");
    setEnv("HAXR_API_BACKEND", "local");
    setEnv("HAXR_ALLOW_LOCAL_RSVP", "true");
    assert.equal(decideRsvpBackend().mode, "local");
    assert.equal(canUseLocalProxyFallback(), false);
    setEnv("HAXR_PROXY_FALLBACK", "true");
    assert.equal(canUseLocalProxyFallback(), true);
  });

  it("Preview sem backend → blocked (sem default local)", () => {
    clearBackendEnv();
    setEnv("VERCEL_ENV", "preview");
    setEnv("NODE_ENV", "production");
    const decision = decideRsvpBackend();
    assert.equal(decision.mode, "blocked");
  });

  it("Development local explícito → local", () => {
    clearBackendEnv();
    setEnv("VERCEL_ENV", "development");
    setEnv("NODE_ENV", "development");
    setEnv("HAXR_API_BACKEND", "local");
    assert.equal(decideRsvpBackend().mode, "local");
  });

  it("next dev sem VERCEL_ENV com local → local", () => {
    clearBackendEnv();
    setEnv("NODE_ENV", "development");
    setEnv("HAXR_API_BACKEND", "local");
    assert.equal(decideRsvpBackend().mode, "local");
  });

  it("resposta 503 sem secrets/PII", async () => {
    const res = rsvpBackendNotConfiguredResponse("test-request-id");
    assert.equal(res.status, 503);
    const body = (await res.json()) as Record<string, unknown>;
    assert.equal(body.success, false);
    assert.equal(body.code, RSVP_BACKEND_NOT_CONFIGURED);
    assert.equal(typeof body.error, "string");
    const serialized = JSON.stringify(body);
    assert.equal(serialized.includes("Bearer"), false);
    assert.equal(serialized.includes("SUPABASE"), false);
    assert.equal(serialized.includes("RESEND"), false);
    assert.equal(serialized.includes("@"), false);
  });
});
