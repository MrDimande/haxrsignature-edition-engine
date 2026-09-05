import test from "node:test";
import assert from "node:assert/strict";
import { getEditionDatabaseProvider, resolveDatabaseProviderName } from "./index";
import { closeNeonPool } from "./neon-client";

const NEON_PROD_URL = "postgresql://neondb_owner:npg_aw9UDbuFkc5v@ep-lingering-base-ay6jd085.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require";

test("Neon live provider integration against Neon Production", async () => {
  const origProvider = process.env.DATABASE_PROVIDER;
  const origDbUrl = process.env.DATABASE_URL;

  try {
    process.env.DATABASE_PROVIDER = "neon";
    process.env.DATABASE_URL = NEON_PROD_URL;

    assert.equal(resolveDatabaseProviderName(), "neon");
    const db = getEditionDatabaseProvider();
    assert.equal(db.name, "neon");
    assert.equal(db.isConfigured(), true);

    // 1. Query wedding photos for jessicasamuelwedding
    const photos1 = await db.listMemoriesPhotos("jessicasamuelwedding", 100);
    assert.equal(photos1.length, 62, "jessicasamuelwedding must have 62 photos");

    // 2. Query wedding photos for jessicaesamueltraditionalwedding
    const photos2 = await db.listMemoriesPhotos("jessicaesamueltraditionalwedding", 100);
    assert.equal(photos2.length, 85, "jessicaesamueltraditionalwedding must have 85 photos");

    // Total
    assert.equal(photos1.length + photos2.length, 147, "Total photos must be 147");

    // 3. Test checkApiRateLimit
    const rateLimitRes = await db.checkApiRateLimit("test-bucket-e5b", 10, 60);
    assert.equal(rateLimitRes.allowed, true);
    assert.ok(rateLimitRes.remaining >= 0);
  } finally {
    await closeNeonPool();
    if (origProvider !== undefined) {
      process.env.DATABASE_PROVIDER = origProvider;
    } else {
      delete process.env.DATABASE_PROVIDER;
    }
    if (origDbUrl !== undefined) {
      process.env.DATABASE_URL = origDbUrl;
    } else {
      delete process.env.DATABASE_URL;
    }
  }
});
