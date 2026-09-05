import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { createMemoryUploadIntent, completeMemoryUpload } from "./upload";
import {
  isMemoriesWriteFrozen,
  HAXR_STORAGE_WRITE_FREEZE_ENV,
  STORAGE_WRITE_FROZEN_CODE,
  __setMemoriesStorageProviderForTests,
} from "./storage";
import { __setPhotoUploadIntentRepositoryForTests } from "@lib/jessica-samuel-wedding/photo-wall/upload-intent-store";

describe("HAXR Signature Edition — Memories Upload Flow & Freeze Integration", () => {
  const origSupaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const origSupaKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  before(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "mock-service-role-key";
  });

  after(() => {
    if (origSupaUrl !== undefined) process.env.NEXT_PUBLIC_SUPABASE_URL = origSupaUrl;
    else delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (origSupaKey !== undefined) process.env.SUPABASE_SERVICE_ROLE_KEY = origSupaKey;
    else delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  test("createMemoryUploadIntent fails closed immediately with 503 code when freeze is active", async () => {
    const originalFreeze = process.env[HAXR_STORAGE_WRITE_FREEZE_ENV];
    try {
      process.env[HAXR_STORAGE_WRITE_FREEZE_ENV] = "true";

      let dbInsertCalled = false;
      __setPhotoUploadIntentRepositoryForTests({
        create: async () => {
          dbInsertCalled = true;
        },
        consume: async () => null,
      });

      const fakeReq = new Request("https://edition.haxrsignature.com/api/memories/upload-intent", {
        method: "POST",
      });

      const result = await createMemoryUploadIntent(
        {
          slug: "jessicasamuelwedding",
          fileName: "photo.jpg",
          contentType: "image/jpeg",
          fileSizeBytes: 1024 * 1024,
        },
        fakeReq
      );

      assert.equal(result.success, false);
      assert.equal((result as any).code, STORAGE_WRITE_FROZEN_CODE);
      assert.equal(dbInsertCalled, false, "Database insert MUST NOT be called when freeze is active");
    } finally {
      if (originalFreeze !== undefined) process.env[HAXR_STORAGE_WRITE_FREEZE_ENV] = originalFreeze;
      else delete process.env[HAXR_STORAGE_WRITE_FREEZE_ENV];
      __setPhotoUploadIntentRepositoryForTests(null);
    }
  });

  test("completeMemoryUpload remains callable during freeze to drain pending intents", async () => {
    const originalFreeze = process.env[HAXR_STORAGE_WRITE_FREEZE_ENV];
    try {
      process.env[HAXR_STORAGE_WRITE_FREEZE_ENV] = "true";

      let consumeCalled = false;
      __setPhotoUploadIntentRepositoryForTests({
        create: async () => {},
        consume: async (input) => {
          consumeCalled = true;
          // return intent expired to verify it reached consume logic
          return null;
        },
      });

      const fakeReq = new Request("https://edition.haxrsignature.com/api/memories/complete", {
        method: "POST",
      });

      const result = await completeMemoryUpload("jessicasamuelwedding", "67a29bbd-6840-43c8-8b8e-31865023bf51", fakeReq);

      assert.equal(consumeCalled, true, "Complete MUST execute consume check even when freeze is true (drain window)");
      assert.equal(result.code, "INTENT_EXPIRED");
    } finally {
      if (originalFreeze !== undefined) process.env[HAXR_STORAGE_WRITE_FREEZE_ENV] = originalFreeze;
      else delete process.env[HAXR_STORAGE_WRITE_FREEZE_ENV];
      __setPhotoUploadIntentRepositoryForTests(null);
    }
  });

  test("completeMemoryUpload purges malformed object when magic bytes do not match", async () => {
    let purgedPath = "";
    const mockProvider = {
      providerName: "r2-s3" as const,
      createSignedUploadUrl: async () => ({ uploadUrl: "https://mock" }),
      createSignedDownloadUrl: async () => ({ downloadUrl: "https://mock" }),
      getObjectInfo: async () => ({ exists: true, contentLength: 1024, contentType: "image/jpeg" }),
      readObjectPrefix: async () => new Uint8Array([0x00, 0x00, 0x00, 0x00]), // corrupt bytes
      remove: async (p: string) => {
        purgedPath = p;
      },
    };

    __setMemoriesStorageProviderForTests(mockProvider);
    __setPhotoUploadIntentRepositoryForTests({
      create: async () => {},
      consume: async () => ({
        photoId: "67a29bbd-6840-43c8-8b8e-31865023bf51",
        slug: "jessicasamuelwedding",
        bucketName: "wedding-photos",
        storagePath: "jessicasamuelwedding/67a29bbd-6840-43c8-8b8e-31865023bf51/original.jpg",
        contentType: "image/jpeg",
        declaredFileSizeBytes: 1024,
        status: "pending",
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 60000).toISOString(),
        consumedAt: null,
      }),
    });

    const fakeReq = new Request("https://edition.haxrsignature.com/api/memories/complete", {
      method: "POST",
    });

    try {
      const result = await completeMemoryUpload("jessicasamuelwedding", "67a29bbd-6840-43c8-8b8e-31865023bf51", fakeReq);
      assert.equal(result.success, false);
      assert.equal(result.code, "INVALID_SIGNATURE");
      assert.equal(purgedPath, "jessicasamuelwedding/67a29bbd-6840-43c8-8b8e-31865023bf51/original.jpg", "Malformed object must be purged");
    } finally {
      __setMemoriesStorageProviderForTests(null);
      __setPhotoUploadIntentRepositoryForTests(null);
    }
  });

  test("completeMemoryUpload purges object when actual size exceeds declared size", async () => {
    let purgedPath = "";
    const mockProvider = {
      providerName: "r2-s3" as const,
      createSignedUploadUrl: async () => ({ uploadUrl: "https://mock" }),
      createSignedDownloadUrl: async () => ({ downloadUrl: "https://mock" }),
      getObjectInfo: async () => ({ exists: true, contentLength: 5000, contentType: "image/jpeg" }),
      readObjectPrefix: async () => new Uint8Array([0xff, 0xd8, 0xff]), // valid JPEG
      remove: async (p: string) => {
        purgedPath = p;
      },
    };

    __setMemoriesStorageProviderForTests(mockProvider);
    __setPhotoUploadIntentRepositoryForTests({
      create: async () => {},
      consume: async () => ({
        photoId: "67a29bbd-6840-43c8-8b8e-31865023bf51",
        slug: "jessicasamuelwedding",
        bucketName: "wedding-photos",
        storagePath: "jessicasamuelwedding/67a29bbd-6840-43c8-8b8e-31865023bf51/original.jpg",
        contentType: "image/jpeg",
        declaredFileSizeBytes: 2000, // declared smaller than actual 5000
        status: "pending",
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 60000).toISOString(),
        consumedAt: null,
      }),
    });

    const fakeReq = new Request("https://edition.haxrsignature.com/api/memories/complete", {
      method: "POST",
    });

    try {
      const result = await completeMemoryUpload("jessicasamuelwedding", "67a29bbd-6840-43c8-8b8e-31865023bf51", fakeReq);
      assert.equal(result.success, false);
      assert.equal(purgedPath, "jessicasamuelwedding/67a29bbd-6840-43c8-8b8e-31865023bf51/original.jpg", "Oversized object must be purged");
    } finally {
      __setMemoriesStorageProviderForTests(null);
      __setPhotoUploadIntentRepositoryForTests(null);
    }
  });
});
