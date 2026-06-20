"use client";

import React from "react";
import { motion } from "motion/react";
import { fadeUp, fadeIn, staggerContainer, defaultViewport } from "@/lib/motion";
import { COLORS } from "@/styles/tokens";

export default function GratitudeSection() {
  return (
    <motion.section
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={defaultViewport}
      className="relative overflow-hidden w-full py-24 text-center z-10"
      id="gratitude"
      style={{ backgroundColor: COLORS.smoothBlack }}
    >
      {/* Symmetrical framing lines */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-16 bg-gradient-to-b from-[#D4AF37]/20 to-transparent" />

      <div className="relative z-10 mx-auto max-w-xl px-6">
        {/* Section Tag */}
        <motion.span 
          variants={fadeUp}
          className="block font-alt text-[9px] uppercase tracking-[0.4em] text-[#D4AF37] mb-6"
        >
          Acolhimento & Bênção
        </motion.span>

        {/* Letter content */}
        <motion.div 
          variants={fadeUp}
          className="relative font-body text-xs sm:text-sm text-[#FAF5F0]/75 leading-relaxed font-light text-justify sm:text-center max-w-lg mx-auto mb-10"
        >
          {/* Elegant quotes */}
          <span className="font-display text-4xl text-[#D4AF37]/50 block mb-2 select-none">&ldquo;</span>
          Que cada convidada traga no coração a alegria do encontro e, nas mãos, a sabedoria da experiência. O Kulaya é o elo sagrado que une as gerações — o respeito pelo ontem que prepara o caminho para o amanhã. Esta transição não se faz a sós; é a vossa presença, conselhos e afeto que abençoam a minha nova jornada.
          <span className="font-display text-4xl text-[#D4AF37]/50 block mt-2 select-none">&rdquo;</span>
        </motion.div>

        {/* Cursive Signature */}
        <motion.div variants={fadeUp} className="mb-10 select-none">
          <p 
            className="font-display italic text-3xl text-white/95"
            style={{ fontFamily: "var(--font-playfair-display), serif" }}
          >
            Jessica Muege
          </p>
          <p className="font-alt text-[8px] uppercase tracking-widest text-[#FAF5F0]/25 mt-1">
            A Noiva
          </p>
        </motion.div>

        {/* SVG Clay Pot Emblem (Traditional Mozambican vase representing womanhood/home) */}
        <motion.div 
          variants={fadeIn}
          className="w-14 h-14 mx-auto text-[#D4AF37] opacity-60 hover:opacity-100 hover:scale-105 transition-all duration-500 cursor-pointer"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="1">
            {/* Top rim of clay pot */}
            <ellipse cx="50" cy="25" rx="15" ry="3" />
            {/* Neck of the pot */}
            <path d="M 37 26 Q 42 35 32 48 Q 22 62 30 78 Q 33 83 50 83 Q 67 83 70 78 Q 80 62 70 48 Q 60 35 65 26" />
            {/* Base line */}
            <ellipse cx="50" cy="83" rx="10" ry="2" />
            {/* Decorative tribal lines on the body of the pot */}
            <path d="M 28 60 Q 50 64 72 60" strokeWidth="0.6" strokeDasharray="2,2" />
            <path d="M 25 65 Q 50 70 75 65" strokeWidth="0.8" />
            <path d="M 28 70 Q 50 75 72 70" strokeWidth="0.6" strokeDasharray="2,2" />
            
            {/* Small geometric dots around the pot representing blessings */}
            <circle cx="50" cy="15" r="1" fill="currentColor" />
            <circle cx="28" cy="35" r="0.8" fill="currentColor" />
            <circle cx="72" cy="35" r="0.8" fill="currentColor" />
            <circle cx="20" cy="55" r="0.6" fill="currentColor" />
            <circle cx="80" cy="55" r="0.6" fill="currentColor" />
          </svg>
        </motion.div>
      </div>

      {/* Symmetrical framing lines bottom */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-px h-16 bg-gradient-to-t from-[#D4AF37]/20 to-transparent" />
    </motion.section>
  );
}
