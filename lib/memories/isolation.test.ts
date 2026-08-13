import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  createMemoryUploadIntent,
  completeMemoryUpload,
  __setSignedUploadUrlForMemoriesTests,
} from "./upload";
import {
  resolveMemoriesConfig,
  isMemoriesEnabledForSlug,
} from "./config";
import {
  createPhotoUploadIntent,
  __setSignedUploadUrlForTests as __setPhotoWallSignedUrl,
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

describe("Generic Multi-Event Memories & Cross-Event Isolation Tests", () => {
  let mockRepo: InMemoryIntentRepo;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "mock-service-role-key";
    mockRepo = new InMemoryIntentRepo();
    __setPhotoUploadIntentRepositoryForTests(mockRepo);
    __setSignedUploadUrlForMemoriesTests(async () => ({
      signedUrl: "https://example.com/mock-upload-memories",
    }));
    __setPhotoWallSignedUrl(async () => ({
      signedUrl: "https://example.com/mock-upload-photowall",
    }));
  });

  it("01. Configuração genérica resolve os variants e slugs corretos para ambos os casamentos", () => {
    const traditionalConfig = resolveMemoriesConfig("jessicaesamueltraditionalwedding");
    assert.ok(traditionalConfig);
    assert.equal(traditionalConfig.invitationSlug, "jessicaesamueltraditionalwedding");
    assert.equal(traditionalConfig.variant, "traditional-memories");

    const plusConfig = resolveMemoriesConfig("jessicasamuelwedding");
    assert.ok(plusConfig);
    assert.equal(plusConfig.invitationSlug, "jessicasamuelwedding");
    assert.equal(plusConfig.variant, "plus-memories");

    // Convites sem memories
    assert.equal(isMemoriesEnabledForSlug("stanturns5"), false);
    assert.equal(resolveMemoriesConfig("stanturns5"), null);
  });

  it("02. Upload Intent para Plus Memories (jessicasamuelwedding) usa prefixo de storage 'jessicasamuelwedding/'", async () => {
    const req = new Request("https://edition.haxrsignature.com/api/memories/upload-intent", {
      method: "POST",
      headers: { "x-forwarded-for": "10.0.0.1" },
    });

    const result = await createMemoryUploadIntent(
      {
        slug: "jessicasamuelwedding",
        fileName: "foto-plus.jpg",
        contentType: "image/jpeg",
        fileSizeBytes: 1024 * 1024,
        challengeId: "05",
        tableId: "07",
      },
      req
    );

    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(
        result.storagePath.startsWith("jessicasamuelwedding/"),
        true,
        "Storage path do Plus Memories deve usar prefixo 'jessicasamuelwedding/'"
      );

      const savedIntent = mockRepo.intents.get(result.photoId);
      assert.ok(savedIntent);
      assert.equal(savedIntent.slug, "jessicasamuelwedding");
    }
  });

  it("03. Isolamento Bidireccional: Intent do Traditional NÃO pode ser consumido pelo Plus Memories (e vice-versa)", async () => {
    const req1 = new Request("https://edition.haxrsignature.com/api/memories/upload-intent", {
      method: "POST",
      headers: { "x-forwarded-for": "10.0.0.2" },
    });

    // 1. Criar intent no Traditional
    const traditionalIntent = await createMemoryUploadIntent(
      {
        slug: "jessicaesamueltraditionalwedding",
        fileName: "trad.jpg",
        contentType: "image/jpeg",
        fileSizeBytes: 500000,
      },
      req1
    );

    assert.equal(traditionalIntent.success, true);
    if (traditionalIntent.success) {
      // Tentar confirmar passando o slug do Plus Memories
      const completeReq = new Request("https://edition.haxrsignature.com/api/memories/complete", {
        method: "POST",
        headers: { "x-forwarded-for": "10.0.0.2" },
      });

      const completeResult = await completeMemoryUpload(
        "jessicasamuelwedding", // slug errado!
        traditionalIntent.photoId,
        completeReq
      );

      assert.equal(completeResult.success, false);
      assert.equal(completeResult.code, "INTENT_EXPIRED");
    }

    // 2. Criar intent no Plus Memories
    const req2 = new Request("https://edition.haxrsignature.com/api/memories/upload-intent", {
      method: "POST",
      headers: { "x-forwarded-for": "10.0.0.3" },
    });

    const plusIntent = await createMemoryUploadIntent(
      {
        slug: "jessicasamuelwedding",
        fileName: "plus.jpg",
        contentType: "image/jpeg",
        fileSizeBytes: 500000,
      },
      req2
    );

    assert.equal(plusIntent.success, true);
    if (plusIntent.success) {
      // Tentar confirmar passando o slug do Traditional
      const completeReq = new Request("https://edition.haxrsignature.com/api/memories/complete", {
        method: "POST",
        headers: { "x-forwarded-for": "10.0.0.3" },
      });

      const completeResult = await completeMemoryUpload(
        "jessicaesamueltraditionalwedding", // slug errado!
        plusIntent.photoId,
        completeReq
      );

      assert.equal(completeResult.success, false);
      assert.equal(completeResult.code, "INTENT_EXPIRED");
    }
  });

  it("04. Isolamento Photo Wall vs Plus Memories: Photo Wall continua a usar prefixo 'jessica-samuel/' e os dois pipelines são independentes", async () => {
    const prevOpensAt = JESSICA_SAMUEL_PHOTO_WALL.opensAt;
    (JESSICA_SAMUEL_PHOTO_WALL as any).opensAt = null;

    try {
      // 1. Criar intent no Photo Wall
      const reqPW = new Request("https://edition.haxrsignature.com/api/wedding-photos/upload-intent", {
        method: "POST",
        headers: { "x-forwarded-for": "10.0.0.4" },
      });

      const pwIntent = await createPhotoUploadIntent(
        {
          slug: "jessicasamuelwedding",
          fileName: "pw.jpg",
          contentType: "image/jpeg",
          fileSizeBytes: 500000,
        },
        reqPW
      );

      assert.equal(pwIntent.success, true);
      if (pwIntent.success) {
        assert.equal(
          pwIntent.storagePath.startsWith("jessica-samuel/"),
          true,
          "Photo Wall existente deve continuar a usar a sua identidade 'jessica-samuel/'"
        );

        // Tentar consumir no pipeline do Plus Memories
        const reqCompleteMemories = new Request("https://edition.haxrsignature.com/api/memories/complete", {
          method: "POST",
          headers: { "x-forwarded-for": "10.0.0.4" },
        });

        const crossResult = await completeMemoryUpload(
          "jessicasamuelwedding",
          pwIntent.photoId,
          reqCompleteMemories
        );

        assert.equal(
          crossResult.success,
          false,
          "Plus Memories não deve consumir um intent do Photo Wall"
        );
      }
    } finally {
      (JESSICA_SAMUEL_PHOTO_WALL as any).opensAt = prevOpensAt;
    }
  });
});
