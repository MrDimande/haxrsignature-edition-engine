"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { QUEEN_KAILANE_COPY } from "@lib/queen-kailane/event-details";
import { QUEEN_COLORS, QUEEN_EASE } from "./queen-motion";

export function QueenKailaneHaxrSignature() {
  const reduceMotion = useReducedMotion();

  return (
    <footer
      id="queen-haxr"
      className="relative px-6 pb-20 pt-8"
      style={{ backgroundColor: QUEEN_COLORS.pearl }}
    >
      <motion.div
        className="mx-auto flex max-w-md flex-col items-center text-center"
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1.15, ease: QUEEN_EASE }}
      >
        <p
          className="text-[0.6rem] tracking-[0.36em]"
          style={{
            fontFamily:
              "var(--font-jost), var(--font-montserrat), system-ui, sans-serif",
            color: QUEEN_COLORS.taupe,
          }}
        >
          {QUEEN_KAILANE_COPY.haxrLine}
        </p>

        <div className="relative mt-6 h-14 w-14 opacity-80">
          <Image
            src="/images/haxr-logo-vertical.png"
            alt=""
            fill
            sizes="56px"
            className="object-contain"
          />
        </div>

        <p
          className="mt-5 text-[0.78rem] tracking-[0.28em]"
          style={{
            fontFamily:
              "var(--font-jost), var(--font-montserrat), system-ui, sans-serif",
            color: QUEEN_COLORS.ink,
          }}
        >
          {QUEEN_KAILANE_COPY.haxrBrand}
        </p>

        <p
          className="mt-3 text-[0.62rem] tracking-[0.18em]"
          style={{
            fontFamily:
              "var(--font-jost), var(--font-montserrat), system-ui, sans-serif",
            color: QUEEN_COLORS.taupe,
          }}
        >
          {QUEEN_KAILANE_COPY.haxrSub}
        </p>

        <div
          className="mt-8 h-px w-10"
          style={{ backgroundColor: QUEEN_COLORS.champagne }}
          aria-hidden="true"
        />

        <p
          className="mt-8 text-[0.72rem] italic leading-relaxed"
          style={{
            fontFamily:
              'var(--font-cormorant), "Cormorant Garamond", Georgia, serif',
            color: QUEEN_COLORS.inkSoft,
          }}
        >
          {QUEEN_KAILANE_COPY.haxrClose}
        </p>
      </motion.div>
    </footer>
  );
}
