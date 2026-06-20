"use client";

import { motion } from "motion/react";
import GoldDivider from "./GoldDivider";
import AfricanPattern from "./AfricanPattern";
import { fadeUp, fadeIn, staggerContainer, defaultViewport } from "@/lib/animations";

export default function StorySection() {
  return (
    <motion.section
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={defaultViewport}
      className="relative overflow-hidden"
      id="tradition"
      style={{ backgroundColor: "#251C15", paddingTop: "5rem", paddingBottom: "5rem" }}
    >
      {/* Subtle pattern echo from Hero — right side */}
      <div className="absolute right-0 top-0 h-full w-[8%] opacity-10">
        <AfricanPattern
          variant="zigzag-strip"
          className="h-full w-full"
          color="#E67E22"
          opacity={0.3}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center md:px-8">
        {/* Section label */}
        <motion.span
          variants={fadeUp}
          className="mb-6 inline-block font-body text-[10px] font-medium uppercase tracking-[0.35em] md:text-xs"
          style={{ color: "#E67E22" }}
        >
          A Tradição
        </motion.span>

        {/* Gold divider */}
        <motion.div variants={fadeIn} className="mx-auto mb-10 flex items-center justify-center gap-3">
          <div className="h-px w-16 bg-gradient-to-r from-transparent" style={{ backgroundImage: "linear-gradient(to right, transparent, rgba(200,162,74,0.4), transparent)" }} />
          <div className="h-2 w-2 rotate-45 border" style={{ borderColor: "rgba(200,162,74,0.4)" }} />
          <div className="h-px w-16" style={{ backgroundImage: "linear-gradient(to right, transparent, rgba(200,162,74,0.4), transparent)" }} />
        </motion.div>

        {/* Title */}
        <motion.h2
          variants={fadeUp}
          className="mb-8 font-display text-2xl md:text-3xl lg:text-4xl"
          style={{ color: "#F0E6D0" }}
        >
          O Significado do Lobolo
        </motion.h2>

        {/* Emotional text */}
        <motion.p
          variants={fadeUp}
          className="mb-6 font-body text-base font-light leading-relaxed md:text-lg"
          style={{ color: "rgba(212, 184, 106, 0.7)" }}
        >
          O Lobolo é mais do que uma tradição — é a ponte sagrada que une duas famílias
          numa só. É o respeito pela ancestralidade, o reconhecimento do amor e a
          promessa de um futuro construído sobre raízes profundas.
        </motion.p>

        <motion.p
          variants={fadeUp}
          className="font-body text-base font-light leading-relaxed md:text-lg"
          style={{ color: "rgba(212, 184, 106, 0.7)" }}
        >
          Nesta celebração, honramos os que vieram antes de nós e abençoamos
          o caminho que Jessica e Samuel percorrerão juntos.
        </motion.p>

        {/* Decorative African-inspired motif */}
        <motion.div variants={fadeIn} className="mx-auto mt-12 flex items-center justify-center gap-4">
          <div className="h-px w-8" style={{ backgroundColor: "rgba(230,126,34,0.3)" }} />
          <svg width="40" height="20" viewBox="0 0 40 20" fill="none">
            <path d="M20 2 L34 18 L6 18 Z" stroke="#E67E22" strokeWidth="0.8" fill="none" opacity="0.5" />
            <path d="M20 7 L28 16 L12 16 Z" stroke="#E67E22" strokeWidth="0.5" fill="none" opacity="0.3" />
            <circle cx="20" cy="13" r="1.5" fill="#E67E22" opacity="0.4" />
          </svg>
          <div className="h-px w-8" style={{ backgroundColor: "rgba(230,126,34,0.3)" }} />
        </motion.div>
      </div>

      {/* Bottom gradient transition to light sections */}
      <div
        className="absolute bottom-0 left-0 h-24 w-full"
        style={{
          background: "linear-gradient(to bottom, transparent, #FAF8F5)",
        }}
      />
    </motion.section>
  );
}
