import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { describe, it, afterEach } from "node:test";
import {
  ALEXANDRINA_KENNETH_AUDIO_CONFIG,
  getAlexandrinaKennethAudioConfig,
  audioPlaybackReducer,
  type AudioPlaybackState,
  type AudioPlaybackAction,
} from "./audio";

describe("Alexandrina & Kenneth — Audio Availability & State Machine Contract", () => {
  const originalUrlEnv = process.env.NEXT_PUBLIC_ALEXANDRINA_KENNETH_AUDIO_URL;
  const originalLocalEnv = process.env.NEXT_PUBLIC_ALEXANDRINA_KENNETH_AUDIO_ALLOW_LOCAL;

  afterEach(() => {
    if (originalUrlEnv !== undefined) {
      process.env.NEXT_PUBLIC_ALEXANDRINA_KENNETH_AUDIO_URL = originalUrlEnv;
    } else {
      delete process.env.NEXT_PUBLIC_ALEXANDRINA_KENNETH_AUDIO_URL;
    }

    if (originalLocalEnv !== undefined) {
      process.env.NEXT_PUBLIC_ALEXANDRINA_KENNETH_AUDIO_ALLOW_LOCAL = originalLocalEnv;
    } else {
      delete process.env.NEXT_PUBLIC_ALEXANDRINA_KENNETH_AUDIO_ALLOW_LOCAL;
    }
  });

  // 1. Origem ausente → disabled (Modo Silencioso Intencional)
  it("1. Origem ausente → disabled: defaults to intentional silent mode without issuing network requests", () => {
    delete process.env.NEXT_PUBLIC_ALEXANDRINA_KENNETH_AUDIO_URL;
    delete process.env.NEXT_PUBLIC_ALEXANDRINA_KENNETH_AUDIO_ALLOW_LOCAL;

    const config = getAlexandrinaKennethAudioConfig();
    assert.equal(config.hasConfiguredOrigin, false);
    assert.equal(config.authorizedSrc, null, "Must NOT default to local unversioned MP3 path in unconfigured environments");
    assert.equal(config.customTrackUrl, null);
    assert.equal(config.initialState, "disabled", "Initial state must be 'disabled' when no origin is configured");
    assert.equal(config.isAuthorized, false, "Must not claim readiness when no physical audio source is configured");
    assert.equal(config.licensingStatus, "unauthorized_commercial");

    // Reducer test: INIT with hasOrigin=false yields 'disabled'
    const state = audioPlaybackReducer("disabled", { type: "INIT", hasOrigin: false });
    assert.equal(state, "disabled");
  });

  // 2. Origem configurada → tentativa de carregamento (loading)
  it("2. Origem configurada → loading: begins buffering when a verified URL is provided", () => {
    process.env.NEXT_PUBLIC_ALEXANDRINA_KENNETH_AUDIO_URL =
      "https://assets.haxrsignature.com/audio/alexandrina-kenneth/say-you-wont-let-go.mp3";

    const config = getAlexandrinaKennethAudioConfig();
    assert.equal(config.hasConfiguredOrigin, true);
    assert.equal(
      config.authorizedSrc,
      "https://assets.haxrsignature.com/audio/alexandrina-kenneth/say-you-wont-let-go.mp3"
    );
    assert.equal(config.initialState, "loading");
    assert.equal(config.isAuthorized, true);
    assert.equal(config.licensingStatus, "authorized_commercial");

    // Reducer test: INIT with hasOrigin=true yields 'loading'
    const state = audioPlaybackReducer("disabled", { type: "INIT", hasOrigin: true });
    assert.equal(state, "loading");
  });

  // 3. Recurso carregado → ready
  it("3. Recurso carregado → ready: transitions from loading to ready on CAN_PLAY event", () => {
    const s1 = audioPlaybackReducer("loading", { type: "CAN_PLAY" });
    assert.equal(s1, "ready", "CAN_PLAY event on loading state must transition to 'ready'");
  });

  // 4. Reprodução confirmada → playing
  it("4. Reprodução confirmada → playing: transitions to playing on PLAYING event", () => {
    const s1 = audioPlaybackReducer("ready", { type: "PLAYING" });
    assert.equal(s1, "playing");

    const s2 = audioPlaybackReducer("loading", { type: "PLAYING" });
    assert.equal(s2, "playing");
  });

  // 5. Pausa → paused
  it("5. Pausa → paused: transitions from playing to paused on PAUSE event", () => {
    const s1 = audioPlaybackReducer("playing", { type: "PAUSE" });
    assert.equal(s1, "paused");
  });

  // 6. Falha HTTP/MediaError → error
  it("6. Falha HTTP/MediaError → error: transitions to error state on network or decoding failures", () => {
    const s1 = audioPlaybackReducer("loading", { type: "ERROR", error: new Error("HTTP 404") });
    assert.equal(s1, "error");

    const s2 = audioPlaybackReducer("playing", { type: "ERROR", error: new Error("Decode error") });
    assert.equal(s2, "error");
  });

  // 7. Erro de reprodução → sem falsa indicação de sucesso
  it("7. Erro de reprodução → sem falsa indicação de sucesso: rejects playing transitions when disabled or erroring", () => {
    // When disabled, rogue playback events must remain disabled
    const s1 = audioPlaybackReducer("disabled", { type: "PLAYING" });
    assert.equal(s1, "disabled", "Disabled state must never enter 'playing'");

    const s2 = audioPlaybackReducer("disabled", { type: "LOAD_START" });
    assert.equal(s2, "disabled");

    // In error state, CAN_PLAY does not mask the error
    const s3 = audioPlaybackReducer("error", { type: "CAN_PLAY" });
    assert.equal(s3, "error", "Error state must not be masked by stray CAN_PLAY");
  });

  // 8. Retoma → sem duplicação
  it("8. Retoma → sem duplicação: allows controlled resume and retry from paused or error", () => {
    // From paused -> playing
    const s1 = audioPlaybackReducer("paused", { type: "PLAYING" });
    assert.equal(s1, "playing");

    // From error -> RETRY transitions to loading
    const s2 = audioPlaybackReducer("error", { type: "RETRY" });
    assert.equal(s2, "loading");
  });

  // 9. Falha do áudio → convite permanece operacional
  it("9. Falha do áudio → convite permanece operacional: reducer is pure, deterministic, and handles unknown actions gracefully", () => {
    const s1 = audioPlaybackReducer("error", { type: "ERROR", error: "repeated error" });
    assert.equal(s1, "error");

    // Unknown action preserves state without throwing
    const s2 = audioPlaybackReducer("ready", { type: "UNKNOWN" as any });
    assert.equal(s2, "ready");
  });

  // 10. Origem ausente em Production → nenhum pedido à rota local inexistente
  it("10. Origem ausente em Production → nenhum pedido à rota local inexistente: whitespace/empty env vars are trimmed to null", () => {
    process.env.NEXT_PUBLIC_ALEXANDRINA_KENNETH_AUDIO_URL = "   ";
    delete process.env.NEXT_PUBLIC_ALEXANDRINA_KENNETH_AUDIO_ALLOW_LOCAL;

    const config = getAlexandrinaKennethAudioConfig();
    assert.equal(config.authorizedSrc, null, "Must NOT emit local MP3 route for empty/whitespace env");
    assert.equal(config.hasConfiguredOrigin, false);
    assert.equal(config.initialState, "disabled");
  });

  // 11. Local development override explicitly opted-in
  it("11. Local engineering workstation override: enables local master when explicitly opted-in", () => {
    delete process.env.NEXT_PUBLIC_ALEXANDRINA_KENNETH_AUDIO_URL;
    process.env.NEXT_PUBLIC_ALEXANDRINA_KENNETH_AUDIO_ALLOW_LOCAL = "1";

    const config = getAlexandrinaKennethAudioConfig();
    assert.equal(config.authorizedSrc, "/audio/alexandrina-kenneth/say-you-wont-let-go.mp3");
    assert.equal(config.hasConfiguredOrigin, true);
    assert.equal(config.initialState, "loading");
    assert.equal(config.isAuthorized, true);
  });

  // 12. Invariant Musical Identity
  it("12. Invariant Musical Identity: retains canonical title and artist regardless of storage source", () => {
    const config = getAlexandrinaKennethAudioConfig();
    assert.equal(config.title, "Say You Won't Let Go");
    assert.equal(config.artist, "James Arthur");
    assert.equal(config.targetVolume, 0.35);
    assert.equal(config.fadeInDurationMs, 3000);
    assert.equal(config.fadeOutDurationMs, 600);
  });

  // 13. Physical local master file cryptographic integrity verification
  it("13. Physical local master file cryptographic integrity verification", (t) => {
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
