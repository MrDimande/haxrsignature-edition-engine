import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import { POST as moderate } from "../../app/api/memories/moderate/route";
import { GET as exportZip } from "../../app/api/memories/export-zip/route";
import { GET as leaderboard } from "../../app/api/memories/leaderboard/route";
import { GET as gallery } from "../../app/api/memories/route";
import { __setEditionDatabaseProviderForTests } from "../db";
import type { EditionDatabaseProvider, PublicMemoryPhotoRow } from "../db/types";
import { __setMemoriesStorageProviderForTests } from "./storage";
import { listMemories } from "./gallery";
import { getInvitation } from "@data/invitations";
import JSZip from "jszip";

const SLUG = "jessicasamuelwedding";
const OTHER_SLUG = "jessicaesamueltraditionalwedding";
const PHOTO_ID = "11111111-1111-4111-8111-111111111111";
const TEST_CREDENTIAL = "isolated-test-credential";
const originalSecret = process.env.ADMIN_MODERATION_SECRET;

function database(overrides: Partial<EditionDatabaseProvider> = {}): EditionDatabaseProvider {
  const unexpected = async (): Promise<never> => { throw new Error("Acesso inesperado à persistência"); };
  return {
    name: "neon", isConfigured: () => true,
    listMemoriesPhotos: unexpected, insertPendingPhoto: unexpected,
    createUploadIntent: unexpected, consumeUploadIntent: unexpected,
    checkApiRateLimit: unexpected, getLeaderboardPhotos: unexpected,
    getParticipantPhotos: unexpected, updateModerationStatus: unexpected,
    listGiftReservations: unexpected, reserveGift: unexpected,
    ...overrides,
  };
}

function photo(overrides: Partial<PublicMemoryPhotoRow> = {}): PublicMemoryPhotoRow {
  return {
    id: PHOTO_ID, invitation_slug: SLUG, moderation_status: "approved",
    caption: null, guest_name: "Convidado", challenge_id: null, table_id: null,
    created_at: "2026-09-10T10:00:00.000Z",
    storage_path: `${SLUG}/${PHOTO_ID}/original.jpg`, content_type: "image/jpeg",
    ...overrides,
  };
}

