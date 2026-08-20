"use client";

import { motion, useReducedMotion } from "motion/react";
import { QUEEN_KAILANE_VERSE } from "@lib/queen-kailane/event-details";
import { QueenArchOfLight } from "./QueenArchOfLight";
import { QUEEN_COLORS, QUEEN_EASE } from "./queen-motion";

/**
 * Momento de pausa — o versículo obrigatório.
 * “ANDAI COMO FILHOS DA LUZ.” — Efésios 5:8
 */
export function QueenKailaneVersiculo() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="queen-versiculo"
      className="relative flex min-h-[88svh] items-center justify-center overflow-hidden px-6 py-28"
      style={{ backgroundColor: QUEEN_COLORS.pearl }}
      aria-labelledby="queen-verse-text"
    >
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 55% 50% at 50% 42%, rgba(255,253,252,0.9) 0%, rgba(231,215,193,0.42) 40%, transparent 72%), radial-gradient(ellipse 80% 60% at 50% 100%, rgba(239,230,216,0.25), transparent 50%)",
        }}
      />

      <div
        className="pointer-events-none absolute left-1/2 top-[6%] h-[58vh] w-[min(70vw,280px)] -translate-x-1/2 opacity-50"
        aria-hidden="true"
      >
        <QueenArchOfLight intensity="soft" />
      </div>

      <div className="relative z-[1] mx-auto max-w-2xl text-center">
        <motion.p
          className="mb-4 text-center text-[0.65rem] tracking-[0.45em]"
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
          CAPÍTULO III · A PALAVRA
        </motion.p>

        <motion.div
          className="mx-auto mb-12 h-px w-10 origin-center"
          style={{ backgroundColor: QUEEN_COLORS.goldMatte }}
          initial={reduceMotion ? false : { scaleX: 0, opacity: 0 }}
          whileInView={{ scaleX: 1, opacity: 0.8 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 1.6, ease: QUEEN_EASE }}
        />

        <motion.blockquote
          id="queen-verse-text"
          className="text-[clamp(1.55rem,5.5vw,2.65rem)] font-light leading-[1.35] tracking-[0.04em]"
          style={{
            fontFamily:
              'var(--font-cormorant), "Cormorant Garamond", Georgia, serif',
            color: QUEEN_COLORS.ink,
          }}
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.55 }}
          transition={{ duration: 1.35, ease: QUEEN_EASE }}
        >
          <span className="block">“ANDAI COMO</span>
          <span className="block">FILHOS DA LUZ.”</span>
        </motion.blockquote>

        <motion.cite
          className="mt-10 block text-[0.68rem] not-italic tracking-[0.38em]"
          style={{
            fontFamily:
              "var(--font-jost), var(--font-montserrat), system-ui, sans-serif",
            color: QUEEN_COLORS.taupe,
          }}
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, delay: 0.2, ease: QUEEN_EASE }}
        >
          {QUEEN_KAILANE_VERSE.reference}
        </motion.cite>

        {/* Subtle linear cross — reverence, not ornament */}
        <motion.div
          className="mx-auto mt-16 flex flex-col items-center gap-0"
          aria-hidden="true"
          initial={reduceMotion ? false : { opacity: 0 }}
          whileInView={{ opacity: 0.55 }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, delay: 0.35, ease: QUEEN_EASE }}
        >
          <span
            className="block h-5 w-px"
            style={{ backgroundColor: QUEEN_COLORS.goldMatte }}
          />
          <span
            className="block h-px w-3"
            style={{ backgroundColor: QUEEN_COLORS.goldMatte }}
          />
          <span
            className="block h-5 w-px"
            style={{ backgroundColor: QUEEN_COLORS.goldMatte }}
          />
        </motion.div>
      </div>
    </section>
  );
}
