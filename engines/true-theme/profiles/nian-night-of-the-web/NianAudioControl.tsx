"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useExperience } from "../../context";
import {
  isNianAudioReady,
  isNianAuthorizedTrackActive,
  readNianAudioPreference,
} from "@lib/nian/event-details";
import { NIAN_EASE } from "./nian-motion";

function AudioGlyph({
  mode,
}: {
  mode: "playing" | "paused" | "ended";
}) {
  if (mode === "playing") {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
        <rect x="3" y="2.5" width="2.75" height="9" rx="0.6" fill="currentColor" />
        <rect x="8.25" y="2.5" width="2.75" height="9" rx="0.6" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
      <path d="M4.2 2.4v9.2L11.6 7 4.2 2.4Z" fill="currentColor" />
    </svg>
  );
}

/**
 * Mute / unmute / replay — visível após o ritual.
 * Isolado a nian-night-of-the-web.
 */
export function NianAudioControl() {
  const { introComplete, audioEnabled, setAudioEnabled, theme, audioPlayer } =
    useExperience();
  const reduceMotion = useReducedMotion();
  const audioReady = isNianAudioReady(theme.audio.src);
  const [mounted, setMounted] = useState(false);
  const [trackEnded, setTrackEnded] = useState(false);
  const [preference, setPreference] = useState<
    "undecided" | "with-music" | "without-music"
  >("undecided");

  useEffect(() => {
    setMounted(true);
    setPreference(readNianAudioPreference());
  }, []);

  useEffect(() => {
    if (!audioPlayer) return;
    return audioPlayer.onEnded(() => {
      setTrackEnded(true);
      setAudioEnabled(false);
    });
  }, [audioPlayer, setAudioEnabled]);

  useEffect(() => {
    if (audioEnabled) setTrackEnded(false);
  }, [audioEnabled]);

  if (!mounted || !introComplete || !audioReady) return null;

  const mode: "playing" | "paused" | "ended" = audioEnabled
    ? "playing"
    : trackEnded || audioPlayer?.hasEnded()
      ? "ended"
      : "paused";

  const label =
    mode === "playing"
      ? "Silenciar"
      : mode === "ended"
        ? "Voltar a ouvir"
        : "Activar som";

  // preference kept for future UX copy variants (with vs without music entry)
  void preference;

  const toggle = async () => {
    if (!audioPlayer) return;
    if (mode === "playing") {
      audioPlayer.pause();
      setAudioEnabled(false);
      return;
    }
    try {
      const ok =
        mode === "ended" || audioPlayer.hasEnded()
          ? await audioPlayer.replay()
          : audioPlayer.hasLoadedTrack()
            ? await audioPlayer.resume()
            : await audioPlayer.start();
      setAudioEnabled(ok);
      if (ok) setTrackEnded(false);
    } catch {
      setAudioEnabled(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={
          reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12, scale: 0.94 }
        }
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: NIAN_EASE }}
        className="pointer-events-none fixed z-[55]"
        style={{
          left: "max(0.75rem, env(safe-area-inset-left))",
          bottom: "max(1rem, env(safe-area-inset-bottom))",
        }}
      >
        <button
          type="button"
          onClick={() => void toggle()}
          aria-label={label}
          aria-pressed={audioEnabled}
          title={
            isNianAuthorizedTrackActive()
              ? label
              : `${label} (placeholder silencioso)`
          }
          className={`pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4169E1] sm:h-[3.25rem] sm:w-[3.25rem] ${
            audioEnabled
              ? "border-[#4169E1] bg-[#4169E1] text-[#F4F6FB] shadow-[0_10px_28px_rgba(5,6,10,0.55)]"
              : "border-[#4169E1]/45 bg-[#0A0A0C]/90 text-[#4169E1] shadow-[0_10px_28px_rgba(5,6,10,0.55)] hover:border-[#4169E1]"
          }`}
        >
          <AudioGlyph mode={mode} />
        </button>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
