"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Pause, Play } from "lucide-react";
import { NEIDY_JOSE_CONSTANTS } from "@lib/neidy-jose/constants";
import {
  isNeidyJoseAmbientPlaying,
  toggleNeidyJoseAmbient,
} from "@lib/neidy-jose/ambient-audio";

interface NeidyJoseAmbientToggleProps {
  prefersReducedMotion?: boolean;
}

/**
 * Controlo de música — canto inferior esquerdo, discreto (play / pause).
 * A música arranca no toque do gate; aqui só pausa / retoma sem competir com o envelope.
 */
export function NeidyJoseAmbientToggle({
  prefersReducedMotion = false,
}: NeidyJoseAmbientToggleProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    setIsPlaying(isNeidyJoseAmbientPlaying());

    const poll = window.setInterval(() => {
      setIsPlaying(isNeidyJoseAmbientPlaying());
    }, 400);

    return () => {
      window.clearInterval(poll);
    };
  }, []);

  const toggleAudio = async () => {
    if (isBusy) return;
    setIsBusy(true);
    try {
      const playing = await toggleNeidyJoseAmbient();
      setIsPlaying(playing);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: prefersReducedMotion ? 0.01 : 0.6,
        delay: prefersReducedMotion ? 0 : 0.45,
        ease: [0.16, 1, 0.3, 1],
      }}
      onClick={toggleAudio}
      disabled={isBusy}
      className={`nj-ambient-corner ${isPlaying ? "is-playing" : "is-paused"}`}
      title={
        isPlaying
          ? `Pausar: ${NEIDY_JOSE_CONSTANTS.audio.title} · ${NEIDY_JOSE_CONSTANTS.audio.artist}`
          : `Tocar: ${NEIDY_JOSE_CONSTANTS.audio.title} · ${NEIDY_JOSE_CONSTANTS.audio.artist}`
      }
      aria-label={isPlaying ? "Pausar música ambiente" : "Tocar música ambiente"}
    >
      {isPlaying ? (
        <Pause className="h-3.5 w-3.5" strokeWidth={1.75} fill="currentColor" />
      ) : (
        <Play className="h-3.5 w-3.5" strokeWidth={1.75} fill="currentColor" />
      )}
    </motion.button>
  );
}
