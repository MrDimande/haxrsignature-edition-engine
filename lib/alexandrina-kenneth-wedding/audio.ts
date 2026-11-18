/**
 * Alexandrina & Kenneth — Audio Licensing and Configuration
 *
 * COMMERCIAL TRACK SPECIFICATION:
 * - Title: "Say You Won't Let Go"
 * - Artist: "James Arthur"
 * - Label / Rights Owner: Sony Music Entertainment / Sony Music Publishing
 *
 * ORGANISATIONAL AUTHORISATION:
 * Confirmed by the organisation on 18 November 2026 for the ceremonial
 * wedding invitation experience of Alexandrina Mitilane & Kenneth Novele.
 *
 * CONFIGURATION CONTRACT:
 * - `commercialLicenseConfirmed`: Declared authorized by the organisation.
 * - `authorizedSrc`: Points to the official master recording at
 *   `/audio/alexandrina-kenneth/say-you-wont-let-go.mp3`.
 * - `fadeInDurationMs`: 3000ms (~3.0 seconds progressive fade-in).
 * - `targetVolume`: 0.35 (comfortable ceremonial volume).
 * - `isAuthorized`: Evaluates to `true` when authorized recording is active.
 */

export interface AlexandrinaKennethAudioConfig {
  title: string;
  artist: string;
  commercialLicenseConfirmed: boolean;
  authorizedSrc: string;
  placeholderSrc: string;
  ambientFallbackSrc: string;
  customTrackUrl: string | null;
  targetVolume: number;
  fadeInDurationMs: number;
  fadeOutDurationMs: number;
  isAuthorized: boolean;
  licensingStatus: "unauthorized_commercial" | "authorized_custom" | "authorized_commercial";
}

export function getAlexandrinaKennethAudioConfig(): AlexandrinaKennethAudioConfig {
  const customUrl =
    typeof process !== "undefined" && process.env.NEXT_PUBLIC_ALEXANDRINA_KENNETH_AUDIO_URL
      ? process.env.NEXT_PUBLIC_ALEXANDRINA_KENNETH_AUDIO_URL.trim()
      : null;

  // Authorisation confirmed by organisation decision
  const commercialLicenseConfirmed = true;

  const isCustomAuthorized = Boolean(customUrl && customUrl.length > 0);
  const isAuthorized = commercialLicenseConfirmed || isCustomAuthorized;

  const licensingStatus = isCustomAuthorized
    ? ("authorized_custom" as const)
    : commercialLicenseConfirmed
      ? ("authorized_commercial" as const)
      : ("unauthorized_commercial" as const);

  return {
    title: isCustomAuthorized ? "Música Cerimonial" : "Say You Won't Let Go",
    artist: isCustomAuthorized ? "Edição Especial" : "James Arthur",
    commercialLicenseConfirmed,
    authorizedSrc: customUrl || "/audio/alexandrina-kenneth/say-you-wont-let-go.mp3",
    placeholderSrc: "/audio/alexandrina-kenneth/say-you-wont-let-go-placeholder.mp3",
    ambientFallbackSrc: "/audio/bg-music-web.mp3",
    customTrackUrl: customUrl,
    targetVolume: 0.35,
    fadeInDurationMs: 3000,
    fadeOutDurationMs: 600,
    isAuthorized,
    licensingStatus,
  };
}

export const ALEXANDRINA_KENNETH_AUDIO_CONFIG = getAlexandrinaKennethAudioConfig();
