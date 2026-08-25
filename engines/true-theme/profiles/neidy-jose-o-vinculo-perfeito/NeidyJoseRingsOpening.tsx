"use client";

import {
    primeNeidyJoseAmbient,
    startNeidyJoseAmbient,
} from "@lib/neidy-jose/ambient-audio";
import { NEIDY_JOSE_CONSTANTS } from "@lib/neidy-jose/constants";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

interface NeidyJoseRingsOpeningProps {
  onComplete: () => void;
}

/**
 * Cena completa da abertura:
 * entering → bandas entram das bordas
 * awaiting → respiração + toque para unir
 * uniting  → rack focus, fio dourado, aproximação lenta
 * sealed   → flash, monograma, whisper bíblico, nomes
 * holding  → pausa editorial
 * exiting  → dissolve para o hero + música
 */
type GatePhase =
  | "entering"
  | "awaiting"
  | "uniting"
  | "sealed"
  | "holding"
  | "exiting";

const TIMING = {
  enterMs: 2200,
  uniteDuration: 2.85,
  sealAfterMs: 3000,
  holdAfterMs: 5100,
  exitAfterMs: 7600,
  exitFadeMs: 1400,
  reducedExitMs: 650,
} as const;

const EASE_CEREMONIAL = [0.22, 1, 0.36, 1] as const;

const BAND_X = {
  off: "18.5rem",
  rest: "8.6rem",
  join: "1.55rem",
} as const;

