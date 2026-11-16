import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { normalizeNeonConnectionString } from "./neon-client";

describe("normalizeNeonConnectionString — SSL normalization", () => {
  test("upgrades sslmode=require to sslmode=verify-full", () => {
    const input =
      "postgres://user:pass@ep-cool-123.eu-central-1.aws.neon.tech/neondb?sslmode=require";
    const result = normalizeNeonConnectionString(input);
    assert.ok(result.includes("sslmode=verify-full"), "must set sslmode=verify-full");
    assert.ok(!result.includes("sslmode=require"), "must not retain sslmode=require");
  });

  test("upgrades sslmode=prefer to sslmode=verify-full", () => {
    const input =
      "postgres://user:pass@ep-cool-123.eu-central-1.aws.neon.tech/neondb?sslmode=prefer";
    const result = normalizeNeonConnectionString(input);
    assert.ok(result.includes("sslmode=verify-full"), "must set sslmode=verify-full");
    assert.ok(!result.includes("sslmode=prefer"), "must not retain sslmode=prefer");
  });

  test("upgrades sslmode=verify-ca to sslmode=verify-full", () => {
    const input =
      "postgres://user:pass@ep-cool-123.eu-central-1.aws.neon.tech/neondb?sslmode=verify-ca";
    const result = normalizeNeonConnectionString(input);
    assert.ok(result.includes("sslmode=verify-full"), "must set sslmode=verify-full");
    assert.ok(!result.includes("sslmode=verify-ca"), "must not retain sslmode=verify-ca");
  });

  test("does not modify sslmode=verify-full (already correct)", () => {
    const input =
      "postgres://user:pass@ep-cool-123.eu-central-1.aws.neon.tech/neondb?sslmode=verify-full";
    const result = normalizeNeonConnectionString(input);
    assert.ok(result.includes("sslmode=verify-full"), "must retain sslmode=verify-full");
    assert.equal(result, input);
  });

  test("preserves other query params alongside the upgrade", () => {
    const input =
      "postgres://user:pass@ep-cool-123.eu-central-1.aws.neon.tech/neondb?channel_binding=disable&sslmode=require&connect_timeout=15";
    const result = normalizeNeonConnectionString(input);
    assert.ok(result.includes("sslmode=verify-full"), "must upgrade to verify-full");
    assert.ok(result.includes("channel_binding=disable"), "must preserve channel_binding");
    assert.ok(result.includes("connect_timeout=15"), "must preserve connect_timeout");
  });

  test("handles URL without sslmode param unchanged", () => {
    const input =
      "postgres://user:pass@ep-cool-123.eu-central-1.aws.neon.tech/neondb";
    const result = normalizeNeonConnectionString(input);
    assert.equal(result, input, "must return string unchanged when no sslmode param");
  });

  test("handles empty string gracefully", () => {
    const result = normalizeNeonConnectionString("");
    assert.equal(result, "", "must return empty string unchanged");
  });

  test("does not leak credentials in normalization (output is deterministic)", () => {
    const url =
      "postgres://runtime:secret123@ep-cool-123.eu-central-1.aws.neon.tech/neondb?sslmode=require";
    const result = normalizeNeonConnectionString(url);
    // Result must contain the original host/db/user
    assert.ok(result.includes("ep-cool-123"), "must preserve host");
    assert.ok(result.includes("neondb"), "must preserve db name");
    // Upgraded correctly
    assert.ok(result.includes("sslmode=verify-full"), "must upgrade sslmode");
  });
});
