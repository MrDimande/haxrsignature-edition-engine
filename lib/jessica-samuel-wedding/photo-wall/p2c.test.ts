import assert from "node:assert/strict";
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { afterEach, beforeEach, describe, it } from "node:test";
import { POST as reserveGiftPost } from "../../../app/api/gifts/reserve/route";
import {
  __setPublicMutationRateLimitForTests,
  publicMutationRateLimit,
  publicMutationRateLimitKey,
} from "@lib/security/mutation-rate-limit";
import type { RateLimitConfig, RateLimitResult } from "@lib/security/rate-limit";
import { JESSICA_SAMUEL_PHOTO_WALL } from "./config";
import { createPhotoUploadIntent, __setSignedUploadUrlForTests } from "./upload-intent";
import {
  __setPhotoUploadIntentRepositoryForTests,
  type CreatePhotoUploadIntentRecordInput,
  type ConsumePhotoUploadIntentInput,
  type PhotoUploadIntentRecord,
  type PhotoUploadIntentRepository,
} from "./upload-intent-store";
import { completePhotoUpload, __setPhotoWallRuntimeForTests } from "./gallery";
import { __isJessicaSamuelGiftFileStoreAllowedForTests } from "@lib/jessica-samuel-wedding/gifts/inventory";

class FakeIntentRepository implements PhotoUploadIntentRepository {
  records = new Map<string, PhotoUploadIntentRecord>();
  created: CreatePhotoUploadIntentRecordInput[] = [];
  consumeCalls = 0;

  async create(input: CreatePhotoUploadIntentRecordInput): Promise<void> {
    this.created.push(input);
    this.records.set(input.photoId, {
      photoId: input.photoId,
      slug: input.slug,
      bucketName: input.bucketName,
      storagePath: input.storagePath,
      contentType: input.contentType,
      declaredFileSizeBytes: input.declaredFileSizeBytes,
      status: "pending",
      createdAt: new Date().toISOString(),
      expiresAt: input.expiresAt,
      consumedAt: null,
    });
  }

  async consume(
    input: ConsumePhotoUploadIntentInput
  ): Promise<PhotoUploadIntentRecord | null> {
    this.consumeCalls += 1;
    const record = this.records.get(input.photoId);
    if (!record) return null;
    if (record.slug !== input.slug) return null;
    if (record.bucketName !== input.bucketName) return null;
    if (record.status !== "pending") return null;
    if (new Date(record.expiresAt) <= new Date(input.nowIso)) return null;

    const consumed = {
      ...record,
      status: "consumed" as const,
      consumedAt: input.nowIso,
    };
    this.records.set(input.photoId, consumed);
    return consumed;
  }
}

const originalEnv = { ...process.env };
const originalPhotoWallEnabled = JESSICA_SAMUEL_PHOTO_WALL.enabled;

function setPhotoWallEnabled(enabled: boolean): void {
  (JESSICA_SAMUEL_PHOTO_WALL as unknown as { enabled: boolean }).enabled =
    enabled;
}

function setSupabaseConfigured(): void {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.example.test";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-test-key";
}

function allowAllRateLimits(): void {
  __setPublicMutationRateLimitForTests(async () => ({
    allowed: true,
    remaining: 99,
    retryAfterSeconds: 0,
  }));
}

function jpegBlob(): Blob {
  return new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0x00])], {
    type: "image/jpeg",
  });
}

beforeEach(() => {
  process.env = { ...originalEnv };
  setPhotoWallEnabled(originalPhotoWallEnabled);
  __setPublicMutationRateLimitForTests(null);
  __setPhotoUploadIntentRepositoryForTests(null);
  __setSignedUploadUrlForTests(null);
  __setPhotoWallRuntimeForTests(null);
});

afterEach(() => {
  process.env = { ...originalEnv };
  setPhotoWallEnabled(originalPhotoWallEnabled);
  __setPublicMutationRateLimitForTests(null);
  __setPhotoUploadIntentRepositoryForTests(null);
  __setSignedUploadUrlForTests(null);
  __setPhotoWallRuntimeForTests(null);
});

