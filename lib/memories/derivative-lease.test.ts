import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import sharp from "sharp";
import { Pool } from "pg";
import { closeNeonPool } from "../db/neon-client";
import { DERIVATIVE_CONFIG, processMediaDerivatives } from "./derivatives";
import { MockMemoriesStorageProvider } from "./storage/mock-provider";

const MEDIA_ID = "d1f4a2b5-02b0-4c22-8a88-8cf0d523ef1a";
const SLUG = "stanturns5";
const ORIGINAL_PATH = `${SLUG}/${MEDIA_ID}/original.jpg`;
const PREVIOUS_LEASE = "old-orphaned-lease-token";
const RECLAIMED_LEASE = "new-reclaimed-lease-token";
const originalDatabaseUrl = process.env.DATABASE_URL;

type QueryResult = { rows: Array<Record<string, unknown>> };
type DerivativeState = "stale" | "processing" | "ready";

class LeaseRuntime {
  state: DerivativeState = "stale";
  claimParameters: unknown[][] = [];
  finalizeTokens: string[] = [];

  async query(sql: string, values: unknown[] = []): Promise<QueryResult> {
    const normalized = sql.replace(/\s+/g, " ").trim();

    if (normalized.includes("FROM haxr_claim_media_derivative_job")) {
      this.claimParameters.push(values);

      if (this.state === "stale") {
        this.state = "processing";
        return {
          rows: [{
            claimed: true,
            media_id: MEDIA_ID,
            invitation_slug: SLUG,
            storage_path: ORIGINAL_PATH,
            content_type: "image/jpeg",
            media_type: "image",
            poster_storage_path: null,
            locked_at: new Date().toISOString(),
            attempts: 2,
            lease_token: RECLAIMED_LEASE,
          }],
        };
      }

      if (this.state === "ready") {
        return {
          rows: [{
            claimed: false,
            media_id: MEDIA_ID,
            invitation_slug: SLUG,
            storage_path: ORIGINAL_PATH,
            content_type: "image/jpeg",
            media_type: "image",
            poster_storage_path: null,
            locked_at: null,
            attempts: 2,
            lease_token: null,
          }],
        };
      }

      return { rows: [] };
    }

    if (normalized.includes("FROM wedding_photos WHERE id = $1")) {
      return {
        rows: [{
          id: MEDIA_ID,
          derivatives_status: this.state,
          has_derivatives: this.state === "ready",
          thumbnail_storage_path: this.state === "ready" ? `${SLUG}/${MEDIA_ID}/thumbnail.webp` : null,
          medium_storage_path: this.state === "ready" ? `${SLUG}/${MEDIA_ID}/medium.webp` : null,
          poster_storage_path: null,
          derivatives_attempts: 2,
        }],
      };
    }

    if (normalized.includes("haxr_finalize_media_derivative_job")) {
      const leaseToken = String(values[1]);
      this.finalizeTokens.push(leaseToken);
      const ownsCurrentLease = this.state === "processing" && leaseToken === RECLAIMED_LEASE;
      if (ownsCurrentLease && normalized.includes("'ready'")) {
        this.state = "ready";
      }
      return { rows: [{ finalized: ownsCurrentLease }] };
    }

    throw new Error(`Query não coberta pelo double de lease: ${normalized}`);
  }
}

class BlockingStorage extends MockMemoriesStorageProvider {
  private releaseRead!: () => void;
  private readonly readStartedPromise: Promise<void>;
  private readonly releaseReadPromise: Promise<void>;

  constructor() {
    super();
    this.readStartedPromise = new Promise((resolve) => {
      this.readStarted = resolve;
    });
    this.releaseReadPromise = new Promise((resolve) => {
      this.releaseRead = resolve;
    });
  }

  private readStarted!: () => void;

  async readObject(storagePath: string): Promise<Uint8Array | null> {
    this.readStarted();
    await this.releaseReadPromise;
    return super.readObject(storagePath);
  }

