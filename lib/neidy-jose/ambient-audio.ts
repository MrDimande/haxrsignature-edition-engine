/**
 * Shared ambient audio for Neidy & José — singleton so gate + dock share one player.
 * Editorial fade-in / fade-out; never hard-cuts volume.
 */
import { NEIDY_JOSE_CONSTANTS } from "./constants";

const TARGET_VOLUME = 0.48;
const FADE_IN_MS = 2600;
const FADE_OUT_MS = 1600;

let ambient: HTMLAudioElement | null = null;
let fadeFrame: number | null = null;
let fadeToken = 0;

function getAmbient(): HTMLAudioElement {
  if (typeof window === "undefined") {
    throw new Error("Ambient audio is client-only");
  }
  const src = NEIDY_JOSE_CONSTANTS.audio.src;
  if (!ambient) {
    ambient = new Audio(src);
    ambient.loop = true;
    ambient.volume = 0;
    ambient.preload = "auto";
    // Helps iOS treat the element as inline media after a user gesture.
    ambient.setAttribute("playsinline", "true");
    ambient.setAttribute("webkit-playsinline", "true");
  } else {
    const currentPath = (() => {
      try {
        return new URL(ambient.src, window.location.href).pathname;
      } catch {
        return ambient.src;
      }
    })();
    if (currentPath !== src) {
      ambient.pause();
      ambient.src = src;
      ambient.loop = true;
      ambient.volume = 0;
      ambient.preload = "auto";
    }
  }
  return ambient;
}

/** Preload so the first play() after the gate tap is instant. */
export function primeNeidyJoseAmbient(): void {
  try {
    getAmbient().load();
  } catch {
    /* ignore */
  }
}

function cancelFade(): void {
  if (fadeFrame !== null) {
    window.cancelAnimationFrame(fadeFrame);
    fadeFrame = null;
  }
  fadeToken += 1;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function fadeVolume(to: number, durationMs: number): Promise<void> {
  const audio = getAmbient();
  cancelFade();
  const token = fadeToken;
  const from = audio.volume;
  const startedAt = performance.now();

  return new Promise((resolve) => {
    const step = (now: number) => {
      if (token !== fadeToken) {
        resolve();
        return;
      }

      const elapsed = now - startedAt;
      const progress = Math.min(1, elapsed / Math.max(1, durationMs));
      const eased = easeInOutCubic(progress);
      audio.volume = from + (to - from) * eased;

      if (progress < 1) {
        fadeFrame = window.requestAnimationFrame(step);
        return;
      }

      fadeFrame = null;
      audio.volume = to;
      resolve();
    };

    fadeFrame = window.requestAnimationFrame(step);
  });
}

/**
 * Starts ambient with a soft editorial fade-in.
 * Must be called from a user gesture (gate tap) — browsers block delayed play().
 */
export async function startNeidyJoseAmbient(): Promise<boolean> {
  try {
    const audio = getAmbient();
    if (audio.paused) {
      audio.volume = 0;
      await audio.play();
    }
    await fadeVolume(TARGET_VOLUME, FADE_IN_MS);
    return !audio.paused;
  } catch {
    return false;
  }
}

/** Soft fade-out, then pause. */
export async function pauseNeidyJoseAmbient(): Promise<void> {
  if (!ambient || ambient.paused) return;
  try {
    await fadeVolume(0, FADE_OUT_MS);
    if (ambient && ambient.volume <= 0.01) {
      ambient.pause();
      ambient.volume = 0;
    }
  } catch {
    ambient?.pause();
    if (ambient) ambient.volume = 0;
  }
}

export async function toggleNeidyJoseAmbient(): Promise<boolean> {
  const audio = getAmbient();
  if (!audio.paused && audio.volume > 0.02) {
    await pauseNeidyJoseAmbient();
    return false;
  }
  return startNeidyJoseAmbient();
}

export function isNeidyJoseAmbientPlaying(): boolean {
  return Boolean(ambient && !ambient.paused && ambient.volume > 0.02);
}
