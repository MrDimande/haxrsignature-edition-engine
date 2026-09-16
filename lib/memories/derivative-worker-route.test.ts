import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import {
  createMemoriesDerivativeWorkerHandler,
  SCOPED_DERIVATIVE_WORKER_BATCH_LIMIT,
} from "./derivative-worker-route";
import { isCronAuthorized } from "../cron-auth";

const TEST_SECRET = "derivative-worker-test-secret";
const previousSecret = process.env.EDITION_CRON_SECRET;

beforeEach(() => {
  process.env.EDITION_CRON_SECRET = TEST_SECRET;
});

afterEach(() => {
  if (previousSecret === undefined) delete process.env.EDITION_CRON_SECRET;
  else process.env.EDITION_CRON_SECRET = previousSecret;
});

const TARGET_MEDIA_ID = "d1f4a2b5-02b0-4c22-8a88-8cf0d523ef1a";

function createHandler(processBatch: (limit: number, options: { workerId: string; mediaId: string }) => Promise<{ processed: number; successes: number; failures: number }>) {
  return createMemoriesDerivativeWorkerHandler({
    isAuthorized: isCronAuthorized,
    processBatch,
  });
}

describe("Memories derivative worker route", () => {
  it("AUTH_MISSING is rejected even when a secret-looking query parameter is supplied", async () => {
    let called = false;
    const response = await createHandler(async () => {
      called = true;
      return { processed: 0, successes: 0, failures: 0 };
    })(new Request("https://preview.example.test/api/cron/memories-derivatives?secret=not-accepted"));

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { success: false, code: "UNAUTHORIZED" });
    assert.equal(called, false);
  });

  it("AUTH_INVALID is rejected without executing the worker", async () => {
    let called = false;
    const response = await createHandler(async () => {
      called = true;
      return { processed: 0, successes: 0, failures: 0 };
    })(new Request("https://preview.example.test/api/cron/memories-derivatives", {
      headers: { authorization: "Bearer invalid" },
    }));

    assert.equal(response.status, 401);
    assert.equal(called, false);
  });

  it("mediaId inválido devolve 400 sem executar o worker", async () => {
    let called = false;
    const response = await createHandler(async () => {
      called = true;
      return { processed: 0, successes: 0, failures: 0 };
    })(new Request("https://preview.example.test/api/cron/memories-derivatives", {
      headers: {
        authorization: `Bearer ${TEST_SECRET}`,
        "x-haxr-derivative-media-id": "not-a-uuid",
      },
    }));

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { success: false, code: "INVALID_MEDIA_ID" });
    assert.equal(called, false);
  });

  it("AUTH_VALID executes only the scoped canonical batch", async () => {
    let observedLimit: number | undefined;
    let observedWorkerId: string | undefined;
    let observedMediaId: string | undefined;
    const response = await createHandler(async (limit, options) => {
      observedLimit = limit;
      observedWorkerId = options.workerId;
      observedMediaId = options.mediaId;
      return { processed: 1, successes: 1, failures: 0 };
    })(new Request("https://preview.example.test/api/cron/memories-derivatives", {
      headers: {
        authorization: `Bearer ${TEST_SECRET}`,
        "x-haxr-derivative-media-id": TARGET_MEDIA_ID,
      },
    }));

    assert.equal(response.status, 200);
    assert.equal(observedLimit, SCOPED_DERIVATIVE_WORKER_BATCH_LIMIT);
    assert.equal(observedWorkerId, "memories-derivatives-cron");
    assert.equal(observedMediaId, TARGET_MEDIA_ID);
    assert.deepEqual(await response.json(), { success: true, processed: 1, successes: 1, failures: 0 });
  });

  it("mediaId inexistente pode devolver no-op seguro", async () => {
    const response = await createHandler(async (limit, options) => {
      assert.equal(limit, 1);
      assert.equal(options.mediaId, TARGET_MEDIA_ID);
      return { processed: 0, successes: 0, failures: 0 };
    })(new Request("https://preview.example.test/api/cron/memories-derivatives", {
      headers: {
        authorization: `Bearer ${TEST_SECRET}`,
        "x-haxr-derivative-media-id": TARGET_MEDIA_ID,
      },
    }));

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { success: true, processed: 0, successes: 0, failures: 0 });
  });

  it("returns a sanitised availability error when the canonical batch throws", async () => {
    const response = await createHandler(async () => {
      throw new Error("must not reach the HTTP response");
    })(new Request("https://preview.example.test/api/cron/memories-derivatives", {
      headers: {
        authorization: `Bearer ${TEST_SECRET}`,
        "x-haxr-derivative-media-id": TARGET_MEDIA_ID,
      },
    }));

    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { success: false, code: "DERIVATIVE_WORKER_UNAVAILABLE" });
  });
});