  async waitForRead(): Promise<void> {
    await this.readStartedPromise;
  }

  continueRead(): void {
    this.releaseRead();
  }
}

let runtime: LeaseRuntime;

beforeEach(async () => {
  await closeNeonPool();
  mock.restoreAll();
  runtime = new LeaseRuntime();
  process.env.DATABASE_URL = "postgres://localhost/derivative_lease_test";

  mock.method(Pool.prototype, "query", async (sql: string, values: unknown[] = []) => runtime.query(sql, values));
});

afterEach(async () => {
  await closeNeonPool();
  mock.restoreAll();
  if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = originalDatabaseUrl;
});

async function putOriginal(storage: MockMemoriesStorageProvider): Promise<void> {
  const jpeg = await sharp({
    create: { width: 24, height: 16, channels: 3, background: { r: 68, g: 93, b: 120 } },
  }).jpeg().toBuffer();
  await storage.putObject(ORIGINAL_PATH, jpeg, "image/jpeg");
}

describe("Derivative lease recovery", () => {
  it("STALE_LEASE_RECLAIM uses the replacement lease and produces canonical derivatives", async () => {
    const storage = new MockMemoriesStorageProvider();
    await putOriginal(storage);

    const result = await processMediaDerivatives(MEDIA_ID, {
      workerId: "recovery-worker",
      storageProvider: storage,
    });

    assert.equal(result.success, true);
    assert.equal(result.status, "ready");
    assert.deepEqual(runtime.claimParameters[0], [
      MEDIA_ID,
      "recovery-worker",
      DERIVATIVE_CONFIG.limits.defaultLeaseTimeoutSeconds,
      false,
    ]);
    assert.deepEqual(runtime.finalizeTokens, [RECLAIMED_LEASE]);
    assert.equal(storage.has(`${SLUG}/${MEDIA_ID}/thumbnail.webp`), true);
    assert.equal(storage.has(`${SLUG}/${MEDIA_ID}/medium.webp`), true);

    const oldLeaseFinalize = await runtime.query(
      "SELECT haxr_finalize_media_derivative_job($1, $2, 'ready', true, $3, $4, NULL, NULL, NULL, NULL, NULL, NULL) AS finalized;",
      [MEDIA_ID, PREVIOUS_LEASE, "unused-thumbnail.webp", "unused-medium.webp"]
    );
    assert.equal(oldLeaseFinalize.rows[0]?.finalized, false);
  });

  it("READY_JOB_RETRY is idempotent and does not rewrite derivative objects", async () => {
    const storage = new MockMemoriesStorageProvider();
    await putOriginal(storage);
    await processMediaDerivatives(MEDIA_ID, { storageProvider: storage });
    const keysBeforeRetry = storage.listKeys();

    const retry = await processMediaDerivatives(MEDIA_ID, { storageProvider: storage });

    assert.equal(retry.success, true);
    assert.equal(retry.status, "ready");
    assert.deepEqual(storage.listKeys(), keysBeforeRetry);
    assert.equal(runtime.finalizeTokens.length, 1);
  });

  it("DOUBLE_WORKER_CLAIM is safe while the first worker holds its lease", async () => {
    const storage = new BlockingStorage();
    await putOriginal(storage);

    const first = processMediaDerivatives(MEDIA_ID, {
      workerId: "worker-a",
      storageProvider: storage,
    });
    await storage.waitForRead();

    const second = await processMediaDerivatives(MEDIA_ID, {
      workerId: "worker-b",
      storageProvider: storage,
    });

    assert.equal(second.success, false);
    assert.equal(second.status, "processing");
    assert.equal(second.error, "LEASE_ACTIVE_ANOTHER_WORKER");

    storage.continueRead();
    const firstResult = await first;
    assert.equal(firstResult.success, true);
    assert.equal(runtime.state, "ready");
  });
});
