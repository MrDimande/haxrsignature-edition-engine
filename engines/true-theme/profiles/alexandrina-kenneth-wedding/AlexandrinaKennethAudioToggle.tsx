"use client";

import React, {
  useEffect,
  useRef,
  useReducer,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useState,
} from "react";
import { Play, Pause, VolumeX, Loader2 } from "lucide-react";
import {
  getAlexandrinaKennethAudioConfig,
  audioPlaybackReducer,
  type AudioPlaybackState,
} from "@lib/alexandrina-kenneth-wedding/audio";

export interface AlexandrinaKennethAudioHandle {
  playOnUserGesture: () => Promise<boolean>;
  pause: () => void;
  toggle: () => void;
  isPlaying: () => boolean;
  getState: () => AudioPlaybackState;
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
  const config = getAlexandrinaKennethAudioConfig();
  const [state, dispatch] = useReducer(audioPlaybackReducer, config.initialState);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isStartingRef = useRef(false);
  const autoStartAttemptedRef = useRef(false);
  const retryCountRef = useRef(0);
  const MAX_MANUAL_RETRIES = 3;

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
    // Mode Silencieux Intentionnel: no-op if disabled or unconfigured
    if (state === "disabled" || !config.authorizedSrc) {
      return false;
    }

    const audio = audioRef.current;
    if (!audio) return false;

    // Idempotency & concurrency guard: prevent duplicate play calls and avoid restarting ongoing fade-in
    if ((!audio.paused && audio.currentTime > 0) || isStartingRef.current) {
      return true;
    }

    isStartingRef.current = true;
    dispatch({ type: "LOAD_START" });

    try {
      if (audio.paused) {
        audio.volume = 0;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          await playPromise;
        }
      }
      dispatch({ type: "PLAYING" });
      fadeTo(config.targetVolume, config.fadeInDurationMs);
      return true;
    } catch (err) {
      console.warn("[Alexandrina & Kenneth Audio] Playback prevented:", err);
      clearFade();
      dispatch({ type: "ERROR", error: err });
      return false;
    } finally {
      isStartingRef.current = false;
    }
  }, [config.authorizedSrc, config.fadeInDurationMs, config.targetVolume, fadeTo, state]);

  const pausePlayback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    fadeTo(0, config.fadeOutDurationMs, () => {
      audio.pause();
      dispatch({ type: "PAUSE" });
    });
    showFeedbackToast("Música pausada");
  }, [config.fadeOutDurationMs, fadeTo, showFeedbackToast]);

  const resumePlayback = useCallback(async (): Promise<boolean> => {
    if (state === "disabled" || !config.authorizedSrc) {
      return false;
    }

    const audio = audioRef.current;
    if (!audio) return false;

    if (!audio.paused || isStartingRef.current) {
      return true;
    }

    isStartingRef.current = true;
    try {
      audio.volume = 0;
      await audio.play();
      dispatch({ type: "PLAYING" });
      fadeTo(config.targetVolume, Math.min(config.fadeInDurationMs, 1200));
      return true;
    } catch (err) {
      console.warn("[Alexandrina & Kenneth Audio] Resume failed:", err);
      clearFade();
      dispatch({ type: "ERROR", error: err });
      return false;
    } finally {
      isStartingRef.current = false;
    }
  }, [config.authorizedSrc, config.fadeInDurationMs, config.targetVolume, fadeTo, state]);

  const togglePlayback = useCallback(async () => {
    if (state === "disabled" || !config.authorizedSrc) {
      return;
    }

    if (state === "error") {
      if (retryCountRef.current >= MAX_MANUAL_RETRIES) {
        showFeedbackToast("Áudio temporariamente indisponível");
        return;
      }
      retryCountRef.current += 1;
      showFeedbackToast("A restabelecer áudio cerimonial...");
      clearFade();
      dispatch({ type: "RETRY" });

      const audio = audioRef.current;
      if (audio) {
        try {
          // Native reload re-initializes media pipeline and forces browser to re-evaluate media resource
          audio.load();
        } catch (loadErr) {
          console.warn("[Alexandrina & Kenneth Audio] audio.load() error:", loadErr);
        }
      }
      await startPlayback();
      return;
    }

    if (state === "playing") {
      pausePlayback();
    } else {
      void resumePlayback();
    }
  }, [config.authorizedSrc, clearFade, pausePlayback, resumePlayback, showFeedbackToast, startPlayback, state]);

  // Imperative handle for parent (Cover Gate) to trigger audio immediately on user tap
  useImperativeHandle(
    ref,
    () => ({
      playOnUserGesture: async () => {
        if (state === "disabled" || !config.authorizedSrc) {
          return false;
        }
        return startPlayback();
      },
      pause: () => {
        pausePlayback();
      },
      toggle: () => {
        void togglePlayback();
      },
      isPlaying: () => state === "playing",
      getState: () => state,
    }),
    [config.authorizedSrc, pausePlayback, startPlayback, state, togglePlayback]
  );

  // Deep-link auto-start fallback
  useEffect(() => {
    if (autoStart && config.hasConfiguredOrigin && state !== "disabled" && !autoStartAttemptedRef.current) {
      autoStartAttemptedRef.current = true;
      void startPlayback();
    }
  }, [autoStart, config.hasConfiguredOrigin, startPlayback, state]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearFade();
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, [clearFade]);

  // SOLUÇÃO PREFERENCIAL: Quando o áudio está intencionalmente desactivado / sem origem configurada,
  // ocultar integralmente o controlo e a tag de áudio do DOM.
  // Preserva 100% da integridade visual e funcional, sem botões inoperacionais nem pedidos de rede.
  if (state === "disabled" || !config.hasConfiguredOrigin || !config.authorizedSrc) {
    return null;
  }

  const isError = state === "error";
  const isLoading = state === "loading";
  const isPlaying = state === "playing";

  return (
    <>
      <audio
        ref={audioRef}
        id="bgMusic"
        loop
        playsInline
        preload="auto"
        onCanPlay={() => dispatch({ type: "CAN_PLAY" })}
        onPlay={() => dispatch({ type: "PLAYING" })}
        onPause={() => dispatch({ type: "PAUSE" })}
        onPlaying={() => {
          dispatch({ type: "PLAYING" });
          showFeedbackToast(`🎶 ${config.title} — ${config.artist}`);
        }}
        onError={(e) => {
          console.warn("[Alexandrina & Kenneth Audio] Native audio error:", e);
          clearFade();
          dispatch({ type: "ERROR", error: e });
        }}
      >
        <source src={config.authorizedSrc} type="audio/mpeg" />
      </audio>

      {showToggle && (
        <button
          type="button"
          className={`audio-toggle cursor-pointer ${
            isError
              ? "audio-toggle--error border-[#d4af37]/40 text-[#d4af37]/75 hover:border-[#d4af37]"
              : ""
          }`}
          id="audioToggle"
          onClick={togglePlayback}
          aria-label={
            isError
              ? "Áudio cerimonial temporariamente indisponível. Toque para tentar novamente."
              : isLoading
              ? "A carregar áudio cerimonial"
              : isPlaying
              ? "Pausar música"
              : "Tocar música"
          }
          aria-pressed={isPlaying}
        >
          {isError ? (
            <VolumeX
              className="audio-toggle__icon opacity-75"
              aria-hidden="true"
              size={20}
            />
          ) : isLoading ? (
            <Loader2
              className="audio-toggle__icon animate-spin"
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
            {isError
              ? "Áudio cerimonial indisponível (toque para tentar novamente)"
              : isLoading
              ? "A carregar áudio"
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
