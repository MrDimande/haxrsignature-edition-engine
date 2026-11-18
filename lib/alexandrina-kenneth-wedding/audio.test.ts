import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { describe, it, afterEach } from "node:test";
import {
  ALEXANDRINA_KENNETH_AUDIO_CONFIG,
  getAlexandrinaKennethAudioConfig,
} from "./audio";

describe("Alexandrina & Kenneth — Audio Configuration & Origin Precedence", () => {
  const originalEnv = process.env.NEXT_PUBLIC_ALEXANDRINA_KENNETH_AUDIO_URL;

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.NEXT_PUBLIC_ALEXANDRINA_KENNETH_AUDIO_URL = originalEnv;
    } else {
      delete process.env.NEXT_PUBLIC_ALEXANDRINA_KENNETH_AUDIO_URL;
    }
  });

  it("1. Precedence: External URL overrides default local path when present", () => {
    process.env.NEXT_PUBLIC_ALEXANDRINA_KENNETH_AUDIO_URL =
      "https://storage.haxrsignature.com/audio/alexandrina-kenneth/say-you-wont-let-go.mp3";
    const config = getAlexandrinaKennethAudioConfig();
    assert.equal(
      config.authorizedSrc,
      "https://storage.haxrsignature.com/audio/alexandrina-kenneth/say-you-wont-let-go.mp3"
    );
    assert.equal(
      config.customTrackUrl,
      "https://storage.haxrsignature.com/audio/alexandrina-kenneth/say-you-wont-let-go.mp3"
    );
  });

  it("2. Behavior when external URL is absent: defaults to canonical relative route", () => {
    delete process.env.NEXT_PUBLIC_ALEXANDRINA_KENNETH_AUDIO_URL;
    const config = getAlexandrinaKennethAudioConfig();
    assert.equal(
      config.authorizedSrc,
      "/audio/alexandrina-kenneth/say-you-wont-let-go.mp3"
    );
    assert.equal(config.customTrackUrl, null);
  });

  it("3. Behavior when external URL is empty or whitespace: trims and falls back cleanly", () => {
    process.env.NEXT_PUBLIC_ALEXANDRINA_KENNETH_AUDIO_URL = "   ";
    const config = getAlexandrinaKennethAudioConfig();
    assert.equal(
      config.authorizedSrc,
      "/audio/alexandrina-kenneth/say-you-wont-let-go.mp3"
    );
    assert.equal(config.customTrackUrl, null);
  });

  it("4. Invariant Musical Identity: maintains canonical Title and Artist regardless of storage origin", () => {
    // Test with local default
    delete process.env.NEXT_PUBLIC_ALEXANDRINA_KENNETH_AUDIO_URL;
    const localConfig = getAlexandrinaKennethAudioConfig();
    assert.equal(localConfig.title, "Say You Won't Let Go");
    assert.equal(localConfig.artist, "James Arthur");

    // Test with CDN / External URL
    process.env.NEXT_PUBLIC_ALEXANDRINA_KENNETH_AUDIO_URL =
      "https://cdn.haxrsignature.com/say-you-wont-let-go.mp3";
    const cdnConfig = getAlexandrinaKennethAudioConfig();
    assert.equal(cdnConfig.title, "Say You Won't Let Go");
    assert.equal(cdnConfig.artist, "James Arthur");
  });

  it("5. Strict Acoustic Parameters: enforces 3-second progressive fade-in and volume ceiling", () => {
    const config = getAlexandrinaKennethAudioConfig();
    assert.equal(config.targetVolume, 0.35, "Target volume must be 0.35");
    assert.equal(config.fadeInDurationMs, 3000, "Fade-in duration must be 3000ms (~3.0s)");
    assert.equal(config.fadeOutDurationMs, 600, "Fade-out duration must be 600ms");
  });

  it("6. Fail-Safe Fallbacks: defines valid placeholder and ambient fallback routes", () => {
    const config = getAlexandrinaKennethAudioConfig();
    assert.equal(
      config.placeholderSrc,
      "/audio/alexandrina-kenneth/say-you-wont-let-go-placeholder.mp3"
    );
    assert.equal(config.ambientFallbackSrc, "/audio/bg-music-web.mp3");
  });

  it("7. Declared Authorization: confirms organizational authorization flag", () => {
    const config = getAlexandrinaKennethAudioConfig();
    assert.equal(config.commercialLicenseConfirmed, true);
    assert.equal(config.isAuthorized, true);
    assert.equal(config.licensingStatus, "authorized_commercial");
  });

  it("8. Physical local master file cryptographic integrity verification", (t) => {
    // CONDITIONAL TEST WITH EXPLICIT CLASSIFICATION:
    //
    // The commercial master recording (say-you-wont-let-go.mp3) is excluded from Git
    // to avoid distributing copyrighted material in the public repository.
    // In CI/CD environments (Vercel Preview builds), the file will NOT be present.
    //
    // - When ABSENT (CI/CD): Explicitly SKIPPED with NOT VERIFIED classification.
    // - When PRESENT (Workstation/Staging with asset): Bit-exact byte size AND SHA-256 hash verified.
    const mp3Path = path.resolve(
      process.cwd(),
      "public/audio/alexandrina-kenneth/say-you-wont-let-go.mp3"
    );

    if (!fs.existsSync(mp3Path)) {
      t.skip(
        "SKIPPED (NOT VERIFIED): Master audio file absent in CI/CD environment (untracked commercial asset). " +
        "Cryptographic integrity can only be verified in environments where the physical asset is present."
      );
      return;
    }

    const fileBuffer = fs.readFileSync(mp3Path);
    const actualHash = crypto
      .createHash("sha256")
      .update(fileBuffer)
      .digest("hex");

    const EXPECTED_HASH = "e010be1f2bda3a99898414089afccbd8a7869eb7d0fef7a20440c90aac88d547";
    const EXPECTED_SIZE = 3_431_168;

    assert.equal(
      fileBuffer.length,
      EXPECTED_SIZE,
      `Local master must match authenticated bit-exact size (${EXPECTED_SIZE} bytes). Actual: ${fileBuffer.length}`
    );

    assert.equal(
      actualHash,
      EXPECTED_HASH,
      `Local master recording SHA-256 hash must match authenticated master bit-for-bit. Expected: ${EXPECTED_HASH}, Actual: ${actualHash}`
    );
  });
});
