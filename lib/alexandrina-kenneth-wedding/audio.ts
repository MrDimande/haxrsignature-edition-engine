/**
 * Alexandrina & Kenneth — Audio Licensing and Configuration
 *
 * Commercial track: "Say You Won't Let Go" — James Arthur (Sony Music Entertainment)
 * Strictly excluded from public repository tracking to comply with copyright licensing.
 *
 * Flip `isAuthorized` to `true` ONLY when an organisation-supplied, legally cleared
 * track is placed at `authorizedSrc` in private R2 / production deployment storage.
 */
export const ALEXANDRINA_KENNETH_AUDIO_CONFIG = {
  title: "Say You Won't Let Go",
  artist: "James Arthur",
  authorizedSrc: "/audio/alexandrina-kenneth/say-you-wont-let-go.mp3",
  placeholderSrc: "/audio/alexandrina-kenneth/say-you-wont-let-go-placeholder.mp3",
  /**
   * Set to `false` in public repository / standard build until formal licensing is confirmed.
   */
  isAuthorized: false,
} as const;
