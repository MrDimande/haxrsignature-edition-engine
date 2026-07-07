import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildLocalRsvpSuccessBody,
  LOCAL_RSVP_SUCCESS_MESSAGE,
} from "./local-response";

describe("buildLocalRsvpSuccessBody", () => {
  it("devolve apenas o envelope público mínimo", () => {
    const body = buildLocalRsvpSuccessBody();

    assert.deepEqual(body, {
      success: true,
      message: LOCAL_RSVP_SUCCESS_MESSAGE,
    });
    assert.equal(Object.keys(body).length, 2);
    assert.equal("data" in body, false);
    assert.equal("persisted" in body, false);
    assert.equal("emailSent" in body, false);
    assert.equal("guestEmailSent" in body, false);
    assert.equal("notificationPending" in body, false);
  });
});
