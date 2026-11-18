"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Play, Pause, VolumeX } from "lucide-react";
import {
  ALEXANDRINA_KENNETH_AUDIO_CONFIG,
  getAlexandrinaKennethAudioConfig,
} from "@lib/alexandrina-kenneth-wedding/audio";

export interface AlexandrinaKennethAudioHandle {
  playOnUserGesture: () => Promise<boolean>;
  pause: () => void;
  toggle: () => void;
  isPlaying: () => boolean;
}

export interface AlexandrinaKennethAudioToggleProps {
  autoStart?: boolean;
  showToggle?: boolean;
}

export const AlexandrinaKennethAudioToggle = forwardRef<
  AlexandrinaKennethAudioHandle,
  AlexandrinaKennethAudioToggleProps
>(function AlexandrinaKennethAudioToggle(
  { autoStart = false, showToggle = true },
  ref
) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const config = getAlexandrinaKennethAudioConfig();
  const isAuthorized = config.isAuthorized;

  const showFeedbackToast = useCallback((msg: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimeoutRef.current = null;
    }, 3200);
  }, []);

  const clearFade = useCallback(() => {
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }
  }, []);

  const fadeTo = useCallback(
    (targetVolume: number, durationMs: number, onComplete?: () => void) => {
      const audio = audioRef.current;
      if (!audio) return;
      clearFade();
      const startVolume = audio.volume;
      const startTime = Date.now();
      const intervalMs = 40;

      fadeIntervalRef.current = setInterval(() => {
        if (!audio) {
          clearFade();
          return;
        }
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / durationMs, 1);
        // Exponential ease-out for natural, elegant luxury transition
        const easedProgress = 1 - Math.pow(1 - progress, 2);
        const currentVal = startVolume + (targetVolume - startVolume) * easedProgress;
        audio.volume = Math.max(0, Math.min(1, currentVal));

        if (progress >= 1) {
          clearFade();
          onComplete?.();
        }
      }, intervalMs);
    },
    [clearFade]
  );

  const startPlayback = useCallback(async (): Promise<boolean> => {
    if (!isAuthorized) {
      return false;
    }

    const audio = audioRef.current;
    if (!audio) return false;

    try {
      audio.volume = 0;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise;
      }
      fadeTo(config.targetVolume, config.fadeInDurationMs);
      return true;
    } catch (err) {
      console.warn("[Alexandrina & Kenneth Audio] Playback prevented:", err);
      setIsPlaying(false);
      return false;
    }
  }, [config.fadeInDurationMs, config.targetVolume, fadeTo, isAuthorized]);

  const pausePlayback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    fadeTo(0, config.fadeOutDurationMs, () => {
      audio.pause();
      setIsPlaying(false);
    });
    showFeedbackToast("Música pausada");
  }, [config.fadeOutDurationMs, fadeTo, showFeedbackToast]);

  const resumePlayback = useCallback(async (): Promise<boolean> => {
    if (!isAuthorized) {
      showFeedbackToast("Áudio cerimonial sob consulta");
      return false;
    }

    const audio = audioRef.current;
    if (!audio) return false;

    try {
      audio.volume = 0;
      await audio.play();
      fadeTo(config.targetVolume, Math.min(config.fadeInDurationMs, 1200));
      return true;
    } catch (err) {
      console.warn("[Alexandrina & Kenneth Audio] Resume failed:", err);
      setIsPlaying(false);
      return false;
    }
  }, [config.fadeInDurationMs, config.targetVolume, fadeTo, isAuthorized, showFeedbackToast]);

  const togglePlayback = useCallback(() => {
    if (!isAuthorized) {
      showFeedbackToast("Áudio cerimonial sob consulta");
      return;
    }

    if (isPlaying) {
      pausePlayback();
    } else {
      void resumePlayback();
    }
  }, [isAuthorized, isPlaying, pausePlayback, resumePlayback, showFeedbackToast]);

  // Imperative handle for parent (Cover Gate) to trigger audio immediately on user tap
  useImperativeHandle(
    ref,
    () => ({
      playOnUserGesture: async () => {
        return startPlayback();
      },
      pause: () => {
        pausePlayback();
      },
      toggle: () => {
        togglePlayback();
      },
      isPlaying: () => isPlaying,
    }),
    [isPlaying, pausePlayback, startPlayback, togglePlayback]
  );

  // Deep-link auto-start fallback
  useEffect(() => {
    if (autoStart && isAuthorized) {
      void startPlayback();
    }
  }, [autoStart, isAuthorized, startPlayback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearFade();
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, [clearFade]);

  return (
    <>
      <audio
        ref={audioRef}
        id="bgMusic"
        loop
        playsInline
        preload={isAuthorized ? "auto" : "none"}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onPlaying={() => {
          setIsPlaying(true);
          if (isAuthorized) {
            showFeedbackToast(`🎶 ${config.title} — ${config.artist}`);
          }
        }}
        onError={(e) => {
          console.warn("[Alexandrina & Kenneth Audio] Native audio error:", e);
          setIsPlaying(false);
          clearFade();
        }}
      >
        {isAuthorized && (
          <source src={config.authorizedSrc} type="audio/mpeg" />
        )}
      </audio>

      {showToggle && (
        <button
          type="button"
          className="audio-toggle cursor-pointer"
          id="audioToggle"
          onClick={togglePlayback}
          aria-label={
            !isAuthorized
              ? "Áudio cerimonial sob consulta"
              : isPlaying
                ? "Pausar música"
                : "Tocar música"
          }
          aria-pressed={isPlaying}
        >
          {!isAuthorized ? (
            <VolumeX
              className="audio-toggle__icon opacity-80"
              aria-hidden="true"
              size={20}
            />
          ) : isPlaying ? (
            <Pause
              className="audio-toggle__icon"
              aria-hidden="true"
              size={20}
            />
          ) : (
            <Play
              className="audio-toggle__icon"
              aria-hidden="true"
              size={20}
            />
          )}
          <span className="audio-toggle__sr sr-only">
            {!isAuthorized
              ? "Áudio cerimonial sob consulta"
              : isPlaying
                ? "Música a tocar"
                : "Música pausada"}
          </span>
        </button>
      )}

      {toastMessage && (
        <div
          className="audio-toast fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#1a1a1a]/95 text-[#d4af37] text-xs tracking-wider uppercase backdrop-blur-md shadow-lg border border-[#d4af37]/30 transition-all duration-300 pointer-events-none select-none"
          role="status"
          aria-live="polite"
        >
          {toastMessage}
        </div>
      )}
    </>
  );
});
