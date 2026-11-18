import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import {
  ALEXANDRINA_KENNETH_AUDIO_CONFIG,
  getAlexandrinaKennethAudioConfig,
} from "./audio";

describe("Alexandrina & Kenneth — Official Audio Activation & Licensing", () => {
  it("activates official master recording per organisation authorisation decision", () => {
    const config = getAlexandrinaKennethAudioConfig();

    assert.equal(
      config.commercialLicenseConfirmed,
      true,
      "Commercial licence must be confirmed per organisation decision"
    );
    assert.equal(
      config.isAuthorized,
      true,
      "Audio must be authorised when organisation decision is confirmed"
    );
    assert.equal(
      config.licensingStatus,
      "authorized_commercial",
      "Status must indicate authorised commercial track"
    );
    assert.equal(config.title, "Say You Won't Let Go");
    assert.equal(config.artist, "James Arthur");
    assert.equal(
      config.authorizedSrc,
      "/audio/alexandrina-kenneth/say-you-wont-let-go.mp3"
    );
  });

  it("verifies physical existence of the authorized MP3 file", () => {
    const mp3Path = path.resolve(
      process.cwd(),
      "public/audio/alexandrina-kenneth/say-you-wont-let-go.mp3"
    );
    assert.ok(
      fs.existsSync(mp3Path),
      `Authorized MP3 file must exist at ${mp3Path}`
    );
    const stats = fs.statSync(mp3Path);
    assert.ok(
      stats.size > 1_000_000,
      `Authorized MP3 file must be a real audio file (> 1MB), got ${stats.size} bytes`
    );
  });

  it("enforces comfortable 3-second progressive fade-in and volume", () => {
    const config = getAlexandrinaKennethAudioConfig();

    assert.equal(
      config.targetVolume,
      0.35,
      "Target volume must be 0.35 (comfortable ceremonial soundscape)"
    );
    assert.equal(
      config.fadeInDurationMs,
      3000,
      "Fade-in duration must be exactly 3000ms (~3 seconds progressive ramp)"
    );
    assert.equal(
      config.fadeOutDurationMs,
      600,
      "Fade-out duration must be 600ms for responsive luxury pause"
    );
  });

  it("dynamically supports custom URL override via NEXT_PUBLIC_ALEXANDRINA_KENNETH_AUDIO_URL", () => {
    const prevUrl = process.env.NEXT_PUBLIC_ALEXANDRINA_KENNETH_AUDIO_URL;
    try {
      process.env.NEXT_PUBLIC_ALEXANDRINA_KENNETH_AUDIO_URL =
        "https://cdn.haxrsignature.com/audio/ceremonial-suite-authorized.mp3";

      const config = getAlexandrinaKennethAudioConfig();
      assert.equal(config.isAuthorized, true);
      assert.equal(config.licensingStatus, "authorized_custom");
      assert.equal(
        config.authorizedSrc,
        "https://cdn.haxrsignature.com/audio/ceremonial-suite-authorized.mp3"
      );
      assert.equal(config.title, "Música Cerimonial");
    } finally {
      if (prevUrl !== undefined) {
        process.env.NEXT_PUBLIC_ALEXANDRINA_KENNETH_AUDIO_URL = prevUrl;
      } else {
        delete process.env.NEXT_PUBLIC_ALEXANDRINA_KENNETH_AUDIO_URL;
      }
    }
  });
});
