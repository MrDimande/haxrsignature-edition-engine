import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ALEXANDRINA_KENNETH_AUDIO_CONFIG,
  getAlexandrinaKennethAudioConfig,
} from "./audio";

describe("Alexandrina & Kenneth — Audio Configuration & Licensing Architecture", () => {
  it("defaults to fail-closed unauthorized status for unlicensed commercial master", () => {
    const config = getAlexandrinaKennethAudioConfig();

    assert.equal(
      config.commercialLicenseConfirmed,
      false,
      "Commercial license must be strictly false until formal sync rights are confirmed"
    );
    assert.equal(
      config.isAuthorized,
      false,
      "Audio must not be authorized in public/standard environment without confirmed license"
    );
    assert.equal(
      config.licensingStatus,
      "unauthorized_commercial",
      "Status must indicate unauthorized commercial track"
    );
    assert.equal(config.title, "Say You Won't Let Go");
    assert.equal(config.artist, "James Arthur");
    assert.equal(
      config.placeholderSrc,
      "/audio/alexandrina-kenneth/say-you-wont-let-go-placeholder.mp3"
    );
  });

  it("enforces comfortable volume and smooth fade durations", () => {
    const config = getAlexandrinaKennethAudioConfig();

    assert.ok(
      config.targetVolume > 0.2 && config.targetVolume <= 0.4,
      `Target volume must be comfortable (0.2 - 0.4), got ${config.targetVolume}`
    );
    assert.ok(
      config.fadeInDurationMs >= 1000 && config.fadeInDurationMs <= 2500,
      `Fade-in duration must be smooth (1000 - 2500ms), got ${config.fadeInDurationMs}`
    );
    assert.ok(
      config.fadeOutDurationMs >= 400 && config.fadeOutDurationMs <= 1000,
      `Fade-out duration must be responsive (400 - 1000ms), got ${config.fadeOutDurationMs}`
    );
  });

  it("dynamically resolves authorized custom track via NEXT_PUBLIC_ALEXANDRINA_KENNETH_AUDIO_URL", () => {
    const prevUrl = process.env.NEXT_PUBLIC_ALEXANDRINA_KENNETH_AUDIO_URL;
    try {
      process.env.NEXT_PUBLIC_ALEXANDRINA_KENNETH_AUDIO_URL =
        "https://cdn.haxrsignature.com/audio/ceremonial-suite-authorized.mp3";

      const config = getAlexandrinaKennethAudioConfig();
      assert.equal(config.isAuthorized, true, "Must be authorized when valid custom URL is configured");
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

  it("fails closed when custom URL is blank or whitespace", () => {
    const prevUrl = process.env.NEXT_PUBLIC_ALEXANDRINA_KENNETH_AUDIO_URL;
    try {
      process.env.NEXT_PUBLIC_ALEXANDRINA_KENNETH_AUDIO_URL = "   ";

      const config = getAlexandrinaKennethAudioConfig();
      assert.equal(config.isAuthorized, false, "Must fail closed for blank whitespace URL");
      assert.equal(config.licensingStatus, "unauthorized_commercial");
    } finally {
      if (prevUrl !== undefined) {
        process.env.NEXT_PUBLIC_ALEXANDRINA_KENNETH_AUDIO_URL = prevUrl;
      } else {
        delete process.env.NEXT_PUBLIC_ALEXANDRINA_KENNETH_AUDIO_URL;
      }
    }
  });
});
