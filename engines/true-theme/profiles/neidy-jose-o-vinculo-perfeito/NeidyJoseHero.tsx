"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import { NEIDY_JOSE_CONSTANTS } from "@lib/neidy-jose/constants";

interface NeidyJoseHeroProps {
  prefersReducedMotion?: boolean;
  /** Só após o gate — revelação, stagger e Ken Burns */
  cinematicActive?: boolean;
}

const EASE_CEREMONIAL = [0.22, 1, 0.36, 1] as const;

/** Ken Burns discreto: scale 1 → 1.04 · ~16s · reverse */
const KEN_BURNS = {
  duration: 16,
  ease: "easeInOut" as const,
  repeat: Infinity,
  repeatType: "reverse" as const,
};

/**
 * Timeline litúrgica pós-gate (segundos):
 * 0.00  cortina da foto sobe
 * 0.28  véu a dissipar
 * 0.42  monograma
 * 0.62  eyebrow
 * 0.82  Neidy
 * 0.98  e + José
 * 1.18  regra
 * 1.36  verso editorial
 * 1.58  data-selo
 * 1.88  chevrons
 */
const STAGGER = {
  curtain: 0.02,
  veil: 0.12,
  monogram: 0.42,
  eyebrow: 0.62,
  bride: 0.82,
  groom: 0.98,
  rule: 1.18,
  verse: 1.36,
  date: 1.58,
  chevrons: 1.88,
} as const;

