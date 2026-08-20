"use client";

import { motion, useReducedMotion } from "motion/react";
import {
  QUEEN_KAILANE_EVENT,
  QUEEN_KAILANE_SIGNATURE,
  QUEEN_KAILANE_VERSE,
} from "@lib/queen-kailane/event-details";
import { QueenArchOfLight } from "./QueenArchOfLight";
import { QUEEN_COLORS, QUEEN_EASE } from "./queen-motion";

export function QueenKailaneClosing() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="queen-closing"
      className="relative overflow-hidden px-6 py-32 md:py-40"
      style={{ backgroundColor: QUEEN_COLORS.ivory }}
      aria-label="Encerramento"
    >
      <div
        className="pointer-events-none absolute left-1/2 top-[4%] h-[50vh] w-[min(60vw,240px)] -translate-x-1/2 opacity-40"
        aria-hidden="true"
      >
        <QueenArchOfLight intensity="soft" />
      </div>

      <div className="relative z-[1] mx-auto max-w-2xl text-center">
        <motion.p
          className="mb-4 text-center text-[0.65rem] tracking-[0.4em]"
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
          EPÍLOGO · UMA PÁGINA DE FÉ
        </motion.p>
        <motion.p
          className="text-[0.72rem] tracking-[0.3em]"
          style={{
            fontFamily:
              "var(--font-jost), var(--font-montserrat), system-ui, sans-serif",
            color: QUEEN_COLORS.inkSoft,
          }}
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: QUEEN_EASE }}
        >
          {QUEEN_KAILANE_EVENT.dateDisplayShort}
        </motion.p>

        <motion.h2
          className="mt-8 text-[clamp(1.6rem,5vw,2.4rem)] font-light tracking-[0.1em]"
          style={{
            fontFamily:
              'var(--font-cormorant), "Cormorant Garamond", Georgia, serif',
            color: QUEEN_COLORS.ink,
          }}
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.15, ease: QUEEN_EASE }}
        >
          QUEEN KAILANE CANDE
        </motion.h2>

        <motion.p
          className="mt-8 space-y-1 text-[0.75rem] tracking-[0.2em]"
          style={{
            fontFamily:
              "var(--font-jost), var(--font-montserrat), system-ui, sans-serif",
            color: QUEEN_COLORS.taupe,
          }}
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.1, ease: QUEEN_EASE }}
        >
          <span className="block">{QUEEN_KAILANE_SIGNATURE.line1}</span>
          <span className="block">{QUEEN_KAILANE_SIGNATURE.line2}</span>
        </motion.p>

        <motion.blockquote
          className="mt-14 text-[clamp(1.15rem,3.5vw,1.55rem)] font-light tracking-[0.04em]"
          style={{
            fontFamily:
              'var(--font-cormorant), "Cormorant Garamond", Georgia, serif',
            color: QUEEN_COLORS.ink,
          }}
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: 0.15, ease: QUEEN_EASE }}
        >
          “{QUEEN_KAILANE_VERSE.text}”
        </motion.blockquote>

        <motion.p
          className="mt-5 text-[0.65rem] tracking-[0.35em]"
          style={{
            fontFamily:
              "var(--font-jost), var(--font-montserrat), system-ui, sans-serif",
            color: QUEEN_COLORS.taupe,
          }}
          initial={reduceMotion ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.25, ease: QUEEN_EASE }}
        >
          {QUEEN_KAILANE_VERSE.reference}
        </motion.p>

        <div className="h-24 md:h-32" aria-hidden="true" />
      </div>
    </section>
  );
}
