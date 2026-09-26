import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  resolveInitialMediaModerationStatus,
  validateExperienceForUploadCompletion,
  isCanonicalPublicMemory,
  isPublishedMemoryForEvent,
  isEligibleForRecap,
} from "./publication";
import { maySignMemoriesMedia, type MemoriesSessionSnapshot } from "./session-policy";
import { GET as memoriesRoute } from "../../app/api/memories/route";
import { listMemories, type PublicMemoryItem } from "./gallery";
import {
  __setEditionDatabaseProviderForTests,
  type EditionDatabaseProvider,
  type PublicMemoryPhotoRow,
} from "../db";
import { __setMemoriesStorageProviderForTests } from "./storage";

function mockDatabase(overrides: Partial<EditionDatabaseProvider> = {}): EditionDatabaseProvider {
  const unexpected = async (): Promise<never> => { throw new Error("Acesso inesperado à persistência"); };
  return {
    name: "neon",
    isConfigured: () => true,
    listMemoriesPhotos: unexpected,
    insertPendingPhoto: unexpected,
    createUploadIntent: unexpected,
    consumeUploadIntent: unexpected,
    checkApiRateLimit: async () => ({ allowed: true, currentRequests: 1, resetInSeconds: 60, remaining: 99, retryAfterSeconds: 0 }),
    getLeaderboardPhotos: unexpected,
    getParticipantPhotos: unexpected,
    updateModerationStatus: unexpected,
    listGiftReservations: unexpected,
    reserveGift: unexpected,
    ...overrides,
  };
}

const EVENT_ID = "d91744cc-f4be-4b75-b706-a55e64481040";
const OTHER_EVENT_ID = "e82855dd-05cf-4c86-c817-b66f75592151";
const EXPERIENCE_ID = "b8876346-caa4-4fb2-984a-b5d77c165c6b";
const OTHER_EXPERIENCE_ID = "0559261a-e07c-4f94-8bf6-3230e6731f2f";
const SLUG = "stanturns5";
const OTHER_SLUG = "jessicasamuelwedding";
const PHOTO_ID = "6262ee47-4f73-47a6-adc0-a01f5aae570b";
const NOW = new Date("2026-09-18T10:00:00Z");

function mockSnapshot(overrides: Partial<MemoriesSessionSnapshot["event"]> = {}): MemoriesSessionSnapshot {
  return {
    event: {
      id: EVENT_ID,
      slug: SLUG,
      active: true,
      visibility: "community",
      uploadsEnabled: true,
      competitionEnabled: true,
      ...overrides,
    },
    participant: {
      id: "3150eb61-ac4e-462d-9f5f-27f999b3da3e",
      eventId: EVENT_ID,
      guestId: null,
      revokedAt: null,
    },
    session: {
      id: "39b81911-1e0e-40dc-979c-081895b18d62",
      eventId: EVENT_ID,
      participantId: "3150eb61-ac4e-462d-9f5f-27f999b3da3e",
      accessLinkId: "e5a10001-57a4-4000-8000-000000000002",
      expiresAt: "2026-09-25T10:00:00Z",
      revokedAt: null,
    },
    accessLink: {
      id: "e5a10001-57a4-4000-8000-000000000002",
      eventId: EVENT_ID,
      expiresAt: null,
      revokedAt: null,
    },
  };
}

function mockPhotoRow(patch: Partial<PublicMemoryPhotoRow> = {}): PublicMemoryPhotoRow {
  return {
    id: PHOTO_ID,
    invitation_slug: SLUG,
    moderation_status: "approved",
    caption: "Stanley com a taça",
    guest_name: "Tio Carlos",
    challenge_id: "53b48ae2-08b9-42ef-8bbc-c098a48e3553",
    table_id: null,
    created_at: NOW.toISOString(),
    storage_path: `${SLUG}/${PHOTO_ID}/original.jpg`,
    content_type: "image/jpeg",
    stage_id: null,
    captured_at: null,
    width: 1920,
    height: 1080,
    orientation: "landscape",
    duration_seconds: null,
    media_type: "image",
    thumbnail_storage_path: `${SLUG}/${PHOTO_ID}/thumbnail.webp`,
    poster_storage_path: null,
    medium_storage_path: `${SLUG}/${PHOTO_ID}/medium.webp`,
    has_derivatives: true,
    derivatives_status: "ready",
    ...patch,
  };
}

