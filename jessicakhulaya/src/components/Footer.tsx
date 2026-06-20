"use client";

import React from "react";
import Image from "next/image";
import { motion } from "motion/react";
import {
  HAXR_AUTH,
  formatCopyright,
  formatStudioCredit,
} from "@lib/brand/authorship";
import { fadeUp, fadeIn, staggerContainer, defaultViewport } from "@/lib/motion";
import { COLORS } from "@/styles/tokens";

export default function Footer() {
  return (
    <motion.footer
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={defaultViewport}
      className="relative overflow-hidden w-full pb-12 pt-24 border-t border-[#FAF5F0]/5 z-10"
      id="footer"
      style={{ backgroundColor: COLORS.smoothBlack }}
    >
      {/* ─── Premium Background Ambient Glow ─── */}
      <div 
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[300px] pointer-events-none opacity-[0.03] blur-[100px] rounded-full"
        style={{
          background: `radial-gradient(circle, ${COLORS.burntGoldLight} 0%, transparent 80%)`
        }}
      />

      {/* ─── Symmetrical Side SVG Accents (Traditional geometry details) ─── */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 h-48 w-12 opacity-10 hidden lg:block text-[#D4AF37]">
        <svg viewBox="0 0 40 200" className="w-full h-full" fill="none" stroke="currentColor">
          <path d="M 10 10 L 30 50 L 10 90 L 30 130 L 10 170" strokeWidth="0.8" />
          <path d="M 20 20 L 35 50 L 20 80 L 35 110 L 20 140" strokeWidth="0.5" strokeDasharray="3,3" />
          <circle cx="20" cy="95" r="2" fill="currentColor" />
          <circle cx="20" cy="105" r="2" fill="currentColor" />
        </svg>
      </div>
      <div className="absolute right-6 top-1/2 -translate-y-1/2 h-48 w-12 opacity-10 hidden lg:block text-[#D4AF37]">
        <svg viewBox="0 0 40 200" className="w-full h-full" fill="none" stroke="currentColor" transform="scale(-1, 1)">
          <path d="M 10 10 L 30 50 L 10 90 L 30 130 L 10 170" strokeWidth="0.8" />
          <path d="M 20 20 L 35 50 L 20 80 L 35 110 L 20 140" strokeWidth="0.5" strokeDasharray="3,3" />
          <circle cx="20" cy="95" r="2" fill="currentColor" />
          <circle cx="20" cy="105" r="2" fill="currentColor" />
        </svg>
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6 md:px-12">
        {/* ─── Emblem & Brand Header ─── */}
        <div className="flex flex-col items-center text-center mb-10">
          {/* Logo Mark PNG Image */}
          <motion.div variants={fadeUp} className="group relative cursor-pointer flex flex-col items-center">
            {/* Soft backdrop glow */}
            <div className="absolute inset-0 bg-[#D4AF37]/5 blur-2xl rounded-full scale-75 group-hover:scale-110 transition-all duration-700" />
            <div className="relative z-10 w-48 h-48 transition-transform duration-700 group-hover:scale-105">
              <Image 
                src="/images/haxr-logo-vertical.png" 
                alt={HAXR_AUTH.brand} 
                fill 
                priority
                className="object-contain"
              />
            </div>
            <p className="font-alt text-[8px] tracking-[0.35em] uppercase -mt-4 text-[#FAF5F0]/30 select-none">
              {HAXR_AUTH.tagline}
            </p>
          </motion.div>
        </div>

        {/* ─── Elevated 3-Column Grid ─── */}
        <motion.div 
          variants={fadeUp}
          className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 pb-16 border-b border-[#FAF5F0]/5 text-center md:text-left"
        >
          {/* Column 1: Manifesto */}
          <div className="flex flex-col gap-3">
            <h3 className="font-cinzel text-xs tracking-[0.25em] text-[#D4AF37]">O ESTÚDIO</h3>
            <div className="h-[1px] w-8 bg-[#D4AF37]/30 mx-auto md:mx-0 my-1" />
            <p className="font-body text-xs text-[#FAF5F0]/50 font-light leading-relaxed max-w-xs mx-auto md:mx-0">
              {HAXR_AUTH.studioDescription}
            </p>
          </div>

          {/* Column 2: Contacts */}
          <div className="flex flex-col gap-3">
            <h3 className="font-cinzel text-xs tracking-[0.25em] text-[#D4AF37]">DIRECTÓRIO</h3>
            <div className="h-[1px] w-8 bg-[#D4AF37]/30 mx-auto md:mx-0 my-1" />
            <ul className="flex flex-col gap-2.5 font-body text-xs font-light text-[#FAF5F0]/60">
              <li>
                <span className="block text-[8px] tracking-wider text-[#FAF5F0]/30 font-alt uppercase">Website Oficial</span>
                <a 
                  href={HAXR_AUTH.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-[#D4AF37] transition-colors duration-300 underline underline-offset-4 decoration-[#FAF5F0]/10 hover:decoration-[#D4AF37]/50"
                >
                  www.{HAXR_AUTH.domain}
                </a>
              </li>
              <li>
                <span className="block text-[8px] tracking-wider text-[#FAF5F0]/30 font-alt uppercase">Correio Electrónico</span>
                <a 
                  href={`mailto:${HAXR_AUTH.email.convites}`}
                  className="hover:text-[#D4AF37] transition-colors duration-300 underline underline-offset-4 decoration-[#FAF5F0]/10 hover:decoration-[#D4AF37]/50"
                >
                  {HAXR_AUTH.email.convites}
                </a>
              </li>
              <li>
                <span className="block text-[8px] tracking-wider text-[#FAF5F0]/30 font-alt uppercase">Presença Digital</span>
                <a 
                  href={HAXR_AUTH.social.instagram} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-[#D4AF37] transition-colors duration-300 underline underline-offset-4 decoration-[#FAF5F0]/10 hover:decoration-[#D4AF37]/50"
                >
                  {HAXR_AUTH.social.handle}
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: The Event Context */}
          <div className="flex flex-col gap-3">
            <h3 className="font-cinzel text-xs tracking-[0.25em] text-[#D4AF37]">O CONVITE</h3>
            <div className="h-[1px] w-8 bg-[#D4AF37]/30 mx-auto md:mx-0 my-1" />
            <div className="font-body text-xs text-[#FAF5F0]/50 font-light leading-relaxed">
              <p className="font-display italic text-[#FAF5F0]/80 text-sm mb-1">Jessica Muege</p>
              <p className="font-alt text-[9px] uppercase tracking-wider text-[#FAF5F0]/40">Cerimónia de Kulaya</p>
              <p className="mt-2 text-[#FAF5F0]/40">01 de Agosto de 2026</p>
              <p className="text-[#FAF5F0]/40">Maputo, Moçambique</p>
            </div>
          </div>
        </motion.div>

        {/* ─── Philosophy Motto ─── */}
        <motion.div variants={fadeUp} className="flex flex-col items-center justify-center pt-12 pb-6 text-center">
          <p className="font-display italic text-sm text-[#FAF5F0]/55 tracking-wide">
            &ldquo;{HAXR_AUTH.motto}&rdquo;
          </p>
        </motion.div>

        {/* ─── Bottom Meta Bar ─── */}
        <motion.div 
          variants={fadeIn} 
          className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 text-center sm:text-left select-none"
        >
          <p className="font-body text-[9px] font-light tracking-[0.2em] text-[#FAF5F0]/25">
            {formatCopyright()}
          </p>
          <p className="font-body text-[8px] font-light tracking-[0.15em] text-[#FAF5F0]/20 mt-1">
            {formatStudioCredit()}
          </p>
          <p className="font-alt text-[8px] font-light tracking-[0.25em]" style={{ color: `${COLORS.burntGoldDark}50` }}>
            INVERNO 2026 • MZ
          </p>
        </motion.div>
      </div>
    </motion.footer>
  );
}
