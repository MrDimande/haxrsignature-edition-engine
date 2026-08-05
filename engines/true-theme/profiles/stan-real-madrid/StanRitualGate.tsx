"use client";

import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useLenis } from "lenis/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useExperience } from "../../context";
import { isStanAudioReady } from "@lib/stan/event-details";
import { StanleyWordmark } from "./StanleyWordmark";

const EASE = [0.22, 1, 0.36, 1] as const;
/** Abertura: pulse → portas → luz → dissolve */
const OPEN_MS = 1750;
const WHISTLE_SRC = "/audio/stan/whistle.mp3";
/** Clip já cortado (~0,38s) — margem de segurança */
const WHISTLE_MS = 420;

type GatePhase = "idle" | "ready" | "opening" | "exit";

let whistleEl: HTMLAudioElement | null = null;

function getWhistleAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!whistleEl) {
    whistleEl = new Audio(WHISTLE_SRC);
    whistleEl.preload = "auto";
    whistleEl.volume = 0.72;
  }
  return whistleEl;
}

function preloadWhistle(): void {
  getWhistleAudio()?.load();
}

/** Apito real ~0,3s — MP3; fallback Web Audio se falhar */
async function playWhistleChirp(): Promise<void> {
  if (typeof window === "undefined") return;
  const audio = getWhistleAudio();
  if (audio) {
    try {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = 0.72;
      await audio.play();
      await new Promise<void>((resolve) => {
        window.setTimeout(() => {
          audio.pause();
          audio.currentTime = 0;
          resolve();
        }, WHISTLE_MS);
      });
      return;
    } catch {
      /* cai no sintetizador */
    }
  }

  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    if (ctx.state === "suspended") await ctx.resume();
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.42, now + 0.012);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
    master.connect(ctx.destination);
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(2100, now);
    osc.frequency.exponentialRampToValueAtTime(2680, now + 0.05);
    osc.frequency.exponentialRampToValueAtTime(1950, now + 0.28);
    osc.connect(master);
    osc.start(now);
    osc.stop(now + 0.32);
    await new Promise<void>((resolve) => {
      window.setTimeout(() => {
        void ctx.close().catch(() => undefined);
        resolve();
      }, 340);
    });
  } catch {
    /* silêncio */
  }
}

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
  const lenis = useLenis();
  const reduceMotion = useReducedMotion();
  const audioReady = isStanAudioReady(theme.audio.src);
  const [reveal, setReveal] = useState(0);
  const [phase, setPhase] = useState<GatePhase>("idle");
  const [sealVibrant, setSealVibrant] = useState(false);
  const [sealHintVisible, setSealHintVisible] = useState(true);

  const snapToHero = useCallback(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash && window.location.hash !== "#hero") {
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}`,
      );
    }
    const hero = document.getElementById("hero");
    if (hero && lenis) {
      lenis.scrollTo(hero, { immediate: true, force: true, offset: 0 });
    } else if (lenis) {
      lenis.scrollTo(0, { immediate: true, force: true });
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [lenis]);

  /* Enquanto o gate está aberto: sem scroll por baixo + sempre no topo */
  useEffect(() => {
    if (introComplete) return;
    const prevOverflow = document.body.style.overflow;
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    snapToHero();
    document.body.style.overflow = "hidden";
    document.documentElement.classList.add("lenis-stopped");
    return () => {
      document.body.style.overflow = prevOverflow;
      window.history.scrollRestoration = previousScrollRestoration;
      document.documentElement.classList.remove("lenis-stopped");
    };
  }, [introComplete, snapToHero]);

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

  /* Pré-carga: apito + Hala Madrid no idle */
  useEffect(() => {
    if (introComplete || phase === "opening" || phase === "exit") return;
    preloadWhistle();
    if (audioReady) audioPlayer?.preload();
  }, [introComplete, phase, audioReady, audioPlayer]);

  useEffect(() => {
    if (phase !== "opening") return;
    const done = window.setTimeout(() => {
      setPhase("exit");
      window.setTimeout(() => {
        snapToHero();
        setIntroComplete(true);
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => snapToHero());
        });
      }, reduceMotion ? 0 : 380);
    }, reduceMotion ? 0 : OPEN_MS);
    return () => window.clearTimeout(done);
  }, [phase, reduceMotion, setIntroComplete, snapToHero]);

  if (introComplete) return null;

  const openGate = async () => {
    if (phase === "opening" || phase === "exit") return;
    setSealHintVisible(false);
    snapToHero();

    // Apito → Hala Madrid (volume suave no tema)
    if (!reduceMotion) {
      await playWhistleChirp();
    }

    if (audioReady && audioPlayer) {
      try {
        await audioPlayer.start();
        setAudioEnabled(true);
      } catch {
        setAudioEnabled(false);
      }
    }
    if (reduceMotion) {
      snapToHero();
      setIntroComplete(true);
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => snapToHero());
      });
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
      aria-label="Entrada na celebração do Stanley"
      className="fixed inset-0 z-50 overflow-hidden text-[#F7F4EF]"
      style={{ minHeight: "100svh", backgroundColor: "#050A12" }}
      animate={phase === "exit" ? { opacity: 0 } : { opacity: 1 }}
      transition={{ duration: 0.45, ease: EASE }}
    >
      {/* Túnel — grade navy/ouro alinhado ao Hero */}
      <motion.div
        className="absolute inset-0"
        initial={false}
        animate={
          opening
            ? { scale: 1.08, filter: "brightness(1.28) saturate(1.04)" }
            : reveal >= 1
              ? { scale: 1.02, filter: "brightness(1)" }
              : { scale: 1.06, filter: "brightness(0.42)" }
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
            className="object-cover object-center opacity-[0.88]"
            style={{
              filter:
                "saturate(0.62) brightness(0.78) contrast(1.12) sepia(0.22) hue-rotate(-8deg)",
            }}
            aria-hidden
          />
        </picture>
        <div
          aria-hidden
          className="absolute inset-0 mix-blend-soft-light opacity-70"
          style={{
            background:
              "linear-gradient(165deg, rgba(201,168,106,0.22) 0%, rgba(11,19,43,0.5) 45%, rgba(5,10,18,0.55) 100%)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 70% 55% at 50% 42%, rgba(11,19,43,0.25) 0%, transparent 68%),
              linear-gradient(180deg, rgba(5,10,18,0.55) 0%, transparent 28%, transparent 58%, rgba(5,10,18,0.9) 100%)
            `,
          }}
        />
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
            radial-gradient(ellipse 70% 55% at 50% 45%, transparent 28%, rgba(5,10,18,0.5) 100%)
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
          aria-label="Abrir o túnel"
          disabled={phase !== "ready"}
          onClick={() => void openGate()}
          onHoverStart={() => {
            if (idle) setSealVibrant(true);
          }}
          onHoverEnd={() => setSealVibrant(false)}
          onTapStart={() => {
            if (idle) {
              setSealVibrant(true);
              setSealHintVisible(false);
            }
          }}
          onTapCancel={() => setSealVibrant(false)}
          className="relative mb-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-[#C9A86A] disabled:cursor-default sm:mb-8"
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
          whileTap={
            idle
              ? { scale: 0.94, transition: { duration: 0.12 } }
              : undefined
          }
        >
          {/* Halo — respiração mais óbvia no mobile (selo = abre) */}
          {idle && !reduceMotion ? (
            <>
              <motion.span
                aria-hidden
                className="pointer-events-none absolute inset-[-22%] rounded-full md:inset-[-18%]"
                style={{
                  background:
                    "radial-gradient(circle, rgba(201,168,106,0.42) 0%, rgba(201,168,106,0.1) 40%, transparent 68%)",
                }}
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: sealVibrant
                    ? [0.75, 1, 0.75]
                    : [0.55, 0.9, 0.55],
                }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <motion.span
                aria-hidden
                className="pointer-events-none absolute inset-[-6%] rounded-full border border-[#C9A86A]/45 md:border-[#C9A86A]/30"
                animate={{
                  scale: [1, 1.06, 1],
                  opacity: [0.35, 0.85, 0.35],
                }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </>
          ) : null}

          <ChampionSeal
            vibrant={sealVibrant}
            showSweep={idle && !reduceMotion}
            className="relative h-[min(48vw,248px)] w-[min(48vw,248px)] drop-shadow-[0_28px_64px_rgba(0,0,0,0.55)] sm:h-[268px] sm:w-[268px]"
          />
        </motion.button>

        <div className="mb-5 flex h-4 items-center justify-center sm:mb-0 sm:h-0">
          <AnimatePresence>
            {idle && sealHintVisible && reveal >= 2 ? (
              <motion.p
                key="seal-hint"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: EASE }}
                className="font-body text-[9px] font-medium uppercase tracking-[0.38em] text-[#C9A86A]/80 sm:hidden"
              >
                Toca no selo
              </motion.p>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Tipografia — marca hero + apoio */}
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
          <StanleyWordmark size="gate" />
          <p className="mt-3 font-body text-[10px] font-semibold uppercase tracking-[0.42em] text-[#C9A86A] sm:mt-3.5 sm:text-[11px]">
            S · 5
          </p>
          <p className="mt-4 max-w-[22ch] px-1 font-display text-[clamp(0.95rem,3.2vw,1.35rem)] font-light leading-snug text-[#E8DCC8]/85 sm:mt-5">
            Um pequeno campeão prepara-se para entrar em campo
          </p>
        </motion.div>

        {/* CTA — um gesto: abre com Hala Madrid (pause no canto depois) */}
        <motion.div
          className="mt-10 flex w-full max-w-xs flex-col items-center sm:mt-12 sm:max-w-sm"
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
            onClick={() => void openGate()}
            className="flex min-h-12 w-full items-center justify-center rounded-full bg-[#C9A86A] px-6 py-3.5 font-body text-[11px] font-extrabold uppercase tracking-[0.28em] text-[#050A12] shadow-[0_14px_40px_rgba(201,168,106,0.28)] transition hover:bg-[#D4B87A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7F4EF] disabled:opacity-50"
          >
            Abrir o túnel
          </button>
        </motion.div>
      </div>

      {opening ? (
        <span className="sr-only" aria-live="polite">
          A abrir o túnel do campeão.
        </span>
      ) : null}
    </motion.div>
  );
}
