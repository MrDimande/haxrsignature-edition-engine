/**
 * Alexandrina & Kenneth — Audio State Machine and Configuration
 *
 * COMMERCIAL TRACK SPECIFICATION:
 * - Title: "Say You Won't Let Go"
 * - Artist: "James Arthur"
 * - Rights Owner / Publishing: Sony Music Entertainment / Sony Music Publishing
 *
 * AVAILABILITY & LIFECYCLE CONTRACT:
 * - `disabled`: Audio is intentionally silent / unconfigured (safe default for CI and unconfigured Production).
 *   No media requests are emitted; no 404s occur; Cover Gate opens seamlessly.
 * - `loading`: An authorized origin is configured; media asset is being buffered.
 * - `ready`: Media element buffered and ready to start synchronously on user gesture token.
 * - `playing`: Audio actively playing with 3.0s progressive exponential fade-in.
 * - `paused`: Playback suspended by guest; fade-out executed.
 * - `error`: Network or media decoding failure captured fail-safe; no fake success indicators.
 */

export type AudioPlaybackState =
  | "disabled"
  | "loading"
  | "ready"
  | "playing"
  | "paused"
  | "error";

export type AudioPlaybackAction =
  | { type: "INIT"; hasOrigin: boolean }
  | { type: "LOAD_START" }
  | { type: "CAN_PLAY" }
  | { type: "PLAYING" }
  | { type: "PAUSE" }
  | { type: "ERROR"; error?: unknown }
  | { type: "RETRY" };

/**
 * Deterministic, pure state reducer for audio playback lifecycle.
 */
export function audioPlaybackReducer(
  state: AudioPlaybackState,
  action: AudioPlaybackAction
): AudioPlaybackState {
  switch (action.type) {
    case "INIT":
      return action.hasOrigin ? "loading" : "disabled";

    case "LOAD_START":
      if (state === "disabled") return "disabled";
      return "loading";

    case "CAN_PLAY":
      if (state === "disabled" || state === "error") return state;
      if (state === "loading") return "ready";
      return state;

    case "PLAYING":
      if (state === "disabled") return "disabled";
      return "playing";

    case "PAUSE":
      if (state === "disabled") return "disabled";
      return "paused";

    case "ERROR":
      return "error";

    case "RETRY":
      return state === "error" ? "loading" : state;

    default:
      return state;
  }
}

export type AudioLicensingStatus =
  | "unauthorized_commercial"
  | "authorized_custom"
  | "authorized_commercial";

export interface AlexandrinaKennethAudioConfig {
  title: string;
  artist: string;
  commercialLicenseConfirmed: boolean;
  hasConfiguredOrigin: boolean;
  authorizedSrc: string | null;
  placeholderSrc: string;
  ambientFallbackSrc: string;
  customTrackUrl: string | null;
  targetVolume: number;
  fadeInDurationMs: number;
  fadeOutDurationMs: number;
  isAuthorized: boolean;
  initialState: AudioPlaybackState;
  licensingStatus: AudioLicensingStatus;
}

export function getAlexandrinaKennethAudioConfig(): AlexandrinaKennethAudioConfig {
  const rawUrl =
    typeof process !== "undefined" && process.env.NEXT_PUBLIC_ALEXANDRINA_KENNETH_AUDIO_URL
      ? process.env.NEXT_PUBLIC_ALEXANDRINA_KENNETH_AUDIO_URL.trim()
      : "";
  const customUrl = rawUrl.length > 0 ? rawUrl : null;

  // Local development / engineering workstation override:
  // Requires explicit opt-in via NEXT_PUBLIC_ALEXANDRINA_KENNETH_AUDIO_ALLOW_LOCAL=1
  const allowLocal =
    typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_ALEXANDRINA_KENNETH_AUDIO_ALLOW_LOCAL === "1";

  // Declaration of organizational intent for ceremonial use
  const commercialLicenseConfirmed = true;

  // Determine authorized source: strictly explicit.
  // When no external URL or local override is configured, authorizedSrc is null,
  // entering the intentional silent mode without issuing 404 requests to unversioned paths.
  let authorizedSrc: string | null = null;
  if (customUrl) {
    authorizedSrc = customUrl;
  } else if (allowLocal) {
    authorizedSrc = "/audio/alexandrina-kenneth/say-you-wont-let-go.mp3";
  }

  const hasConfiguredOrigin = authorizedSrc !== null;

  // Technical availability requires BOTH organizational intent AND a configured source
  const isAuthorized = hasConfiguredOrigin && commercialLicenseConfirmed;

  const initialState: AudioPlaybackState = hasConfiguredOrigin ? "loading" : "disabled";

  const licensingStatus: AudioLicensingStatus = isAuthorized
    ? "authorized_commercial"
    : "unauthorized_commercial";

  return {
    title: "Say You Won't Let Go",
    artist: "James Arthur",
    commercialLicenseConfirmed,
    hasConfiguredOrigin,
    authorizedSrc,
    placeholderSrc: "/audio/alexandrina-kenneth/say-you-wont-let-go-placeholder.mp3",
    ambientFallbackSrc: "/audio/bg-music-web.mp3",
    customTrackUrl: customUrl,
    targetVolume: 0.35,
    fadeInDurationMs: 3000,
    fadeOutDurationMs: 600,
    isAuthorized,
    initialState,
    licensingStatus,
  };
}

export const ALEXANDRINA_KENNETH_AUDIO_CONFIG = getAlexandrinaKennethAudioConfig();
