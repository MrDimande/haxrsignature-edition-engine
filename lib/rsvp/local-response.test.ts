import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildLocalRsvpSuccessBody,
  LOCAL_RSVP_SUCCESS_MESSAGE,
} from "./local-response";

describe("buildLocalRsvpSuccessBody", () => {
  it("devolve envelope com success + persisted obrigatórios", () => {
    const body = buildLocalRsvpSuccessBody({ notificationSkipped: true });

    assert.equal(body.success, true);
    assert.equal(body.persisted, true);
    assert.equal(body.message, LOCAL_RSVP_SUCCESS_MESSAGE);
    assert.equal(body.notificationSkipped, true);
    assert.equal("data" in body, false);
    assert.equal("emailSent" in body, false);
  });
});
