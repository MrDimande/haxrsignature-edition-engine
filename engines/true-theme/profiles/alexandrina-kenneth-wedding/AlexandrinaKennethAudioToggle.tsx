"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, VolumeX } from "lucide-react";
import { ALEXANDRINA_KENNETH_AUDIO_CONFIG } from "@lib/alexandrina-kenneth-wedding/audio";

interface AlexandrinaKennethAudioToggleProps {
  autoStart?: boolean;
  showToggle?: boolean;
}

export function AlexandrinaKennethAudioToggle({
  autoStart = false,
  showToggle = true,
}: AlexandrinaKennethAudioToggleProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isAuthorized = ALEXANDRINA_KENNETH_AUDIO_CONFIG.isAuthorized;

  const showFeedbackToast = useCallback((msg: string) => {
    setToastMessage(msg);
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 3200);
    return () => clearTimeout(timer);
  }, []);

  const startPlayback = useCallback(async () => {
    if (!isAuthorized) {
      showFeedbackToast("Áudio cerimonial sob consulta");
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;
    try {
      audio.volume = 0.35;
      await audio.play();
      setIsPlaying(true);
      showFeedbackToast(
        `🎶 ${ALEXANDRINA_KENNETH_AUDIO_CONFIG.title} — ${ALEXANDRINA_KENNETH_AUDIO_CONFIG.artist}`
      );
    } catch (err) {
      console.warn("Autoplay prevent / user interaction needed:", err);
      setIsPlaying(false);
    }
  }, [isAuthorized, showFeedbackToast]);

  const pausePlayback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    setIsPlaying(false);
    showFeedbackToast("Música pausada");
  }, [showFeedbackToast]);

  const togglePlayback = useCallback(() => {
    if (!isAuthorized) {
      showFeedbackToast("Áudio cerimonial sob consulta");
      return;
    }

    if (isPlaying) {
      pausePlayback();
    } else {
      void startPlayback();
    }
  }, [isAuthorized, isPlaying, pausePlayback, startPlayback, showFeedbackToast]);

  useEffect(() => {
    if (autoStart && isAuthorized) {
      const timer = setTimeout(() => {
        void startPlayback();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [autoStart, isAuthorized, startPlayback]);

  return (
    <>
      {isAuthorized && (
        <audio ref={audioRef} id="bgMusic" loop preload="none">
          <source
            src={ALEXANDRINA_KENNETH_AUDIO_CONFIG.authorizedSrc}
            type="audio/mpeg"
          />
        </audio>
      )}

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
}
