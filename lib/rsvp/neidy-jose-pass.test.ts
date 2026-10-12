import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildNeidyJoseCheckinUrl } from "@engines/true-theme/profiles/neidy-jose-o-vinculo-perfeito/NeidyJoseDigitalPass";
import { buildLocalRsvpSuccessBody } from "@lib/rsvp/local-response";
import { resolveRsvpClientOutcome } from "@lib/rsvp/client-outcome";

describe("Neidy & José — Digital Pass & Token Security", () => {
  it("buildNeidyJoseCheckinUrl encodes canonical event ID and token without PII", () => {
    const token = "b7a2d4f9e1c3856012345678abcdef01";
    const url = buildNeidyJoseCheckinUrl(token);

    assert.equal(
      url,
      `https://www.haxrsignature.com/event/aed4c44a-49f8-4e9e-8b6b-cd5b3c701102/checkin/${token}`
    );
    // Verificação estrita de ausência de dados privados na URL do QR
    assert.ok(!url.includes("name="));
    assert.ok(!url.includes("phone="));
    assert.ok(!url.includes("notes="));
    assert.ok(!url.includes("plus_ones="));
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
