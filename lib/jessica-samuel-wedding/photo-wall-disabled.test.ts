import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GET } from "../../app/api/wedding-photos/route";
import { JESSICA_SAMUEL_PHOTO_WALL } from "./photo-wall/config";
import {
  __getPhotoWallSupabaseAccessCountForTests,
  __resetPhotoWallSupabaseAccessCountForTests,
  listApprovedPublicPhotos,
} from "./photo-wall/gallery";
import { getPhotoWallPhase } from "./photo-wall/validation";

describe("photo-wall live configuration and pre-opening baseline", () => {
  it("valida que Photo Wall está activo em produção com upload fechado na pré-abertura", async () => {
    assert.equal(JESSICA_SAMUEL_PHOTO_WALL.enabled, true);
    assert.equal(JESSICA_SAMUEL_PHOTO_WALL.publicGalleryEnabled, true);
    assert.equal(JESSICA_SAMUEL_PHOTO_WALL.moderationRequired, true);

    __resetPhotoWallSupabaseAccessCountForTests();

    // Em ambiente de teste de unidade sem credenciais de Supabase,
    // listApprovedPublicPhotos deve degradar com segurança para lista vazia.
    const listed = await listApprovedPublicPhotos("jessica-samuel");
    assert.deepEqual(listed, []);

    const response = await GET(
      new Request("http://localhost/api/wedding-photos?slug=jessica-samuel")
    );
    assert.equal(response.status, 200);

    const body = (await response.json()) as {
      success: boolean;
      phase: string;
      uploadOpen: boolean;
      photos: unknown[];
    };

    assert.equal(body.success, true);
    assert.equal(body.phase, getPhotoWallPhase());
    assert.equal(body.uploadOpen, getPhotoWallPhase() === "open");
    assert.ok(Array.isArray(body.photos));
  });
});
