"use client";

import { motion, useReducedMotion } from "motion/react";
import {
  QUEEN_KAILANE_COPY,
  QUEEN_KAILANE_EVENT,
} from "@lib/queen-kailane/event-details";
import { QUEEN_COLORS, QUEEN_EASE } from "./queen-motion";

export function QueenKailaneAlmoco() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="queen-almoco"
      className="relative px-6 py-28 md:py-36"
      style={{ backgroundColor: QUEEN_COLORS.ivory }}
      aria-labelledby="queen-almoco-title"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${QUEEN_COLORS.champagne}, transparent)`,
        }}
        aria-hidden="true"
      />

      <div className="mx-auto max-w-2xl text-center">
        <motion.p
          className="text-[0.65rem] tracking-[0.4em]"
          style={{
            fontFamily:
              "var(--font-jost), var(--font-montserrat), system-ui, sans-serif",
            color: QUEEN_COLORS.goldMatte,
          }}
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: QUEEN_EASE }}
        >
          CAPÍTULO IV · À MESA
        </motion.p>

        <motion.h2
          id="queen-almoco-title"
          className="mt-6 text-[clamp(1.7rem,4.5vw,2.4rem)] font-light tracking-[0.06em]"
          style={{
            fontFamily:
              'var(--font-cormorant), "Cormorant Garamond", Georgia, serif',
            color: QUEEN_COLORS.ink,
          }}
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, ease: QUEEN_EASE }}
        >
          {QUEEN_KAILANE_COPY.almocoLead}
        </motion.h2>

        <motion.p
          className="mx-auto mt-8 max-w-md text-[0.95rem] leading-[1.85]"
          style={{
            fontFamily:
              "var(--font-jost), var(--font-montserrat), system-ui, sans-serif",
            color: QUEEN_COLORS.inkSoft,
            fontWeight: 300,
          }}
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, delay: 0.08, ease: QUEEN_EASE }}
        >
          {QUEEN_KAILANE_COPY.almocoBody}
        </motion.p>

        <motion.div
          className="mt-16 flex flex-col items-center gap-3"
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, delay: 0.12, ease: QUEEN_EASE }}
        >
          <span
            className="text-[clamp(2.4rem,7vw,3.4rem)] font-light tracking-[0.12em]"
            style={{
              fontFamily:
                'var(--font-cormorant), "Cormorant Garamond", Georgia, serif',
              color: QUEEN_COLORS.ink,
            }}
          >
            {QUEEN_KAILANE_EVENT.lunchTime.replace("h", "H")}
          </span>
          <span
            className="mt-4 text-[0.72rem] tracking-[0.32em]"
            style={{
              fontFamily:
                "var(--font-jost), var(--font-montserrat), system-ui, sans-serif",
              color: QUEEN_COLORS.taupe,
            }}
          >
            {QUEEN_KAILANE_EVENT.lunchLocation.toUpperCase()}
          </span>
          <span
            className="text-[clamp(1.05rem,3vw,1.3rem)] tracking-[0.04em]"
            style={{
              fontFamily:
                'var(--font-cormorant), "Cormorant Garamond", Georgia, serif',
              color: QUEEN_COLORS.inkSoft,
            }}
          >
            {QUEEN_KAILANE_EVENT.lunchVenue}
          </span>
        </motion.div>
      </div>
    </section>
  );
}
