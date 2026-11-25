import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveBabyAyllaRsvpState } from "../aylla/rsvp-state";

describe("Baby Aylla RSVP publication state", () => {
  it("keeps the draft form visible only for visual Preview and blocks submission", () => {
    assert.deepEqual(resolveBabyAyllaRsvpState(true, "draft"), {
      showForm: true,
      canSubmit: false,
      isDraftPreview: true,
    });
  });

  it("enables submission only after an explicit active status", () => {
    assert.deepEqual(resolveBabyAyllaRsvpState(true, "active"), {
      showForm: true,
      canSubmit: true,
      isDraftPreview: false,
    });
  });

  it("fails closed when RSVP is not configured or the status is unknown", () => {
    assert.deepEqual(resolveBabyAyllaRsvpState(false, "active"), {
      showForm: false,
      canSubmit: false,
      isDraftPreview: false,
    });
    assert.deepEqual(resolveBabyAyllaRsvpState(true, "archived"), {
      showForm: false,
      canSubmit: false,
      isDraftPreview: false,
    });
  });
});
