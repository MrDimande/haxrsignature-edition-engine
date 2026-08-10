"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { NIAN_COLORS, NIAN_EASE } from "./nian-motion";
import { NianSignalPulse } from "./NianSignalPulse";

const COLOUR_PLANES = [
  {
    id: "royal",
    label: "AZUL ROYAL",
    fill: NIAN_COLORS.royal,
    glow: "rgba(65,105,225,0.45)",
  },
  {
    id: "crimson",
    label: "VERMELHO VIVO",
    fill: NIAN_COLORS.crimson,
    glow: "rgba(225,6,0,0.4)",
  },
  {
    id: "ink",
    label: "PRETO",
    fill: "#05060c",
    glow: "rgba(244,246,251,0.08)",
  },
] as const;

/**
 * Uniforme da Noite — editorial cromático (sem fotografia).
 * Isolado a nian-night-of-the-web.
 */
export function NianUniformeSection() {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.28 });

  return (
    <section
      ref={sectionRef}
      id="uniforme"
      aria-labelledby="nian-uniforme-title"
      className="relative w-full overflow-hidden"
      style={{ backgroundColor: NIAN_COLORS.bg }}
    >
      {/* Atmosphere grain / depth */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 70% 50% at 12% 20%, rgba(65,105,225,0.14) 0%, transparent 55%),
            radial-gradient(ellipse 55% 45% at 88% 70%, rgba(225,6,0,0.1) 0%, transparent 58%),
            linear-gradient(180deg, #03050b 0%, #060814 48%, #03050b 100%)
          `,
        }}
      />

      {/* Slow rim / haze breathe */}
      {!reduceMotion ? (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          animate={{ opacity: [0.28, 0.55, 0.28] }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            background: `
              radial-gradient(ellipse 55% 40% at 18% 22%, rgba(65,105,225,0.16) 0%, transparent 60%),
              radial-gradient(ellipse 45% 35% at 86% 72%, rgba(225,6,0,0.1) 0%, transparent 58%)
            `,
          }}
        />
      ) : null}

      <div className="relative z-10 mx-auto grid min-h-[100svh] w-full max-w-7xl items-center gap-10 px-5 pb-[calc(env(safe-area-inset-bottom,0px)+6.5rem)] pt-16 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] md:gap-14 md:px-10 md:py-24 lg:gap-20">
        {/* Chromatic architecture — power-on sequential */}
        <div className="relative order-2 flex w-full flex-col gap-3 md:order-1 md:gap-4">
          {COLOUR_PLANES.map((plane, index) => (
            <div
              key={plane.id}
              className="relative overflow-hidden"
              style={{
                height: "clamp(4.75rem, 14vw, 7.5rem)",
              }}
            >
              <motion.div
                className="absolute inset-0 origin-left"
                initial={
                  reduceMotion
                    ? false
                    : { scaleX: 0.08, opacity: 0, filter: "brightness(1.35)" }
                }
                animate={
                  inView
                    ? { scaleX: 1, opacity: 1, filter: "brightness(1)" }
                    : reduceMotion
                      ? undefined
                      : { scaleX: 0.08, opacity: 0, filter: "brightness(1.35)" }
                }
                transition={{
                  duration: reduceMotion ? 0.4 : 0.72,
                  delay: reduceMotion ? 0.05 * index : 0.1 + index * 0.22,
                  ease: NIAN_EASE,
                }}
                style={{
                  background: `
                    linear-gradient(105deg, ${plane.fill} 0%, ${plane.fill} 62%, rgba(3,5,11,0.35) 100%)
                  `,
                  boxShadow: reduceMotion
                    ? undefined
                    : `0 0 48px ${plane.glow}`,
                }}
              />

              {/* Slow glow pulse — not flashing */}
              {!reduceMotion ? (
                <motion.div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 mix-blend-soft-light"
                  initial={{ opacity: 0 }}
                  animate={
                    inView
                      ? { opacity: [0, 0.55, 0.28] }
                      : undefined
                  }
                  transition={{
                    duration: 2.6,
                    delay: 0.45 + index * 0.22,
                    ease: NIAN_EASE,
                  }}
                  style={{
                    background: `linear-gradient(90deg, transparent 0%, ${plane.glow} 45%, transparent 100%)`,
                  }}
                />
              ) : null}

              <motion.p
                initial={reduceMotion ? false : { opacity: 0, x: -12 }}
                animate={inView ? { opacity: 1, x: 0 } : undefined}
                transition={{
                  duration: 0.65,
                  delay: reduceMotion ? 0.08 * index : 0.32 + index * 0.22,
                  ease: NIAN_EASE,
                }}
                className="relative z-[1] flex h-full items-center px-5 text-[clamp(0.95rem,2.4vw,1.2rem)] font-semibold uppercase tracking-[0.28em] text-[#F4F6FB] md:px-7"
                style={{
                  fontFamily:
                    "var(--font-jost), var(--font-montserrat), sans-serif",
                  textShadow: "0 2px 18px rgba(3,5,11,0.55)",
                }}
              >
                {plane.label}
              </motion.p>
            </div>
          ))}
        </div>

        {/* Copy — first on mobile so dress code is immediately clear */}
        <div className="relative order-1 max-w-xl md:order-2 md:justify-self-end">
          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.55, ease: NIAN_EASE }}
            className="text-[10px] font-semibold uppercase tracking-[0.42em] text-[#4169E1]"
          >
            Protocolo de entrada
          </motion.p>

          <div className="mt-4 overflow-hidden">
            <motion.h2
              id="nian-uniforme-title"
              initial={
                reduceMotion ? false : { opacity: 0, y: "108%" }
              }
              animate={inView ? { opacity: 1, y: "0%" } : undefined}
              transition={{
                duration: reduceMotion ? 0.45 : 0.8,
                delay: 0.1,
                ease: NIAN_EASE,
              }}
              className="text-[clamp(2.15rem,6.2vw,3.6rem)] font-semibold uppercase leading-[0.98] tracking-[0.04em] text-[#F4F6FB]"
              style={{
                fontFamily:
                  "var(--font-jost), var(--font-montserrat), sans-serif",
              }}
            >
              Uniforme
              <br />
              da noite
            </motion.h2>
          </div>
          <NianSignalPulse active={inView} />

          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={inView ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.65, delay: 0.28, ease: NIAN_EASE }}
            className="mt-6 max-w-sm text-[1.05rem] leading-relaxed text-[#B0BED8] md:text-[1.12rem]"
          >
            Veste as cores.
            <br />
            Entra no universo do Nian.
          </motion.p>
        </div>
      </div>
    </section>
  );
}