function request(path: string, options: { body?: unknown; bearer?: string; query?: string; headers?: HeadersInit } = {}): Request {
  const headers = new Headers(options.headers);
  if (options.bearer) headers.set("Authorization", `Bearer ${options.bearer}`);
  if (options.body !== undefined) headers.set("Content-Type", "application/json");
  return new Request(`https://edition.example/api/memories/${path}?slug=${SLUG}${options.query ?? ""}`, {
    method: options.body !== undefined ? "POST" : "GET", headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
}

describe("Plus Memories — fronteiras de autorização e publicação", () => {
  let signedPaths: string[];

  beforeEach(() => {
    process.env.ADMIN_MODERATION_SECRET = TEST_CREDENTIAL;
    __setEditionDatabaseProviderForTests(database());
    signedPaths = [];
    __setMemoriesStorageProviderForTests({
      providerName: "r2-s3",
      createSignedDownloadUrl: async ({ storagePath }) => {
        signedPaths.push(storagePath);
        return { downloadUrl: `https://storage.example/${storagePath}` };
      },
      createSignedUploadUrl: async () => { throw new Error("Upload inesperado"); },
      getObjectInfo: async () => { throw new Error("HEAD inesperado"); },
      readObject: async () => { throw new Error("Leitura inesperada"); },
      putObject: async () => { throw new Error("Escrita inesperada"); },
      readObjectPrefix: async () => { throw new Error("Leitura inesperada"); },
      remove: async () => { throw new Error("Eliminação inesperada"); },
    });
    mock.method(globalThis, "fetch", async () => { throw new Error("Rede proibida neste teste"); });
  });

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.ADMIN_MODERATION_SECRET;
    else process.env.ADMIN_MODERATION_SECRET = originalSecret;
    __setEditionDatabaseProviderForTests(null);
    __setMemoriesStorageProviderForTests(null);
    mock.restoreAll();
  });

  const endpoints = [
    { name: "moderação", call: (options: Parameters<typeof request>[1]) => moderate(request("moderate", { body: { slug: SLUG, photoId: PHOTO_ID, action: "approve" }, ...options })) },
    { name: "exportação", call: (options: Parameters<typeof request>[1]) => exportZip(request("export-zip", options)) },
    { name: "classificação", call: (options: Parameters<typeof request>[1]) => leaderboard(request("leaderboard", options)) },
  ];

  for (const endpoint of endpoints) {
    it(`${endpoint.name}: recusa ausência de Bearer antes da BD/storage`, async () => {
      const response = await endpoint.call({});
      assert.equal(response.status, 401);
      assert.equal(response.headers.get("cache-control"), "no-store");
      assert.equal(signedPaths.length, 0);
    });

    it(`${endpoint.name}: sem segredo configurado fica indisponível`, async () => {
      delete process.env.ADMIN_MODERATION_SECRET;
      assert.equal((await endpoint.call({ bearer: TEST_CREDENTIAL })).status, 503);
    });

    it(`${endpoint.name}: rejeita credenciais erradas, URL e header legado`, async () => {
      const invalidRequests: NonNullable<Parameters<typeof request>[1]>[] = [
        { bearer: "incorrect" },
        { query: `&secretKey=${TEST_CREDENTIAL}` },
        { headers: { "x-admin-secret": TEST_CREDENTIAL } },
        { headers: { Authorization: `Basic ${TEST_CREDENTIAL}` } },
      ];
      for (const options of invalidRequests) assert.equal((await endpoint.call(options)).status, 401);
    });
  }

  it("moderação não aceita autenticação no JSON", async () => {
    const response = await moderate(request("moderate", { body: { slug: SLUG, photoId: PHOTO_ID, action: "approve", secretKey: TEST_CREDENTIAL } }));
    assert.equal(response.status, 401);
  });

  it("moderação valida o corpo e a acção antes da persistência", async () => {
    for (const body of [null, [], "text", { slug: 3, photoId: PHOTO_ID, action: "approve" },
      { slug: SLUG, photoId: PHOTO_ID, action: "delete" }, { slug: SLUG, photoId: "invalid", action: "approve" }]) {
      const response = await moderate(request("moderate", { body, bearer: TEST_CREDENTIAL }));
      assert.equal(response.status, 400);
    }
  });

  it("admin aprova/rejeita e não altera uma fotografia de outro evento", async () => {
    let state = "pending";
    __setEditionDatabaseProviderForTests(database({ updateModerationStatus: async (id, slug, status) => {
      if (id !== PHOTO_ID || slug !== SLUG) return false;
      state = status;
      return true;
    } }));
    const cross = await moderate(request("moderate", { body: { slug: OTHER_SLUG, photoId: PHOTO_ID, action: "approve" }, bearer: TEST_CREDENTIAL }));
    assert.equal(cross.status, 404);
    assert.equal(state, "pending");
    for (const action of ["approve", "reject"]) {
      const response = await moderate(request("moderate", { body: { slug: SLUG, photoId: PHOTO_ID, action }, bearer: TEST_CREDENTIAL }));
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("cache-control"), "no-store");
      assert.equal(state, action === "approve" ? "approved" : "rejected");
    }
  });

  it("galeria só assina media aprovada do evento e com caminho correspondente", async () => {
    __setEditionDatabaseProviderForTests(database({ listMemoriesPhotos: async (slug) => {
      assert.equal(slug, SLUG);
      return [photo(), photo({ moderation_status: "pending" }), photo({ moderation_status: "rejected" }),
        photo({ invitation_slug: OTHER_SLUG }), photo({ storage_path: `${OTHER_SLUG}/${PHOTO_ID}/original.jpg` }),
        photo({ storage_path: `${SLUG}/../original.jpg` })];
    } }));
    const result = await listMemories(SLUG);
    assert.equal(result.length, 1);
    assert.deepEqual(signedPaths, [`${SLUG}/${PHOTO_ID}/original.jpg`]);
    assert.equal("invitation_slug" in result[0], false);
    assert.equal("moderation_status" in result[0], false);
  });

  it("galeria privada não consulta media nem gera URLs", async () => {
    let queried = false;
    __setEditionDatabaseProviderForTests(database({ listMemoriesPhotos: async () => { queried = true; return []; } }));
    const invitation = getInvitation(SLUG);
    assert.ok(invitation?.features?.memories);
    const feature = invitation.features.memories;
    const previous = { ...feature };
    Object.assign(feature, { publicGalleryEnabled: false });
    try {
      assert.deepEqual(await listMemories(SLUG), []);
      assert.equal(queried, false);
      assert.equal(signedPaths.length, 0);
    } finally {
      if ("publicGalleryEnabled" in previous) Object.assign(feature, previous);
      else Reflect.deleteProperty(feature, "publicGalleryEnabled");
    }
  });

  it("erro de BD não é apresentado como álbum vazio", async () => {
    mock.method(console, "error", () => {});
    const response = await gallery(request(""));
    assert.equal(response.status, 503);
    assert.equal((await response.json()).success, false);
    assert.equal(response.headers.get("cache-control"), "no-store");
  });

  it("galeria vazia válida mantém sucesso e fica fora de caches/indexação", async () => {
    __setEditionDatabaseProviderForTests(database({ listMemoriesPhotos: async () => [] }));
    const response = await gallery(request(""));
    assert.equal(response.status, 200);
    assert.deepEqual((await response.json()).memories, []);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow");
  });

  it("admin consulta o ranking sem alterar a regra provisória/final", async () => {
    __setEditionDatabaseProviderForTests(database({ getLeaderboardPhotos: async (slug) => {
      assert.equal(slug, SLUG);
      return [
        { ...photo({ challenge_id: "01", moderation_status: "pending" }), participant_id: PHOTO_ID },
        { ...photo({ challenge_id: "02" }), participant_id: PHOTO_ID },
      ];
    } }));
    for (const [mode, completed] of [["provisional", 2], ["final", 1]] as const) {
      const response = await leaderboard(request("leaderboard", { bearer: TEST_CREDENTIAL, query: `&mode=${mode}` }));
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow");
      const result = await response.json();
      assert.equal(result.mode, mode);
      assert.equal(result.leaderboard[0].completed, completed);
    }
  });

  it("ZIP autorizado inclui apenas o evento aprovado, com nomes seguros e sem colisão pelo prefixo do ID", async () => {
    const secondId = "11111111-2222-4222-8222-222222222222";
    __setEditionDatabaseProviderForTests(database({ listMemoriesPhotos: async () => [
      photo({ table_id: "../../fora" }),
      photo({ id: secondId, storage_path: `${SLUG}/${secondId}/original.jpg`, table_id: "../../fora" }),
      photo({ moderation_status: "pending" }),
      photo({ invitation_slug: OTHER_SLUG }),
      photo({ storage_path: `${OTHER_SLUG}/${PHOTO_ID}/original.jpg` }),
    ] }));
    mock.method(globalThis, "fetch", async () => new Response("conteudo-sintetico"));
    const response = await exportZip(request("export-zip", { bearer: TEST_CREDENTIAL }));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "application/zip");
    assert.equal(response.headers.get("cache-control"), "no-store");
    const zip = await JSZip.loadAsync(await response.arrayBuffer());
    const files = Object.values(zip.files).filter((entry) => !entry.dir);
    assert.deepEqual(files.map((entry) => entry.name).sort(), [PHOTO_ID, secondId]
      .map((id) => `Por_Mesa/Mesa_fora/${id}_Convidado.jpg`).sort());
    assert.equal(await files[0].async("text"), "conteudo-sintetico");
    assert.equal(signedPaths.length, 2);
  });

  it("ZIP falha explicitamente se um objecto não puder ser lido", async () => {
    mock.method(console, "error", () => {});
    __setEditionDatabaseProviderForTests(database({ listMemoriesPhotos: async () => [photo()] }));
    mock.method(globalThis, "fetch", async () => new Response(null, { status: 503 }));
    const response = await exportZip(request("export-zip", { bearer: TEST_CREDENTIAL }));
    assert.equal(response.status, 503);
    assert.equal((await response.json()).success, false);
  });
});
