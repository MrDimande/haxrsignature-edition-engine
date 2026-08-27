import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { getDatabaseBackend } from "@lib/database/backend";

const ENV_KEYS = [
  "HAXR_DATABASE_BACKEND",
  "VERCEL_ENV",
  "VERCEL_GIT_COMMIT_REF",
] as const;

const saved = new Map<string, string | undefined>();
for (const key of ENV_KEYS) saved.set(key, process.env[key]);

function restoreEnv(): void {
  for (const key of ENV_KEYS) {
    const value = saved.get(key);
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

describe("database backend selector", () => {
  afterEach(restoreEnv);

  it("defaults to Supabase outside the dedicated migration Preview", () => {
    delete process.env.HAXR_DATABASE_BACKEND;
    process.env.VERCEL_ENV = "production";
    process.env.VERCEL_GIT_COMMIT_REF = "main";
    assert.equal(getDatabaseBackend(), "supabase");
  });

  it("auto-selects Neon only on the dedicated migration Preview", () => {
    delete process.env.HAXR_DATABASE_BACKEND;
    process.env.VERCEL_ENV = "preview";
    process.env.VERCEL_GIT_COMMIT_REF = "migration/supabase-to-neon";
    assert.equal(getDatabaseBackend(), "neon");
  });

  it("does not auto-select Neon on another Preview branch", () => {
    delete process.env.HAXR_DATABASE_BACKEND;
    process.env.VERCEL_ENV = "preview";
    process.env.VERCEL_GIT_COMMIT_REF = "feature/other-preview";
    assert.equal(getDatabaseBackend(), "supabase");
  });

  it("explicit Supabase override wins even on the migration Preview", () => {
    process.env.HAXR_DATABASE_BACKEND = "supabase";
    process.env.VERCEL_ENV = "preview";
    process.env.VERCEL_GIT_COMMIT_REF = "migration/supabase-to-neon";
    assert.equal(getDatabaseBackend(), "supabase");
  });

  it("explicit Neon override requires the exact supported value", () => {
    process.env.HAXR_DATABASE_BACKEND = "neon";
    process.env.VERCEL_ENV = "production";
    process.env.VERCEL_GIT_COMMIT_REF = "main";
    assert.equal(getDatabaseBackend(), "neon");

    process.env.HAXR_DATABASE_BACKEND = "unexpected";
    assert.equal(getDatabaseBackend(), "supabase");
  });
});
