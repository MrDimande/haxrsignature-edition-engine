import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildLocalRsvpSuccessBody,
  LOCAL_RSVP_SUCCESS_MESSAGE,
} from "./local-response";

describe("buildLocalRsvpSuccessBody", () => {
  it("devolve envelope com persisted:true após confirmação de BD", () => {
    const body = buildLocalRsvpSuccessBody(true);

    assert.deepEqual(body, {
      success: true,
      message: LOCAL_RSVP_SUCCESS_MESSAGE,
      persisted: true,
    });
    assert.equal(Object.keys(body).length, 3);
    assert.equal("data" in body, false);
    assert.equal("emailSent" in body, false);
  });

  it("devolve persisted:false quando nada foi guardado", () => {
    const body = buildLocalRsvpSuccessBody(false);

    assert.deepEqual(body, {
      success: true,
      message: LOCAL_RSVP_SUCCESS_MESSAGE,
      persisted: false,
    });
  });

  it("só trata boolean true como persisted:true", () => {
    assert.equal(buildLocalRsvpSuccessBody(true).persisted, true);
    assert.equal(buildLocalRsvpSuccessBody(false).persisted, false);
  });
});
