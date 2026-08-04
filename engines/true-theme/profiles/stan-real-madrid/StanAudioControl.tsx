"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useExperience } from "../../context";
import { isStanAudioReady } from "@lib/stan/event-details";

const EASE = [0.22, 1, 0.36, 1] as const;

async function toggleStanAudio(
  audioPlayer: ReturnType<typeof useExperience>["audioPlayer"],
  audioEnabled: boolean,
  setAudioEnabled: (v: boolean) => void
) {
  if (!audioPlayer) return;
  if (audioEnabled) {
    audioPlayer.pause();
    setAudioEnabled(false);
    return;
  }
  try {
    if (audioPlayer.hasLoadedTrack()) {
      await audioPlayer.resume();
    } else {
      await audioPlayer.start();
    }
    setAudioEnabled(true);
  } catch {
    setAudioEnabled(false);
  }
}

/** Ícones geométricos — sem stroke+fill do Lucide (evita ghosting) */
function AudioGlyph({ playing }: { playing: boolean }) {
  if (playing) {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
        <rect x="3" y="2.5" width="2.75" height="9" rx="0.6" fill="currentColor" />
        <rect x="8.25" y="2.5" width="2.75" height="9" rx="0.6" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
      <path
        d="M4.2 2.4v9.2L11.6 7 4.2 2.4Z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * Controlo Matchday — único play/pause no canto inferior esquerdo.
 * Esconde no gate e no painel de presentes.
 */
export function StanAudioControl() {
  const { introComplete, audioEnabled, setAudioEnabled, theme, audioPlayer } =
    useExperience();
  const reduceMotion = useReducedMotion();
  const audioReady = isStanAudioReady(theme.audio.src);
  const [mounted, setMounted] = useState(false);
  const [navVisible, setNavVisible] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const sync = () => {
      const hero = document.getElementById("hero");
      const bottom = hero?.getBoundingClientRect().bottom ?? window.innerHeight;
      setNavVisible(bottom <= 24);
      setPanelOpen(document.body.hasAttribute("data-stan-panel"));
    };
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    const observer = new MutationObserver(sync);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["data-stan-panel"],
    });
    return () => {
      window.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      observer.disconnect();
    };
  }, []);

  if (!mounted || !introComplete || !audioReady) return null;

  const visible = !panelOpen;

  return createPortal(
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={
            reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12, scale: 0.94 }
          }
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={
            reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.96 }
          }
          transition={{ duration: 0.4, ease: EASE }}
          className="pointer-events-none fixed z-[55]"
          style={{
            left: "max(0.75rem, env(safe-area-inset-left))",
            bottom: navVisible
              ? "4.75rem"
              : "max(1rem, env(safe-area-inset-bottom))",
          }}
        >
          <button
            type="button"
            onClick={() =>
              void toggleStanAudio(audioPlayer, audioEnabled, setAudioEnabled)
            }
            aria-label={
              audioEnabled ? "Pausar Hala Madrid" : "Reproduzir Hala Madrid"
            }
            aria-pressed={audioEnabled}
            title={audioEnabled ? "Pausar" : "Hala Madrid"}
            className={`pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9A86A] sm:h-[3.25rem] sm:w-[3.25rem] ${
              audioEnabled
                ? "border-[#C9A86A] bg-[#C9A86A] text-[#050A12] shadow-[0_10px_28px_rgba(5,10,18,0.45)]"
                : "border-[#C9A86A]/50 bg-[#0B132B]/90 text-[#C9A86A] shadow-[0_10px_28px_rgba(5,10,18,0.45)] hover:border-[#C9A86A]"
            }`}
          >
            <AudioGlyph playing={audioEnabled} />
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
