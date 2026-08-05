"use client";

import React, { useRef, useSyncExternalStore } from "react";
import Image from "next/image";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { useExperience } from "../../context";
import {
  STAN_EVENT,
  getStanVenueShortName,
} from "@lib/stan/event-details";
import { StanleyWordmark } from "./StanleyWordmark";

const EASE = [0.22, 1, 0.36, 1] as const;

function subscribeMd(onStoreChange: () => void) {
  const mq = window.matchMedia("(min-width: 768px)");
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function useIsDesktopMd() {
  return useSyncExternalStore(
    subscribeMd,
    () => window.matchMedia("(min-width: 768px)").matches,
    () => false
  );
}

/**
 * Hero — Poster do Pequeno Campeão
 * Colagem 3 camadas · badge top-right · navy / ouro.
 * Isolado a stan-real-madrid.
 */
export function StanHeroSection() {
  const { introComplete } = useExperience();
  // useScroll precisa do nó montado — só monta o hero após o gate
  if (!introComplete) return null;
  return <StanHeroMounted />;
}

function StanHeroMounted() {
  const reduceMotion = useReducedMotion();
  const isDesktop = useIsDesktopMd();
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const enableParallax = Boolean(isDesktop && !reduceMotion);
  const bgY = useTransform(scrollYProgress, [0, 1], [0, 48]);
  const midY = useTransform(scrollYProgress, [0, 1], [0, 28]);
  const fgY = useTransform(scrollYProgress, [0, 1], [0, 12]);

  const venueLine = getStanVenueShortName();
  const matchDay = STAN_EVENT.dateIso.slice(8, 10).replace(/^0/, "");
  const kickHour = String(STAN_EVENT.timeHour);

  // Grade navy/ouro — no mobile o FG ocupa mais e precisa de mais wash
  const stadiumFilter = isDesktop
    ? "saturate(0.72) brightness(0.82) contrast(1.12) sepia(0.18) hue-rotate(-8deg)"
    : "saturate(0.52) brightness(0.7) contrast(1.16) sepia(0.3) hue-rotate(-10deg)";
  const midFilter = isDesktop
    ? "drop-shadow(0 14px 28px rgba(5,10,18,0.55)) drop-shadow(0 0 14px rgba(201,168,106,0.12)) sepia(0.28) saturate(0.62) brightness(0.82) contrast(1.06) hue-rotate(-4deg)"
    : "drop-shadow(0 14px 28px rgba(5,10,18,0.55)) drop-shadow(0 0 14px rgba(201,168,106,0.12)) sepia(0.34) saturate(0.55) brightness(0.78) contrast(1.08) hue-rotate(-5deg)";
  const fgFilter = isDesktop
    ? "drop-shadow(0 18px 36px rgba(5,10,18,0.45)) sepia(0.08) saturate(0.92) brightness(0.98) contrast(1.03) hue-rotate(-2deg)"
    : "drop-shadow(0 18px 36px rgba(5,10,18,0.5)) sepia(0.22) saturate(0.7) brightness(0.88) contrast(1.06) hue-rotate(-5deg)";

  return (
    <section
      ref={sectionRef}
      id="hero"
      aria-labelledby="stan-hero-title"
      className="relative flex min-h-[100svh] w-full scroll-mt-24 flex-col overflow-hidden text-[#F7F4EF] sm:scroll-mt-28"
      style={{ backgroundColor: "#050A12" }}
    >
      {/* Atmosfera estádio — grade navy / ouro unificado */}
      <div className="absolute inset-0">
        <Image
          src="/images/stan/hero/stadium-bg-desktop.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_22%] opacity-55 scale-105 max-md:opacity-[0.48]"
          style={{
            filter: stadiumFilter,
          }}
          aria-hidden
        />
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 42% 70% at 50% 0%, rgba(247,244,239,0.28) 0%, rgba(201,168,106,0.16) 28%, transparent 62%),
              radial-gradient(ellipse 70% 55% at 50% 45%, rgba(11,19,43,0.35) 0%, transparent 70%),
              radial-gradient(ellipse 90% 50% at 50% 100%, rgba(5,10,18,0.97) 0%, transparent 55%),
              linear-gradient(180deg, rgba(5,10,18,0.55) 0%, rgba(5,10,18,0.22) 30%, rgba(5,10,18,0.72) 68%, rgba(5,10,18,0.98) 100%),
              linear-gradient(90deg, rgba(5,10,18,0.35) 0%, transparent 22%, transparent 78%, rgba(5,10,18,0.35) 100%)
            `,
          }}
        />
        {/* Véu de cor — une estádio + fotos no mesmo clima */}
        <div
          aria-hidden
          className="absolute inset-0 mix-blend-soft-light opacity-70 max-md:opacity-75"
          style={{
            background:
              "linear-gradient(165deg, rgba(201,168,106,0.22) 0%, rgba(11,19,43,0.45) 42%, rgba(5,10,18,0.55) 100%)",
          }}
        />
        {/* Wash navy extra no mobile — só no estádio (as fotos têm grade próprio) */}
        {!isDesktop ? (
          <div
            aria-hidden
            className="absolute inset-0 mix-blend-color opacity-35"
            style={{
              background:
                "linear-gradient(180deg, rgba(11,19,43,0.65) 0%, rgba(201,168,106,0.2) 42%, rgba(5,10,18,0.7) 100%)",
            }}
          />
        ) : null}
      </div>

      {/* Feixe vertical de luz — como na referência */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 z-[1] h-[62%] w-[min(55vw,280px)] -translate-x-1/2"
        style={{
          background:
            "linear-gradient(180deg, rgba(247,244,239,0.28) 0%, rgba(201,168,106,0.12) 35%, transparent 100%)",
          filter: "blur(18px)",
        }}
      />

      <div className="pointer-events-none absolute inset-0 z-[1] opacity-40 mix-blend-screen">
        <Image
          src="/images/stan/hero/light-rays.png"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-top"
          aria-hidden
        />
      </div>

      {/* Partículas douradas */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[2] opacity-55"
        style={{
          backgroundImage: `
            radial-gradient(1.5px 1.5px at 18% 18%, rgba(247,244,239,0.7), transparent),
            radial-gradient(2px 2px at 72% 12%, rgba(201,168,106,0.55), transparent),
            radial-gradient(1px 1px at 48% 28%, rgba(247,244,239,0.45), transparent),
            radial-gradient(1.5px 1.5px at 82% 42%, rgba(232,220,200,0.4), transparent),
            radial-gradient(1px 1px at 30% 48%, rgba(201,168,106,0.35), transparent)
          `,
        }}
      />

      {/* Top: Matchday + Badge (forma intacta, no topo) + áudio */}
      <div className="relative z-40 flex w-full shrink-0 items-start justify-between gap-3 px-4 pt-[max(0.85rem,env(safe-area-inset-top))] sm:px-8 sm:pt-7">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: EASE }}
          className="mt-3 flex items-center gap-2.5 sm:mt-4"
        >
          <span
            className="h-px w-7 bg-gradient-to-r from-transparent to-[#C9A86A] sm:w-10"
            aria-hidden
          />
          <span className="font-body text-[9px] font-semibold uppercase tracking-[0.46em] text-[#C9A86A] sm:text-[10px]">
            It&apos;s Matchday
          </span>
        </motion.div>

        <div className="flex items-start gap-2.5">
          {/* Badge — topo + halo dourado subtil */}
          <div className="relative">
            {!reduceMotion ? (
              <motion.span
                aria-hidden
                className="pointer-events-none absolute inset-[-18%] rounded-[1.85rem]"
                style={{
                  background:
                    "radial-gradient(ellipse 70% 75% at 50% 45%, rgba(201,168,106,0.28) 0%, rgba(201,168,106,0.08) 45%, transparent 72%)",
                }}
                animate={{ opacity: [0.45, 0.7, 0.45] }}
                transition={{
                  duration: 5.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ) : (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-[-18%] rounded-[1.85rem]"
                style={{
                  background:
                    "radial-gradient(ellipse 70% 75% at 50% 45%, rgba(201,168,106,0.22) 0%, transparent 70%)",
                }}
              />
            )}
            <motion.aside
              initial={reduceMotion ? false : { opacity: 0, y: -14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.35, ease: EASE }}
              className="relative flex w-[4.35rem] flex-col items-center rounded-b-[1.75rem] rounded-t-xl border border-[#C9A86A]/45 bg-[#0B132B]/78 px-2 py-3.5 shadow-[0_12px_40px_rgba(0,0,0,0.35),0_0_24px_rgba(201,168,106,0.12)] backdrop-blur-md sm:w-[5.25rem] sm:py-4"
              aria-label="Stan, número 5"
            >
              <span className="font-body text-[8px] font-semibold uppercase tracking-[0.28em] text-[#C9A86A] sm:text-[9px]">
                S · 5
              </span>
              <span
                className="mt-1.5 font-display font-light leading-none text-[#F7F4EF]"
                style={{ fontSize: "clamp(2.2rem, 7.5vw, 3rem)" }}
              >
                5
              </span>
              <span className="mt-2.5 h-px w-7 bg-[#C9A86A]/55" aria-hidden />
              <span className="mt-2.5 text-center font-body text-[8px] font-bold uppercase tracking-[0.22em] text-[#F7F4EF] sm:text-[9px]">
                Stan
              </span>
            </motion.aside>
          </div>
        </div>
      </div>

      {/* Stage — colagem mobile; no desktop alarga para Stanley + fotos maiores */}
      <div className="relative z-20 mx-auto min-h-0 w-full max-w-[26.5rem] flex-1 sm:max-w-[28rem] md:max-w-[36rem] lg:max-w-[40rem] [container-type:inline-size]">
        {/* Halo dourado atrás do sujeito — mesma temperatura do estádio */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[34%] h-[48%] w-[min(88%,520px)] -translate-x-1/2 -translate-y-1/2 rounded-full md:top-[32%] md:h-[52%]"
          style={{
            background:
              "radial-gradient(circle, rgba(201,168,106,0.38) 0%, rgba(11,19,43,0.22) 45%, rgba(5,10,18,0.08) 62%, transparent 72%)",
            filter: "blur(32px)",
          }}
        />

        {/* BG — suave, centrado atrás */}
        <motion.div
          aria-hidden
          initial={reduceMotion ? false : { opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: EASE }}
          className="pointer-events-none absolute left-1/2 top-[-2%] z-[1] h-[72%] w-[170%] max-w-none -translate-x-1/2 md:top-[-18%] md:h-[78%] md:w-[160%] md:origin-[center_22%] md:scale-[1.55]"
          style={{
            y: enableParallax ? bgY : 0,
            WebkitMaskImage:
              "linear-gradient(180deg, #000 0%, #000 48%, transparent 88%)",
            maskImage:
              "linear-gradient(180deg, #000 0%, #000 48%, transparent 88%)",
            filter: isDesktop
              ? "drop-shadow(0 0 48px rgba(201,168,106,0.18)) sepia(0.42) saturate(0.48) brightness(0.72) contrast(1.08) hue-rotate(-6deg)"
              : "drop-shadow(0 0 48px rgba(201,168,106,0.18)) sepia(0.48) saturate(0.42) brightness(0.68) contrast(1.1) hue-rotate(-8deg)",
            opacity: isDesktop ? 0.38 : 0.34,
          }}
        >
          <Image
            src="/images/stan/hero/poster-bg.png"
            alt=""
            fill
            priority
            sizes="(max-width: 640px) 100vw, 640px"
            className="object-contain object-[center_18%]"
          />
        </motion.div>

        {/* MID — apoio à direita (atrás do título) */}
        <motion.div
          aria-hidden
          initial={reduceMotion ? false : { opacity: 0, x: 28 }}
          animate={{ opacity: 0.7, x: 0 }}
          transition={{ duration: 1.2, delay: 0.18, ease: EASE }}
          className="pointer-events-none absolute right-[-8%] top-[12%] z-[2] h-[54%] w-[62%] md:right-[-4%] md:top-[10%] md:h-[60%] md:w-[58%]"
          style={{
            y: enableParallax ? midY : 0,
            WebkitMaskImage:
              "linear-gradient(180deg, #000 0%, #000 72%, transparent 100%)",
            maskImage:
              "linear-gradient(180deg, #000 0%, #000 72%, transparent 100%)",
            filter: midFilter,
          }}
        >
          <Image
            src="/images/stan/hero/poster-mid.png"
            alt=""
            fill
            priority
            sizes="(max-width: 640px) 50vw, 320px"
            className="object-contain object-bottom"
          />
        </motion.div>

        {/* Tipografia — STANLEY cream/camel (alinhado à capa) */}
        <div className="absolute inset-x-0 bottom-[10%] z-[5] flex w-full flex-col items-center px-3 pb-1 text-center sm:px-4 md:bottom-[9%]">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.95, delay: 0.45, ease: EASE }}
            className="w-full max-w-full"
          >
            <StanleyWordmark size="hero" id="stan-hero-title" />
          </motion.div>

          <motion.p
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.62, duration: 0.75 }}
            className="mt-1.5 font-body text-[10px] font-bold uppercase tracking-[0.44em] text-[#C9A86A] sm:mt-2 sm:text-[11px]"
          >
            Celebra 5 Anos
          </motion.p>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.78, duration: 0.75 }}
            className="mt-3 flex items-end justify-center gap-4 sm:mt-4 sm:gap-6"
          >
            {/* Data — estilo stats: número grande + label */}
            <div className="flex items-baseline gap-2">
              <time
                dateTime={STAN_EVENT.dateIso}
                className="font-display text-[1.55rem] font-light leading-none tracking-tight text-[#F7F4EF] sm:text-[1.85rem]"
              >
                {matchDay}
              </time>
              <div className="flex flex-col items-start gap-0.5 pb-0.5">
                <span className="font-body text-[8px] font-semibold uppercase leading-tight tracking-[0.22em] text-[#C9A86A] sm:text-[9px] sm:tracking-[0.24em]">
                  Setembro 2026
                </span>
                <span className="font-body text-[7px] uppercase tracking-[0.28em] text-[#C9A86A]/70 sm:text-[8px]">
                  Matchday
                </span>
              </div>
            </div>

            <span
              className="mb-1 h-7 w-px bg-[#C9A86A]/25 sm:h-8"
              aria-hidden
            />

            {/* Kick-off — mesmo ritmo tipográfico */}
            <div className="flex items-baseline gap-2">
              <span className="font-display text-[1.55rem] font-light leading-none tracking-tight text-[#F7F4EF] sm:text-[1.85rem]">
                {kickHour}
              </span>
              <div className="flex flex-col items-start gap-0.5 pb-0.5">
                <span className="max-w-[9.5rem] text-left font-body text-[8px] font-semibold uppercase leading-tight tracking-[0.16em] text-[#C9A86A] sm:max-w-none sm:text-[9px] sm:tracking-[0.2em]">
                  h{String(STAN_EVENT.timeMinute).padStart(2, "0")} · {venueLine}
                </span>
                <span className="font-body text-[7px] uppercase tracking-[0.28em] text-[#C9A86A]/70 sm:text-[8px]">
                  Kick-off
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* FG — herói central, ampliado no desktop */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.15, delay: 0.32, ease: EASE }}
          className="pointer-events-none absolute bottom-[24%] left-[-4%] z-[4] h-[56%] w-[76%] md:bottom-[28%] md:left-[-2%] md:h-[58%] md:w-[64%] lg:h-[60%] lg:w-[62%]"
          style={{
            y: enableParallax ? fgY : 0,
            filter: fgFilter,
            WebkitMaskImage:
              "linear-gradient(180deg, #000 0%, #000 88%, transparent 100%)",
            maskImage:
              "linear-gradient(180deg, #000 0%, #000 88%, transparent 100%)",
          }}
        >
          <motion.div
            className="relative h-full w-full"
            animate={reduceMotion ? undefined : { y: [0, -5, 0] }}
            transition={
              reduceMotion
                ? undefined
                : { duration: 5.8, repeat: Infinity, ease: "easeInOut" }
            }
          >
            {/* Glow dourado — só na bola */}
            <motion.div
              aria-hidden
              className="pointer-events-none absolute bottom-[1%] left-[52%] z-0 h-[26%] w-[42%] -translate-x-1/2 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(242,230,201,0.85) 0%, rgba(201,168,106,0.45) 32%, rgba(201,168,106,0.12) 55%, transparent 72%)",
                filter: "blur(8px)",
              }}
              animate={
                reduceMotion
                  ? undefined
                  : { opacity: [0.7, 1, 0.7], scale: [1, 1.06, 1] }
              }
              transition={
                reduceMotion
                  ? undefined
                  : { duration: 3.8, repeat: Infinity, ease: "easeInOut" }
              }
            />
            <div
              aria-hidden
              className="pointer-events-none absolute bottom-[0%] left-[52%] z-0 h-[10%] w-[34%] -translate-x-1/2 rounded-[100%]"
              style={{
                background:
                  "radial-gradient(ellipse, rgba(201,168,106,0.55) 0%, transparent 70%)",
                filter: "blur(4px)",
              }}
            />

            <Image
              src="/images/stan/hero/poster-fg-cut.png"
              alt="Stan, o pequeno campeão"
              fill
              priority
              sizes="(max-width: 640px) 72vw, 520px"
              className="relative z-[1] object-contain object-bottom"
            />
            {/* Drop-shadow ouro localizado na bola */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-[2]"
              style={{
                WebkitMaskImage:
                  "radial-gradient(ellipse 28% 18% at 52% 92%, #000 0%, #000 55%, transparent 75%)",
                maskImage:
                  "radial-gradient(ellipse 28% 18% at 52% 92%, #000 0%, #000 55%, transparent 75%)",
                filter:
                  "drop-shadow(0 0 10px rgba(201,168,106,0.85)) drop-shadow(0 0 22px rgba(242,230,201,0.45))",
              }}
            >
              <Image
                src="/images/stan/hero/poster-fg-cut.png"
                alt=""
                fill
                sizes="(max-width: 640px) 72vw, 520px"
                className="object-contain object-bottom"
              />
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Véu unificador mobile — cobre colagem + estádio no mesmo clima */}
      {!isDesktop ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[6] mix-blend-soft-light opacity-45"
          style={{
            background:
              "linear-gradient(165deg, rgba(201,168,106,0.28) 0%, rgba(11,19,43,0.55) 48%, rgba(5,10,18,0.5) 100%)",
          }}
        />
      ) : null}

      {/* Fade para a História — navy → bege editorial */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[15] h-40 sm:h-48"
        style={{
          background: `
            linear-gradient(
              to top,
              #F7F4EF 0%,
              rgba(247,244,239,0.85) 18%,
              rgba(232,220,200,0.35) 38%,
              rgba(5,10,18,0.55) 62%,
              transparent 100%
            )
          `,
        }}
      />

      <motion.div
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.8 }}
        className="relative z-40 flex shrink-0 flex-col items-center gap-1 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
        aria-hidden
      >
        <span className="font-body text-[8px] uppercase tracking-[0.4em] text-[#0A1628]/45">
          A história
        </span>
        <motion.span
          className="block h-6 w-px bg-gradient-to-b from-[#C9A86A] to-transparent"
          animate={reduceMotion ? undefined : { opacity: [0.35, 1, 0.35] }}
          transition={
            reduceMotion
              ? undefined
              : { duration: 2.2, repeat: Infinity, ease: "easeInOut" }
          }
        />
      </motion.div>
    </section>
  );
}
