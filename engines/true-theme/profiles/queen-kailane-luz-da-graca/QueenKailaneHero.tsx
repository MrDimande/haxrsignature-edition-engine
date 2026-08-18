"use client";

import { motion, useReducedMotion } from "motion/react";
import {
  QUEEN_KAILANE_COPY,
  QUEEN_KAILANE_EVENT,
  QUEEN_KAILANE_SIGNATURE,
} from "@lib/queen-kailane/event-details";
import { QueenArchOfLight } from "./QueenArchOfLight";
import { QUEEN_COLORS, QUEEN_EASE } from "./queen-motion";

export function QueenKailaneHero() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="queen-hero"
      className="relative flex min-h-[100svh] items-center justify-center overflow-hidden px-6 pb-24 pt-20"
      style={{ backgroundColor: QUEEN_COLORS.pearl }}
      aria-labelledby="queen-hero-name"
    >
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 28%, rgba(255,253,252,0.95) 0%, rgba(231,215,193,0.45) 42%, transparent 70%), radial-gradient(ellipse 90% 50% at 50% 100%, rgba(239,230,216,0.4), transparent 55%), linear-gradient(180deg, #FFFDFC 0%, #F6F1E8 100%)",
        }}
      />

      {/* Soft vignette — ceremonial depth */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 75% 70% at 50% 45%, transparent 40%, rgba(115,107,98,0.06) 100%)",
        }}
      />

      <div
        className="pointer-events-none absolute left-1/2 top-[4%] h-[64vh] w-[min(70vw,300px)] -translate-x-1/2 opacity-[0.42] max-md:opacity-[0.32]"
        aria-hidden="true"
      >
        <QueenArchOfLight intensity="strong" />
      </div>

      <div className="relative z-[1] mx-auto w-full max-w-3xl text-center">
        <motion.p
          className="text-[0.65rem] tracking-[0.4em]"
          style={{
            fontFamily:
              "var(--font-jost), var(--font-montserrat), system-ui, sans-serif",
            color: QUEEN_COLORS.taupe,
          }}
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: QUEEN_EASE }}
        >
          {QUEEN_KAILANE_COPY.heroEyebrow}
        </motion.p>

        <motion.h1
          id="queen-hero-name"
          className="mt-8 leading-[0.92]"
          style={{
            fontFamily:
              'var(--font-cormorant), "Cormorant Garamond", Georgia, serif',
            color: QUEEN_COLORS.ink,
          }}
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.15, delay: 0.1, ease: QUEEN_EASE }}
        >
          <span className="block text-[clamp(3.2rem,12vw,6.5rem)] font-light tracking-[0.04em]">
            QUEEN
          </span>
          <span className="mt-1 block text-[clamp(2.4rem,9vw,4.8rem)] font-light tracking-[0.06em]">
            KAILANE
          </span>
          <span className="mt-1 block text-[clamp(2.2rem,8vw,4.2rem)] font-light tracking-[0.08em]">
            CANDE
          </span>
        </motion.h1>

        <motion.p
          className="mt-8 text-[0.72rem] tracking-[0.3em] md:mt-10"
          style={{
            fontFamily:
              "var(--font-jost), var(--font-montserrat), system-ui, sans-serif",
            color: QUEEN_COLORS.inkSoft,
          }}
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.15, delay: 0.28, ease: QUEEN_EASE }}
        >
          {QUEEN_KAILANE_EVENT.dateDisplayShort}
        </motion.p>

        <motion.div
          className="mx-auto mt-8 h-px w-16 origin-center"
          style={{ backgroundColor: QUEEN_COLORS.goldMatte }}
          initial={reduceMotion ? false : { scaleX: 0, opacity: 0 }}
          whileInView={{ scaleX: 1, opacity: 0.75 }}
          viewport={{ once: true }}
          transition={{ duration: 1.3, delay: 0.35, ease: QUEEN_EASE }}
        />

        <motion.p
          className="mt-8 space-y-1 text-[0.78rem] leading-relaxed tracking-[0.18em]"
          style={{
            fontFamily:
              "var(--font-jost), var(--font-montserrat), system-ui, sans-serif",
            color: QUEEN_COLORS.taupe,
          }}
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.45, ease: QUEEN_EASE }}
        >
          <span className="block">{QUEEN_KAILANE_SIGNATURE.line1}</span>
          <span className="block">{QUEEN_KAILANE_SIGNATURE.line2}</span>
        </motion.p>
      </div>
    </section>
  );
}