describe("P2C public mutation rate limiting", () => {
  it("uses hashed requester fingerprints without raw IP or PII in keys", async () => {
    const request = new Request("https://example.test", {
      headers: {
        "x-forwarded-for": "203.0.113.10",
        "user-agent": "P2C Test Agent",
      },
    });
    const key = publicMutationRateLimitKey({
      scope: "gifts",
      slug: "jessica-samuel",
      action: "reserve",
      request,
    });

    assert.match(key, /^edition:public-mutation:gifts:jessica-samuel:reserve:/);
    assert.doesNotMatch(key, /203\.0\.113\.10/);
    assert.doesNotMatch(key, /P2C Test Agent/);

    const counts = new Map<string, number>();
    __setPublicMutationRateLimitForTests(
      async (bucketKey: string, config: RateLimitConfig): Promise<RateLimitResult> => {
        const count = (counts.get(bucketKey) ?? 0) + 1;
        counts.set(bucketKey, count);
        return {
          allowed: count <= config.max,
          remaining: Math.max(0, config.max - count),
          retryAfterSeconds: count <= config.max ? 0 : 60,
        };
      }
    );

    const config = { max: 1, windowMs: 60_000 };
    const first = await publicMutationRateLimit(
      { scope: "gifts", slug: "jessica-samuel", action: "reserve", request },
      config
    );
    const second = await publicMutationRateLimit(
      { scope: "gifts", slug: "jessica-samuel", action: "reserve", request },
      config
    );

    assert.equal(first.allowed, true);
    assert.equal(second.allowed, false);
    assert.equal(first.key, second.key);
  });

  it("gift reserve returns 429 before reservation mutation when persistent limit is exceeded", async () => {
    __setPublicMutationRateLimitForTests(async () => ({
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 90,
    }));

    const response = await reserveGiftPost(
      new Request("https://example.test/api/gifts/reserve", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": "198.51.100.9",
        },
        body: JSON.stringify({
          slug: "jessica-samuel",
          itemId: "00000000-0000-0000-0000-000000000001",
          guestName: "Convidada Teste",
          guestPhone: "840000000",
          quantity: 1,
        }),
      })
    );

    assert.equal(response.status, 429);
    assert.equal(response.headers.get("Retry-After"), "90");
    const body = await response.json();
    assert.equal(body.success, false);
    assert.equal(body.code, "RATE_LIMITED");
    assert.doesNotMatch(JSON.stringify(body), /Convidada Teste|840000000/);
  });
});

