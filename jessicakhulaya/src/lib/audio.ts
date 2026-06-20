/**
 * Música de fundo — Cerimónia de Kulaya
 * HTML5 Audio simples e fiável (mobile-first, gesto do utilizador).
 */

export const KULAYA_AUDIO = {
  src: "/audio/bg-music-web.mp3",
  storageKey: "haxr_kulaya_audio",
  targetVolume: 0.55,
  fadeInMs: 7500,
  fadeInDelayMs: 500,
  fadeOutMs: 800,
} as const;

export function getStoredAudioPreference(): boolean | null {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(KULAYA_AUDIO.storageKey);
  if (value === "on") return true;
  if (value === "off") return false;
  return null;
}

export function shouldAutoPlayKulayaAudio(): boolean {
  return getStoredAudioPreference() !== false;
}

class KulayaBackgroundMusic {
  private audio: HTMLAudioElement | null = null;
  private active = false;
  private fadeTimer: ReturnType<typeof setInterval> | null = null;
  private resolvedSrc: string | null = null;

  constructor() {
    if (typeof window === "undefined") return;
    this.audio = new Audio();
    this.audio.loop = true;
    this.audio.preload = "none";
    this.audio.volume = 0;
    this.audio.setAttribute("playsinline", "");
  }

  private storePreference(on: boolean): void {
    localStorage.setItem(KULAYA_AUDIO.storageKey, on ? "on" : "off");
  }

  private clearFade(): void {
    if (this.fadeTimer) {
      clearInterval(this.fadeTimer);
      this.fadeTimer = null;
    }
  }

  /** Curva suave — entrada quase imperceptível nos primeiros segundos */
  private easeInCubic(t: number): number {
    return t * t * t;
  }

  private fadeTo(
    target: number,
    durationMs: number,
    onComplete?: () => void,
    delayMs = 0
  ): void {
    if (!this.audio) return;
    this.clearFade();
    const start = this.audio.volume;
    const startedAt = Date.now() + delayMs;

    this.fadeTimer = setInterval(() => {
      if (!this.audio) return;
      const elapsed = Date.now() - startedAt;
      if (elapsed < 0) return;
      const linear = Math.min(elapsed / durationMs, 1);
      const eased = this.easeInCubic(linear);
      this.audio.volume = start + (target - start) * eased;
      if (linear >= 1) {
        this.clearFade();
        onComplete?.();
      }
    }, 40);
  }

  private async resolveSource(): Promise<string> {
    if (this.resolvedSrc) return this.resolvedSrc;
    this.resolvedSrc = KULAYA_AUDIO.src;
    return this.resolvedSrc;
  }

  async start(): Promise<boolean> {
    if (!this.audio || this.active) return this.active;

    const src = await this.resolveSource();
    const absoluteSrc = new URL(src, window.location.origin).href;
    if (this.audio.src !== absoluteSrc) {
      this.audio.src = src;
      this.audio.load();
    }

    try {
      this.audio.volume = 0;
      await this.audio.play();
      this.active = true;
      this.storePreference(true);
      this.fadeTo(
        KULAYA_AUDIO.targetVolume,
        KULAYA_AUDIO.fadeInMs,
        undefined,
        KULAYA_AUDIO.fadeInDelayMs
      );
      return true;
    } catch (error) {
      console.warn("[kulaya-audio] Falha ao iniciar música:", error);
      this.active = false;
      return false;
    }
  }

  stop(): void {
    if (!this.audio || !this.active) return;

    this.active = false;
    this.storePreference(false);
    this.fadeTo(0, KULAYA_AUDIO.fadeOutMs, () => {
      this.audio?.pause();
      if (this.audio) this.audio.currentTime = 0;
    });
  }

  isPlaying(): boolean {
    return this.active;
  }
}

export const kulayaMusic =
  typeof window !== "undefined" ? new KulayaBackgroundMusic() : null;

/** @deprecated Alias legado usado pelos componentes Kulaya */
export const kalimbaPlayer = kulayaMusic;
