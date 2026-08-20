"use client";

import { motion, useReducedMotion } from "motion/react";
import { QUEEN_KAILANE_COPY } from "@lib/queen-kailane/event-details";
import { QUEEN_COLORS, QUEEN_EASE } from "./queen-motion";

/**
 * Sequência editorial — respiração tipográfica, um verso de cada vez.
 */
export function QueenKailaneStory() {
  const reduceMotion = useReducedMotion();
  const lines = QUEEN_KAILANE_COPY.story;

  return (
    <section
      id="queen-story"
      className="relative px-6 py-28 md:py-36"
      style={{ backgroundColor: QUEEN_COLORS.ivory }}
      aria-label="Narrativa"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 50% 40% at 50% 50%, rgba(231,215,193,0.5), transparent 70%)",
        }}
      />

      <div className="relative mx-auto flex max-w-2xl flex-col gap-16 md:gap-24">
        <motion.p
          className="text-center text-[0.65rem] tracking-[0.4em]"
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
          CAPÍTULO I · A CAMINHADA
        </motion.p>
        {lines.map((line, index) => {
          const isLead = index === 0;
          const isClose = index === lines.length - 1;
          return (
            <motion.p
              key={line}
              className={
                isLead
                  ? "text-center text-[clamp(1.35rem,4.5vw,2rem)] leading-snug tracking-[0.06em]"
                  : isClose
                    ? "text-center text-[clamp(1.15rem,3.5vw,1.55rem)] leading-relaxed"
                    : "text-center text-[clamp(1.05rem,3vw,1.35rem)] leading-relaxed"
              }
              style={{
                fontFamily: isLead || isClose
                  ? 'var(--font-cormorant), "Cormorant Garamond", Georgia, serif'
                  : "var(--font-jost), var(--font-montserrat), system-ui, sans-serif",
                color: isLead ? QUEEN_COLORS.ink : QUEEN_COLORS.inkSoft,
                fontWeight: isLead ? 400 : 300,
              }}
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.7 }}
              transition={{
                duration: 1.05,
                delay: reduceMotion ? 0 : 0.05,
                ease: QUEEN_EASE,
              }}
            >
              {line}
            </motion.p>
          );
        })}
      </div>
    </section>
  );
}
