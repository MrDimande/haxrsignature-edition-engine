"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Volume2, VolumeX } from "lucide-react";
import { NEIDY_JOSE_CONSTANTS } from "@lib/neidy-jose/constants";
import {
  isNeidyJoseAmbientPlaying,
  toggleNeidyJoseAmbient,
} from "@lib/neidy-jose/ambient-audio";

interface NeidyJoseAmbientToggleProps {
  prefersReducedMotion?: boolean;
}

/**
 * Controlo de música — canto inferior esquerdo.
 * A música arranca no toque do gate (mesmo gesto); aqui sincroniza / pausa / retoma.
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
      className={`nj-ambient-corner ${isPlaying ? "is-playing" : ""}`}
      title={
        isPlaying
          ? `Pausar: ${NEIDY_JOSE_CONSTANTS.audio.title} · ${NEIDY_JOSE_CONSTANTS.audio.artist}`
          : `Tocar: ${NEIDY_JOSE_CONSTANTS.audio.title} · ${NEIDY_JOSE_CONSTANTS.audio.artist}`
      }
      aria-label={isPlaying ? "Pausar música ambiente" : "Tocar música ambiente"}
    >
      {isPlaying ? (
        <>
          <Volume2 className="h-4 w-4" strokeWidth={1.75} />
          <span className="nj-ambient-corner__bars" aria-hidden>
            <span />
            <span />
            <span />
          </span>
        </>
      ) : (
        <VolumeX className="h-4 w-4" strokeWidth={1.75} />
      )}
    </motion.button>
  );
}
