"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useExperience } from "../../context";
import { isStanAudioReady } from "@lib/stan/event-details";

const EASE = [0.22, 1, 0.36, 1] as const;
/** Abertura: pulse → portas → luz → dissolve */
const OPEN_MS = 1750;

type GatePhase = "idle" | "ready" | "opening" | "exit";

/** Medalha S·5 — selo limpo + specular sweep no aro */
function ChampionSeal({
  className,
  vibrant = false,
  showSweep = false,
}: {
  className?: string;
  vibrant?: boolean;
  showSweep?: boolean;
}) {
  return (
    <div className={`relative ${className ?? ""}`}>
      <svg viewBox="0 0 240 240" className="h-full w-full" aria-hidden>
        <defs>
          <linearGradient id="sealGold" x1="40" y1="28" x2="200" y2="210">
            <stop offset="0%" stopColor={vibrant ? "#F7EFD8" : "#F2E6C9"} />
            <stop offset="35%" stopColor={vibrant ? "#D4B87A" : "#C9A86A"} />
            <stop offset="70%" stopColor="#A8894A" />
            <stop offset="100%" stopColor="#7A6440" />
          </linearGradient>
          <linearGradient id="sealRim" x1="60" y1="20" x2="180" y2="220">
            <stop offset="0%" stopColor={vibrant ? "#F2E6C9" : "#E8DCC8"} />
            <stop offset="50%" stopColor={vibrant ? "#D4B87A" : "#C9A86A"} />
            <stop offset="100%" stopColor="#8B7355" />
          </linearGradient>
          <radialGradient id="sealCore" cx="36%" cy="30%" r="72%">
            <stop offset="0%" stopColor="#1A2744" />
            <stop offset="45%" stopColor="#0D1628" />
            <stop offset="100%" stopColor="#050A12" />
          </radialGradient>
          <radialGradient id="sealSheen" cx="32%" cy="28%" r="55%">
            <stop offset="0%" stopColor="rgba(247,244,239,0.28)" />
            <stop offset="45%" stopColor="rgba(247,244,239,0.06)" />
            <stop offset="100%" stopColor="rgba(247,244,239,0)" />
          </radialGradient>
          <path id="sealArcTop" d="M 50 120 A 70 70 0 0 0 190 120" fill="none" />
          <path id="sealArcBot" d="M 50 120 A 70 70 0 0 1 190 120" fill="none" />
        </defs>

        <circle
          cx="120"
          cy="120"
          r="112"
          fill="none"
          stroke="url(#sealGold)"
          strokeWidth="1"
          opacity={vibrant ? 0.65 : 0.45}
        />
        <circle
          cx="120"
          cy="120"
          r="102"
          fill="url(#sealCore)"
          stroke="url(#sealRim)"
          strokeWidth="2.4"
        />
        <circle
          cx="120"
          cy="120"
          r="94"
          fill="none"
          stroke="url(#sealGold)"
          strokeWidth="0.7"
          opacity={vibrant ? 0.75 : 0.55}
        />
        <circle cx="120" cy="120" r="102" fill="url(#sealSheen)" />

        {/* Specular sweep — brilho que passa no aro */}
        {showSweep ? (
          <motion.circle
            cx="120"
            cy="120"
            r="102"
            fill="none"
            stroke="rgba(247,244,239,0.9)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeDasharray="32 610"
            initial={{ strokeDashoffset: 0 }}
            animate={{ strokeDashoffset: -642 }}
            transition={{
              duration: 7.5,
              repeat: Infinity,
              ease: "linear",
              repeatDelay: 1.4,
            }}
            opacity={0.75}
          />
        ) : null}

        <text
          fill={vibrant ? "#D4B87A" : "#C9A86A"}
          fontSize="11"
          letterSpacing="4"
          fontWeight="600"
          style={{ fontFamily: "var(--font-display), Georgia, serif" }}
        >
          <textPath href="#sealArcTop" startOffset="50%" textAnchor="middle">
            S · 5
          </textPath>
        </text>

        <text
          fill={vibrant ? "#D4B87A" : "#C9A86A"}
          fontSize="9.5"
          letterSpacing="3.5"
          fontWeight="500"
          opacity="0.9"
          style={{ fontFamily: "var(--font-body), system-ui, sans-serif" }}
        >
          <textPath href="#sealArcBot" startOffset="50%" textAnchor="middle">
            CAMPEÃO
          </textPath>
        </text>
      </svg>

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center pt-1">
        <span
          className="font-display font-light leading-none tracking-tight text-[#F7F4EF]"
          style={{
            fontSize: "clamp(3.6rem, 14vw, 5rem)",
            textShadow: "0 2px 24px rgba(5,10,18,0.45)",
          }}
        >
          5
        </span>
      </div>
    </div>
  );
}

