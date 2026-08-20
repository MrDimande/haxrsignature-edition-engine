"use client";

import { motion, useReducedMotion } from "motion/react";
import {
  QUEEN_KAILANE_COPY,
  QUEEN_KAILANE_EVENT,
  downloadQueenKailaneIcsFile,
  shouldShowQueenKailaneCeremonyTime,
} from "@lib/queen-kailane/event-details";
import { QUEEN_COLORS, QUEEN_EASE } from "./queen-motion";

export function QueenKailaneCelebracao() {
  const reduceMotion = useReducedMotion();
  const showTime = shouldShowQueenKailaneCeremonyTime();

  return (
    <section
      id="queen-celebracao"
      className="relative px-6 py-28 md:py-36"
      style={{ backgroundColor: QUEEN_COLORS.pearl }}
      aria-labelledby="queen-celebracao-title"
    >
      <div className="mx-auto max-w-3xl">
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
          CAPÍTULO II · O SACRAMENTO
        </motion.p>

        <motion.h2
          id="queen-celebracao-title"
          className="mt-6 text-center text-[clamp(1.8rem,5vw,2.6rem)] font-light tracking-[0.08em]"
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
          O Sacramento
        </motion.h2>

        <motion.p
          className="mx-auto mt-10 max-w-xl text-center text-[0.95rem] leading-[1.85]"
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
          {QUEEN_KAILANE_COPY.celebracaoLead}
        </motion.p>

        <motion.p
          className="mx-auto mt-6 max-w-xl text-center text-[0.92rem] leading-[1.85]"
          style={{
            fontFamily:
              "var(--font-jost), var(--font-montserrat), system-ui, sans-serif",
            color: QUEEN_COLORS.taupe,
            fontWeight: 300,
          }}
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, delay: 0.12, ease: QUEEN_EASE }}
        >
          {QUEEN_KAILANE_COPY.celebracaoBody}
        </motion.p>

        <motion.div
          className="mx-auto mt-16 flex max-w-sm flex-col items-center gap-1 text-center"
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, delay: 0.15, ease: QUEEN_EASE }}
        >
          <span
            className="text-[clamp(3rem,10vw,4.5rem)] font-light leading-none tracking-[0.06em]"
            style={{
              fontFamily:
                'var(--font-cormorant), "Cormorant Garamond", Georgia, serif',
              color: QUEEN_COLORS.ink,
            }}
          >
            30
          </span>
          <span
            className="text-[0.72rem] tracking-[0.35em]"
            style={{
              fontFamily:
                "var(--font-jost), var(--font-montserrat), system-ui, sans-serif",
              color: QUEEN_COLORS.taupe,
            }}
          >
            AGOSTO
          </span>
          <span
            className="mt-1 text-[0.72rem] tracking-[0.35em]"
            style={{
              fontFamily:
                "var(--font-jost), var(--font-montserrat), system-ui, sans-serif",
              color: QUEEN_COLORS.inkSoft,
            }}
          >
            2026
          </span>
          {showTime && QUEEN_KAILANE_EVENT.ceremonyTime ? (
            <span
              className="mt-4 text-[0.75rem] tracking-[0.28em]"
              style={{
                fontFamily:
                  "var(--font-jost), var(--font-montserrat), system-ui, sans-serif",
                color: QUEEN_COLORS.goldMatte,
              }}
            >
              {QUEEN_KAILANE_EVENT.ceremonyTime}
            </span>
          ) : null}
        </motion.div>

        <motion.div
          className="mx-auto mt-14 h-px w-12"
          style={{ backgroundColor: QUEEN_COLORS.champagne }}
          initial={reduceMotion ? false : { scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: QUEEN_EASE }}
        />

        <motion.div
          className="mt-12 text-center"
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, ease: QUEEN_EASE }}
        >
          <p
            className="text-[0.68rem] tracking-[0.32em]"
            style={{
              fontFamily:
                "var(--font-jost), var(--font-montserrat), system-ui, sans-serif",
              color: QUEEN_COLORS.taupe,
            }}
          >
            IGREJA ANGLICANA
          </p>
          <p
            className="mt-4 text-[clamp(1.15rem,3.5vw,1.55rem)] leading-snug tracking-[0.04em]"
            style={{
              fontFamily:
                'var(--font-cormorant), "Cormorant Garamond", Georgia, serif',
              color: QUEEN_COLORS.ink,
            }}
          >
            PARÓQUIA DE
            <br />
            SÃO ESTÊVÃO E LOURENÇO
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => downloadQueenKailaneIcsFile()}
              className="inline-flex min-h-11 items-center justify-center border px-6 py-3 text-[0.65rem] tracking-[0.24em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
              style={{
                fontFamily:
                  "var(--font-jost), var(--font-montserrat), system-ui, sans-serif",
                color: QUEEN_COLORS.ink,
                borderColor: "rgba(185,151,91,0.55)",
                background:
                  "linear-gradient(180deg, rgba(255,253,252,0.95), rgba(246,241,232,0.7))",
                outlineColor: QUEEN_COLORS.goldMatte,
              }}
            >
              ADICIONAR AO CALENDÁRIO
            </button>

            {QUEEN_KAILANE_EVENT.mapUrl ? (
              <a
                href={QUEEN_KAILANE_EVENT.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center justify-center border px-6 py-3 text-[0.65rem] tracking-[0.24em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
                style={{
                  fontFamily:
                    "var(--font-jost), var(--font-montserrat), system-ui, sans-serif",
                  color: QUEEN_COLORS.ink,
                  borderColor: "rgba(185,151,91,0.55)",
                  background:
                    "linear-gradient(180deg, rgba(255,253,252,0.95), rgba(246,241,232,0.7))",
                  outlineColor: QUEEN_COLORS.goldMatte,
                }}
              >
                VER NO MAPA
              </a>
            ) : null}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
