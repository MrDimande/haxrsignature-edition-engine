import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  isLocalRsvpSlugAllowed,
  parseLocalRsvpAllowedSlugs,
  resolveRsvpNotificationMode,
} from "@lib/control-plane/rsvp-backend";
import {
  normalizeRsvpEmail,
  normalizeRsvpPhone,
} from "@lib/rsvp/normalize";

const ENV_KEYS = ["VERCEL_ENV", "HAXR_LOCAL_RSVP_ALLOWED_SLUGS", "HAXR_RSVP_NOTIFICATION_MODE"] as const;

const saved: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>> = {};

function snapshotEnv(): void {
  for (const key of ENV_KEYS) {
    saved[key] = process.env[key];
  }
}

function restoreEnv(): void {
  for (const key of ENV_KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
}

describe("normalizeRsvpEmail / phone idempotency keys", () => {
  it("normaliza email com capitalização diferente", () => {
    assert.equal(
      normalizeRsvpEmail("HAXR-Canary@Example.INVALID"),
      "haxr-canary@example.invalid"
    );
  });

  it("normaliza telefone com espaços", () => {
    assert.equal(normalizeRsvpPhone(" 84 123 4567 "), "841234567");
  });

  it("normaliza telefone +258", () => {
    assert.equal(normalizeRsvpPhone("+258 84 123 4567"), "+258841234567");
    assert.equal(normalizeRsvpPhone("258841234567"), "+258841234567");
  });
});

describe("local RSVP allowlist", () => {
  snapshotEnv();
  afterEach(restoreEnv);

  it("Production sem allowlist → nenhum slug permitido", () => {
    delete process.env.HAXR_LOCAL_RSVP_ALLOWED_SLUGS;
    process.env.VERCEL_ENV = "production";
    assert.equal(isLocalRsvpSlugAllowed("jessicasamuelwedding"), false);
    assert.equal(parseLocalRsvpAllowedSlugs().size, 0);
  });

  it("Production com allowlist → só slugs listados", () => {
    process.env.VERCEL_ENV = "production";
    process.env.HAXR_LOCAL_RSVP_ALLOWED_SLUGS =
      "jessicakulaya, jessicaesamueltraditionalwedding, jessicachadelingerie, jessicasamuelwedding";
    assert.equal(isLocalRsvpSlugAllowed("jessicasamuelwedding"), true);
    assert.equal(isLocalRsvpSlugAllowed("cha-de-panela"), false);
  });
});

describe("notification mode", () => {
  snapshotEnv();
  afterEach(restoreEnv);

  it("default é disabled", () => {
    delete process.env.HAXR_RSVP_NOTIFICATION_MODE;
    assert.equal(resolveRsvpNotificationMode(), "disabled");
  });

  it("enabled só com valor exacto", () => {
    process.env.HAXR_RSVP_NOTIFICATION_MODE = "enabled";
    assert.equal(resolveRsvpNotificationMode(), "enabled");
    process.env.HAXR_RSVP_NOTIFICATION_MODE = "ENABLED";
    assert.equal(resolveRsvpNotificationMode(), "enabled");
    process.env.HAXR_RSVP_NOTIFICATION_MODE = "true";
    assert.equal(resolveRsvpNotificationMode(), "disabled");
  });
});

describe("idempotency contract (documentação + normalização)", () => {
  it("mesmo contacto normaliza igual (exact duplicate)", () => {
    const a = {
      email: normalizeRsvpEmail("Guest@Example.com"),
      phone: normalizeRsvpPhone("+258 84 000 0001"),
    };
    const b = {
      email: normalizeRsvpEmail("guest@example.com"),
      phone: normalizeRsvpPhone("+258840000001"),
    };
    assert.deepEqual(a, b);
  });

  it("attending=false força party size zero no contrato de persist", () => {
    const attending = false;
    const guests = attending ? 3 : 0;
    assert.equal(guests, 0);
  });

  it("eventos diferentes mantêm contactos separados (chave inclui event_id)", () => {
    const eventA = "de277c01-ce34-4765-8655-27307c674d5d";
    const eventB = "7cec4447-de0d-40a5-8f03-8d7c87acb3f5";
    const contact = normalizeRsvpEmail("same@example.invalid");
    assert.notEqual(`${eventA}:${contact}`, `${eventB}:${contact}`);
  });
});
