"use client";

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import { useLenis } from "lenis/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useExperience } from "../../context";
import {
  QUEEN_KAILANE_COPY,
  QUEEN_KAILANE_EVENT,
} from "@lib/queen-kailane/event-details";
import { QueenDoorsOfLight } from "./QueenDoorsOfLight";
import { QueenMonogram } from "./QueenMonogram";
import { QUEEN_COLORS, QUEEN_EASE } from "./queen-motion";
import "./queen-gate.css";

const CTA_READY_MS = 1700;
/** Cinematic open — slower so mid-open doors stay readable on mobile */
const OPEN_MS = 3000;
const EXIT_MS = 520;

type GatePhase = "idle" | "ready" | "opening" | "exit";

/**
 * Gate — AS PORTAS DA LUZ.
 * Portal solene: portas fechadas → luz interior → abertura → revelação.
 */
export function QueenKailaneGate() {
  const { introComplete, setIntroComplete } = useExperience();
  const reduceMotion = useReducedMotion();
  const lenis = useLenis();
  const [phase, setPhase] = useState<GatePhase>("idle");
  const [ctasReady, setCtasReady] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const snapToTop = useCallback(() => {
    if (lenis) {
      lenis.scrollTo(0, { immediate: true, force: true });
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [lenis]);

  useLayoutEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (introComplete) return;
    const prevOverflow = document.body.style.overflow;
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    snapToTop();
    document.body.style.overflow = "hidden";
    document.documentElement.classList.add("lenis-stopped");
    return () => {
      document.body.style.overflow = prevOverflow;
      window.history.scrollRestoration = previousScrollRestoration;
      document.documentElement.classList.remove("lenis-stopped");
    };
  }, [introComplete, snapToTop]);

  useEffect(() => {
    if (introComplete || !hydrated) return;
    if (reduceMotion === true) {
      setCtasReady(true);
      setPhase("ready");
      return;
    }
    const tCta = window.setTimeout(() => {
      setCtasReady(true);
      setPhase("ready");
    }, CTA_READY_MS);
    return () => window.clearTimeout(tCta);
  }, [introComplete, reduceMotion, hydrated]);

  const handleEnter = () => {
    if (!ctasReady || phase === "opening" || phase === "exit") return;

    if (reduceMotion) {
      setPhase("opening");
      window.setTimeout(() => {
        setPhase("exit");
        window.setTimeout(() => setIntroComplete(true), 220);
      }, 700);
      return;
    }

    setPhase("opening");
    window.setTimeout(() => {
      setPhase("exit");
      window.setTimeout(() => setIntroComplete(true), EXIT_MS);
    }, OPEN_MS);
  };

  if (introComplete) return null;

  const isOpening = phase === "opening";

  return (
    <AnimatePresence>
      {phase !== "exit" && (
        <motion.div
          className="queen-gate fixed inset-0 z-[80] flex items-center justify-center overflow-hidden"
          style={{ backgroundColor: QUEEN_COLORS.pearl }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55, ease: QUEEN_EASE }}
          role="dialog"
          aria-modal="true"
          aria-label="As Portas da Luz — entrada no Sacramento do Crisma"
        >
          <div className="queen-gate__grain" aria-hidden="true" />
          <div className="queen-gate__veil" aria-hidden="true" />
          <motion.div
            className="queen-gate__haze"
            aria-hidden="true"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: isOpening ? 1 : 0.85 }}
            transition={{ duration: 1.4, ease: QUEEN_EASE }}
          />

          <div className="queen-gate__portal" aria-hidden="true">
            <div className="queen-gate__portal-inner">
              <QueenDoorsOfLight open={isOpening} />
            </div>
          </div>

          <motion.div
            className="queen-gate__content"
            initial={false}
            animate={{
              opacity: isOpening ? 0 : 1,
              y: isOpening && !reduceMotion ? -10 : 0,
              filter: isOpening ? "blur(2px)" : "blur(0px)",
            }}
            transition={{ duration: 0.85, ease: QUEEN_EASE }}
          >
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.05, delay: 0.25, ease: QUEEN_EASE }}
            >
              <QueenMonogram size="md" />
            </motion.div>

            <motion.p
              className="queen-gate__eyebrow"
              style={{
                fontFamily:
                  "var(--font-jost), var(--font-montserrat), system-ui, sans-serif",
              }}
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 0.75 }}
              transition={{ duration: 1, delay: 0.4, ease: QUEEN_EASE }}
            >
              SACRAMENTO DO CRISMA
            </motion.p>

            <motion.p
              className="mt-5 text-[0.72rem] tracking-[0.42em] md:text-[0.78rem]"
              style={{
                fontFamily:
                  "var(--font-jost), var(--font-montserrat), system-ui, sans-serif",
                color: QUEEN_COLORS.inkSoft,
              }}
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.55, ease: QUEEN_EASE }}
            >
              {QUEEN_KAILANE_EVENT.conceptualTitle}
            </motion.p>

            <motion.p
              className="mt-4 text-[0.7rem] tracking-[0.28em]"
              style={{
                fontFamily:
                  "var(--font-jost), var(--font-montserrat), system-ui, sans-serif",
                color: QUEEN_COLORS.taupe,
              }}
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.75, ease: QUEEN_EASE }}
            >
              {QUEEN_KAILANE_EVENT.dateDisplayShort}
            </motion.p>

            <motion.div
              className="mt-5 h-px w-14 origin-center"
              style={{ backgroundColor: QUEEN_COLORS.goldMatte }}
              initial={reduceMotion ? false : { scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 0.7 }}
              transition={{ duration: 1.25, delay: 0.95, ease: QUEEN_EASE }}
            />

            <motion.button
              type="button"
              onClick={handleEnter}
              disabled={!ctasReady}
              className="queen-gate__cta"
              style={{
                fontFamily:
                  "var(--font-jost), var(--font-montserrat), system-ui, sans-serif",
              }}
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: ctasReady ? 1 : 0.35, y: 0 }}
              transition={{ duration: 0.95, delay: 1.1, ease: QUEEN_EASE }}
              whileTap={reduceMotion ? undefined : { scale: 0.985 }}
            >
              {QUEEN_KAILANE_COPY.gateCta}
            </motion.button>
          </motion.div>

          {isOpening && (
            <motion.div
              className="queen-gate__bloom"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: reduceMotion ? 0.7 : 1.6,
                delay: reduceMotion ? 0 : 1.05,
                ease: QUEEN_EASE,
              }}
              aria-hidden="true"
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