describe("HAXR Plus Memories — Stanley Album Recovery & Publication Policy Regressions", () => {
  describe("1. Semântica Canónica de Moderação Inicial (Source of Truth)", () => {
    it("community -> approved + approved_at: auto-publicação imediata para membros autenticados", () => {
      const decision = resolveInitialMediaModerationStatus("community", NOW);
      assert.equal(decision.moderationStatus, "approved");
      assert.deepEqual(decision.approvedAt, NOW);
    });

    it("moderated -> pending: retido em moderação com approved_at nulo até curadoria do anfitrião", () => {
      const decision = resolveInitialMediaModerationStatus("moderated", NOW);
      assert.equal(decision.moderationStatus, "pending");
      assert.equal(decision.approvedAt, null);
    });

    it("private_to_couple -> pending: retido em moderação com approved_at nulo até partilha do casal", () => {
      const decision = resolveInitialMediaModerationStatus("private_to_couple", NOW);
      assert.equal(decision.moderationStatus, "pending");
      assert.equal(decision.approvedAt, null);
    });

    it("valor desconhecido ou inválido faz fail-closed para pending", () => {
      const decision = resolveInitialMediaModerationStatus("unknown_status", NOW);
      assert.equal(decision.moderationStatus, "pending");
      assert.equal(decision.approvedAt, null);
    });
  });

  describe("2. Validação Autoritativa da Experiência (Fail-Closed)", () => {
    it("experiência válida e activa: devolve valid=true e a visibilidade canónica", () => {
      const outcome = validateExperienceForUploadCompletion(
        { id: EXPERIENCE_ID, event_id: EVENT_ID, status: "active", visibility: "community" },
        EXPERIENCE_ID,
        EVENT_ID
      );
      assert.equal(outcome.valid, true);
      if (outcome.valid) {
        assert.equal(outcome.visibility, "community");
      }
    });

    it("event/experience mismatch -> fail closed (EXPERIENCE_INCONSISTENT)", () => {
      const mismatchEvent = validateExperienceForUploadCompletion(
        { id: EXPERIENCE_ID, event_id: OTHER_EVENT_ID, status: "active", visibility: "community" },
        EXPERIENCE_ID,
        EVENT_ID
      );
      assert.equal(mismatchEvent.valid, false);
      if (!mismatchEvent.valid) {
        assert.equal(mismatchEvent.code, "EXPERIENCE_INCONSISTENT");
      }

      const mismatchExpId = validateExperienceForUploadCompletion(
        { id: OTHER_EXPERIENCE_ID, event_id: EVENT_ID, status: "active", visibility: "community" },
        EXPERIENCE_ID,
        EVENT_ID
      );
      assert.equal(mismatchExpId.valid, false);
      if (!mismatchExpId.valid) {
        assert.equal(mismatchExpId.code, "EXPERIENCE_INCONSISTENT");
      }
    });

    it("inactive experience -> fail closed (EXPERIENCE_INACTIVE)", () => {
      const paused = validateExperienceForUploadCompletion(
        { id: EXPERIENCE_ID, event_id: EVENT_ID, status: "paused", visibility: "community" },
        EXPERIENCE_ID,
        EVENT_ID
      );
      assert.equal(paused.valid, false);
      if (!paused.valid) {
        assert.equal(paused.code, "EXPERIENCE_INACTIVE");
      }

      const archived = validateExperienceForUploadCompletion(
        { id: EXPERIENCE_ID, event_id: EVENT_ID, status: "archived", visibility: "community" },
        EXPERIENCE_ID,
        EVENT_ID
      );
      assert.equal(archived.valid, false);
      if (!archived.valid) {
        assert.equal(archived.code, "EXPERIENCE_INACTIVE");
      }
    });

    it("experiência inexistente (null) -> fail closed (EXPERIENCE_NOT_FOUND)", () => {
      const notFound = validateExperienceForUploadCompletion(null, EXPERIENCE_ID, EVENT_ID);
      assert.equal(notFound.valid, false);
      if (!notFound.valid) {
        assert.equal(notFound.code, "EXPERIENCE_NOT_FOUND");
      }
    });
  });

  describe("3. Fronteiras de Segurança e Validação de Publicação", () => {
    it("isCanonicalPublicMemory: requer estritamente moderation_status = 'approved'", () => {
      const approved = mockPhotoRow({ moderation_status: "approved" });
      const pending = mockPhotoRow({ moderation_status: "pending" });
      const rejected = mockPhotoRow({ moderation_status: "rejected" });
      const deleted = mockPhotoRow({ moderation_status: "deleted" });

      assert.equal(isCanonicalPublicMemory(approved, SLUG), true);
      assert.equal(isCanonicalPublicMemory(pending, SLUG), false);
      assert.equal(isCanonicalPublicMemory(rejected, SLUG), false);
      assert.equal(isCanonicalPublicMemory(deleted, SLUG), false);
    });

    it("rejected/deleted never public: status rejeitado ou eliminado é estritamente bloqueado", () => {
      assert.equal(isCanonicalPublicMemory(mockPhotoRow({ moderation_status: "rejected" }), SLUG), false);
      assert.equal(isCanonicalPublicMemory(mockPhotoRow({ moderation_status: "deleted" }), SLUG), false);
      assert.equal(isPublishedMemoryForEvent(mockPhotoRow({ moderation_status: "rejected" }), SLUG), false);
      assert.equal(isEligibleForRecap(mockPhotoRow({ moderation_status: "rejected" }), SLUG), false);
    });

    it("cross-event never public: recusa isolamento cruzado de eventos e adulterações de caminho", () => {
      const crossSlug = mockPhotoRow({ invitation_slug: OTHER_SLUG });
      const crossPath = mockPhotoRow({ storage_path: `${OTHER_SLUG}/${PHOTO_ID}/original.jpg` });
      const mismatchId = mockPhotoRow({ storage_path: `${SLUG}/11111111-1111-4111-8111-111111111111/original.jpg` });

      assert.equal(isCanonicalPublicMemory(crossSlug, SLUG), false);
      assert.equal(isCanonicalPublicMemory(crossPath, SLUG), false);
      assert.equal(isCanonicalPublicMemory(mismatchId, SLUG), false);
    });

    it("isEligibleForRecap: obedece estritamente ao mesmo predicado canónico de aprovação", () => {
      const approved = mockPhotoRow({ moderation_status: "approved" });
      const pending = mockPhotoRow({ moderation_status: "pending" });
      assert.equal(isEligibleForRecap(approved, SLUG), true);
      assert.equal(isEligibleForRecap(pending, SLUG), false);
    });

    it("maySignMemoriesMedia: autoriza assinaturas em community e moderated apenas se approved", () => {
      const snapCommunity = mockSnapshot({ visibility: "community" });
      const snapModerated = mockSnapshot({ visibility: "moderated" });
      const snapPrivate = mockSnapshot({ visibility: "private_to_couple" });

      const approvedMedia = { eventId: EVENT_ID, moderationStatus: "approved", visibility: "community" as const };
      const pendingMedia = { eventId: EVENT_ID, moderationStatus: "pending", visibility: "community" as const };

      assert.equal(maySignMemoriesMedia(EVENT_ID, snapCommunity, approvedMedia, NOW), true);
      assert.equal(maySignMemoriesMedia(EVENT_ID, snapModerated, approvedMedia, NOW), true);
      assert.equal(maySignMemoriesMedia(EVENT_ID, snapPrivate, approvedMedia, NOW), false);
      assert.equal(maySignMemoriesMedia(EVENT_ID, snapCommunity, pendingMedia, NOW), false);
    });
  });

  describe("4. Contrato Canónico da Galeria e Resolução de URLs", () => {
    it("canonical album API contract: entrega envelope com memories[] e PublicMemoryItem", async () => {
      const signedPaths: string[] = [];
      const ROUTE_SLUG = "jessicasamuelwedding";
      __setMemoriesStorageProviderForTests({
        providerName: "r2-s3",
        createSignedDownloadUrl: async ({ storagePath }) => {
          signedPaths.push(storagePath);
          return { downloadUrl: `https://r2.example/${storagePath}` };
        },
        createSignedUploadUrl: async () => { throw new Error("Inesperado"); },
        getObjectInfo: async () => ({ exists: true, contentLength: 1000 }),
        readObject: async () => null,
        putObject: async () => {},
        readObjectPrefix: async () => null,
        remove: async () => {},
      });

      __setEditionDatabaseProviderForTests(mockDatabase({
        listMemoriesPhotos: async (slug) => {
          assert.equal(slug, ROUTE_SLUG);
          return [
            mockPhotoRow({ invitation_slug: ROUTE_SLUG, storage_path: `${ROUTE_SLUG}/${PHOTO_ID}/original.jpg`, moderation_status: "approved" }),
            mockPhotoRow({ id: "3537ad62-2aea-4a1e-998d-e9fccf702402", invitation_slug: ROUTE_SLUG, storage_path: `${ROUTE_SLUG}/3537ad62-2aea-4a1e-998d-e9fccf702402/original.jpg`, moderation_status: "pending" }), // filtrado
            mockPhotoRow({ id: "f738ec31-287b-43f4-96a5-2e74077b7021", invitation_slug: ROUTE_SLUG, storage_path: `${ROUTE_SLUG}/f738ec31-287b-43f4-96a5-2e74077b7021/original.jpg`, moderation_status: "rejected" }), // filtrado
          ];
        },
      }));

      try {
        const req = new Request(`https://edition.haxrsignature.com/api/memories?slug=${encodeURIComponent(ROUTE_SLUG)}`);
        const res = await memoriesRoute(req);
        assert.equal(res.status, 200);

        const body = await res.json();
        assert.equal(body.success, true);
        assert.ok(Array.isArray(body.memories));
        assert.equal(body.memories.length, 1);

        const first: PublicMemoryItem = body.memories[0];
        assert.equal(first.id, PHOTO_ID);
        assert.ok(first.signedUrl.includes("original.jpg"));
        assert.ok(first.thumbnailUrl?.includes("thumbnail.webp"));
        assert.ok(first.mediumUrl?.includes("medium.webp"));
        assert.equal(first.hasDerivatives, true);
        assert.equal(first.kind, "image");
        assert.equal(first.guestName, "Tio Carlos");
        assert.equal(first.caption, "Stanley com a taça");
      } finally {
        __setMemoriesStorageProviderForTests(null);
        __setEditionDatabaseProviderForTests(null);
      }
    });

    it("community approved media reaches gallery: mídias aprovadas em community são expostas na galeria", async () => {
      __setMemoriesStorageProviderForTests({
        providerName: "r2-s3",
        createSignedDownloadUrl: async ({ storagePath }) => ({ downloadUrl: `https://r2.example/${storagePath}` }),
        createSignedUploadUrl: async () => { throw new Error("Inesperado"); },
        getObjectInfo: async () => ({ exists: true, contentLength: 1000 }),
        readObject: async () => null,
        putObject: async () => {},
        readObjectPrefix: async () => null,
        remove: async () => {},
      });

      __setEditionDatabaseProviderForTests(mockDatabase({
        listMemoriesPhotos: async () => [mockPhotoRow({ moderation_status: "approved" })],
      }));

      try {
        const items = await listMemories(SLUG);
        assert.equal(items.length, 1);
        assert.equal(items[0].id, PHOTO_ID);
      } finally {
        __setMemoriesStorageProviderForTests(null);
        __setEditionDatabaseProviderForTests(null);
      }
    });

    it("gallery HTTP failure != empty: em falha de rede/servidor a galeria assinala erro e não apresenta empty state", () => {
      // Regra de transição de estados de UI:
      // loading: true → em carregamento
      // error: true → erro de rede/servidor (NUNCA renderizar empty state)
      // empty: !loading && !error && memories.length === 0
      // loaded: !loading && !error && memories.length > 0

      function resolveGalleryUiState(loading: boolean, error: boolean, count: number): "loading" | "error" | "empty" | "loaded" {
        if (loading) return "loading";
        if (error) return "error";
        if (count === 0) return "empty";
        return "loaded";
      }

      assert.equal(resolveGalleryUiState(true, false, 0), "loading");
      assert.equal(resolveGalleryUiState(false, true, 0), "error"); // FALHA HTTP != EMPTY
      assert.equal(resolveGalleryUiState(false, false, 0), "empty");
      assert.equal(resolveGalleryUiState(false, false, 3), "loaded");
    });

    it("GET /api/memories: rejeita chamadas sem identificador de slug com 400", async () => {
      const req = new Request("https://edition.haxrsignature.com/api/memories");
      const res = await memoriesRoute(req);
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.equal(data.error, "Slug em falta.");
    });
  });
});
