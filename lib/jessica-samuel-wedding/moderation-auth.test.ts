import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { POST as moderatePost } from "../../app/api/memories/moderate/route";

const originalEnv = { ...process.env };
const PHOTO_ID = "9f63016a-32e5-4dc1-88a2-5407a8b5d5a1";
const SLUG = "jessicasamuelwedding";
const TEST_SECRET = "moderation-auth-test-value-not-a-runtime-secret";

function makeRequest(input: {
  action?: string;
  bearer?: string;
  bodySecret?: string;
} = {}): Request {
  return new Request("https://example.test/api/memories/moderate", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(input.bearer ? { authorization: `Bearer ${input.bearer}` } : {}),
    },
    body: JSON.stringify({
      slug: SLUG,
      photoId: PHOTO_ID,
      action: input.action ?? "approve",
      ...(input.bodySecret ? { secretKey: input.bodySecret } : {}),
    }),
  });
}

beforeEach(() => {
  process.env = { ...originalEnv };
  process.env.HAXR_DATABASE_BACKEND = "neon";
  delete process.env.DATABASE_URL;
  delete process.env.ADMIN_MODERATION_SECRET;
});

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("Memories moderation authorization", () => {
  it("fails closed when the server moderation secret is not configured", async () => {
    const response = await moderatePost(makeRequest());
    assert.equal(response.status, 503);
    const body = await response.json();
    assert.equal(body.success, false);
  });

  it("rejects missing and invalid credentials", async () => {
    process.env.ADMIN_MODERATION_SECRET = TEST_SECRET;

    const missing = await moderatePost(makeRequest());
    assert.equal(missing.status, 401);

    const invalid = await moderatePost(
      makeRequest({ bearer: `${TEST_SECRET}-wrong` })
    );
    assert.equal(invalid.status, 401);
  });

  it("accepts Bearer authorization before reaching the database gate", async () => {
    process.env.ADMIN_MODERATION_SECRET = TEST_SECRET;

    const response = await moderatePost(makeRequest({ bearer: TEST_SECRET }));
    assert.equal(response.status, 503);
    const body = await response.json();
    assert.equal(body.error, "Serviço indisponível.");
  });

  it("keeps temporary body-secret compatibility before the database gate", async () => {
    process.env.ADMIN_MODERATION_SECRET = TEST_SECRET;

    const response = await moderatePost(
      makeRequest({ bodySecret: TEST_SECRET, action: "reject" })
    );
    assert.equal(response.status, 503);
    const body = await response.json();
    assert.equal(body.error, "Serviço indisponível.");
  });

  it("rejects unsupported moderation actions before authorization", async () => {
    process.env.ADMIN_MODERATION_SECRET = TEST_SECRET;

    const response = await moderatePost(
      makeRequest({ action: "archive", bearer: TEST_SECRET })
    );
    assert.equal(response.status, 400);
  });
});