function HeroScrollChevrons({ prefersReducedMotion }: { prefersReducedMotion: boolean }) {
  const chev = (
    <svg
      width="22"
      height="14"
      viewBox="0 0 20 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M1.5 2.5L10 9.5 18.5 2.5"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const scrollDown = {
    duration: 1.45,
    repeat: Infinity,
    ease: "easeInOut" as const,
  };

  return (
    <span className="flex flex-col items-center leading-none text-[#CBB994]">
      <motion.span
        animate={{ y: prefersReducedMotion ? 0 : [0, 11, 0], opacity: [0.55, 1, 0.55] }}
        transition={scrollDown}
      >
        {chev}
      </motion.span>
      <motion.span
        className="-mt-1"
        animate={{ y: prefersReducedMotion ? 0 : [0, 11, 0], opacity: [0.35, 0.9, 0.35] }}
        transition={{ ...scrollDown, delay: 0.18 }}
      >
        {chev}
      </motion.span>
    </span>
  );
}

function HeroExitTransition() {
  return (
    <div className="nj-hero-exit" aria-hidden>
      <svg
        className="nj-hero-exit__curve"
        viewBox="0 0 1440 72"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path fill="currentColor" d="M0,18 Q720,72 1440,18 L1440,72 L0,72 Z" />
      </svg>
    </div>
  );
}

/**
 * Hero editorial — paleta esmeralda/ouro, monograma oficial, tipografia enxuta.
 * Pós-gate: cortina da foto + véu a dissipar + stagger tipográfico cerimonial.
 * Foto: Ken Burns discreto + parallax mínimo (~3%).
 */
export function NeidyJoseHero({
  prefersReducedMotion = false,
  cinematicActive = true,
}: NeidyJoseHeroProps) {
  const { hero } = NEIDY_JOSE_CONSTANTS;
  const sectionRef = useRef<HTMLElement>(null);
  const enableCinema = cinematicActive && !prefersReducedMotion;
  /** Tipografia / monograma revelam após o gate (ou de imediato se reduced) */
  const revealType = cinematicActive || prefersReducedMotion;
  const revealPhoto = cinematicActive || prefersReducedMotion;

  const typeDuration = prefersReducedMotion ? 0.01 : 1.15;
  const delay = (seconds: number) => (prefersReducedMotion || !cinematicActive ? 0 : seconds);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const backParallaxY = useTransform(
    scrollYProgress,
    [0, 1],
    enableCinema ? [0, 36] : [0, 0]
  );
  const photoParallaxY = useTransform(
    scrollYProgress,
    [0, 1],
    enableCinema ? [0, 28] : [0, 0]
  );

  const scrollToNext = () => {
    const nextSection =
      document.getElementById("our-thread") ||
      document.getElementById("the-wedding-day") ||
      document.getElementById("scripture");
    nextSection?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative h-[100svh] min-h-[100svh] w-full overflow-hidden text-[#FCFDFC] select-none"
      aria-labelledby="nj-hero-heading"
    >
      <div className="absolute inset-0 z-0 bg-[#0A211A]" aria-hidden />

      {/* Backplane blur — parallax ligeiramente mais rápido */}
      <motion.div
        className="nj-backplane absolute inset-0 z-0 pointer-events-none overflow-hidden"
        style={{ y: backParallaxY }}
        aria-hidden
      >
        <motion.div
          className="absolute inset-[-6%]"
          initial={false}
          animate={{ opacity: revealPhoto ? 1 : 0 }}
          transition={{
            duration: prefersReducedMotion ? 0.01 : 1.4,
            delay: delay(STAGGER.curtain),
            ease: EASE_CEREMONIAL,
          }}
        >
          <Image
            src={hero.imageMobile}
            alt=""
            fill
            priority
            unoptimized
            className="object-cover object-center scale-125 blur-3xl opacity-40 md:hidden"
            sizes="100vw"
          />
          <Image
            src={hero.imageDesktop}
            alt=""
            fill
            priority
            unoptimized
            className="hidden object-cover object-center scale-110 blur-3xl opacity-45 md:block"
            sizes="100vw"
          />
        </motion.div>
      </motion.div>

      {/* Placa nítida — cortina de baixo → cima + Ken Burns + parallax */}
      <motion.div
        className="nj-hero-photo-curtain absolute inset-0 z-[1] pointer-events-none overflow-hidden"
        style={{ y: photoParallaxY }}
        initial={false}
        animate={{
          clipPath: revealPhoto
            ? "inset(0% 0 0 0)"
            : "inset(100% 0 0 0)",
        }}
        transition={{
          duration: prefersReducedMotion ? 0.01 : 1.65,
          delay: delay(STAGGER.curtain),
          ease: EASE_CEREMONIAL,
        }}
      >
        <motion.div
          className="absolute inset-0 will-change-transform"
          initial={false}
          animate={
            enableCinema
              ? { scale: [1, 1.04], y: ["0%", "-1.2%"] }
              : { scale: 1, y: "0%" }
          }
          transition={enableCinema ? KEN_BURNS : { duration: 0 }}
          style={{ transformOrigin: "50% 42%" }}
        >
          <div className="absolute inset-0 md:hidden">
            <Image
              src={hero.imageMobile}
              alt={NEIDY_JOSE_CONSTANTS.coupleTitle}
              fill
              priority
              unoptimized
              quality={100}
              className="object-cover object-[center_32%]"
              sizes="100vw"
            />
          </div>
          <div className="absolute inset-0 hidden md:block">
            <Image
              src={hero.imageDesktop}
              alt={NEIDY_JOSE_CONSTANTS.coupleTitle}
              fill
              priority
              unoptimized
              quality={100}
              className="object-cover object-[center_45%]"
              sizes="100vw"
            />
          </div>
        </motion.div>
      </motion.div>

      {/* Véu de revelação — densifica e depois dissipar */}
      <motion.div
        className="nj-hero-reveal-veil absolute inset-0 z-[2]"
        initial={false}
        animate={{
          opacity: revealPhoto ? (prefersReducedMotion ? 0 : [0.92, 0.55, 0]) : 0.95,
        }}
        transition={{
          duration: prefersReducedMotion ? 0.01 : 2.1,
          delay: delay(STAGGER.veil),
          ease: EASE_CEREMONIAL,
          times: prefersReducedMotion ? undefined : [0, 0.45, 1],
        }}
        aria-hidden
      />

      {/* Véu editorial permanente — leve, para tipografia assentar */}
      <motion.div
        className="absolute inset-0 z-[2] pointer-events-none"
        initial={false}
        animate={{ opacity: revealPhoto ? 1 : 0 }}
        transition={{
          duration: prefersReducedMotion ? 0.01 : 1.5,
          delay: delay(0.55),
          ease: EASE_CEREMONIAL,
        }}
        style={{
          background: [
            "linear-gradient(180deg, rgba(10,33,26,0.28) 0%, rgba(10,33,26,0.06) 34%, rgba(10,33,26,0.2) 56%, rgba(10,33,26,0.72) 88%, rgba(10,33,26,0.88) 100%)",
            "linear-gradient(180deg, transparent 55%, rgba(203,185,148,0.12) 100%)",
            "linear-gradient(90deg, rgba(10,33,26,0.18) 0%, transparent 18%, transparent 82%, rgba(10,33,26,0.18) 100%)",
          ].join(", "),
        }}
        aria-hidden
      />

      {/* Monograma — crest */}
      <motion.div
        initial={false}
        animate={
          revealType
            ? { opacity: 1, scale: 1, y: 0 }
            : { opacity: 0, scale: prefersReducedMotion ? 1 : 0.9, y: prefersReducedMotion ? 0 : 10 }
        }
        transition={{
          duration: typeDuration,
          delay: delay(STAGGER.monogram),
          ease: EASE_CEREMONIAL,
        }}
        className="nj-hero-monogram pointer-events-none absolute left-1/2 z-20 h-16 w-16 -translate-x-1/2 sm:h-[4.25rem] sm:w-[4.25rem] md:h-[4.75rem] md:w-[4.75rem] top-[10%] sm:top-[11%] md:top-[12%]"
      >
        <Image
          src={hero.monogram}
          alt=""
          fill
          unoptimized
          quality={100}
          className="object-contain"
          sizes="80px"
          aria-hidden
        />
      </motion.div>

      {/* Tipografia — stagger cerimonial */}
      <div className="nj-frontplane relative z-10 flex h-full flex-col items-center justify-end px-6 sm:px-10 pb-24 sm:pb-28 md:pb-36 text-center">
        <div className="flex w-full max-w-3xl flex-col items-center">
          <motion.p
            initial={false}
            animate={
              revealType
                ? { opacity: 0.88, y: 0 }
                : { opacity: 0, y: prefersReducedMotion ? 0 : -8 }
            }
            transition={{
              duration: typeDuration,
              delay: delay(STAGGER.eyebrow),
              ease: EASE_CEREMONIAL,
            }}
            className="font-serif text-[11px] sm:text-xs tracking-[0.38em] uppercase text-[#EBE4D5] mb-5 sm:mb-4 md:mb-3 -translate-y-1 md:translate-y-0"
          >
            {hero.eyebrow}
          </motion.p>

          <h1
            id="nj-hero-heading"
            className="nj-script-font nj-hero-editorial-glow w-full font-normal text-[#FCFDFC]"
          >
            {/* —— Mobile asymmetric — stagger Neidy → e José —— */}
            <span className="md:hidden block w-full max-w-[20.5rem] mx-auto">
              <motion.span
                initial={false}
                animate={
                  revealType
                    ? { opacity: 1, y: 0 }
                    : { opacity: 0, y: prefersReducedMotion ? 0 : 16 }
                }
                transition={{
                  duration: prefersReducedMotion ? 0.01 : 1.25,
                  delay: delay(STAGGER.bride),
                  ease: EASE_CEREMONIAL,
                }}
                className="block text-left text-[clamp(2.4rem,10vw,3.25rem)] leading-[1.02] tracking-wide"
              >
                {NEIDY_JOSE_CONSTANTS.brideName}
              </motion.span>
              <motion.span
                initial={false}
                animate={
                  revealType
                    ? { opacity: 1, y: 0 }
                    : { opacity: 0, y: prefersReducedMotion ? 0 : 14 }
                }
                transition={{
                  duration: prefersReducedMotion ? 0.01 : 1.25,
                  delay: delay(STAGGER.groom),
                  ease: EASE_CEREMONIAL,
                }}
                className="mt-0.5 flex justify-end pl-[12%]"
              >
                <span className="text-right text-[clamp(2.2rem,9.2vw,3rem)] leading-[1.02] tracking-wide">
                  <span className="nj-hero-and mr-[0.28em] text-[0.45em] align-middle">e</span>
                  {NEIDY_JOSE_CONSTANTS.groomName}
                </span>
              </motion.span>
            </span>

            {/* —— Desktop: Neidy → e → José —— */}
            <span className="hidden md:flex flex-wrap items-baseline justify-center gap-x-0 text-center text-[clamp(2.75rem,4.2vw,3.85rem)] leading-[1.08] tracking-wide">
              <motion.span
                initial={false}
                animate={
                  revealType
                    ? { opacity: 1, y: 0 }
                    : { opacity: 0, y: prefersReducedMotion ? 0 : 18 }
                }
                transition={{
                  duration: prefersReducedMotion ? 0.01 : 1.3,
                  delay: delay(STAGGER.bride),
                  ease: EASE_CEREMONIAL,
                }}
                className="inline-block"
              >
                {NEIDY_JOSE_CONSTANTS.brideName}
              </motion.span>
              <motion.span
                initial={false}
                animate={
                  revealType
                    ? { opacity: 1, y: 0 }
                    : { opacity: 0, y: prefersReducedMotion ? 0 : 10 }
                }
                transition={{
                  duration: prefersReducedMotion ? 0.01 : 1.05,
                  delay: delay(STAGGER.groom - 0.04),
                  ease: EASE_CEREMONIAL,
                }}
                className="nj-hero-and mx-[0.35em] inline-block text-[0.48em] align-middle"
              >
                e
              </motion.span>
              <motion.span
                initial={false}
                animate={
                  revealType
                    ? { opacity: 1, y: 0 }
                    : { opacity: 0, y: prefersReducedMotion ? 0 : 18 }
                }
                transition={{
                  duration: prefersReducedMotion ? 0.01 : 1.3,
                  delay: delay(STAGGER.groom + 0.06),
                  ease: EASE_CEREMONIAL,
                }}
                className="inline-block"
              >
                {NEIDY_JOSE_CONSTANTS.groomName}
              </motion.span>
            </span>
          </h1>

          <motion.div
            initial={false}
            animate={
              revealType
                ? { opacity: 1, scaleX: 1 }
                : { opacity: 0, scaleX: prefersReducedMotion ? 1 : 0 }
            }
            transition={{
              duration: prefersReducedMotion ? 0.01 : 1.05,
              delay: delay(STAGGER.rule),
              ease: EASE_CEREMONIAL,
            }}
            className="nj-hero-rule mt-5 sm:mt-6"
            aria-hidden
          />

          <motion.p
            initial={false}
            animate={
              revealType
                ? { opacity: 1, y: 0 }
                : { opacity: 0, y: prefersReducedMotion ? 0 : 12 }
            }
            transition={{
              duration: typeDuration,
              delay: delay(STAGGER.verse),
              ease: EASE_CEREMONIAL,
            }}
            className="mt-5 sm:mt-6 max-w-lg font-serif text-sm sm:text-base md:text-lg italic font-light leading-relaxed text-[#F5F7F4]/92"
          >
            {hero.editorialLine1}
            <br />
            {hero.editorialLine2}
          </motion.p>

          <motion.p
            initial={false}
            animate={
              revealType
                ? { opacity: 1, y: 0 }
                : { opacity: 0, y: prefersReducedMotion ? 0 : 8 }
            }
            transition={{
              duration: typeDuration,
              delay: delay(STAGGER.date),
              ease: EASE_CEREMONIAL,
            }}
            className="mt-6 sm:mt-7 font-body text-[11px] sm:text-xs tracking-[0.4em] uppercase text-[#CBB994]"
          >
            {hero.dateSeal}
          </motion.p>
        </div>
      </div>

      <motion.button
        onClick={scrollToNext}
        initial={false}
        animate={
          revealType
            ? { opacity: 1, y: 0 }
            : { opacity: 0, y: prefersReducedMotion ? 0 : 12 }
        }
        transition={{
          duration: typeDuration,
          delay: delay(STAGGER.chevrons),
          ease: EASE_CEREMONIAL,
        }}
        type="button"
        aria-label="Rolar para a secção O nosso fio"
        className="absolute bottom-8 sm:bottom-10 left-1/2 z-20 -translate-x-1/2 cursor-pointer p-2 focus:outline-none"
      >
        <HeroScrollChevrons prefersReducedMotion={prefersReducedMotion} />
      </motion.button>

      <HeroExitTransition />
    </section>
  );
}
