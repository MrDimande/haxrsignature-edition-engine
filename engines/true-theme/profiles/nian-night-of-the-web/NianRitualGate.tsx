"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useLenis } from "lenis/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useExperience } from "../../context";
import {
  isNianAudioReady,
  isNianAuthorizedTrackActive,
  type NianAudioPreference,
  writeNianAudioPreference,
} from "@lib/nian/event-details";
import { NIAN_COLORS, NIAN_EASE } from "./nian-motion";

const OPEN_MS = 1100;

type GatePhase = "idle" | "ready" | "opening" | "exit";

/**
 * Ritual dual — Entrar com música / Entrar sem música.
 * Áudio só inicia no gesture de “com música”.
 * Isolado a nian-night-of-the-web.
 */
export function NianRitualGate() {
  const {
    introComplete,
    setIntroComplete,
    audioPlayer,
    setAudioEnabled,
    theme,
  } = useExperience();
  const reduceMotion = useReducedMotion();
  const lenis = useLenis();
  const audioReady = isNianAudioReady(theme.audio.src);
  const [phase, setPhase] = useState<GatePhase>("idle");
  const [reveal, setReveal] = useState(0);
  const [busy, setBusy] = useState(false);

  const snapToTop = useCallback(() => {
    if (lenis) {
      lenis.scrollTo(0, { immediate: true, force: true });
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [lenis]);

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
    if (introComplete) return;
    if (reduceMotion) {
      setReveal(3);
      setPhase("ready");
      return;
    }
    const t1 = window.setTimeout(() => setReveal(1), 220);
    const t2 = window.setTimeout(() => setReveal(2), 640);
    const t3 = window.setTimeout(() => {
      setReveal(3);
      setPhase("ready");
    }, 1100);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [introComplete, reduceMotion]);

  useEffect(() => {
    if (introComplete || phase === "opening" || phase === "exit") return;
    if (audioReady) audioPlayer?.preload();
  }, [introComplete, phase, audioReady, audioPlayer]);

  useEffect(() => {
    if (phase !== "opening") return;
    const done = window.setTimeout(() => {
      setPhase("exit");
      window.setTimeout(() => {
        snapToTop();
        setIntroComplete(true);
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => snapToTop());
        });
      }, reduceMotion ? 0 : 280);
    }, reduceMotion ? 0 : OPEN_MS);
    return () => window.clearTimeout(done);
  }, [phase, reduceMotion, setIntroComplete, snapToTop]);

  const completeGate = useCallback(
    async (preference: Exclude<NianAudioPreference, "undecided">) => {
      if (busy || phase === "opening" || phase === "exit") return;
      setBusy(true);
      writeNianAudioPreference(preference);
      snapToTop();

      if (preference === "with-music" && audioReady && audioPlayer) {
        try {
          const started = await audioPlayer.start();
          setAudioEnabled(started);
        } catch {
          setAudioEnabled(false);
        }
      } else {
        setAudioEnabled(false);
      }

      if (reduceMotion) {
        snapToTop();
        setIntroComplete(true);
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => snapToTop());
        });
        return;
      }
      setPhase("opening");
    },
    [
      busy,
      phase,
      snapToTop,
      audioReady,
      audioPlayer,
      setAudioEnabled,
      reduceMotion,
      setIntroComplete,
    ]
  );

  if (introComplete) return null;

  const ctasReady = phase === "ready" || reveal >= 3;

  return (
    <AnimatePresence>
      {phase !== "exit" ? (
        <motion.div
          key="nian-gate"
          role="dialog"
          aria-modal="true"
          aria-labelledby="nian-gate-title"
          initial={{ opacity: 1 }}
          exit={
            reduceMotion
              ? { opacity: 0 }
              : { opacity: 0, filter: "blur(8px)" }
          }
          transition={{ duration: 0.45, ease: NIAN_EASE }}
          className="fixed inset-0 z-[80] flex flex-col items-center justify-center overflow-hidden px-5"
          style={{ backgroundColor: NIAN_COLORS.bg }}
        >
          {/* City night atmosphere */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse 70% 50% at 50% 110%, rgba(65,105,225,0.28) 0%, transparent 55%),
                radial-gradient(ellipse 40% 35% at 18% 30%, rgba(225,6,0,0.14) 0%, transparent 60%),
                radial-gradient(ellipse 45% 40% at 82% 25%, rgba(65,105,225,0.16) 0%, transparent 55%),
                linear-gradient(180deg, #05060A 0%, #0A0C14 48%, #05060A 100%)
              `,
            }}
          />

          {/* Subtle web lines */}
          <svg
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.14]"
            xmlns="http://www.w3.org/2000/svg"
          >
            <line x1="8%" y1="0" x2="42%" y2="100%" stroke="#4169E1" strokeWidth="0.6" />
            <line x1="92%" y1="0" x2="58%" y2="100%" stroke="#E10600" strokeWidth="0.5" />
            <line x1="0" y1="28%" x2="100%" y2="38%" stroke="#F4F6FB" strokeWidth="0.35" opacity="0.35" />
            <line x1="20%" y1="0" x2="70%" y2="100%" stroke="#F4F6FB" strokeWidth="0.3" opacity="0.2" />
          </svg>

          <div className="relative z-10 flex w-full max-w-md flex-col items-center text-center">
            <motion.p
              id="nian-gate-eyebrow"
              initial={false}
              animate={{ opacity: reveal >= 1 ? 1 : 0, y: reveal >= 1 ? 0 : 10 }}
              transition={{ duration: 0.55, ease: NIAN_EASE }}
              className="mb-4 text-[10px] font-semibold uppercase tracking-[0.42em] text-[#4169E1]"
            >
              A noite está a mudar
            </motion.p>

            <motion.h1
              id="nian-gate-title"
              initial={false}
              animate={{ opacity: reveal >= 2 ? 1 : 0, y: reveal >= 2 ? 0 : 14 }}
              transition={{ duration: 0.65, ease: NIAN_EASE }}
              className="text-[clamp(2.1rem,8vw,3.25rem)] font-semibold uppercase leading-[0.95] tracking-[0.04em] text-[#F4F6FB]"
              style={{ fontFamily: "var(--font-jost), var(--font-montserrat), sans-serif" }}
            >
              Entra na cidade.
            </motion.h1>

            <motion.p
              initial={false}
              animate={{ opacity: reveal >= 2 ? 1 : 0 }}
              transition={{ duration: 0.6, delay: 0.08, ease: NIAN_EASE }}
              className="mt-4 max-w-sm text-[0.95rem] leading-relaxed text-[#8FA3D1]"
            >
              Uma experiência para o aniversário do Nian.
            </motion.p>

            <motion.div
              initial={false}
              animate={{
                opacity: ctasReady ? 1 : 0,
                y: ctasReady ? 0 : 16,
              }}
              transition={{ duration: 0.55, ease: NIAN_EASE }}
              className="mt-10 flex w-full flex-col gap-3"
            >
              <button
                type="button"
                disabled={!ctasReady || busy}
                onClick={() => void completeGate("with-music")}
                className="flex h-13 min-h-[3.25rem] w-full items-center justify-center rounded-sm border border-[#4169E1] bg-[#4169E1] px-5 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#F4F6FB] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4169E1] disabled:opacity-60"
              >
                Entrar com música
              </button>
              <button
                type="button"
                disabled={!ctasReady || busy}
                onClick={() => void completeGate("without-music")}
                className="flex h-13 min-h-[3.25rem] w-full items-center justify-center rounded-sm border border-[#F4F6FB]/28 bg-transparent px-5 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#F4F6FB] transition hover:border-[#F4F6FB]/55 hover:bg-[#F4F6FB]/05 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F4F6FB] disabled:opacity-60"
              >
                Entrar sem música
              </button>
            </motion.div>

            <motion.p
              initial={false}
              animate={{ opacity: ctasReady ? 0.75 : 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-6 text-[9px] uppercase tracking-[0.32em] text-[#8FA3D1]"
            >
              {isNianAuthorizedTrackActive()
                ? "Trilha — Sunflower · Spider-Verse"
                : "Trilha — Sunflower · aguarda ficheiro autorizado"}
            </motion.p>
          </div>

          {phase === "opening" && !reduceMotion ? (
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.35, 0] }}
              transition={{ duration: OPEN_MS / 1000, ease: NIAN_EASE }}
              style={{
                background:
                  "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(65,105,225,0.45) 0%, transparent 70%)",
              }}
            />
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
