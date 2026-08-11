"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import {
  getNianMapsUrl,
  getNianVenueCity,
  getNianVenueName,
  hasNianMapsUrl,
} from "@lib/nian/event-details";
import { NIAN_COLORS, NIAN_EASE } from "./nian-motion";
import { NianSignalPulse } from "./NianSignalPulse";

/**
 * Localização — ponto de encontro (sem mapa/iframe nesta fase).
 * Isolado a nian-night-of-the-web.
 */
export function NianLocationSection() {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.3 });
  const mapsUrl = getNianMapsUrl();
  const showMaps = hasNianMapsUrl();

  return (
    <section
      ref={sectionRef}
      id="local"
      aria-labelledby="nian-local-title"
      className="relative w-full overflow-hidden"
      style={{ backgroundColor: NIAN_COLORS.bg }}
    >
      {/* Abstract night city — no map tiles */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 55% 40% at 18% 30%, rgba(65,105,225,0.18) 0%, transparent 58%),
            radial-gradient(ellipse 40% 35% at 82% 68%, rgba(225,6,0,0.12) 0%, transparent 55%),
            linear-gradient(180deg, #03050b 0%, #070a14 48%, #03050b 100%)
          `,
        }}
      />

      {/* Subtle urban lines */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <line x1="8%" y1="12%" x2="42%" y2="88%" stroke="#4169E1" strokeWidth="0.6" />
        <line x1="22%" y1="8%" x2="78%" y2="92%" stroke="#8FA3D1" strokeWidth="0.45" />
        <line x1="68%" y1="10%" x2="92%" y2="70%" stroke="#E10600" strokeWidth="0.5" />
        <line x1="4%" y1="55%" x2="96%" y2="48%" stroke="#4169E1" strokeWidth="0.35" />
      </svg>

      <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-3xl flex-col justify-center px-5 pb-[calc(env(safe-area-inset-bottom,0px)+6.5rem)] pt-20 md:px-10 md:py-28">
        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.5, ease: NIAN_EASE }}
          className="text-[10px] font-semibold uppercase tracking-[0.42em] text-[#4169E1]"
        >
          Ponto de encontro da missão
        </motion.p>

        <div className="mt-4 overflow-hidden">
          <motion.h2
            id="nian-local-title"
            initial={reduceMotion ? false : { opacity: 0, y: "108%" }}
            animate={inView ? { opacity: 1, y: "0%" } : undefined}
            transition={{
              duration: reduceMotion ? 0.4 : 0.75,
              delay: 0.08,
              ease: NIAN_EASE,
            }}
            className="text-[clamp(2rem,6vw,3.4rem)] font-semibold uppercase leading-[1.02] tracking-[0.04em] text-[#F4F6FB]"
            style={{
              fontFamily:
                "var(--font-jost), var(--font-montserrat), sans-serif",
            }}
          >
            A missão
            <br />
            tem um destino.
          </motion.h2>
        </div>
        <NianSignalPulse active={inView} />

        <div className="relative mt-12 space-y-8 md:mt-14">
          {/* Destination marker — subtle luminous point, not radar */}
          {!reduceMotion ? (
            <motion.div
              aria-hidden
              className="pointer-events-none absolute -left-1 top-2 h-2.5 w-2.5 rounded-full md:-left-3"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={
                inView
                  ? { opacity: [0, 1, 0.65], scale: [0.6, 1.05, 1] }
                  : undefined
              }
              transition={{ duration: 1.4, delay: 0.28, ease: NIAN_EASE }}
              style={{
                background: NIAN_COLORS.crimson,
                boxShadow: "0 0 18px rgba(225,6,0,0.55)",
              }}
            />
          ) : (
            <div
              aria-hidden
              className="absolute -left-1 top-2 h-2 w-2 rounded-full bg-[#E10600] md:-left-3"
            />
          )}

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.55, delay: 0.2, ease: NIAN_EASE }}
            className="pl-5 md:pl-6"
          >
            <p className="text-[9px] font-semibold uppercase tracking-[0.4em] text-[#4169E1]">
              Local
            </p>
            <p className="mt-2 text-[clamp(1.05rem,2.8vw,1.4rem)] font-medium uppercase tracking-[0.14em] text-[#F4F6FB]">
              {getNianVenueName()}
            </p>
          </motion.div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.55, delay: 0.3, ease: NIAN_EASE }}
            className="pl-5 md:pl-6"
          >
            <p className="text-[9px] font-semibold uppercase tracking-[0.4em] text-[#4169E1]">
              Cidade
            </p>
            <p className="mt-2 text-[clamp(1.05rem,2.8vw,1.4rem)] font-medium uppercase tracking-[0.14em] text-[#F4F6FB]">
              {getNianVenueCity()}
            </p>
          </motion.div>
        </div>

        {showMaps && mapsUrl ? (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.5, delay: 0.4, ease: NIAN_EASE }}
            className="mt-12 pl-5 md:pl-6"
          >
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center border border-[#4169E1]/70 bg-transparent px-7 text-[11px] font-semibold uppercase tracking-[0.32em] text-[#F4F6FB] transition hover:border-[#4169E1] hover:bg-[#4169E1]/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4169E1]"
            >
              Abrir ponto de encontro
            </a>
          </motion.div>
        ) : null}

        <motion.div
          aria-hidden
          initial={reduceMotion ? false : { scaleX: 0 }}
          animate={inView ? { scaleX: 1 } : undefined}
          transition={{ duration: 0.8, delay: 0.45, ease: NIAN_EASE }}
          className="mt-14 h-px origin-left bg-gradient-to-r from-[#E10600] via-[#4169E1]/50 to-transparent"
        />
      </div>
    </section>
  );
}
