import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { RSVP_BACKEND_NOT_CONFIGURED } from "./rsvp-backend";
import { POST } from "../../app/api/rsvp/route";

const ENV_KEYS = [
  "VERCEL_ENV",
  "NODE_ENV",
  "HAXR_API_BACKEND",
  "HAXR_ALLOW_LOCAL_RSVP",
  "HAXR_PROXY_FALLBACK",
  "RESEND_API_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
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

function makeRequest(): Request {
  return new Request("https://edition.haxrsignature.com/api/rsvp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Side Effect Probe",
      attending: false,
      guests: 0,
      slug: "jessicaesamueltraditionalwedding",
      email: "probe@example.invalid",
    }),
  });
}

describe("POST /api/rsvp production guard", () => {
  snapshotEnv();
  afterEach(restoreEnv);

  it("Production sem backend → 503 sem side effects", async () => {
    setEnv("HAXR_API_BACKEND", undefined);
    setEnv("VERCEL_ENV", "production");
    setEnv("NODE_ENV", "production");
    setEnv("RESEND_API_KEY", "re_test_should_not_be_used");
    setEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    setEnv("SUPABASE_SERVICE_ROLE_KEY", "service_role_should_not_be_used");

    const response = await POST(makeRequest());
    assert.equal(response.status, 503);
    const body = (await response.json()) as Record<string, unknown>;
    assert.equal(body.code, RSVP_BACKEND_NOT_CONFIGURED);
    assert.equal(body.success, false);

    const serialized = JSON.stringify(body);
    assert.equal(serialized.includes("re_test"), false);
    assert.equal(serialized.includes("service_role"), false);
    assert.equal(serialized.includes("probe@"), false);
  });

  it("Production com fallback=true e backend ausente → ainda 503", async () => {
    setEnv("HAXR_API_BACKEND", undefined);
    setEnv("VERCEL_ENV", "production");
    setEnv("HAXR_PROXY_FALLBACK", "true");
    setEnv("HAXR_ALLOW_LOCAL_RSVP", "true");

    const response = await POST(makeRequest());
    assert.equal(response.status, 503);
    const body = (await response.json()) as Record<string, unknown>;
    assert.equal(body.code, RSVP_BACKEND_NOT_CONFIGURED);
  });
});
