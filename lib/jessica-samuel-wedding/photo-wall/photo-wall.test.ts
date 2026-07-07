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
  it("is disabled by default", () => {
    assert.equal(JESSICA_SAMUEL_PHOTO_WALL.enabled, false);
    assert.equal(isPhotoWallOpen(), false);
    assert.ok(PHOTO_WALL_DISABLED_MESSAGE.includes("celebração"));
  });

  it("accepts only jpeg, png, webp under 5MB", () => {
    assert.equal(validateContentType("image/jpeg"), null);
    assert.equal(validateContentType("image/png"), null);
    assert.equal(validateContentType("image/webp"), null);
    assert.ok(validateContentType("application/pdf"));
    assert.ok(validateFileSize(6 * 1024 * 1024));
    assert.equal(validateFileSize(1024), null);
  });

  it("validates magic bytes", () => {
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0x00]);
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    assert.equal(matchesMagicBytes(jpeg, "image/jpeg"), true);
    assert.equal(matchesMagicBytes(png, "image/png"), true);
    assert.equal(matchesMagicBytes(jpeg, "image/png"), false);
  });

  it("builds storage path for jessica-samuel only", () => {
    const p = buildStoragePath("550e8400-e29b-41d4-a716-446655440000", "image/jpeg");
    assert.match(p!, /^jessica-samuel\//);
    assert.match(p!, /original\.jpg$/);
  });
});

describe("photo wall — upload intent", () => {
  it("rejects when feature is disabled", async () => {
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
    });
    assert.equal(item.id, "id-1");
    assert.equal(item.caption, "Um momento");
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
    if (!fs.existsSync(experiencePath) || !fs.existsSync(memoriesPath)) {
      return;
    }

    const experience = fs.readFileSync(experiencePath, "utf8");
    const memories = fs.readFileSync(memoriesPath, "utf8");
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
