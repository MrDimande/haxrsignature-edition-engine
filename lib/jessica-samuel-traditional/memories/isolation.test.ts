import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  createTraditionalMemoryUploadIntent,
  completeTraditionalMemoryUpload,
  __setTraditionalSignedUploadUrlForTests,
} from "./upload";
import {
  createPhotoUploadIntent,
  __setSignedUploadUrlForTests as __setWeddingSignedUrl,
} from "@lib/jessica-samuel-wedding/photo-wall/upload-intent";
import { completePhotoUpload } from "@lib/jessica-samuel-wedding/photo-wall/gallery";
import { JESSICA_SAMUEL_PHOTO_WALL } from "@lib/jessica-samuel-wedding/photo-wall/config";
import {
  __setPhotoUploadIntentRepositoryForTests,
  type PhotoUploadIntentRepository,
  type PhotoUploadIntentRecord,
} from "@lib/jessica-samuel-wedding/photo-wall/upload-intent-store";

// Mock repository em memória para testes de isolamento sem Supabase real
class InMemoryIntentRepo implements PhotoUploadIntentRepository {
  public intents = new Map<string, PhotoUploadIntentRecord>();

  async create(input: any): Promise<void> {
    this.intents.set(input.photoId, {
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

  async consume(input: any): Promise<PhotoUploadIntentRecord | null> {
    const record = this.intents.get(input.photoId);
    if (!record) return null;
    if (record.slug !== input.slug) return null;
    if (record.bucketName !== input.bucketName) return null;
    if (record.status !== "pending") return null;

    record.status = "consumed";
    record.consumedAt = input.nowIso;
    return record;
  }
}

describe("Memórias Traditional vs Wedding PhotoWall — Testes de Isolamento", () => {
  let mockRepo: InMemoryIntentRepo;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "mock-service-role-key";
    mockRepo = new InMemoryIntentRepo();
    __setPhotoUploadIntentRepositoryForTests(mockRepo);
    __setTraditionalSignedUploadUrlForTests(async () => ({
      signedUrl: "https://example.com/mock-upload-traditional",
    }));
    __setWeddingSignedUrl(async () => ({
      signedUrl: "https://example.com/mock-upload-wedding",
    }));
  });

  it("01. Upload Traditional utiliza o slug canónico e o prefixo de storage correto", async () => {
    const req = new Request("https://edition.haxrsignature.com/api/memories/upload-intent", {
      method: "POST",
      headers: { "x-forwarded-for": "127.0.0.1" },
    });

    const result = await createTraditionalMemoryUploadIntent(
      {
        slug: "jessicaesamueltraditionalwedding",
        fileName: "foto-mesa.jpg",
        contentType: "image/jpeg",
        fileSizeBytes: 1024 * 1024,
        challengeId: "01",
        tableId: "12",
      },
      req
    );

    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(
        result.storagePath.startsWith("jessicaesamueltraditionalwedding/"),
        true,
        "Storage path deve usar prefixo 'jessicaesamueltraditionalwedding/'"
      );

      const savedIntent = mockRepo.intents.get(result.photoId);
      assert.ok(savedIntent);
      assert.equal(savedIntent.slug, "jessicaesamueltraditionalwedding");
    }
  });

  it("02. Intent Traditional NÃO pode ser consumido pelo pipeline de Wedding (jessica-samuel)", async () => {
    const prevOpensAt = JESSICA_SAMUEL_PHOTO_WALL.opensAt;
    (JESSICA_SAMUEL_PHOTO_WALL as any).opensAt = null;

    try {
      const req = new Request("https://edition.haxrsignature.com/api/memories/upload-intent", {
        method: "POST",
        headers: { "x-forwarded-for": "127.0.0.2" },
      });

      const traditionalIntent = await createTraditionalMemoryUploadIntent(
        {
          slug: "jessicaesamueltraditionalwedding",
          fileName: "teste-isolamento.jpg",
          contentType: "image/jpeg",
          fileSizeBytes: 500000,
        },
        req
      );

      assert.equal(traditionalIntent.success, true);
      if (traditionalIntent.success) {
        // Tentar consumir o intent no pipeline do Wedding
        const completeReq = new Request("https://edition.haxrsignature.com/api/wedding-photos/complete", {
          method: "POST",
          headers: { "x-forwarded-for": "127.0.0.2" },
        });

        const weddingCompleteResult = await completePhotoUpload(
          "jessicasamuelwedding",
          traditionalIntent.photoId,
          completeReq
        );

        assert.equal(
          weddingCompleteResult.success,
          false,
          "O pipeline de Wedding não deve consumir um intent do Traditional"
        );
        assert.equal(weddingCompleteResult.code, "INTENT_EXPIRED");
      }
    } finally {
      (JESSICA_SAMUEL_PHOTO_WALL as any).opensAt = prevOpensAt;
    }
  });

  it("03. Intent Wedding (jessica-samuel) NÃO pode ser consumido pelo pipeline Traditional", async () => {
    const prevOpensAt = JESSICA_SAMUEL_PHOTO_WALL.opensAt;
    (JESSICA_SAMUEL_PHOTO_WALL as any).opensAt = null;

    try {
      const req = new Request("https://edition.haxrsignature.com/api/wedding-photos/upload-intent", {
        method: "POST",
        headers: { "x-forwarded-for": "127.0.0.3" },
      });

      const weddingIntent = await createPhotoUploadIntent(
        {
          slug: "jessicasamuelwedding",
          fileName: "foto-wedding.jpg",
          contentType: "image/jpeg",
          fileSizeBytes: 500000,
        },
        req
      );

      assert.equal(weddingIntent.success, true);
      if (weddingIntent.success) {
        assert.equal(
          weddingIntent.storagePath.startsWith("jessica-samuel/"),
          true,
          "Wedding deve continuar a usar o prefixo 'jessica-samuel/'"
        );

        // Tentar consumir o intent do Wedding no pipeline Traditional
        const completeReq = new Request("https://edition.haxrsignature.com/api/memories/complete", {
          method: "POST",
          headers: { "x-forwarded-for": "127.0.0.3" },
        });

        const traditionalCompleteResult = await completeTraditionalMemoryUpload(
          "jessicaesamueltraditionalwedding",
          weddingIntent.photoId,
          completeReq
        );

        assert.equal(
          traditionalCompleteResult.success,
          false,
          "O pipeline Traditional não deve consumir um intent do Wedding"
        );
        assert.equal(traditionalCompleteResult.code, "INTENT_EXPIRED");
      }
    } finally {
      (JESSICA_SAMUEL_PHOTO_WALL as any).opensAt = prevOpensAt;
    }
  });

  it("04. Convites sem a feature 'memories' ativada não aceitam criação de intent de memórias", async () => {
    const req = new Request("https://edition.haxrsignature.com/api/memories/upload-intent", {
      method: "POST",
      headers: { "x-forwarded-for": "127.0.0.4" },
    });

    const result = await createTraditionalMemoryUploadIntent(
      {
        slug: "stanturns5",
        fileName: "tentativa.jpg",
        contentType: "image/jpeg",
        fileSizeBytes: 500000,
      },
      req
    );

    assert.equal(result.success, false);
    assert.equal(result.code, "NOT_FOUND");
  });
});
