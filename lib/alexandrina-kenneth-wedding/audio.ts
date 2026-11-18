/**
 * Alexandrina & Kenneth — Audio Licensing and Configuration
 *
 * COMMERCIAL TRACK SPECIFICATION:
 * - Title: "Say You Won't Let Go"
 * - Artist: "James Arthur"
 * - Label / Rights Owner: Sony Music Entertainment / Sony Music Publishing
 *
 * LEGAL COMPLIANCE & LICENSING INTEGRITY:
 * In accordance with HAXR Signature copyright standards, commercial master
 * recordings must NEVER be activated without verifiable written synchronization
 * and digital communication licensing from the respective rightsholders.
 * Storing a commercial MP3 file on a private CDN or R2 bucket does NOT constitute
 * legal authorization.
 *
 * CONFIGURATION CONTRACT:
 * - `commercialLicenseConfirmed`: Set to `true` ONLY when formal legal clearance
 *   has been vetted and executed by the organisation. Defaults strictly to `false`.
 * - `customTrackUrl`: Can be supplied via environment variable
 *   `NEXT_PUBLIC_ALEXANDRINA_KENNETH_AUDIO_URL` for organisation-approved,
 *   royalty-free, or licensed ceremonial recordings.
 * - `isAuthorized`: Boolean evaluated dynamically: true if either commercial
 *   license is confirmed OR an authorized custom track is provided.
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

  // Commercial license is strictly false until formal proof of sync license is on record
  const commercialLicenseConfirmed = false;

  const isCustomAuthorized = Boolean(customUrl && customUrl.length > 0);
  const isAuthorized = commercialLicenseConfirmed || isCustomAuthorized;

  const licensingStatus = commercialLicenseConfirmed
    ? ("authorized_commercial" as const)
    : isCustomAuthorized
      ? ("authorized_custom" as const)
      : ("unauthorized_commercial" as const);

  return {
    title: isCustomAuthorized ? "Música Cerimonial" : "Say You Won't Let Go",
    artist: isCustomAuthorized ? "Edição Especial" : "James Arthur",
    commercialLicenseConfirmed,
    authorizedSrc: customUrl || "/audio/alexandrina-kenneth/say-you-wont-let-go.mp3",
    placeholderSrc: "/audio/alexandrina-kenneth/say-you-wont-let-go-placeholder.mp3",
    ambientFallbackSrc: "/audio/bg-music-web.mp3",
    customTrackUrl: customUrl,
    targetVolume: 0.32,
    fadeInDurationMs: 1800,
    fadeOutDurationMs: 600,
    isAuthorized,
    licensingStatus,
  };
}

export const ALEXANDRINA_KENNETH_AUDIO_CONFIG = getAlexandrinaKennethAudioConfig();
