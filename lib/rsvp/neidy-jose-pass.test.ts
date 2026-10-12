import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildNeidyJoseCheckinUrl } from "@engines/true-theme/profiles/neidy-jose-o-vinculo-perfeito/NeidyJoseDigitalPass";
import { buildLocalRsvpSuccessBody } from "@lib/rsvp/local-response";
import { resolveRsvpClientOutcome } from "@lib/rsvp/client-outcome";

import {
  resolveNeidyJoseCheckinUrl,
  CANONICAL_CORE_PRODUCTION_BASE,
  NEIDY_JOSE_CANONICAL_EVENT_ID,
} from "@lib/rsvp/checkin-url";

describe("Neidy & José — Digital Pass & Token Security", () => {
  it("buildNeidyJoseCheckinUrl encodes canonical event ID and token without PII in production", () => {
    const token = "b7a2d4f9e1c3856012345678abcdef01";
    const res = resolveNeidyJoseCheckinUrl(token, { env: "production" });

    assert.equal(res.ok, true);
    if (res.ok) {
      assert.equal(
        res.url,
        `${CANONICAL_CORE_PRODUCTION_BASE}/event/${NEIDY_JOSE_CANONICAL_EVENT_ID}/checkin/${token}`
      );
      assert.equal(res.environment, "production");
      // Verificação estrita de ausência de dados privados na URL do QR
      assert.ok(!res.url.includes("name="));
      assert.ok(!res.url.includes("phone="));
      assert.ok(!res.url.includes("notes="));
      assert.ok(!res.url.includes("plus_ones="));
    }
  });

  it("resolveNeidyJoseCheckinUrl falha fechado (fail-closed) em Preview sem destino configurado", () => {
    const token = "b7a2d4f9e1c3856012345678abcdef01";
    const res = resolveNeidyJoseCheckinUrl(token, {
      env: "preview",
      previewBaseUrl: "",
    });

    assert.equal(res.ok, false);
    if (!res.ok) {
      assert.equal(res.error, "preview_target_unconfigured");
      assert.ok(res.message.includes("bloqueada"));
    }
  });

  it("resolveNeidyJoseCheckinUrl rejeita apontar para Produção quando em ambiente Preview", () => {
    const token = "b7a2d4f9e1c3856012345678abcdef01";
    const res = resolveNeidyJoseCheckinUrl(token, {
      env: "preview",
      previewBaseUrl: "https://www.haxrsignature.com",
    });

    assert.equal(res.ok, false);
    if (!res.ok) {
      assert.equal(res.error, "preview_cannot_target_production");
    }
  });

  it("resolveNeidyJoseCheckinUrl aceita destino de Preview válido e isolado", () => {
    const token = "b7a2d4f9e1c3856012345678abcdef01";
    const res = resolveNeidyJoseCheckinUrl(token, {
      env: "preview",
      previewBaseUrl: "https://haxrsignature-preview-pr-123.vercel.app",
    });

    assert.equal(res.ok, true);
    if (res.ok) {
      assert.equal(res.environment, "preview");
      assert.equal(
        res.url,
        `https://haxrsignature-preview-pr-123.vercel.app/event/${NEIDY_JOSE_CANONICAL_EVENT_ID}/checkin/${token}`
      );
    }
  });

  it("resolveNeidyJoseCheckinUrl rejeita tokens inválidos ou curtos", () => {
    const resEmpty = resolveNeidyJoseCheckinUrl("");
    assert.equal(resEmpty.ok, false);

    const resShort = resolveNeidyJoseCheckinUrl("curto");
    assert.equal(resShort.ok, false);
    if (!resShort.ok) {
      assert.equal(resShort.error, "invalid_token");
    }
  });

  it("buildLocalRsvpSuccessBody includes qrToken and partySize for newly confirmed guests", () => {
    const token = "f9e1c3856012345678abcdef01b7a2d4";
    const body = buildLocalRsvpSuccessBody({
      guestId: "550e8400-e29b-41d4-a716-446655440000",
      qrToken: token,
      status: "confirmed",
      created: true,
      partySize: 2,
      plusOnes: 1,
    });

    assert.equal(body.success, true);
    assert.equal(body.persisted, true);
    assert.equal(body.qrToken, token);
    assert.equal(body.partySize, 2);
    assert.equal(body.plusOnes, 1);
    assert.equal(body.created, true);
    assert.equal(body.status, "confirmed");
  });

  it("buildLocalRsvpSuccessBody preserves absence of qrToken when created is false (least privilege)", () => {
    const body = buildLocalRsvpSuccessBody({
      guestId: "550e8400-e29b-41d4-a716-446655440000",
      status: "confirmed",
      created: false,
      partySize: 2,
      plusOnes: 1,
    });

    assert.equal(body.success, true);
    assert.equal(body.persisted, true);
    assert.equal(body.qrToken, undefined);
    assert.equal(body.created, false);
  });

  it("resolveRsvpClientOutcome requires success=true and persisted=true", () => {
    const successWithToken = resolveRsvpClientOutcome(true, {
      success: true,
      persisted: true,
      qrToken: "valid_test_token_1234567890123456",
    });
    assert.equal(successWithToken.kind, "success");

    const failedPersistence = resolveRsvpClientOutcome(true, {
      success: true,
      persisted: false,
    });
    assert.equal(failedPersistence.kind, "error");

    const serverError = resolveRsvpClientOutcome(false, {
      success: false,
      error: "server_error",
    });
    assert.equal(serverError.kind, "error");
  });
});
