import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { getEditionDatabaseProvider, resolveDatabaseProviderName } from "./index";
import { closeNeonPool } from "./neon-client";

function loadNeonUrl(): string | null {
  if (process.env.DATABASE_URL?.trim()) {
    return process.env.DATABASE_URL.trim();
  }
  const envPath = path.join(process.cwd(), ".env.neon.local");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
    for (const l of lines) {
      if (l.startsWith("DATABASE_URL=")) {
        return l.slice("DATABASE_URL=".length).trim().replace(/^["']|["']$/g, "");
      }
    }
  }
  return null;
}

test("Neon live provider integration against Neon Production", async () => {
  const neonUrl = loadNeonUrl();
  if (!neonUrl) {
    console.log("Skipping live neon test: DATABASE_URL not available");
    return;
  }

  const origProvider = process.env.DATABASE_PROVIDER;
  const origDbUrl = process.env.DATABASE_URL;

  try {
    process.env.DATABASE_PROVIDER = "neon";
    process.env.DATABASE_URL = neonUrl;

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

    // 4. Test listGiftReservations
    const reservations = await db.listGiftReservations("rose-elegance");
    assert.ok(Array.isArray(reservations));
    console.log("Live Neon rose-elegance reservations count:", reservations.length);
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
