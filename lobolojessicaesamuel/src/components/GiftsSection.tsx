"use client";

import { motion } from "motion/react";
import { fadeUp, fadeIn, staggerContainer, defaultViewport } from "@/lib/animations";

export default function GiftsSection() {
  return (
    <motion.section
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={defaultViewport}
      className="section-padding relative overflow-hidden bg-ivory"
      id="gifts"
    >
      <div className="relative z-10 mx-auto max-w-2xl px-6 text-center md:px-8">
        <motion.span
          variants={fadeUp}
          className="mb-6 inline-block font-body text-[10px] font-medium uppercase tracking-[0.35em] text-gold md:text-xs"
        >
          Presentes
        </motion.span>

        <motion.div variants={fadeIn} className="mx-auto mb-8 flex items-center justify-center gap-3">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-gold/30" />
          <div className="h-1.5 w-1.5 rotate-45 border border-gold/40" />
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-gold/30" />
        </motion.div>

        {/* Gift icon */}
        <motion.div variants={fadeUp} className="mb-8">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.8"
            strokeLinecap="round"
            className="mx-auto text-gold/50"
          >
            <rect x="3" y="8" width="18" height="13" rx="1" />
            <path d="M12 8v13" />
            <path d="M3 12h18" />
            <path d="M12 8c-2-3-6-3-6 0s4 0 6 0" />
            <path d="M12 8c2-3 6-3 6 0s-4 0-6 0" />
          </svg>
        </motion.div>

        <motion.p
          variants={fadeUp}
          className="font-display text-lg text-charcoal md:text-xl"
        >
          Lista de presentes será partilhada em breve
        </motion.p>

        <motion.p
          variants={fadeUp}
          className="mt-4 font-body text-xs font-light text-warm-gray/60"
        >
          A sua presença é o nosso maior presente
        </motion.p>
      </div>
    </motion.section>
  );
}
