"use client";

import React from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { useExperience } from "../../context";
import {
  STAN_EVENT,
  getStanVenueShortName,
} from "@lib/stan/event-details";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Hero — Poster do Pequeno Campeão
 * Colagem 3 camadas · badge top-right · navy / ouro.
 * Isolado a stan-real-madrid.
 */
export function StanHeroSection() {
  const { introComplete } = useExperience();
  const reduceMotion = useReducedMotion();

  if (!introComplete) return null;

  const venueLine = getStanVenueShortName();
  const matchDay = STAN_EVENT.dateIso.slice(8, 10).replace(/^0/, "");
  const kickHour = String(STAN_EVENT.timeHour);

  return (
    <section
      id="hero"
      aria-labelledby="stan-hero-title"
      className="relative flex min-h-[100svh] w-full scroll-mt-24 flex-col overflow-hidden text-[#F7F4EF] sm:scroll-mt-28"
      style={{ backgroundColor: "#050A12" }}
    >
      {/* Atmosfera estádio */}
      <div className="absolute inset-0">
        <Image
          src="/images/stan/hero/stadium-bg-desktop.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_22%] opacity-60 scale-105"
          aria-hidden
        />
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 42% 70% at 50% 0%, rgba(247,244,239,0.35) 0%, rgba(201,168,106,0.14) 28%, transparent 62%),
              radial-gradient(ellipse 90% 50% at 50% 100%, rgba(5,10,18,0.95) 0%, transparent 55%),
              linear-gradient(180deg, rgba(5,10,18,0.45) 0%, rgba(5,10,18,0.15) 30%, rgba(5,10,18,0.7) 68%, rgba(5,10,18,0.97) 100%)
            `,
          }}
        />
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

      {/* Stage */}
      <div className="relative z-20 flex min-h-0 w-full flex-1">
        {/* Halo dourado atrás do sujeito */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[36%] h-[50%] w-[75%] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(201,168,106,0.4) 0%, rgba(247,244,239,0.08) 42%, transparent 70%)",
            filter: "blur(32px)",
          }}
        />

        {/* BG — grande, suave, sob o feixe */}
        <motion.div
          aria-hidden
          initial={reduceMotion ? false : { opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: EASE }}
          className="pointer-events-none absolute left-1/2 top-[-4%] z-[1] h-[84%] w-[200%] -translate-x-1/2 sm:top-[-2%] sm:h-[90%] sm:w-[160%] md:top-[-6%] md:h-[96%] md:w-[140%] lg:w-[125%]"
          style={{
            WebkitMaskImage:
              "linear-gradient(180deg, #000 0%, #000 48%, transparent 88%)",
            maskImage:
              "linear-gradient(180deg, #000 0%, #000 48%, transparent 88%)",
            filter:
              "drop-shadow(0 0 48px rgba(201,168,106,0.22)) saturate(0.7) brightness(0.9) contrast(1.05)",
            opacity: 0.48,
          }}
        >
          <Image
            src="/images/stan/hero/poster-bg.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-contain object-[center_18%]"
          />
        </motion.div>

        {/* MID — acção subordinada; no desktop sobe e estreita à direita */}
        <motion.div
          aria-hidden
          initial={reduceMotion ? false : { opacity: 0, x: 28 }}
          animate={{ opacity: 0.72, x: 0 }}
          transition={{ duration: 1.2, delay: 0.18, ease: EASE }}
          className="pointer-events-none absolute right-[-2%] top-[22%] z-[2] h-[46%] w-[56%] sm:right-[5%] sm:top-[18%] sm:h-[52%] sm:w-[42%] md:right-[9%] md:top-[11%] md:h-[58%] md:w-[34%] lg:right-[11%] lg:top-[8%] lg:h-[62%] lg:w-[30%] xl:right-[13%] xl:w-[28%]"
          style={{
            WebkitMaskImage:
              "linear-gradient(180deg, #000 0%, #000 72%, transparent 100%)",
            maskImage:
              "linear-gradient(180deg, #000 0%, #000 72%, transparent 100%)",
            filter:
              "drop-shadow(0 14px 28px rgba(0,0,0,0.4)) drop-shadow(0 0 14px rgba(201,168,106,0.1)) saturate(0.82) brightness(0.93)",
          }}
        >
          <Image
            src="/images/stan/hero/poster-mid.png"
            alt=""
            fill
            priority
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 36vw, 28vw"
            className="object-contain object-bottom"
          />
        </motion.div>

        {/* FG — herói; desktop: mais centrado-esquerdo, acima do título */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.15, delay: 0.32, ease: EASE }}
          className="absolute bottom-[28%] left-[4%] z-[3] h-[46%] w-[66%] sm:bottom-[24%] sm:left-[12%] sm:h-[52%] sm:w-[44%] md:bottom-[17%] md:left-[16%] md:h-[60%] md:w-[38%] lg:bottom-[14%] lg:left-[19%] lg:h-[64%] lg:w-[34%] xl:left-[21%] xl:w-[32%]"
          style={{
            filter: "drop-shadow(0 28px 52px rgba(0,0,0,0.58))",
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
              src="/images/stan/hero/poster-fg.png"
              alt="Stan, o pequeno campeão"
              fill
              priority
              sizes="(max-width: 640px) 72vw, 420px"
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
                src="/images/stan/hero/poster-fg.png"
                alt=""
                fill
                sizes="(max-width: 640px) 72vw, 420px"
                className="object-contain object-bottom"
              />
            </div>
          </motion.div>
        </motion.div>

        {/* Tipografia — sob as figuras; no desktop desce ligeiro para dar ar ao FG */}
        <div className="absolute inset-x-0 bottom-[5%] z-30 flex flex-col items-center px-5 pb-1 text-center sm:bottom-[6%] md:bottom-[4.5%] lg:bottom-[3.5%]">
          <motion.h1
            id="stan-hero-title"
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.95, delay: 0.45, ease: EASE }}
            className="relative inline-block font-display text-[clamp(8.5rem,36vw,19.5rem)] font-semibold uppercase leading-[0.78] tracking-[-0.06em] sm:text-[clamp(9.5rem,28vw,18rem)] md:text-[clamp(11rem,22vw,17rem)] lg:text-[clamp(12rem,18vw,16.5rem)]"
          >
            {/* Sombra dura — navy/bronze */}
            <span
              aria-hidden
              className="absolute inset-0 select-none"
              style={{
                color: "#1A1520",
                transform: "translate(0.04em, 0.05em)",
                opacity: 0.78,
                textShadow: "0.03em 0.04em 0 rgba(12, 10, 18, 0.5)",
              }}
            >
              Stan
            </span>
            {/* Contorno prateado + ouro */}
            <span
              aria-hidden
              className="absolute inset-0 select-none"
              style={{
                color: "transparent",
                WebkitTextStroke: "0.018em rgba(201, 168, 106, 0.55)",
                textShadow: `
                  -0.012em -0.01em 0 rgba(232, 236, 242, 0.7),
                  0.012em 0.01em 0 rgba(148, 163, 184, 0.45),
                  0 0 0.06em rgba(201, 168, 106, 0.35),
                  0.06em 0.08em 0.14em rgba(90, 72, 40, 0.4)
                `,
              }}
            >
              Stan
            </span>
            {/* Face — branco Los Blancos + veios metálicos ouro/prata */}
            <span
              className="relative"
              style={{
                backgroundImage: `
                  linear-gradient(
                    168deg,
                    #FFFFFF 0%,
                    #F7F4EF 12%,
                    #E8ECF2 22%,
                    #FFFFFF 34%,
                    #F2E6C9 42%,
                    #FFFFFF 52%,
                    #D4D8E0 62%,
                    #FFFFFF 74%,
                    #C9A86A 82%,
                    #F7F4EF 90%,
                    #FFFFFF 100%
                  )
                `,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                WebkitTextStroke: "0.008em rgba(247, 244, 239, 0.5)",
                filter: `
                  drop-shadow(0 1px 0 rgba(255,255,255,0.55))
                  drop-shadow(0 -1px 0 rgba(148,163,184,0.35))
                  drop-shadow(0 0 0.5px rgba(201,168,106,0.4))
                `,
              }}
            >
              Stan
            </span>
          </motion.h1>

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
            className="mt-4 flex items-end justify-center gap-6 sm:mt-7 sm:gap-14"
          >
            {/* Data — estilo stats: número grande + label */}
            <div className="flex items-baseline gap-2 sm:gap-3">
              <time
                dateTime={STAN_EVENT.dateIso}
                className="font-display text-[1.75rem] font-light leading-none tracking-tight text-[#F7F4EF] sm:text-5xl"
              >
                {matchDay}
              </time>
              <div className="flex flex-col items-start gap-0.5 pb-0.5">
                <span className="font-body text-[8px] font-semibold uppercase leading-tight tracking-[0.22em] text-[#C9A86A] sm:text-[10px] sm:tracking-[0.28em]">
                  Setembro 2026
                </span>
                <span className="font-body text-[7px] uppercase tracking-[0.28em] text-[#C9A86A]/70 sm:text-[9px]">
                  Matchday
                </span>
              </div>
            </div>

            <span
              className="mb-1 hidden h-8 w-px bg-[#C9A86A]/25 sm:mb-2 sm:block sm:h-12"
              aria-hidden
            />

            {/* Kick-off — mesmo ritmo tipográfico */}
            <div className="flex items-baseline gap-2 sm:gap-3">
              <span className="font-display text-[1.75rem] font-light leading-none tracking-tight text-[#F7F4EF] sm:text-5xl">
                {kickHour}
              </span>
              <div className="flex flex-col items-start gap-0.5 pb-0.5">
                <span className="font-body text-[8px] font-semibold uppercase leading-tight tracking-[0.22em] text-[#C9A86A] sm:text-[10px] sm:tracking-[0.28em]">
                  h{String(STAN_EVENT.timeMinute).padStart(2, "0")} · {venueLine}
                </span>
                <span className="font-body text-[7px] uppercase tracking-[0.28em] text-[#C9A86A]/70 sm:text-[9px]">
                  Kick-off
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

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
