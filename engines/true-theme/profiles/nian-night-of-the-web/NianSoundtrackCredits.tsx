"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { isNianAuthorizedTrackActive } from "@lib/nian/event-details";
import { NIAN_EASE } from "./nian-motion";

/**
 * Créditos discretos da banda sonora — exclusivo nian-night-of-the-web.
 * Não inicia, pausa, reinicia nem altera currentTime do áudio.
 */
export function NianSoundtrackCredits() {
  const reduceMotion = useReducedMotion();
  const panelId = useId();
  const [open, setOpen] = useState(false);

  if (!isNianAuthorizedTrackActive()) return null;

  return (
    <div className="pointer-events-auto flex flex-col items-start gap-2">
      <AnimatePresence initial={false}>
        {open ? (
          <motion.aside
            id={panelId}
            key="nian-credits-panel"
            role="region"
            aria-label="Créditos da banda sonora"
            initial={
              reduceMotion ? { opacity: 1 } : { opacity: 0, y: 8, scale: 0.98 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.98 }
            }
            transition={{ duration: reduceMotion ? 0.15 : 0.28, ease: NIAN_EASE }}
            className="w-[min(16.5rem,calc(100vw-5.5rem))] border border-[#4169E1]/35 bg-[#0A0A0C]/92 px-3.5 py-3 text-left shadow-[0_12px_32px_rgba(3,5,11,0.55)] backdrop-blur-sm"
          >
            <p className="text-[9px] font-semibold uppercase tracking-[0.32em] text-[#4169E1]">
              Créditos da banda sonora
            </p>
            <p className="mt-2 text-[13px] font-medium leading-snug tracking-[0.02em] text-[#F4F6FB]">
              &ldquo;Sunflower&rdquo;
            </p>
            <p className="mt-1 text-[11px] leading-snug text-[#8FA3D1]">
              Post Malone &amp; Swae Lee
            </p>
            <p className="mt-2 text-[10px] uppercase tracking-[0.14em] text-[#8FA3D1]/85">
              Spider-Man: Into the Spider-Verse
            </p>
          </motion.aside>
        ) : null}
      </AnimatePresence>

      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="min-h-9 border border-[#4169E1]/40 bg-[#0A0A0C]/85 px-3 text-[9px] font-semibold uppercase tracking-[0.28em] text-[#8FA3D1] transition hover:border-[#4169E1] hover:text-[#F4F6FB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4169E1]"
      >
        Créditos
      </button>
    </div>
  );
}
