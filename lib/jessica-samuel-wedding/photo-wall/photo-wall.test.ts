import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { isCronAuthorized } from "@lib/cron-auth";
import {
  JESSICA_SAMUEL_PHOTO_WALL,
  PHOTO_WALL_DISABLED_MESSAGE,
} from "./config";
import { createPhotoUploadIntent } from "./upload-intent";
import {
  buildStoragePath,
  isPhotoWallOpen,
  matchesMagicBytes,
  toPublicGalleryItem,
  validateContentType,
  validateFileSize,
} from "./validation";

describe("photo wall — configuration", () => {
  it("monta a feature com uploads fechados até ao dia do casamento", () => {
    assert.equal(JESSICA_SAMUEL_PHOTO_WALL.enabled, true);
    assert.ok(JESSICA_SAMUEL_PHOTO_WALL.opensAt?.startsWith("2026-08-15"));
    assert.equal(isPhotoWallOpen(new Date("2026-07-18T12:00:00+02:00")), false);
    assert.equal(isPhotoWallOpen(new Date("2026-08-15T10:00:00+02:00")), true);
    assert.ok(PHOTO_WALL_DISABLED_MESSAGE.includes("celebração"));
  });

  it("aceita fotos e vídeos de telemóvel com limites realistas", () => {
    assert.equal(validateContentType("image/jpeg"), null);
    assert.equal(validateContentType("image/heic"), null);
    assert.equal(validateContentType("video/mp4"), null);
    assert.equal(validateContentType("video/quicktime"), null);
    assert.ok(validateContentType("application/pdf"));

    // Foto até 25 MB
    assert.equal(validateFileSize(20 * 1024 * 1024, "image/jpeg"), null);
    assert.ok(validateFileSize(26 * 1024 * 1024, "image/jpeg"));

    // Vídeo até 100 MB
    assert.equal(validateFileSize(80 * 1024 * 1024, "video/mp4"), null);
    assert.ok(validateFileSize(101 * 1024 * 1024, "video/mp4"));
  });

  it("validates magic bytes", () => {
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0x00]);
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    const mp4 = new Uint8Array([
      0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d,
    ]);
    assert.equal(matchesMagicBytes(jpeg, "image/jpeg"), true);
    assert.equal(matchesMagicBytes(png, "image/png"), true);
    assert.equal(matchesMagicBytes(jpeg, "image/png"), false);
    assert.equal(matchesMagicBytes(mp4, "video/mp4"), true);
  });

  it("builds storage path for jessica-samuel only", () => {
    const p = buildStoragePath("550e8400-e29b-41d4-a716-446655440000", "image/jpeg");
    assert.match(p!, /^jessica-samuel\//);
    assert.match(p!, /original\.jpg$/);
    const mov = buildStoragePath(
      "550e8400-e29b-41d4-a716-446655440000",
      "video/quicktime"
    );
    assert.match(mov!, /original\.mov$/);
  });
});

describe("photo wall — upload intent", () => {
  it("rejects when upload window is closed (antes do dia)", async () => {
    const previousOpensAt = JESSICA_SAMUEL_PHOTO_WALL.opensAt;
    (JESSICA_SAMUEL_PHOTO_WALL as unknown as { opensAt: string | null }).opensAt =
      "2099-01-01T00:00:00+02:00";
    try {
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
      if (!result.success) {
        assert.equal(result.code, "PHOTO_WALL_CLOSED");
      }
    } finally {
      (JESSICA_SAMUEL_PHOTO_WALL as unknown as { opensAt: string | null }).opensAt =
        previousOpensAt;
    }
  });

  it("rejects wrong slug", async () => {
    const result = await createPhotoUploadIntent(
      {
        slug: "jessicakulaya",
        fileName: "foto.jpg",
        contentType: "image/jpeg",
        fileSizeBytes: 1024,
      },
      new Request("https://example.test")
    );
    assert.equal(result.success, false);
  });
});

describe("photo wall — public API shape", () => {
  it("public gallery item excludes guest name and storage path", () => {
    const item = toPublicGalleryItem({
      id: "id-1",
      caption: "Um momento",
      created_at: "2026-08-15T12:00:00Z",
      signedUrl: "https://signed.example/photo",
      content_type: "video/mp4",
    });
    assert.equal(item.id, "id-1");
    assert.equal(item.caption, "Um momento");
    assert.equal(item.kind, "video");
    assert.equal(item.contentType, "video/mp4");
    assert.ok(item.signedUrl);
    assert.ok(!("guestName" in item));
    assert.ok(!("storagePath" in item));
  });
});

describe("photo wall — admin protection", () => {
  it("requires Bearer secret for admin API pattern (server-to-server only)", () => {
    const prev = process.env.EDITION_CRON_SECRET;
    process.env.EDITION_CRON_SECRET = "test-secret";
    assert.equal(
      isCronAuthorized(
        new Request("https://example.test", {
          headers: { Authorization: "Bearer test-secret" },
        })
      ),
      true
    );
    assert.equal(isCronAuthorized(new Request("https://example.test")), false);
    if (prev) process.env.EDITION_CRON_SECRET = prev;
    else delete process.env.EDITION_CRON_SECRET;
  });

  it("does not expose EDITION_CRON_SECRET or AdminPhotosPanel on public routes", () => {
    const experiencePath = path.join(
      process.cwd(),
      "engines/true-theme/profiles/jessica-samuel-wedding/JessicaSamuelExperience.tsx"
    );
    const memoriesPath = path.join(
      process.cwd(),
      "engines/true-theme/profiles/jessica-samuel-wedding/photos/MemoriesSection.tsx"
    );
    assert.ok(fs.existsSync(experiencePath));
    assert.ok(fs.existsSync(memoriesPath));

    const experience = fs.readFileSync(experiencePath, "utf8");
    const memories = fs.readFileSync(memoriesPath, "utf8");
    assert.match(experience, /MemoriesSection/);
    assert.doesNotMatch(experience, /AdminPhotosPanel/);
    assert.doesNotMatch(experience, /EDITION_CRON_SECRET/);
    assert.doesNotMatch(memories, /EDITION_CRON_SECRET/);
    assert.doesNotMatch(memories, /adminToken/);
  });
});

describe("photo wall — isolation", () => {
  it("is only imported by jessica-samuel-wedding profile", () => {
    const rose = fs.readFileSync(
      path.join(
        process.cwd(),
        "engines/true-theme/profiles/rose-elegance/RoseEleganceExperience.tsx"
      ),
      "utf8"
    );
    assert.doesNotMatch(rose, /MemoriesSection/);
    assert.doesNotMatch(rose, /LivePhotoGallery/);
    assert.doesNotMatch(rose, /WeddingCountdown/);
  });
});
