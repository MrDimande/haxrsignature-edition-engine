import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GET } from "../../app/api/wedding-photos/route";
import { JESSICA_SAMUEL_PHOTO_WALL } from "./photo-wall/config";
import {
  __getPhotoWallSupabaseAccessCountForTests,
  __resetPhotoWallSupabaseAccessCountForTests,
  listApprovedPublicPhotos,
} from "./photo-wall/gallery";

describe("photo-wall disabled — zero Supabase", () => {
  it("GET /api/wedding-photos devolve 200 vazio sem createAdminClient", async () => {
    assert.equal(JESSICA_SAMUEL_PHOTO_WALL.enabled, false);
    __resetPhotoWallSupabaseAccessCountForTests();

    const listed = await listApprovedPublicPhotos("jessica-samuel");
    assert.deepEqual(listed, []);
    assert.equal(__getPhotoWallSupabaseAccessCountForTests(), 0);

    const response = await GET(
      new Request("http://localhost/api/wedding-photos?slug=jessica-samuel")
    );
    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      success: boolean;
      uploadOpen: boolean;
      photos: unknown[];
    };
    assert.equal(body.success, true);
    assert.equal(body.uploadOpen, false);
    assert.deepEqual(body.photos, []);
    assert.equal(body.photos.length, 0);
    assert.equal(__getPhotoWallSupabaseAccessCountForTests(), 0);
  });
});
