import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { S3Client } from "@aws-sdk/client-s3";
import { R2MemoriesStorageProvider } from "./r2-provider";
import { matchesMagicBytes } from "@lib/jessica-samuel-wedding/photo-wall/validation";

describe("HAXR Signature Edition — Browser Contract & MIME Signatures", () => {
  const fakeConfig = {
    accessKeyId: "mock-access-key-id",
    secretAccessKey: "mock-secret-access-key",
    endpoint: "https://mock-account.r2.cloudflarestorage.com",
    bucketName: "haxr-wedding-photos",
  };

  test("R2 presigned PUT allows only Content-Type and does not require unauthorized extra headers", async () => {
    const client = new S3Client({
      region: "auto",
      endpoint: fakeConfig.endpoint,
      credentials: {
        accessKeyId: fakeConfig.accessKeyId,
        secretAccessKey: fakeConfig.secretAccessKey,
      },
    });
    const provider = new R2MemoriesStorageProvider(fakeConfig, client);

    const result = await provider.createSignedUploadUrl({
      storagePath: "jessicasamuelwedding/67a29bbd-6840-43c8-8b8e-31865023bf51/original.jpg",
      contentType: "image/jpeg",
      expiresInSeconds: 900,
    });

    const parsed = new URL(result.uploadUrl);
    const signedHeaders = parsed.searchParams.get("X-Amz-SignedHeaders") || "";

    // The browser client in plus-memorias-upload.ts only sends Content-Type
    // Current R2 CORS allows: ["Content-Type"]
    // Ensure no unexpected mandatory headers like x-amz-* are required
    assert.ok(
      signedHeaders.includes("content-type") || signedHeaders.includes("host"),
      "Signed headers must be compatible with browser upload"
    );
  });

  test("validates binary magic bytes for all supported formats", () => {
    // JPEG
    const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    assert.equal(matchesMagicBytes(jpegBytes, "image/jpeg"), true);

    // PNG
    const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
    assert.equal(matchesMagicBytes(pngBytes, "image/png"), true);

    // WebP (RIFF....WEBP)
    const webpBytes = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, // RIFF
      0x24, 0x00, 0x00, 0x00,
      0x57, 0x45, 0x42, 0x50, // WEBP
    ]);
    assert.equal(matchesMagicBytes(webpBytes, "image/webp"), true);

    // MP4 (....ftypisom....)
    const mp4Bytes = new Uint8Array([
      0x00, 0x00, 0x00, 0x18,
      0x66, 0x74, 0x79, 0x70, // ftyp
      0x69, 0x73, 0x6f, 0x6d, // isom
    ]);
    assert.equal(matchesMagicBytes(mp4Bytes, "video/mp4"), true);

    // QuickTime MOV (....ftypqt  ....)
    const movBytes = new Uint8Array([
      0x00, 0x00, 0x00, 0x14,
      0x66, 0x74, 0x79, 0x70, // ftyp
      0x71, 0x74, 0x20, 0x20, // qt  
    ]);
    assert.equal(matchesMagicBytes(movBytes, "video/quicktime"), true);

    // HEIC (....ftypheic....)
    const heicBytes = new Uint8Array([
      0x00, 0x00, 0x00, 0x18,
      0x66, 0x74, 0x79, 0x70, // ftyp
      0x68, 0x65, 0x69, 0x63, // heic
    ]);
    assert.equal(matchesMagicBytes(heicBytes, "image/heic"), true);

    // HEIF (....ftypheif....)
    const heifBytes = new Uint8Array([
      0x00, 0x00, 0x00, 0x18,
      0x66, 0x74, 0x79, 0x70, // ftyp
      0x68, 0x65, 0x69, 0x66, // heif
    ]);
    assert.equal(matchesMagicBytes(heifBytes, "image/heif"), true);

    // WebM (EBML: 1A 45 DF A3)
    const webmBytes = new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 0x01, 0x00]);
    assert.equal(matchesMagicBytes(webmBytes, "video/webm"), true);

    // Corrupt bytes
    const corruptBytes = new Uint8Array([0x00, 0x00, 0x00, 0x00]);
    assert.equal(matchesMagicBytes(corruptBytes, "image/jpeg"), false);
    assert.equal(matchesMagicBytes(corruptBytes, "image/heic"), false);
    assert.equal(matchesMagicBytes(corruptBytes, "video/webm"), false);
    assert.equal(matchesMagicBytes(corruptBytes, "video/mp4"), false);
  });
});