describe("P2C durable photo upload intents", () => {
  it("persists valid intents through repository metadata only", async () => {
    setPhotoWallEnabled(true);
    setSupabaseConfigured();
    allowAllRateLimits();
    const repo = new FakeIntentRepository();
    __setPhotoUploadIntentRepositoryForTests(repo);
    __setSignedUploadUrlForTests(async () => ({
      signedUrl: "https://upload.example.test/signed",
    }));

    const result = await createPhotoUploadIntent(
      {
        slug: "jessicasamuelwedding",
        fileName: "foto.jpg",
        contentType: "image/jpeg",
        fileSizeBytes: 1024,
        guestName: "Nome Privado",
        caption: "Legenda privada",
      },
      new Request("https://example.test", {
        headers: { "x-forwarded-for": "203.0.113.20" },
      })
    );

    assert.equal(result.success, true);
    assert.equal(repo.created.length, 1);
    const created = repo.created[0];
    assert.equal(created.slug, "jessica-samuel");
    assert.equal(created.bucketName, "wedding-photos");
    assert.match(created.storagePath, /^jessica-samuel\/.+\/original\.jpg$/);
    assert.equal(created.contentType, "image/jpeg");
    assert.equal(created.declaredFileSizeBytes, 1024);
    assert.equal("guestName" in created, false);
    assert.equal("caption" in created, false);
  });

  it("disabled and unknown Photo Wall contexts never create intents or consume rate limit", async () => {
    const repo = new FakeIntentRepository();
    let rateLimitCalls = 0;
    __setPhotoUploadIntentRepositoryForTests(repo);
    __setPublicMutationRateLimitForTests(async () => {
      rateLimitCalls += 1;
      return { allowed: true, remaining: 1, retryAfterSeconds: 0 };
    });

    setPhotoWallEnabled(false);
    const disabled = await createPhotoUploadIntent(
      {
        slug: "jessica-samuel",
        fileName: "foto.jpg",
        contentType: "image/jpeg",
        fileSizeBytes: 1024,
      },
      new Request("https://example.test")
    );
    assert.equal(disabled.success, false);
    assert.equal(disabled.code, "PHOTO_WALL_CLOSED");

    setPhotoWallEnabled(true);
    const unknown = await createPhotoUploadIntent(
      {
        slug: "unknown-slug",
        fileName: "foto.jpg",
        contentType: "image/jpeg",
        fileSizeBytes: 1024,
      },
      new Request("https://example.test")
    );
    assert.equal(unknown.success, false);
    assert.equal(unknown.code, "NOT_FOUND");
    assert.equal(repo.created.length, 0);
    assert.equal(rateLimitCalls, 0);
  });

  it("photo intent returns 429 before creating a signed upload URL", async () => {
    setPhotoWallEnabled(true);
    const repo = new FakeIntentRepository();
    let signedUrlCalls = 0;
    __setPhotoUploadIntentRepositoryForTests(repo);
    __setPublicMutationRateLimitForTests(async () => ({
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 30,
    }));
    __setSignedUploadUrlForTests(async () => {
      signedUrlCalls += 1;
      return { signedUrl: "https://upload.example.test/signed" };
    });

    const result = await createPhotoUploadIntent(
      {
        slug: "jessica-samuel",
        fileName: "foto.jpg",
        contentType: "image/jpeg",
        fileSizeBytes: 1024,
      },
      new Request("https://example.test")
    );

    assert.equal(result.success, false);
    assert.equal(result.code, "RATE_LIMITED");
    assert.equal(result.retryAfterSeconds, 30);
    assert.equal(repo.created.length, 0);
    assert.equal(signedUrlCalls, 0);
  });

  it("rejects expired, consumed, foreign-slug and tampered-path intents", async () => {
    setPhotoWallEnabled(true);
    setSupabaseConfigured();
    allowAllRateLimits();
    const repo = new FakeIntentRepository();
    __setPhotoUploadIntentRepositoryForTests(repo);
    let downloadCalls = 0;
    __setPhotoWallRuntimeForTests({
      async download() {
        downloadCalls += 1;
        return jpegBlob();
      },
      async remove() {},
      async insertPendingPhoto() {
        return true;
      },
    });

    const base = {
      photoId: "00000000-0000-0000-0000-000000000010",
      slug: "jessica-samuel",
      bucketName: "wedding-photos",
      storagePath:
        "jessica-samuel/00000000-0000-0000-0000-000000000010/original.jpg",
      contentType: "image/jpeg",
      declaredFileSizeBytes: 1024,
      status: "pending" as const,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() - 1000).toISOString(),
      consumedAt: null,
    };

    repo.records.set(base.photoId, base);
    const expired = await completePhotoUpload(
      "jessica-samuel",
      base.photoId,
      new Request("https://example.test")
    );
    assert.equal(expired.success, false);
    assert.equal(expired.code, "INTENT_EXPIRED");

    const validId = "00000000-0000-0000-0000-000000000011";
    repo.records.set(validId, {
      ...base,
      photoId: validId,
      storagePath: `jessica-samuel/${validId}/original.jpg`,
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    });

    const first = await completePhotoUpload(
      "jessica-samuel",
      validId,
      new Request("https://example.test"),
      { guestName: "Guest", caption: "Caption" }
    );
    assert.equal(first.success, true);

    const second = await completePhotoUpload(
      "jessica-samuel",
      validId,
      new Request("https://example.test")
    );
    assert.equal(second.success, false);
    assert.equal(second.code, "INTENT_EXPIRED");

    const foreign = await completePhotoUpload(
      "jessicakulaya",
      validId,
      new Request("https://example.test")
    );
    assert.equal(foreign.success, false);
    assert.equal(foreign.code, "NOT_FOUND");

    const badPathId = "00000000-0000-0000-0000-000000000012";
    repo.records.set(badPathId, {
      ...base,
      photoId: badPathId,
      storagePath: `other-slug/${badPathId}/original.jpg`,
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    });

    const badPath = await completePhotoUpload(
      "jessica-samuel",
      badPathId,
      new Request("https://example.test")
    );
    assert.equal(badPath.success, false);
    assert.equal(badPath.code, "INVALID_INTENT");
    assert.equal(downloadCalls, 1);
  });

  it("runtime upload-intent authority no longer uses an in-memory Map", () => {
    const source = fs.readFileSync(
      "lib/jessica-samuel-wedding/photo-wall/upload-intent.ts",
      "utf8"
    );
    assert.doesNotMatch(source, /new Map|intentStore/);
  });
});

describe("P2C local reservation fallback PII protection", () => {
  it("runtime reservation files are ignored by Git", () => {
    const gitignore = fs.readFileSync(".gitignore", "utf8");
    assert.match(gitignore, /data\/gifts\/\*reservations\*\.json/);

    const check = spawnSync(
      "git",
      ["check-ignore", "-q", "data/gifts/jessica-samuel-reservations.json"],
      { cwd: process.cwd() }
    );
    assert.equal(check.status, 0);
  });

  it("development fallback remains disabled for production persistence path", () => {
    assert.equal(
      __isJessicaSamuelGiftFileStoreAllowedForTests({
        NODE_ENV: "production",
        NEXT_PUBLIC_SUPABASE_URL: "https://supabase.example.test",
        SUPABASE_SERVICE_ROLE_KEY: "service-role",
      } as NodeJS.ProcessEnv),
      false
    );
  });
});
