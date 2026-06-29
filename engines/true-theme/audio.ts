import type { TrueTheme } from "../../theme/true-types";

export class ExperienceAudioPlayer {
  private audio: HTMLAudioElement | null = null;
  private active = false;
  private fadeTimer: ReturnType<typeof setInterval> | null = null;
  private theme: TrueTheme;
  private onStateChange: (active: boolean) => void;

  constructor(theme: TrueTheme, onStateChange: (active: boolean) => void) {
    if (typeof window === "undefined") {
      this.onStateChange = () => {};
      this.theme = theme;
      return;
    }
    this.theme = theme;
    this.onStateChange = onStateChange;
    this.audio = new Audio();
    this.audio.loop = true;
    this.audio.preload = "none";
    this.audio.volume = 0;
    this.audio.setAttribute("playsinline", "");
  }

  private storePreference(on: boolean): void {
    localStorage.setItem(
      `haxr_experience_audio_${this.theme.identity}`,
      on ? "on" : "off"
    );
  }

  getPreference(): boolean | null {
    if (typeof window === "undefined") return null;
    const value = localStorage.getItem(
      `haxr_experience_audio_${this.theme.identity}`
    );
    if (value === "on") return true;
    if (value === "off") return false;
    return null;
  }

  private clearFade(): void {
    if (this.fadeTimer) {
      clearInterval(this.fadeTimer);
      this.fadeTimer = null;
    }
  }

  private easeInCubic(t: number): number {
    return t * t * t;
  }

  private fadeTo(
    target: number,
    durationMs: number,
    onComplete?: () => void
  ): void {
    if (!this.audio) return;
    this.clearFade();
    const start = this.audio.volume;
    const startedAt = Date.now();

    this.fadeTimer = setInterval(() => {
      if (!this.audio) return;
      const elapsed = Date.now() - startedAt;
      const linear = Math.min(elapsed / durationMs, 1);
      const eased = this.easeInCubic(linear);
      this.audio.volume = start + (target - start) * eased;
      if (linear >= 1) {
        this.clearFade();
        onComplete?.();
      }
    }, 40);
  }

  async start(): Promise<boolean> {
    if (
      !this.audio ||
      this.active ||
      this.theme.audio.type === "silent" ||
      !this.theme.audio.src
    ) {
      return false;
    }

    const absoluteSrc = new URL(
      this.theme.audio.src,
      window.location.origin
    ).href;
    if (this.audio.src !== absoluteSrc) {
      this.audio.src = this.theme.audio.src;
      this.audio.load();
    }

    try {
      this.audio.volume = 0;
      await this.audio.play();
      this.active = true;
      this.storePreference(true);
      this.onStateChange(true);
      this.fadeTo(this.theme.audio.volume, this.theme.audio.fadeIn);
      return true;
    } catch (error) {
      console.warn("[experience-audio] play failed:", error);
      this.active = false;
      this.onStateChange(false);
      return false;
    }
  }

  stop(): void {
    if (!this.audio || !this.active) return;
    this.active = false;
    this.storePreference(false);
    this.onStateChange(false);
    const fadeOut = this.theme.audio.fadeOut ?? 800;
    this.fadeTo(0, fadeOut, () => {
      this.audio?.pause();
      if (this.audio) this.audio.currentTime = 0;
    });
  }

  /** Pausa sem reiniciar a faixa — para controlo play/pause */
  pause(): void {
    if (!this.audio || !this.active) return;
    this.active = false;
    this.storePreference(false);
    this.onStateChange(false);
    const fadeOut = Math.min(this.theme.audio.fadeOut ?? 800, 600);
    this.fadeTo(0, fadeOut, () => {
      this.audio?.pause();
    });
  }

  async resume(): Promise<boolean> {
    if (
      !this.audio ||
      this.active ||
      this.theme.audio.type === "silent" ||
      !this.theme.audio.src
    ) {
      return false;
    }

    try {
      if (!this.audio.src) {
        return this.start();
      }
      await this.audio.play();
      this.active = true;
      this.storePreference(true);
      this.onStateChange(true);
      this.fadeTo(
        this.theme.audio.volume,
        Math.min(this.theme.audio.fadeIn, 1500)
      );
      return true;
    } catch (error) {
      console.warn("[experience-audio] resume failed:", error);
      return false;
    }
  }

  hasLoadedTrack(): boolean {
    return Boolean(this.audio?.src && this.audio.currentTime > 0);
  }

  isPlaying(): boolean {
    return this.active;
  }
}
