import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  submitUniversalRsvp,
  type UniversalRsvpPayload,
} from "./universal-client";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

const SLUGS = [
  "jessicakulaya",
  "jessicaesamueltraditionalwedding",
  "jessicachadelingerie",
  "jessicasamuelwedding",
] as const;

describe("Universal RSVP client contract", () => {
  for (const slug of SLUGS) {
    it(`${slug}: POST comum e sucesso só com persisted=true`, async () => {
      const capturedBodies: UniversalRsvpPayload[] = [];
      globalThis.fetch = async (_input, init) => {
        capturedBodies.push(
          JSON.parse(String(init?.body)) as UniversalRsvpPayload
        );
        return new Response(
          JSON.stringify({
            success: true,
            persisted: true,
            notificationSkipped: true,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      };

      const result = await submitUniversalRsvp({
        slug,
        name: "Canary Test",
        attending: false,
        guests: 0,
      });

      const capturedBody = capturedBodies[0];
      assert.ok(capturedBody);
      assert.equal(capturedBody.slug, slug);
      assert.equal(capturedBody.attending, false);
      assert.equal(capturedBody.guests, 0);
      assert.equal("event_id" in capturedBody, false);
      assert.equal(result.outcome.kind, "success");
    });
  }

  it("HTTP 200 sem persisted não produz sucesso", async () => {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });

    const result = await submitUniversalRsvp({
      slug: "jessicakulaya",
      name: "Canary Test",
      attending: false,
      guests: 0,
    });

    assert.equal(result.outcome.kind, "error");
  });
});
