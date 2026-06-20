"use client";

import { motion } from "motion/react";
import { fadeUp, staggerContainer, defaultViewport } from "@/lib/animations";

export default function FamilySection() {
  return (
    <motion.section
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={defaultViewport}
      className="section-padding relative overflow-hidden"
      id="family"
      style={{
        background: "radial-gradient(circle at center, #FDFBF7 0%, #EFE9DB 100%)",
      }}
    >
      {/* Background soft shapes to represent silk folds / ambient light */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(circle_at_center,rgba(200,162,74,0.08)_0%,transparent_70%)] blur-2xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(circle_at_center,rgba(230,126,34,0.06)_0%,transparent_70%)] blur-2xl" />
      </div>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 md:px-8 relative z-10">
        {/* The Luxury Rounded Card */}
        <motion.div
          variants={fadeUp}
          className="relative rounded-[32px] md:rounded-[48px] bg-white shadow-[0_20px_50px_rgba(200,162,74,0.12)] p-8 sm:p-12 md:p-16 overflow-hidden border-[6px] border-[#A8853A]"
        >
          {/* Thin Inset Gold Border */}
          <div className="absolute inset-3 sm:inset-4 md:inset-5 rounded-[22px] md:rounded-[38px] border border-[#C8A24A]/40 pointer-events-none z-0" />

          {/* Top-Left Floral Ornament (Flipped and Rotated from transparent asset) */}
          <div className="absolute top-[-10px] left-[-10px] w-28 sm:w-36 md:w-44 h-auto pointer-events-none select-none z-10 rotate-180">
            <img src="/roses-corner-trans.png" alt="Rose ornament" className="w-full h-auto" />
          </div>

          {/* Bottom-Right Floral Ornament (Transparent asset) */}
          <div className="absolute bottom-[-10px] right-[-10px] w-32 sm:w-44 md:w-52 h-auto pointer-events-none select-none z-10">
            <img src="/roses-corner-trans.png" alt="Rose ornament" className="w-full h-auto" />
          </div>

          {/* Content Wrapper */}
          <div className="relative z-10 flex flex-col items-center justify-center py-6">
            
            {/* Circular Logo */}
            <div className="w-14 h-14 rounded-full border border-[#C8A24A]/60 flex flex-col items-center justify-center bg-white/40 mb-6 shadow-sm">
              <span className="font-display text-sm font-semibold tracking-wider text-[#A8853A] leading-none">J&S</span>
              <span className="font-body text-[6px] tracking-[0.25em] text-[#C8A24A] uppercase mt-1">LOBOLO</span>
            </div>

            {/* Cultural Greeting / Title */}
            <span className="font-display text-[10px] md:text-xs tracking-[0.35em] text-[#A8853A] font-semibold uppercase mb-4">
              Kanimambo
            </span>

            {/* Cursive Sublabel */}
            <span className="font-script text-xl md:text-2xl text-warm-gray mb-3">
              As famílias de
            </span>

            {/* Parent Names Block with Giant Ampersand */}
            <div className="relative flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4 my-2 max-w-xl text-center">
              <div className="flex flex-col font-display text-[10px] sm:text-xs md:text-sm tracking-[0.18em] text-[#A8853A] font-semibold space-y-2 leading-relaxed">
                <div>LUCAS J. A. MUEGE & MARIA S. F. A. DJIVE</div>
                <div>JAIME GOVENE & MARIA ROSA MAXAIEIE</div>
              </div>
              <div className="font-script text-5xl md:text-7xl text-[#D4B86A] select-none md:translate-y-[-8px]">
                &
              </div>
            </div>

            {/* Invitation Request */}
            <p className="font-body text-[8px] md:text-[9px] tracking-[0.25em] text-warm-gray font-light uppercase mt-6 mb-6 text-center max-w-sm leading-relaxed">
              Têm a honra de convidar para a celebração do
            </p>

            {/* "Wedding Celebration" equivalent: "Celebração do Lobolo" with overlapping circular ornament */}
            <div className="relative my-2 flex flex-col items-center justify-center">
              <div className="relative">
                {/* Overlapping gold circle ornament */}
                <div className="absolute left-[-20px] top-1/2 -translate-y-1/2 w-14 h-14 sm:w-18 sm:h-18 md:w-20 md:h-20 border border-[#D4B86A]/20 rounded-full z-0" />
                <h1 className="relative z-10 font-display text-3xl sm:text-4xl md:text-5xl font-light tracking-widest text-[#A8853A] uppercase">
                  Lobolo
                </h1>
              </div>
            </div>

            {/* Divider line "de seus filhos" */}
            <div className="flex items-center justify-center gap-4 my-6 w-full max-w-xs sm:max-w-md mx-auto">
              <div className="h-[1px] flex-1 bg-[#C8A24A]/25" />
              <span className="font-body text-[8px] tracking-[0.25em] uppercase text-warm-gray font-light whitespace-nowrap">
                de seus filhos
              </span>
              <div className="h-[1px] flex-1 bg-[#C8A24A]/25" />
            </div>

            {/* Names of the Couple */}
            <div className="flex items-center justify-center gap-2 sm:gap-3 my-2 text-center">
              <span className="font-display text-base sm:text-lg md:text-xl tracking-[0.22em] text-[#A8853A] font-semibold">
                JESSICA
              </span>
              {/* Elegant glyph ornament separator */}
              <svg width="24" height="20" viewBox="0 0 30 20" fill="none" className="text-[#D4B86A] mx-1">
                <path d="M5 10 C15 5 15 15 25 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                <path d="M12 6 C15 9 15 11 18 14" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                <circle cx="15" cy="10" r="1.5" fill="currentColor" />
              </svg>
              <span className="font-display text-base sm:text-lg md:text-xl tracking-[0.22em] text-[#A8853A] font-semibold">
                SAMUEL
              </span>
            </div>

            {/* Wedding Date Info */}
            <div className="flex items-center justify-center gap-4 sm:gap-6 my-6 font-display text-xs text-[#A8853A] tracking-wider">
              <div className="flex flex-col items-center">
                <span className="font-body text-[8px] tracking-[0.18em] text-warm-gray font-light">DIA</span>
                <span className="font-semibold mt-1">SÁB. 29</span>
              </div>
              <div className="h-6 w-px bg-[#C8A24A]/20" />
              <div className="flex flex-col items-center">
                <span className="font-body text-[8px] tracking-[0.18em] text-warm-gray font-light">MÊS</span>
                <span className="font-semibold mt-1">AGO. 2026</span>
              </div>
              <div className="h-6 w-px bg-[#C8A24A]/20" />
              <div className="flex flex-col items-center">
                <span className="font-body text-[8px] tracking-[0.18em] text-warm-gray font-light">HORA</span>
                <span className="font-semibold mt-1">13H30</span>
              </div>
            </div>

            {/* Venue Badge */}
            <div className="flex items-center justify-center gap-4 my-6 max-w-sm mx-auto text-left">
              <div className="bg-[#E67E22] text-white px-2 py-3 font-body text-[9px] tracking-[0.3em] font-semibold uppercase [writing-mode:vertical-lr] rotate-180 rounded-sm leading-none text-center select-none">
                LOCAL
              </div>
              <p className="font-body text-xs md:text-sm font-light text-warm-gray leading-relaxed">
                <strong className="text-[#A8853A] font-semibold">Local a confirmar</strong>
                <br />
                Maputo, Moçambique
              </p>
            </div>

            {/* Quote / Toast Section */}
            <div className="flex items-center justify-center gap-4 mt-6 w-full max-w-[150px] mx-auto">
              <div className="h-[1px] flex-1 bg-[#C8A24A]/20" />
              <span className="font-body text-[8px] tracking-[0.25em] uppercase text-[#A8853A] font-light">
                Mensagem
              </span>
              <div className="h-[1px] flex-1 bg-[#C8A24A]/20" />
            </div>
            <p className="mt-3 font-body text-[10px] md:text-xs font-light italic text-warm-gray/80 max-w-md mx-auto leading-relaxed text-center">
              "O Lobolo é a ponte sagrada que une duas famílias numa só. É o respeito pela ancestralidade, o reconhecimento do amor e a promessa de um futuro construído sobre raíces profundas."
            </p>

          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}
