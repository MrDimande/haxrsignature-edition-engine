"use client";

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { useLenis } from "lenis/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useExperience } from "../../context";
import {
  NIAN_EVENT,
  getNianEventTimeLabel,
  isNianAudioReady,
  writeNianAudioPreference,
} from "@lib/nian/event-details";
import { getNianStoryImage } from "@lib/nian/assets-manifest";
import { NIAN_COLORS, NIAN_EASE } from "./nian-motion";
import "./nian-gate.css";

const OPEN_MS = 1100;
/** Signal acquisition pacing — CTA interactive after sequence settles */
const CTA_READY_MS = 1750;

type GatePhase = "idle" | "ready" | "opening" | "exit";

/**
 * Gate — primeiro frame cinematográfico de NIGHT OF THE WEB.
 * Composição editorial aprovada; esta camada cinematiza sem redesenhar.
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
  const gatePortrait = getNianStoryImage("origin");
  const [phase, setPhase] = useState<GatePhase>("idle");
  const [ctasReady, setCtasReady] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [busy, setBusy] = useState(false);
  const parallaxRef = useRef<HTMLDivElement | null>(null);
  const pointerRaf = useRef<number | null>(null);
  const pointerTarget = useRef({ x: 0, y: 0 });

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
    // Treat null (SSR/unknown) like false so the ready timer is not reset
    // when useReducedMotion resolves from null → false.
    if (reduceMotion === true) {
      setCtasReady(true);
      setPhase("ready");
      return;
    }
    const tCta = window.setTimeout(() => {
      setCtasReady(true);
      setPhase("ready");
    }, CTA_READY_MS);
    return () => {
      window.clearTimeout(tCta);
    };
  }, [introComplete, reduceMotion === true, hydrated]);

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
      }, reduceMotion ? 0 : 260);
    }, reduceMotion ? 0 : OPEN_MS);
    return () => window.clearTimeout(done);
  }, [phase, reduceMotion, setIntroComplete, snapToTop]);

  // Desktop micro-parallax — pointer only, no gyroscope
  useEffect(() => {
    if (introComplete || reduceMotion || phase === "opening" || phase === "exit")
      return;
    const root = parallaxRef.current;
    if (!root) return;

    const isCoarse =
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: coarse)").matches;
    if (isCoarse) return;

    const onMove = (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;
      pointerTarget.current = { x: nx, y: ny };
      if (pointerRaf.current != null) return;
      pointerRaf.current = window.requestAnimationFrame(() => {
        pointerRaf.current = null;
        const { x, y } = pointerTarget.current;
        root.style.setProperty("--nian-px", x.toFixed(4));
        root.style.setProperty("--nian-py", y.toFixed(4));
      });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (pointerRaf.current != null) {
        window.cancelAnimationFrame(pointerRaf.current);
        pointerRaf.current = null;
      }
    };
  }, [introComplete, reduceMotion, phase]);

  const enterNight = useCallback(async () => {
    if (busy || phase === "opening" || phase === "exit") return;
    setBusy(true);
    writeNianAudioPreference("with-music");
    snapToTop();

    if (audioReady && audioPlayer) {
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
  }, [
    busy,
    phase,
    snapToTop,
    audioReady,
    audioPlayer,
    setAudioEnabled,
    reduceMotion,
    setIntroComplete,
  ]);

  if (introComplete) return null;

  const interactive = phase === "ready" || ctasReady;
  const ambient = !reduceMotion && phase !== "opening";

  return (
    <AnimatePresence>
      {phase !== "exit" ? (
        <motion.div
          key="nian-gate"
          ref={parallaxRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="nian-gate-title"
          data-nian-gate=""
          data-nian-hydrated={hydrated ? "true" : "false"}
          data-nian-reduce={reduceMotion === true ? "true" : "false"}
          data-nian-ambient={ambient ? "true" : "false"}
          data-nian-opening={phase === "opening" ? "true" : "false"}
          data-nian-cta-ready={interactive ? "true" : "false"}
          initial={{ opacity: 1 }}
          exit={
            reduceMotion
              ? { opacity: 0 }
              : { opacity: 0, filter: "blur(5px)" }
          }
          transition={{ duration: reduceMotion ? 0.35 : 0.58, ease: NIAN_EASE }}
          className="fixed inset-0 z-[80] flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-5"
          style={
            {
              backgroundColor: NIAN_COLORS.bg,
              "--nian-px": "0",
              "--nian-py": "0",
            } as React.CSSProperties
          }
        >
          {/* Atmosphere — depth layer */}
          <div
            aria-hidden
            data-gate-layer="atmosphere"
            className="nian-gate-atmosphere pointer-events-none absolute inset-0"
          />

          {/* Soft vignette */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[2]"
            style={{
              background:
                "radial-gradient(ellipse 78% 72% at 50% 46%, transparent 32%, rgba(2,3,8,0.78) 100%)",
            }}
          />

          {/* Network / signal transmission */}
          <div
            aria-hidden
            data-gate-layer="web"
            className="nian-gate-web pointer-events-none absolute inset-0 z-[3]"
          >
            <svg
              className="h-full w-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g className="nian-gate-web-lines" opacity="0.55">
                <line
                  className="nian-gate-line nian-gate-line--a"
                  x1="50"
                  y1="0"
                  x2="50"
                  y2="100"
                  stroke="#4169E1"
                  strokeWidth="0.12"
                />
                <line
                  className="nian-gate-line nian-gate-line--b"
                  x1="6"
                  y1="0"
                  x2="44"
                  y2="100"
                  stroke="#4169E1"
                  strokeWidth="0.11"
                />
                <line
                  className="nian-gate-line nian-gate-line--c"
                  x1="94"
                  y1="0"
                  x2="56"
                  y2="100"
                  stroke="#E10600"
                  strokeWidth="0.1"
                  opacity="0.85"
                />
                <line
                  className="nian-gate-line nian-gate-line--d"
                  x1="0"
                  y1="32"
                  x2="100"
                  y2="40"
                  stroke="#F4F6FB"
                  strokeWidth="0.07"
                  opacity="0.32"
                />
                <line
                  className="nian-gate-line nian-gate-line--e"
                  x1="0"
                  y1="68"
                  x2="100"
                  y2="62"
                  stroke="#4169E1"
                  strokeWidth="0.07"
                  opacity="0.4"
                />
                <line
                  className="nian-gate-line nian-gate-line--f"
                  x1="18"
                  y1="0"
                  x2="72"
                  y2="100"
                  stroke="#F4F6FB"
                  strokeWidth="0.06"
                  opacity="0.2"
                />
              </g>
              <g className="nian-gate-nodes">
                <circle
                  className="nian-gate-node nian-gate-node--pulse"
                  cx="50"
                  cy="42"
                  r="0.55"
                  fill="#4169E1"
                />
                <circle
                  className="nian-gate-node"
                  cx="38"
                  cy="58"
                  r="0.32"
                  fill="#4169E1"
                  fillOpacity="0.55"
                />
                <circle
                  className="nian-gate-node"
                  cx="62"
                  cy="36"
                  r="0.28"
                  fill="#E10600"
                  fillOpacity="0.4"
                />
              </g>
              {!reduceMotion ? (
                <g className="nian-gate-travellers">
                  <circle
                    className="nian-gate-traveller nian-gate-traveller--1"
                    r="0.32"
                    fill="#4169E1"
                  >
                    <animateMotion
                      dur="11s"
                      repeatCount="indefinite"
                      path="M6,0 L44,100"
                    />
                  </circle>
                  <circle
                    className="nian-gate-traveller nian-gate-traveller--2"
                    r="0.26"
                    fill="#F4F6FB"
                    fillOpacity="0.75"
                  >
                    <animateMotion
                      dur="16s"
                      begin="4s"
                      repeatCount="indefinite"
                      path="M0,32 L100,40"
                    />
                  </circle>
                </g>
              ) : null}
            </svg>
          </div>

          {/* Portrait — presence without dominance */}
          {gatePortrait ? (
            <div
              aria-hidden
              data-gate-layer="nian"
              data-gate-step="portrait"
              className="nian-gate-portrait pointer-events-none"
            >
              <div className="nian-gate-portrait-frame">
                <Image
                  src={gatePortrait.src}
                  alt=""
                  fill
                  priority
                  sizes="(max-width: 640px) 48vw, (max-width: 1024px) 38vw, 420px"
                  className="nian-gate-portrait-img object-cover object-[center_16%]"
                />
                <div className="nian-gate-portrait-rim" />
                <div className="nian-gate-portrait-mask" />
              </div>
            </div>
          ) : null}

          {/* Corner signal chips */}
          <p
            aria-hidden
            data-gate-step="chip-l"
            className="pointer-events-none absolute left-5 top-[max(1.25rem,env(safe-area-inset-top))] z-[12] text-[8px] font-semibold uppercase tracking-[0.34em] text-[#4169E1]/85 sm:left-8 sm:text-[9px]"
          >
            WEB // 01
          </p>
          <p
            aria-hidden
            data-gate-step="chip-r"
            className="pointer-events-none absolute right-5 top-[max(1.25rem,env(safe-area-inset-top))] z-[12] text-[8px] font-semibold uppercase tracking-[0.34em] text-[#8FA3D1]/8 sm:right-8 sm:text-[9px]"
          >
            19.09.2026
          </p>

          <div
            data-gate-layer="copy"
            className="nian-gate-copy relative z-10 flex w-full max-w-lg flex-col items-center text-center"
          >
            {/* Volumetric haze behind headline */}
            <div aria-hidden className="nian-gate-haze" />

            <p
              id="nian-gate-eyebrow"
              data-gate-step="eyebrow"
              className="relative mb-5 text-[9px] font-semibold uppercase tracking-[0.4em] text-[#4169E1] sm:text-[10px] sm:tracking-[0.46em]"
            >
              Night of the Web // Signal 01
            </p>

            <h1
              id="nian-gate-title"
              aria-label="A cidade está a chamar."
              className="nian-gate-headline relative text-[clamp(2.35rem,9vw,3.85rem)] font-semibold uppercase leading-[0.92] tracking-[0.04em]"
              style={{
                fontFamily:
                  "var(--font-jost), var(--font-montserrat), sans-serif",
              }}
            >
              <span
                data-gate-step="h1"
                className="nian-gate-line-text nian-gate-line-text--1"
              >
                A cidade
              </span>
              <span
                data-gate-step="h2"
                className="nian-gate-line-text nian-gate-line-text--2"
              >
                está a
              </span>
              <span
                data-gate-step="h3"
                className="nian-gate-line-text nian-gate-line-text--3"
              >
                chamar.
              </span>
            </h1>

            <p
              data-gate-step="date"
              className="relative mt-5 text-[11px] font-medium uppercase tracking-[0.38em] text-[#A4B4D4] sm:text-[12px]"
            >
              {`${NIAN_EVENT.dateIso.split("-").reverse().join(".")}${getNianEventTimeLabel() ? ` · ${getNianEventTimeLabel()?.toUpperCase()}` : ""}`}
            </p>

            <div
              data-gate-step="support"
              className="relative mt-6 max-w-xs space-y-1 text-[0.95rem] leading-snug text-[#8FA3D1] sm:text-[1rem]"
            >
              <p>Uma aventura.</p>
              <p>Um pequeno herói.</p>
              <p className="text-[#F4F6FB]/88">Uma missão inesquecível.</p>
            </div>

            <div
              data-gate-step="cta"
              className="relative mt-11 w-full max-w-sm"
              onAnimationEnd={(event) => {
                if (event.currentTarget !== event.target) return;
                setCtasReady(true);
                setPhase((p) => (p === "idle" ? "ready" : p));
              }}
            >
              <button
                type="button"
                disabled={!interactive || busy}
                onClick={() => void enterNight()}
                className="nian-gate-cta group relative flex min-h-[3.4rem] w-full items-center justify-center overflow-hidden px-6 text-[11px] font-semibold uppercase tracking-[0.32em] text-[#F4F6FB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F4F6FB] disabled:opacity-55 sm:tracking-[0.36em]"
                data-ready={interactive ? "true" : "false"}
              >
                <span aria-hidden className="nian-gate-cta-glow" />
                <span aria-hidden className="nian-gate-cta-sweep" />
                <span className="relative z-[1]">Entrar no universo</span>
              </button>
              <p
                aria-hidden
                data-gate-step="locked"
                className="nian-gate-locked mt-3 text-[8px] font-semibold uppercase tracking-[0.36em]"
              >
                Signal locked
              </p>
            </div>

            <p
              data-gate-step="credit"
              className="relative mt-7 text-[9px] uppercase tracking-[0.3em] text-[#8FA3D1]/85"
            >
              Sunflower · Post Malone &amp; Swae Lee
            </p>
          </div>

          {phase === "opening" && !reduceMotion ? (
            <>
              {/* Click signal: CTA → centro (causalidade do gesto) */}
              <div aria-hidden className="nian-gate-entry-signal" />
              <motion.div
                aria-hidden
                className="pointer-events-none absolute inset-0 z-20"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.38, 0.22, 0.55, 0] }}
                transition={{ duration: OPEN_MS / 1000, ease: NIAN_EASE }}
                style={{
                  background:
                    "radial-gradient(ellipse 58% 50% at 50% 52%, rgba(65,105,225,0.48) 0%, transparent 70%)",
                }}
              />
              <motion.div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-[44%] z-20 h-px w-[min(72vw,24rem)] -translate-x-1/2 origin-center bg-[#4169E1]"
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: [0, 1, 1], opacity: [0, 1, 0] }}
                transition={{
                  duration: OPEN_MS / 1000,
                  delay: 0.12,
                  ease: NIAN_EASE,
                }}
              />
              <motion.div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-[44%] z-20 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#4169E1]"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 2.4, 0], opacity: [0, 0.85, 0] }}
                transition={{
                  duration: OPEN_MS / 1000,
                  delay: 0.12,
                  ease: NIAN_EASE,
                }}
                style={{ boxShadow: "0 0 40px 12px rgba(65,105,225,0.45)" }}
              />
              {/* Continuity handoff — último frame alinhado ao Hero */}
              <motion.div
                aria-hidden
                className="nian-gate-handoff pointer-events-none absolute inset-0 z-[25]"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0, 0.35, 0.92] }}
                transition={{ duration: OPEN_MS / 1000, ease: NIAN_EASE }}
              />
            </>
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
