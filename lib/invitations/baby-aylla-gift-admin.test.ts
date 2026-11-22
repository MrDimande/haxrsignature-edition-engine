import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { AYLLA_GIFTS_CONFIG } from "../aylla/gifts/config";
import { canAdministerAyllaGiftReservation } from "../aylla/gifts/admin";

describe("Baby Aylla gift administration", () => {
  it("requires an active server-established administrator with authority for the event", () => {
    assert.deepEqual(
      canAdministerAyllaGiftReservation({
        administrator: { id: "admin-1", active: true, permittedEventIds: [AYLLA_GIFTS_CONFIG.eventId] },
        eventId: AYLLA_GIFTS_CONFIG.eventId,
      }),
      { allowed: true, actorId: "admin-1" }
    );
  });

  it("rejects inactive administrators and administrators from another event", () => {
    for (const administrator of [
      { id: "admin-inactive", active: false, permittedEventIds: [AYLLA_GIFTS_CONFIG.eventId] },
      { id: "admin-other-event", active: true, permittedEventIds: ["another-event"] },
    ]) {
      assert.deepEqual(
        canAdministerAyllaGiftReservation({ administrator, eventId: AYLLA_GIFTS_CONFIG.eventId }),
        { allowed: false, reason: "access_denied" }
      );
    }
  });
});