/**
 * Ritual de Entrada — Coroação do Campeão
 * Entrada em 3 tempos · idle subtil · abertura nobre.
 * Isolado a stan-real-madrid.
 */
export function StanRitualGate() {
  const { introComplete, setIntroComplete, setAudioEnabled, theme, audioPlayer } =
    useExperience();
  const reduceMotion = useReducedMotion();
  const audioReady = isStanAudioReady(theme.audio.src);
  const [reveal, setReveal] = useState(0);
  const [phase, setPhase] = useState<GatePhase>("idle");
  const [sealVibrant, setSealVibrant] = useState(false);

  /* Entrada ~2s: escuridão → luz → selo → tipografia → botão */
  useEffect(() => {
    if (introComplete) return;
    if (reduceMotion) {
      setReveal(4);
      setPhase("ready");
      return;
    }
    const t1 = window.setTimeout(() => setReveal(1), 280); // luz sobe
    const t2 = window.setTimeout(() => setReveal(2), 820); // selo
    const t3 = window.setTimeout(() => setReveal(3), 1180); // tipografia
    const t4 = window.setTimeout(() => {
      setReveal(4);
      setPhase("ready");
    }, 1750); // botão
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.clearTimeout(t4);
    };
  }, [introComplete, reduceMotion]);

  useEffect(() => {
    if (phase !== "opening") return;
    const done = window.setTimeout(() => {
      setPhase("exit");
      window.setTimeout(() => setIntroComplete(true), reduceMotion ? 0 : 380);
    }, reduceMotion ? 0 : OPEN_MS);
    return () => window.clearTimeout(done);
  }, [phase, reduceMotion, setIntroComplete]);

  if (introComplete) return null;

  const openGate = async (withAudio: boolean) => {
    if (phase === "opening" || phase === "exit") return;
    const enable = withAudio && audioReady;
    setAudioEnabled(enable);
    if (enable && audioPlayer) {
      try {
        await audioPlayer.start();
      } catch {
        setAudioEnabled(false);
      }
    }
    if (reduceMotion) {
      setIntroComplete(true);
      return;
    }
    setPhase("opening");
  };

  const opening = phase === "opening" || phase === "exit";
  const idle = phase === "ready" && !opening;

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Entrada na celebração do Stan"
      className="fixed inset-0 z-50 overflow-hidden text-[#F7F4EF]"
      style={{ minHeight: "100svh", backgroundColor: "#050A12" }}
      animate={phase === "exit" ? { opacity: 0 } : { opacity: 1 }}
      transition={{ duration: 0.45, ease: EASE }}
    >
      {/* Túnel — começa escuro, luz sobe no tempo 1 */}
      <motion.div
        className="absolute inset-0"
        initial={false}
        animate={
          opening
            ? { scale: 1.08, filter: "brightness(1.32) saturate(1.06)" }
            : reveal >= 1
              ? { scale: 1.02, filter: "brightness(1)" }
              : { scale: 1.06, filter: "brightness(0.45)" }
        }
        transition={{ duration: 1.35, ease: EASE }}
      >
        <picture>
          <source
            media="(max-width: 639px)"
            srcSet="/images/stan/hero/tunnel-mobile.png"
          />
          <Image
            src="/images/stan/hero/tunnel-desktop.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
            aria-hidden
          />
        </picture>
      </motion.div>

      {/* Raios — sobem com a luz */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 mix-blend-screen"
        initial={false}
        animate={
          opening
            ? { opacity: 0.9, y: 0 }
            : reveal >= 1
              ? { opacity: 0.42, y: 0 }
              : { opacity: 0, y: 40 }
        }
        transition={{ duration: 1.4, ease: EASE }}
      >
        <Image
          src="/images/stan/hero/light-rays.png"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-top opacity-70"
        />
      </motion.div>

      {/* Holofote central */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[42%] h-[min(70vw,420px)] w-[min(70vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-full"
        initial={false}
        animate={
          opening
            ? { opacity: 1, scale: 1.65 }
            : reveal >= 1
              ? { opacity: 0.65, scale: 1 }
              : { opacity: 0, scale: 0.55 }
        }
        transition={{ duration: 1.5, ease: EASE }}
        style={{
          background:
            "radial-gradient(circle, rgba(247,244,239,0.48) 0%, rgba(201,168,106,0.14) 36%, transparent 68%)",
          filter: "blur(24px)",
        }}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 70% 55% at 50% 45%, transparent 20%, rgba(5,10,18,0.55) 100%),
            linear-gradient(180deg, rgba(5,10,18,0.72) 0%, transparent 22%, transparent 62%, rgba(5,10,18,0.88) 100%)
          `,
        }}
      />

      {/* Poucas partículas — só após o selo */}
      {!reduceMotion && reveal >= 2 ? (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: opening ? 0.75 : 0.4 }}
          transition={{ duration: 1.2 }}
          style={{
            backgroundImage: `
              radial-gradient(1.5px 1.5px at 22% 30%, rgba(201,168,106,0.65), transparent),
              radial-gradient(1px 1px at 76% 24%, rgba(247,244,239,0.45), transparent),
              radial-gradient(1.5px 1.5px at 58% 62%, rgba(201,168,106,0.35), transparent)
            `,
          }}
        />
      ) : null}

      {/* Portas — abrem depois do pulse do selo */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-[8] w-1/2"
        style={{
          background:
            "linear-gradient(90deg, rgba(5,10,18,0.92) 0%, rgba(5,10,18,0.55) 55%, transparent 100%)",
        }}
        animate={opening ? { x: "-108%" } : { x: 0 }}
        transition={{
          duration: 1.15,
          ease: EASE,
          delay: opening ? 0.32 : 0,
        }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-[8] w-1/2"
        style={{
          background:
            "linear-gradient(270deg, rgba(5,10,18,0.92) 0%, rgba(5,10,18,0.55) 55%, transparent 100%)",
        }}
        animate={opening ? { x: "108%" } : { x: 0 }}
        transition={{
          duration: 1.15,
          ease: EASE,
          delay: opening ? 0.32 : 0,
        }}
      />

      {/* Luz invade — depois das portas */}
      <AnimatePresence>
        {opening ? (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0, 0.35, 0.92] }}
            transition={{
              duration: 1.55,
              times: [0, 0.28, 0.55, 1],
              ease: EASE,
            }}
            style={{
              background:
                "radial-gradient(ellipse 55% 48% at 50% 44%, rgba(247,244,239,0.96) 0%, rgba(201,168,106,0.28) 42%, transparent 74%)",
            }}
          />
        ) : null}
      </AnimatePresence>

      {/* Conteúdo */}
      <div className="relative z-10 flex min-h-[100svh] w-full flex-col items-center justify-center px-6 py-14 safe-pb">
        {/* Eyebrow + hastes a desenhar */}
        <motion.div
          initial={false}
          animate={
            opening
              ? { opacity: 0, y: -10 }
              : reveal >= 1
                ? { opacity: 1, y: 0 }
                : { opacity: 0, y: 6 }
          }
          transition={{ duration: 0.85, ease: EASE }}
          className="mb-8 flex items-center gap-3 sm:mb-10"
        >
          <motion.span
            aria-hidden
            className="h-px origin-right bg-gradient-to-r from-transparent to-[#C9A86A]"
            initial={false}
            animate={
              reveal >= 1 && !opening
                ? { scaleX: 1, opacity: 1 }
                : { scaleX: 0, opacity: 0 }
            }
            transition={{ duration: 0.9, ease: EASE, delay: 0.15 }}
            style={{ width: 32 }}
          />
          <span className="font-body text-[10px] font-semibold uppercase tracking-[0.52em] text-[#C9A86A] sm:text-[11px]">
            Entrada do campeão
          </span>
          <motion.span
            aria-hidden
            className="h-px origin-left bg-gradient-to-l from-transparent to-[#C9A86A]"
            initial={false}
            animate={
              reveal >= 1 && !opening
                ? { scaleX: 1, opacity: 1 }
                : { scaleX: 0, opacity: 0 }
            }
            transition={{ duration: 0.9, ease: EASE, delay: 0.15 }}
            style={{ width: 32 }}
          />
        </motion.div>

        {/* Selo — tempo 2: 0.92→1; abertura: pulse → funde na luz */}
        <motion.button
          type="button"
          aria-label="Abrir o convite"
          disabled={phase !== "ready"}
          onClick={() => void openGate(false)}
          onHoverStart={() => {
            if (idle) setSealVibrant(true);
          }}
          onHoverEnd={() => setSealVibrant(false)}
          onTapStart={() => {
            if (idle) setSealVibrant(true);
          }}
          onTapCancel={() => setSealVibrant(false)}
          className="relative mb-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-[#C9A86A] disabled:cursor-default sm:mb-12"
          initial={false}
          animate={
            opening
              ? {
                  scale: [1, 1.045, 1, 0.78],
                  opacity: [1, 1, 1, 0],
                }
              : reveal >= 2
                ? { scale: 1, opacity: 1 }
                : { scale: 0.92, opacity: 0 }
          }
          transition={
            opening
              ? {
                  duration: 1.05,
                  times: [0, 0.18, 0.32, 1],
                  ease: EASE,
                }
              : { duration: 1.1, ease: EASE }
          }
          whileHover={
            idle && !reduceMotion
              ? { scale: 1.02 }
              : undefined
          }
          whileTap={idle ? { scale: 0.99 } : undefined}
        >
          {/* Halo — respiração */}
          {idle && !reduceMotion ? (
            <motion.span
              aria-hidden
              className="pointer-events-none absolute inset-[-18%] rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(201,168,106,0.3) 0%, rgba(201,168,106,0.06) 42%, transparent 70%)",
              }}
              animate={{
                scale: [1, 1.05, 1],
                opacity: sealVibrant ? [0.7, 0.95, 0.7] : [0.45, 0.75, 0.45],
              }}
              transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }}
            />
          ) : null}

          <ChampionSeal
            vibrant={sealVibrant}
            showSweep={idle && !reduceMotion}
            className="relative h-[min(48vw,248px)] w-[min(48vw,248px)] drop-shadow-[0_28px_64px_rgba(0,0,0,0.55)] sm:h-[268px] sm:w-[268px]"
          />
        </motion.button>

        {/* Tipografia — tempo 3, ~100ms após selo */}
        <motion.div
          className="flex max-w-md flex-col items-center text-center"
          initial={false}
          animate={
            opening
              ? { opacity: 0, y: 12 }
              : reveal >= 3
                ? { opacity: 1, y: 0 }
                : { opacity: 0, y: 12 }
          }
          transition={{ duration: 0.95, ease: EASE }}
        >
          <p className="mb-3 font-body text-[10px] font-medium uppercase tracking-[0.42em] text-[#E8DCC8]/65">
            Antes do apito inicial
          </p>
          <h1 className="mb-8 max-w-[16ch] font-display text-[clamp(1.85rem,5.8vw,2.9rem)] font-light leading-[1.08] tracking-tight text-[#F7F4EF] sm:mb-10">
            Um pequeno campeão prepara-se para entrar em campo
          </h1>
        </motion.div>

        {/* CTA — tempo 4 */}
        <motion.div
          className="flex w-full max-w-xs flex-col items-center gap-5 sm:max-w-sm"
          initial={false}
          animate={
            opening
              ? { opacity: 0, y: 16 }
              : reveal >= 4
                ? { opacity: 1, y: 0 }
                : { opacity: 0, y: 10 }
          }
          transition={{ duration: 0.85, ease: EASE }}
        >
          <button
            type="button"
            disabled={phase !== "ready"}
            onClick={() => void openGate(false)}
            className="flex min-h-12 w-full items-center justify-center rounded-full bg-[#C9A86A] px-6 py-3.5 font-body text-[11px] font-bold uppercase tracking-[0.28em] text-[#050A12] transition hover:bg-[#D4B87A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7F4EF] disabled:opacity-50"
          >
            Abrir o túnel
          </button>

          {audioReady ? (
            <button
              type="button"
              disabled={phase !== "ready"}
              onClick={() => void openGate(true)}
              className="font-body text-[10px] font-medium uppercase tracking-[0.32em] text-[#C9A86A]/85 transition hover:text-[#D4B87A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9A86A] disabled:opacity-50"
            >
              Abrir com Hala Madrid
            </button>
          ) : (
            <p className="font-body text-[10px] tracking-[0.2em] text-[#94A3B8]/70">
              Toca o selo para entrar
            </p>
          )}
        </motion.div>
      </div>

      {opening ? (
        <span className="sr-only" aria-live="polite">
          A abrir o convite do campeão.
        </span>
      ) : null}
    </motion.div>
  );
}
