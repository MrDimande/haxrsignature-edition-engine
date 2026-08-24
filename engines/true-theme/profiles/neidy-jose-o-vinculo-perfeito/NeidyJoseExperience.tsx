"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { useExperience } from "../../context";
import { NeidyJoseOpeningGate } from "./NeidyJoseOpeningGate";
import { NeidyJoseFloatingNav } from "./NeidyJoseFloatingNav";
import { NeidyJoseAmbientToggle } from "./NeidyJoseAmbientToggle";
import { NeidyJoseHero } from "./NeidyJoseHero";
import { NeidyJoseOurThread } from "./NeidyJoseOurThread";
import { NeidyJoseParents } from "./NeidyJoseParents";
import { NeidyJoseScripture } from "./NeidyJoseScripture";
import { NeidyJoseTheWeddingDay } from "./NeidyJoseTheWeddingDay";
import { NeidyJoseCelebration } from "./NeidyJoseCelebration";
import { NeidyJoseRsvp } from "./NeidyJoseRsvp";
import { NeidyJoseBlessings } from "./NeidyJoseBlessings";
import { NeidyJoseClosing } from "./NeidyJoseClosing";
import "./neidy-jose.css";

/**
 * useReducedMotion() can differ between SSR (null/false) and the browser.
 * Keep `false` until after mount so Framer Motion `initial` styles match.
 */
function usePrefersReducedMotionAfterMount(): boolean {
  const mediaPreference = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return false;
  return mediaPreference ?? false;
}

/** Activa .is-visible nas secções com .nj-section-rise quando entram no viewport */
function useDepthReveal(active: boolean) {
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!active) return;
    const root = mainRef.current;
    if (!root) return;

    const targets = root.querySelectorAll<HTMLElement>(
      ".nj-section-rise, .nj-letter-emerge, .nj-rack-bg"
    );
    if (!targets.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible", "is-focused");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );

    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [active]);

  return mainRef;
}

export function NeidyJoseExperience() {
  const { introComplete, setIntroComplete } = useExperience();
  const prefersReducedMotion = usePrefersReducedMotionAfterMount();
  const [hasEntered, setHasEntered] = useState(false);
  /** Hero só revela depois do gate terminar o fade-out */
  const [cinematicReady, setCinematicReady] = useState(false);

  useEffect(() => {
    // Sessão já sem gate (ex.: HMR / reentrada) — activar capa de imediato
    if (introComplete && !hasEntered) {
      setHasEntered(true);
      setCinematicReady(true);
    }
  }, [introComplete, hasEntered]);

  const handleGateComplete = () => {
    setHasEntered(true);
    setIntroComplete(true);
    if (prefersReducedMotion) {
      setCinematicReady(true);
      return;
    }
    // Crossfade: cortina começa a meio do fade do gate (~1.15s)
    window.setTimeout(() => setCinematicReady(true), 420);
  };

  const mainRef = useDepthReveal(!prefersReducedMotion && hasEntered);

  return (
    <div className="nj-experience-root relative min-h-screen w-full overflow-x-hidden bg-[#FBFBFA] font-body text-[#0A211A]">
      <AnimatePresence>
        {!hasEntered && (
          <motion.div
            key="nj-gate"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 1.15, ease: [0.22, 1, 0.36, 1] } }}
            className="pointer-events-auto fixed inset-0 z-50"
          >
            <NeidyJoseOpeningGate onComplete={handleGateComplete} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Névoa atmosférica persistente — plano fixo sobre o conteúdo */}
      {hasEntered && !prefersReducedMotion && (
        <>
          <div className="nj-atmo-veil" aria-hidden="true" />
          <div className="nj-atmo-fog" aria-hidden="true" />
        </>
      )}

      <div
        className="relative z-10 transition-opacity duration-700"
        style={{ opacity: hasEntered ? 1 : 0.95 }}
        {...(!hasEntered ? ({ inert: true } as Record<string, unknown>) : {})}
        aria-hidden={!hasEntered ? "true" : undefined}
      >
        {hasEntered && (
          <>
            <NeidyJoseAmbientToggle prefersReducedMotion={prefersReducedMotion} />
            <NeidyJoseFloatingNav prefersReducedMotion={prefersReducedMotion} />
          </>
        )}

        <main ref={mainRef} className="nj-experience-main nj-depth-scene relative w-full">
          <NeidyJoseHero
            prefersReducedMotion={prefersReducedMotion}
            cinematicActive={cinematicReady}
          />
          <NeidyJoseOurThread prefersReducedMotion={prefersReducedMotion} />
          <NeidyJoseParents prefersReducedMotion={prefersReducedMotion} />
          <NeidyJoseScripture prefersReducedMotion={prefersReducedMotion} />
          <NeidyJoseTheWeddingDay prefersReducedMotion={prefersReducedMotion} />
          <NeidyJoseCelebration prefersReducedMotion={prefersReducedMotion} />
          <NeidyJoseRsvp prefersReducedMotion={prefersReducedMotion} />
          <NeidyJoseBlessings prefersReducedMotion={prefersReducedMotion} />
          <NeidyJoseClosing prefersReducedMotion={prefersReducedMotion} />
        </main>
      </div>
    </div>
  );
}
