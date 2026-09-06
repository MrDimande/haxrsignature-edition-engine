import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveDatabaseProviderName,
  getEditionDatabaseProvider,
  __setEditionDatabaseProviderForTests,
} from "./index";
import type { EditionDatabaseProvider } from "./types";

test("resolveDatabaseProviderName fail-closed on unknown provider", () => {
  const origProvider = process.env.DATABASE_PROVIDER;
  try {
    process.env.DATABASE_PROVIDER = "oracle";
    assert.throws(
      () => resolveDatabaseProviderName(),
      /Provedor de base de dados desconhecido: oracle/
    );
  } finally {
    if (origProvider !== undefined) {
      process.env.DATABASE_PROVIDER = origProvider;
    } else {
      delete process.env.DATABASE_PROVIDER;
    }
  }
});

test("resolveDatabaseProviderName fail-closed on neon without DATABASE_URL", () => {
  const origProvider = process.env.DATABASE_PROVIDER;
  const origDbUrl = process.env.DATABASE_URL;
  try {
    process.env.DATABASE_PROVIDER = "neon";
    delete process.env.DATABASE_URL;
    assert.throws(
      () => resolveDatabaseProviderName(),
      /DATABASE_URL está em falta/
    );
  } finally {
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

test("resolveDatabaseProviderName defaults to supabase when unset", () => {
  const origProvider = process.env.DATABASE_PROVIDER;
  try {
    delete process.env.DATABASE_PROVIDER;
    assert.equal(resolveDatabaseProviderName(), "supabase");
  } finally {
    if (origProvider !== undefined) {
      process.env.DATABASE_PROVIDER = origProvider;
    } else {
      delete process.env.DATABASE_PROVIDER;
    }
  }
});

test("resolveDatabaseProviderName resolves neon when DATABASE_URL present", () => {
  const origProvider = process.env.DATABASE_PROVIDER;
  const origDbUrl = process.env.DATABASE_URL;
  try {
    process.env.DATABASE_PROVIDER = "neon";
    process.env.DATABASE_URL = "postgres://test:test@localhost:5432/test";
    assert.equal(resolveDatabaseProviderName(), "neon");
    const provider = getEditionDatabaseProvider();
    assert.equal(provider.name, "neon");
  } finally {
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

test("getEditionDatabaseProvider respects test seam override", () => {
  const mockProvider: EditionDatabaseProvider = {
    name: "neon",
    isConfigured: () => true,
    listMemoriesPhotos: async () => [],
    insertPendingPhoto: async () => true,
    createUploadIntent: async () => {},
    consumeUploadIntent: async () => null,
    checkApiRateLimit: async () => ({ allowed: true, remaining: 10, retryAfterSeconds: 0 }),
    getLeaderboardPhotos: async () => [],
    getParticipantPhotos: async () => [],
    updateModerationStatus: async () => true,
    listGiftReservations: async () => [],
    reserveGift: async () => ({ ok: true }),
  };

  try {
    __setEditionDatabaseProviderForTests(mockProvider);
    assert.equal(getEditionDatabaseProvider(), mockProvider);
  } finally {
    __setEditionDatabaseProviderForTests(null);
  }
});