function MetallicBand({
  gradientId,
  tilt,
}: {
  gradientId: string;
  tilt: number;
}) {
  return (
    <svg
      viewBox="0 0 220 220"
      className="h-full w-full"
      aria-hidden
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      <defs>
        <linearGradient id={gradientId} x1="8%" y1="0%" x2="92%" y2="100%">
          <stop offset="0%" stopColor="#F7EDD4" />
          <stop offset="28%" stopColor="#CBB994" />
          <stop offset="58%" stopColor="#8C733E" />
          <stop offset="82%" stopColor="#E8D7B0" />
          <stop offset="100%" stopColor="#FFF8E8" />
        </linearGradient>
        <filter id={`${gradientId}-soft`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.55" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <ellipse
        cx="110"
        cy="110"
        rx="78"
        ry="78"
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="10"
        filter={`url(#${gradientId}-soft)`}
      />
      <ellipse
        cx="110"
        cy="110"
        rx="78"
        ry="78"
        fill="none"
        stroke="#FFFDF6"
        strokeWidth="1.15"
        opacity="0.48"
        strokeDasharray="40 230"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function NeidyJoseRingsOpening({ onComplete }: NeidyJoseRingsOpeningProps) {
  const mediaPreference = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const prefersReducedMotion = mounted ? (mediaPreference ?? false) : false;
  const [phase, setPhase] = useState<GatePhase>("entering");
  const completedRef = useRef(false);
  const timersRef = useRef<number[]>([]);

  const schedule = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  }, []);

  useEffect(() => {
    setMounted(true);
    primeNeidyJoseAmbient();
    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];
    };
  }, []);

  // Entrada automática → awaiting
  useEffect(() => {
    if (!mounted) return;
    if (prefersReducedMotion) {
      setPhase("awaiting");
      return;
    }
    const id = schedule(() => setPhase("awaiting"), TIMING.enterMs);
    return () => window.clearTimeout(id);
  }, [mounted, prefersReducedMotion, schedule]);

  const finish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    setPhase("exiting");
    schedule(onComplete, prefersReducedMotion ? 280 : TIMING.exitFadeMs);
  }, [onComplete, prefersReducedMotion, schedule]);

  const unite = useCallback(() => {
    if (phase !== "awaiting") return;
    // Unlock + fade no mesmo gesto do toque — senão o browser bloqueia o autoplay.
    void startNeidyJoseAmbient();

    if (prefersReducedMotion) {
      setPhase("sealed");
      schedule(finish, TIMING.reducedExitMs);
      return;
    }

    setPhase("uniting");
    schedule(() => {
      setPhase("sealed");
    }, TIMING.sealAfterMs);
    schedule(() => setPhase("holding"), TIMING.holdAfterMs);
    schedule(finish, TIMING.exitAfterMs);
  }, [finish, phase, prefersReducedMotion, schedule]);

  const canInteract = phase === "awaiting";
  const bandsAtRest = phase === "entering" || phase === "awaiting";
  const bandsJoining =
    phase === "uniting" ||
    phase === "sealed" ||
    phase === "holding" ||
    phase === "exiting";
  const isSealed =
    phase === "sealed" || phase === "holding" || phase === "exiting";
  const rackDark =
    phase === "uniting" || phase === "sealed" || phase === "holding";

  const bandX = (side: "left" | "right") => {
    const sign = side === "left" ? "-" : "";
    if (bandsJoining) return `${sign}${BAND_X.join}`;
    // entering + awaiting: destino em descanso (a entrada anima desde off-screen)
    return `${sign}${BAND_X.rest}`;
  };

  return (
    <motion.div
      onClick={canInteract ? unite : undefined}
      onKeyDown={(event) => {
        if (!canInteract) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          unite();
        }
      }}
      initial={{ opacity: 1 }}
      animate={{ opacity: phase === "exiting" ? 0 : 1 }}
      transition={{
        duration: prefersReducedMotion ? 0.25 : TIMING.exitFadeMs / 1000,
        ease: EASE_CEREMONIAL,
      }}
      role="button"
      tabIndex={canInteract ? 0 : -1}
      aria-label="Toque para unir as alianças e abrir o convite de Neidy Marino e José Mateus."
      aria-disabled={!canInteract}
      className={`fixed inset-0 z-[100] flex select-none flex-col items-center overflow-hidden bg-[#05120E] px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 text-[#FCFDFC] max-[520px]:pt-4 sm:px-10 sm:pb-10 sm:pt-10 ${
        canInteract ? "cursor-pointer" : "cursor-default"
      }`}
    >
      {/* Base esmeralda */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_46%,rgba(203,185,148,0.14)_0%,rgba(5,18,14,0.94)_58%,#030C09_100%)]"
        aria-hidden
      />

      {/* Véu dourado respirante */}
      <motion.div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_55%,rgba(203,185,148,0.09),transparent_44%)]"
        animate={
          prefersReducedMotion
            ? { opacity: 0.45 }
            : { opacity: [0.28, 0.52, 0.28] }
        }
        transition={{ duration: 6.2, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden
      />

      {/* Rack focus — escurece o fundo no toque */}
      <motion.div
        className="pointer-events-none absolute inset-0 bg-[#020806]"
        animate={{ opacity: rackDark ? 0.38 : 0 }}
        transition={{ duration: 1.6, ease: EASE_CEREMONIAL }}
        aria-hidden
      />

      <header className="relative z-20 flex shrink-0 flex-col items-center pt-3 text-center">
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{
            opacity: phase === "entering" ? 0 : isSealed ? 0.35 : 1,
            y: 0,
          }}
          transition={{ duration: 1.25, delay: 0.35, ease: EASE_CEREMONIAL }}
          className="font-body text-[10px] uppercase tracking-[0.46em] text-[#CBB994]"
        >
          {NEIDY_JOSE_CONSTANTS.scriptureTheme}
        </motion.p>
      </header>

      <main className="relative z-20 flex min-h-0 w-full max-w-3xl flex-1 flex-col items-center justify-center">
        <div className="relative flex h-[min(16.5rem,36svh)] w-full max-w-[32rem] items-center justify-center overflow-visible max-[380px]:h-[min(14.5rem,32svh)] sm:h-[23rem] sm:max-w-[38rem]">
          {/* Luz de sala */}
          <motion.div
            className="pointer-events-none absolute h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(255,248,225,0.3)_0%,rgba(203,185,148,0.15)_38%,transparent_72%)] blur-2xl sm:h-60 sm:w-60"
            animate={{
              opacity: isSealed ? 0.9 : bandsJoining ? 0.58 : 0.2,
              scale: isSealed ? 1.32 : bandsJoining ? 1.12 : 1,
            }}
            transition={{ duration: 1.55, ease: EASE_CEREMONIAL }}
            aria-hidden
          />

          {/* Fio dourado — cresce entre as bandas na união */}
          <motion.svg
            viewBox="0 0 320 24"
            className="pointer-events-none absolute z-[5] h-6 w-[min(18rem,70%)]"
            aria-hidden
          >
            <motion.line
              x1="12"
              y1="12"
              x2="308"
              y2="12"
              stroke="url(#nj-filament)"
              strokeWidth="1.35"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{
                pathLength: bandsJoining ? 1 : 0,
                opacity: bandsJoining ? (isSealed ? 0.25 : 0.85) : 0,
              }}
              transition={{
                duration: prefersReducedMotion ? 0.01 : TIMING.uniteDuration * 0.92,
                ease: EASE_CEREMONIAL,
              }}
            />
            <defs>
              <linearGradient id="nj-filament" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="transparent" />
                <stop offset="20%" stopColor="#CBB994" />
                <stop offset="50%" stopColor="#FFF4D6" />
                <stop offset="80%" stopColor="#CBB994" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>
          </motion.svg>

          {/* Flash no selo */}
          <AnimatePresence>
            {phase === "sealed" ? (
              <motion.div
                key="nj-seal-flash"
                initial={{ opacity: 0, scale: 0.35 }}
                animate={{ opacity: [0, 0.95, 0], scale: [0.45, 1.4, 1.7] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, ease: EASE_CEREMONIAL }}
                className="pointer-events-none absolute z-[6] h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(255,250,235,0.8)_0%,rgba(203,185,148,0.35)_42%,transparent_70%)] blur-md sm:h-40 sm:w-40"
                aria-hidden
              />
            ) : null}
          </AnimatePresence>

          {/* Banda esquerda */}
          <motion.div
            className="absolute z-10 h-[min(10rem,28svh)] w-[min(10rem,28svh)] sm:h-[12.75rem] sm:w-[12.75rem]"
            initial={{ x: `-${BAND_X.off}`, rotate: -12, opacity: 0 }}
            animate={{
              x: bandX("left"),
              rotate: bandsJoining ? -27 : -13,
              opacity: 1,
              y:
                phase === "awaiting" && !prefersReducedMotion
                  ? [0, -3.5, 0]
                  : 0,
            }}
            transition={
              phase === "awaiting"
                ? {
                    x: { duration: 0.01 },
                    opacity: { duration: 0.01 },
                    y: { duration: 4.6, repeat: Infinity, ease: "easeInOut" },
                  }
                : phase === "entering"
                  ? { duration: 2.15, ease: EASE_CEREMONIAL }
                  : {
                      duration: prefersReducedMotion ? 0.01 : TIMING.uniteDuration,
                      ease: EASE_CEREMONIAL,
                    }
            }
          >
            <MetallicBand gradientId="nj-band-left" tilt={0} />
          </motion.div>

          {/* Banda direita */}
          <motion.div
            className="absolute z-10 h-[min(10rem,28svh)] w-[min(10rem,28svh)] sm:h-[12.75rem] sm:w-[12.75rem]"
            initial={{ x: BAND_X.off, rotate: 12, opacity: 0 }}
            animate={{
              x: bandX("right"),
              rotate: bandsJoining ? 27 : 13,
              opacity: 1,
              y:
                phase === "awaiting" && !prefersReducedMotion
                  ? [0, 3.5, 0]
                  : 0,
            }}
            transition={
              phase === "awaiting"
                ? {
                    x: { duration: 0.01 },
                    opacity: { duration: 0.01 },
                    y: {
                      duration: 4.6,
                      delay: 0.4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    },
                  }
                : phase === "entering"
                  ? { duration: 2.15, delay: 0.14, ease: EASE_CEREMONIAL }
                  : {
                      duration: prefersReducedMotion ? 0.01 : TIMING.uniteDuration,
                      ease: EASE_CEREMONIAL,
                    }
            }
          >
            <MetallicBand gradientId="nj-band-right" tilt={0} />
          </motion.div>

          {/* Monograma — selo */}
          <AnimatePresence>
            {isSealed ? (
              <motion.div
                key="nj-seal-monogram"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 1.15, delay: 0.1, ease: EASE_CEREMONIAL }}
                className="relative z-20 flex h-[5.5rem] w-[5.5rem] items-center justify-center sm:h-[6.5rem] sm:w-[6.5rem]"
              >
                <span
                  className="pointer-events-none absolute inset-0 rounded-full border border-[#CBB994]/38"
                  aria-hidden
                />
                <span
                  className="pointer-events-none absolute inset-[-0.4rem] rounded-full border border-[#CBB994]/16"
                  aria-hidden
                />
                <div className="relative h-16 w-16 sm:h-[4.75rem] sm:w-[4.75rem]">
                  <Image
                    src={NEIDY_JOSE_CONSTANTS.hero.monogram}
                    alt=""
                    fill
                    unoptimized
                    quality={100}
                    className="object-contain drop-shadow-[0_12px_30px_rgba(203,185,148,0.55)]"
                    sizes="92px"
                    aria-hidden
                  />
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Tipografia por fase — em fluxo (não absolute) para não colidir com o rodapé */}
        <div className="relative mt-3 flex w-full flex-col items-center justify-start text-center max-[520px]:mt-1.5 sm:mt-7">
          <AnimatePresence mode="wait">
            {phase === "entering" ? (
              <motion.div
                key="entering"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.55 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
                className="flex min-h-[4.5rem] flex-col items-center justify-start sm:min-h-[5.5rem]"
              >
                <p className="font-body text-[9px] uppercase tracking-[0.4em] text-[#CBB994]/70">
                  A preparar o vínculo
                </p>
              </motion.div>
            ) : phase === "awaiting" ? (
              <motion.div
                key="awaiting"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.7, ease: EASE_CEREMONIAL }}
                className="flex min-h-[4.5rem] flex-col items-center justify-start sm:min-h-[5.5rem]"
              >
                <p className="font-body text-[10px] uppercase tracking-[0.44em] text-[#CBB994]">
                  Toque para unir
                </p>
                <p className="mt-3 max-w-[17rem] font-serif text-[0.95rem] italic leading-snug text-[#EBE4D5]/78 max-[520px]:mt-2 max-[520px]:text-[0.88rem]">
                  Duas bandas.
                  <br />
                  Um único vínculo.
                </p>
              </motion.div>
            ) : phase === "uniting" ? (
              <motion.div
                key="uniting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
                className="flex min-h-[4.5rem] flex-col items-center justify-start sm:min-h-[5.5rem]"
              >
                <p className="font-body text-[10px] uppercase tracking-[0.42em] text-[#CBB994]/90">
                  A fechar o vínculo
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="sealed"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.85, delay: 0.08, ease: EASE_CEREMONIAL }}
                className="flex min-h-[4.5rem] flex-col items-center justify-start sm:min-h-[5.5rem]"
              >
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.8 }}
                  transition={{ duration: 1, delay: 0.2 }}
                  className="mb-2.5 font-body text-[9px] uppercase tracking-[0.38em] text-[#CBB994] max-[520px]:mb-1.5"
                >
                  {NEIDY_JOSE_CONSTANTS.scriptureReference}
                </motion.p>
                <div className="nj-hero-rule mb-3 opacity-75 max-[520px]:mb-2" aria-hidden />
                <h1 className="nj-script-font text-[1.85rem] leading-tight text-[#FCFDFC] max-[520px]:text-[1.55rem] sm:text-4xl">
                  {NEIDY_JOSE_CONSTANTS.brideName}
                  <span className="nj-hero-and mx-[0.3em] align-middle text-[0.42em]">
                    e
                  </span>
                  {NEIDY_JOSE_CONSTANTS.groomName}
                </h1>
                <p className="mt-3 font-body text-[10px] uppercase tracking-[0.36em] text-[#CBB994] max-[520px]:mt-2">
                  {NEIDY_JOSE_CONSTANTS.eventDateFormatted}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer className="relative z-20 mt-3 shrink-0 pb-1 text-center sm:mt-4">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: bandsAtRest || isSealed ? 0.5 : 0.25 }}
          transition={{ duration: 1 }}
          className="font-body text-[9px] uppercase tracking-[0.34em] text-[#CBB994]"
        >
          HAXR Signature
        </motion.p>
      </footer>
    </motion.div>
  );
}
