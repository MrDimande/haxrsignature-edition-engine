import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { logLocalRsvp } from "./logging";

describe("logLocalRsvp diagnostic fields", () => {
  it("regista campos seguros sem PII", () => {
    const lines: string[] = [];
    const originalInfo = console.info;
    console.info = (...args: unknown[]) => {
      lines.push(args.map(String).join(" "));
    };

    try {
      logLocalRsvp({
        requestId: "req-local-1",
        slug: "jessicachadelingerie",
        stage: "complete",
        durationMs: 842,
        httpStatus: 200,
        outcome: "success",
        persisted: true,
        emailSent: false,
        guestEmailSent: false,
      });

      assert.equal(lines.length, 1);
      const payload = JSON.parse(lines[0] ?? "{}") as Record<string, unknown>;

      assert.equal(payload.scope, "edition/rsvp/local");
      assert.equal(payload.backend, "local");
      assert.equal(payload.requestId, "req-local-1");
      assert.equal(payload.stage, "complete");
      assert.equal(payload.httpStatus, 200);
      assert.equal(payload.outcome, "success");
      assert.equal(payload.persisted, true);
      assert.equal(String(lines[0]).includes("@"), false);
    } finally {
      console.info = originalInfo;
    }
  });
});
