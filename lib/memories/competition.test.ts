import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  calculateLeaderboardFromPhotos,
  getParticipantProgressFromPhotos,
  type RawMemoryPhotoRow,
} from "./leaderboard";
import {
  createMemoryUploadIntent,
  completeMemoryUpload,
  __setSignedUploadUrlForMemoriesTests,
} from "./upload";
import { resolveMemoriesConfig } from "./config";
import {
  __setPhotoUploadIntentRepositoryForTests,
  type PhotoUploadIntentRepository,
  type PhotoUploadIntentRecord,
} from "@lib/jessica-samuel-wedding/photo-wall/upload-intent-store";

// Mock repository em memória
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

describe("Explorador da Noite — Testes de Competição, Whitelist, Identidade e Ranking", () => {
  let mockRepo: InMemoryIntentRepo;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "mock-service-role-key";
    mockRepo = new InMemoryIntentRepo();
    __setPhotoUploadIntentRepositoryForTests(mockRepo);
    __setSignedUploadUrlForMemoriesTests(async () => ({
      signedUrl: "https://example.com/mock-upload-memories",
    }));
  });

  it("01. Configuração resolve competition com totalChallenges 12 e whitelist para jessicasamuelwedding", () => {
    const config = resolveMemoriesConfig("jessicasamuelwedding");
    assert.ok(config);
    assert.ok(config.competition);
    assert.equal(config.competition.enabled, true);
    assert.equal(config.competition.totalChallenges, 12);
    assert.equal(config.challengeWhitelist.length, 12);
    assert.equal(config.challengeWhitelist.includes("01"), true);
    assert.equal(config.challengeWhitelist.includes("12"), true);
  });

  it("02. Whitelist de Desafios: Backend rejeita challengeId fora dos 12 válidos no Upload Intent", async () => {
    const req = new Request("https://edition.haxrsignature.com/api/memories/upload-intent", {
      method: "POST",
      headers: { "x-forwarded-for": "10.0.0.1" },
    });

    const invalidChallengeIntent = await createMemoryUploadIntent(
      {
        slug: "jessicasamuelwedding",
        fileName: "fake.jpg",
        contentType: "image/jpeg",
        fileSizeBytes: 1024,
        challengeId: "13", // fora da whitelist!
      },
      req
    );

    assert.equal(invalidChallengeIntent.success, false);
    if (!invalidChallengeIntent.success) {
      assert.equal(invalidChallengeIntent.error, "ID de desafio inválido.");
    }
  });

  it("03. Identidade do Participante: Validação estrita de formato UUID v4 no participante", async () => {
    const req = new Request("https://edition.haxrsignature.com/api/memories/upload-intent", {
      method: "POST",
      headers: { "x-forwarded-for": "10.0.0.1" },
    });

    const invalidParticipantIntent = await createMemoryUploadIntent(
      {
        slug: "jessicasamuelwedding",
        fileName: "test.jpg",
        contentType: "image/jpeg",
        fileSizeBytes: 1024,
        participantId: "not-a-valid-uuid", // inválido!
      },
      req
    );

    assert.equal(invalidParticipantIntent.success, false);
    if (!invalidParticipantIntent.success) {
      assert.equal(invalidParticipantIntent.error, "ID de participante inválido.");
    }

    const validUuid = "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d";
    const validIntent = await createMemoryUploadIntent(
      {
        slug: "jessicasamuelwedding",
        fileName: "test.jpg",
        contentType: "image/jpeg",
        fileSizeBytes: 1024,
        participantId: validUuid,
        challengeId: "01",
      },
      req
    );

    assert.equal(validIntent.success, true);
  });

  it("04. Regra de Contagem: Contagem por participante considera apenas challenge_ids únicos", () => {
    const p1 = "11111111-1111-4111-8111-111111111111";

    const photos: RawMemoryPhotoRow[] = [
      { id: "1", invitation_slug: "jessicasamuelwedding", participant_id: p1, guest_name: "Carlos", challenge_id: "01", created_at: "2026-08-15T20:00:00Z", moderation_status: "approved" },
      { id: "2", invitation_slug: "jessicasamuelwedding", participant_id: p1, guest_name: "Carlos", challenge_id: "02", created_at: "2026-08-15T20:05:00Z", moderation_status: "approved" },
      { id: "3", invitation_slug: "jessicasamuelwedding", participant_id: p1, guest_name: "Carlos", challenge_id: "03", created_at: "2026-08-15T20:10:00Z", moderation_status: "approved" },
      { id: "4", invitation_slug: "jessicasamuelwedding", participant_id: p1, guest_name: "Carlos", challenge_id: "03", created_at: "2026-08-15T20:15:00Z", moderation_status: "approved" },
      { id: "5", invitation_slug: "jessicasamuelwedding", participant_id: p1, guest_name: "Carlos", challenge_id: "03", created_at: "2026-08-15T20:20:00Z", moderation_status: "approved" },
      { id: "6", invitation_slug: "jessicasamuelwedding", participant_id: p1, guest_name: "Carlos", challenge_id: "04", created_at: "2026-08-15T20:25:00Z", moderation_status: "approved" },
      { id: "7", invitation_slug: "jessicasamuelwedding", participant_id: p1, guest_name: "Carlos", challenge_id: null, created_at: "2026-08-15T20:30:00Z", moderation_status: "approved" }, // momento livre
    ];

    const leaderboard = calculateLeaderboardFromPhotos(photos, "provisional");
    assert.equal(leaderboard.length, 1);
    assert.equal(leaderboard[0].displayName, "Carlos");
    assert.equal(leaderboard[0].completed, 4); // 4 desafios únicos (01, 02, 03, 04), NÃO 7!
    assert.equal(leaderboard[0].totalUploads, 7);
  });

  it("05. Nome Oficial do Competidor: Usa o guest_name não vazio mais recente do participante", () => {
    const p1 = "22222222-2222-4222-8222-222222222222";

    const photos: RawMemoryPhotoRow[] = [
      { id: "1", invitation_slug: "jessicasamuelwedding", participant_id: p1, guest_name: "Carlos", challenge_id: "01", created_at: "2026-08-15T20:00:00Z", moderation_status: "approved" },
      { id: "2", invitation_slug: "jessicasamuelwedding", participant_id: p1, guest_name: "Carlos M.", challenge_id: "02", created_at: "2026-08-15T21:00:00Z", moderation_status: "approved" }, // mudou de nome!
      { id: "3", invitation_slug: "jessicasamuelwedding", participant_id: p1, guest_name: "", challenge_id: "03", created_at: "2026-08-15T21:30:00Z", moderation_status: "approved" }, // sem nome neste upload
    ];

    const leaderboard = calculateLeaderboardFromPhotos(photos, "provisional");
    assert.equal(leaderboard.length, 1);
    assert.equal(leaderboard[0].displayName, "Carlos M.", "Deve usar o nome não vazio mais recente enviado ('Carlos M.')");
  });

  it("06. Ranking Provisório (pending + approved) vs Vencedor Final (apenas approved)", () => {
    const p1 = "33333333-3333-4333-8333-333333333333";

    const photos: RawMemoryPhotoRow[] = [
      { id: "1", invitation_slug: "jessicasamuelwedding", participant_id: p1, guest_name: "Mariana", challenge_id: "01", created_at: "2026-08-15T20:00:00Z", moderation_status: "approved" },
      { id: "2", invitation_slug: "jessicasamuelwedding", participant_id: p1, guest_name: "Mariana", challenge_id: "02", created_at: "2026-08-15T20:10:00Z", moderation_status: "pending" },
      { id: "3", invitation_slug: "jessicasamuelwedding", participant_id: p1, guest_name: "Mariana", challenge_id: "03", created_at: "2026-08-15T20:20:00Z", moderation_status: "rejected" },
    ];

    const provisional = calculateLeaderboardFromPhotos(photos, "provisional");
    assert.equal(provisional[0].completed, 2, "Provisório conta 01 (approved) + 02 (pending)");

    const finalWinner = calculateLeaderboardFromPhotos(photos, "final");
    assert.equal(finalWinner[0].completed, 1, "Vencedor final conta apenas 01 (approved)");
  });

  it("07. Regra de Desempate: Ganha quem atingiu a N-ésima conclusão de desafio primeiro", () => {
    const pMariana = "44444444-4444-4444-8444-444444444444";
    const pPaulo = "55555555-5555-4555-8555-555555555555";

    const photos: RawMemoryPhotoRow[] = [
      // Mariana atinge 3 desafios às 20:20:00
      { id: "m1", invitation_slug: "jessicasamuelwedding", participant_id: pMariana, guest_name: "Mariana", challenge_id: "01", created_at: "2026-08-15T20:00:00Z", moderation_status: "approved" },
      { id: "m2", invitation_slug: "jessicasamuelwedding", participant_id: pMariana, guest_name: "Mariana", challenge_id: "02", created_at: "2026-08-15T20:10:00Z", moderation_status: "approved" },
      { id: "m3", invitation_slug: "jessicasamuelwedding", participant_id: pMariana, guest_name: "Mariana", challenge_id: "03", created_at: "2026-08-15T20:20:00Z", moderation_status: "approved" },

      // Paulo atinge 3 desafios às 20:30:00
      { id: "p1", invitation_slug: "jessicasamuelwedding", participant_id: pPaulo, guest_name: "Paulo", challenge_id: "01", created_at: "2026-08-15T20:05:00Z", moderation_status: "approved" },
      { id: "p2", invitation_slug: "jessicasamuelwedding", participant_id: pPaulo, guest_name: "Paulo", challenge_id: "02", created_at: "2026-08-15T20:15:00Z", moderation_status: "approved" },
      { id: "p3", invitation_slug: "jessicasamuelwedding", participant_id: pPaulo, guest_name: "Paulo", challenge_id: "03", created_at: "2026-08-15T20:30:00Z", moderation_status: "approved" },
    ];

    const leaderboard = calculateLeaderboardFromPhotos(photos, "provisional");
    assert.equal(leaderboard.length, 2);
    assert.equal(leaderboard[0].displayName, "Mariana", "Mariana fica em 1º por ter terminado o 3º desafio às 20:20 (antes das 20:30 do Paulo)");
    assert.equal(leaderboard[1].displayName, "Paulo");
  });

  it("08. Endpoint de Progresso Pessoal: Reconcilia desafios únicos concluídos", () => {
    const p1 = "66666666-6666-4666-8666-666666666666";

    const photos: RawMemoryPhotoRow[] = [
      { id: "1", invitation_slug: "jessicasamuelwedding", participant_id: p1, guest_name: "Ana", challenge_id: "01", created_at: "2026-08-15T20:00:00Z", moderation_status: "approved" },
      { id: "2", invitation_slug: "jessicasamuelwedding", participant_id: p1, guest_name: "Ana", challenge_id: "05", created_at: "2026-08-15T20:05:00Z", moderation_status: "approved" },
      { id: "3", invitation_slug: "jessicasamuelwedding", participant_id: p1, guest_name: "Ana", challenge_id: "09", created_at: "2026-08-15T20:10:00Z", moderation_status: "rejected" }, // rejeitado não conta!
    ];

    const progress = getParticipantProgressFromPhotos(photos, p1);
    assert.deepEqual(progress, ["01", "05"]);
  });
});
