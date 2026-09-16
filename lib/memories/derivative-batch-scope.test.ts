import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Pool } from "pg";
import {
  processPendingDerivativesBatchWithDependencies,
  type ProcessMediaDerivativesResult,
} from "./derivatives";

const TARGET_MEDIA_ID = "d1f4a2b5-02b0-4c22-8a88-8cf0d523ef1a";
const NON_TARGET_MEDIA_ID = "a8c1f3e2-72cb-44c4-9e56-b2e2be9956bc";

type JobState = {
  id: string;
  status: "pending" | "processing";
  attempts: number;
  leaseToken: string | null;
};

function readyResult(mediaId: string): ProcessMediaDerivativesResult {
  return { success: true, mediaId, status: "ready", hasDerivatives: true };
}

describe("Scoped derivative batch selection", () => {
  it("processa A sem seleccionar, claimar ou mutar B", async () => {
    const target: JobState = { id: TARGET_MEDIA_ID, status: "processing", attempts: 1, leaseToken: "stale-a" };
    const nonTarget: JobState = { id: NON_TARGET_MEDIA_ID, status: "pending", attempts: 7, leaseToken: "lease-b" };
    const nonTargetBefore = structuredClone(nonTarget);
    const processedIds: string[] = [];
    let selectorValues: unknown[] | undefined;

    const pool = {
      async query(_sql: string, values: unknown[] = []) {
        selectorValues = values;
        // The fake selector mirrors the SQL contract: only the exact third
        // parameter can enter the processor, so B cannot be claimed.
        return { rows: values[2] === TARGET_MEDIA_ID ? [{ id: target.id }] : [] };
      },
    } as unknown as Pick<Pool, "query">;

    const result = await processPendingDerivativesBatchWithDependencies(1, {
      mediaId: TARGET_MEDIA_ID,
      workerId: "scoped-test-worker",
    }, {
      pool,
      processMedia: async (mediaId) => {
        processedIds.push(mediaId);
        target.status = "processing";
        target.attempts += 1;
        target.leaseToken = "replacement-a";
        return readyResult(mediaId);
      },
    });

    assert.deepEqual(selectorValues, [1, null, TARGET_MEDIA_ID]);
    assert.deepEqual(processedIds, [TARGET_MEDIA_ID]);
    assert.deepEqual(nonTarget, nonTargetBefore);
    assert.equal(result.processed, 1);
    assert.equal(result.successes, 1);
  });

  it("mediaId inexistente é no-op e não invoca o processor", async () => {
    let processorCalls = 0;
    const pool = {
      async query(_sql: string, values: unknown[] = []) {
        assert.deepEqual(values, [1, null, TARGET_MEDIA_ID]);
        return { rows: [] };
      },
    } as unknown as Pick<Pool, "query">;

    const result = await processPendingDerivativesBatchWithDependencies(1, { mediaId: TARGET_MEDIA_ID }, {
      pool,
      processMedia: async () => {
        processorCalls += 1;
        return readyResult(TARGET_MEDIA_ID);
      },
    });

    assert.deepEqual(result, { processed: 0, successes: 0, failures: 0 });
    assert.equal(processorCalls, 0);
  });
});
