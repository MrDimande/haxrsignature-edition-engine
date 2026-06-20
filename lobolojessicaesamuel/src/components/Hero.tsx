"use client";

import { motion } from "motion/react";
import AfricanPattern from "./AfricanPattern";
import { heroStagger, fadeUp, fadeIn } from "@/lib/animations";

/**
 * Hero Section — Dark luxury African editorial style
 * Inspired by: dark background, bold orange tribal pattern on left,
 * gold/orange text, Africa continent icon, structured layout.
 */
export default function Hero() {
  return (
    <motion.section
      variants={heroStagger}
      initial="hidden"
      animate="visible"
      className="relative min-h-screen w-full overflow-hidden"
      id="hero"
      style={{ backgroundColor: "#1C1410" }}
    >
      {/* ─── Left: Bold African tribal pattern strip ─── */}
      <div className="absolute left-0 top-0 h-full w-[22%] sm:w-[24%] md:w-[26%] lg:w-[28%] z-10">
        <AfricanPattern
          variant="bold-tribal"
          className="h-full w-full"
          color="#E67E22"
          opacity={0.85}
        />
        {/* Organic wavy/torn paper transition edge */}
        <svg
          className="absolute top-0 right-0 h-full w-12 translate-x-1/2 pointer-events-none z-20"
          viewBox="0 0 100 1000"
          preserveAspectRatio="none"
          fill="#1C1410"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M100 0 L30 0 C 10 50, 50 100, 20 150 C 40 200, 10 250, 30 300 C 15 350, 45 400, 25 450 C 35 500, 5 550, 20 600 C 40 650, 15 700, 35 750 C 10 800, 30 850, 15 900 C 25 950, 5 980, 20 1000 L100 1000 Z" />
        </svg>
      </div>

      {/* ─── Subtle pattern overlay on right area ─── */}
      <div className="absolute bottom-0 right-0 h-[40%] w-[15%] opacity-15 md:w-[12%] z-0">
        <AfricanPattern
          variant="zigzag-strip"
          className="h-full w-full"
          color="#E67E22"
          opacity={0.3}
        />
      </div>

      {/* ─── Africa continent outline (Top Right) ─── */}
      <motion.div
        variants={fadeIn}
        className="absolute top-6 right-6 z-20 md:top-10 md:right-10 lg:top-12 lg:right-12"
      >
        <svg
          width="48"
          height="53"
          viewBox="0 0 50 55"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="md:h-16 md:w-14"
        >
          <path
            d="M25 2 C22 2 18 4 16 7 C14 10 12 12 11 15 C10 18 9 20 8 22 C7 25 6 28 6 31 C6 34 7 37 9 39 C10 41 12 43 14 44 C16 46 18 48 20 49 C22 50 24 51 25 51 C27 51 29 50 31 49 C33 48 35 46 36 44 C38 42 39 40 40 38 C41 36 42 33 42 30 C42 27 41 24 40 22 C39 19 37 17 35 14 C33 11 31 8 29 6 C27 4 26 2 25 2Z"
            stroke="#E67E22"
            strokeWidth="1.2"
            fill="none"
            opacity="0.8"
          />
          <path
            d="M22 15 C20 18 19 22 19 26 C19 30 20 33 22 36"
            stroke="#E67E22"
            strokeWidth="0.5"
            fill="none"
            opacity="0.4"
          />
        </svg>
      </motion.div>

      {/* ─── Main Content ─── */}
      {/* 
        Uses relative layout with left padding to push content right of the pattern column.
        Items are centered horizontally for a luxury editorial feel matching the reference design.
      */}
      <div className="relative z-10 flex min-h-screen w-full flex-col items-center justify-center pl-[24%] pr-6 py-20 sm:pl-[26%] sm:pr-8 md:pl-[30%] md:pr-12 lg:pl-[34%] lg:pr-16 text-center">
        
        {/* Title */}
        <motion.div variants={fadeUp} className="mb-4">
          <h2
            className="font-script text-3xl md:text-4xl lg:text-5xl"
            style={{ color: "#E67E22" }}
          >
            Lobolo
          </h2>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          variants={fadeUp}
          className="mb-8 max-w-md mx-auto font-body text-sm font-light tracking-wide md:mb-10 md:text-base"
          style={{ color: "#D4B86A" }}
        >
          Temos o prazer de vos convidar para o nosso casamento tradicional
        </motion.p>

        {/* ─── Couple Names (Large Script) ─── */}
        <div className="flex flex-col items-center justify-center w-full">
          <motion.div variants={fadeUp} className="mb-2">
            <h1
              className="font-script text-5xl leading-tight sm:text-6xl md:text-7xl lg:text-8xl"
              style={{ color: "#E67E22" }}
            >
              Jessica Muege
            </h1>
          </motion.div>

          <motion.div
            variants={fadeIn}
            className="my-1 md:my-2"
          >
            <span
              className="font-script text-3xl md:text-4xl"
              style={{ color: "#D4B86A" }}
            >
              &
            </span>
          </motion.div>

          <motion.div variants={fadeUp} className="mb-10 md:mb-14">
            <h1
              className="font-script text-5xl leading-tight sm:text-6xl md:text-7xl lg:text-8xl"
              style={{ color: "#E67E22" }}
            >
              Samuel Govene
            </h1>
          </motion.div>
        </div>

        {/* ─── Event Details Bar ─── */}
        <motion.div
          variants={fadeUp}
          className="mb-10 flex flex-col sm:flex-row items-stretch justify-center gap-4 sm:gap-0 mx-auto"
        >
          {/* Date */}
          <div
            className="flex flex-col items-center justify-center px-6 py-2 sm:border-r"
            style={{ borderColor: "rgba(200, 162, 74, 0.3)" }}
          >
            <span
              className="font-body text-[10px] font-medium uppercase tracking-[0.25em] md:text-xs"
              style={{ color: "#D4B86A" }}
            >
              Ago
            </span>
            <span
              className="font-display text-3xl font-light md:text-4xl"
              style={{ color: "#E67E22" }}
            >
              29
            </span>
          </div>

          {/* Venue */}
          <div
            className="flex flex-col justify-center px-6 py-2 text-center sm:border-r"
            style={{ borderColor: "rgba(200, 162, 74, 0.3)" }}
          >
            <span
              className="font-body text-xs font-light leading-relaxed md:text-sm"
              style={{ color: "#D4B86A" }}
            >
              Local a confirmar
              <br />
              Maputo, Moçambique
            </span>
          </div>

          {/* Time */}
          <div className="flex flex-col items-center justify-center px-6 py-2">
            <span
              className="font-display text-2xl font-light md:text-3xl"
              style={{ color: "#E67E22" }}
            >
              13:30
            </span>
            <span
              className="font-body text-[10px] font-medium uppercase tracking-[0.2em] md:text-xs"
              style={{ color: "#D4B86A" }}
            >
              Copo de Água
            </span>
          </div>
        </motion.div>

        {/* ─── RSVP Info ─── */}
        <motion.div variants={fadeUp} className="w-full max-w-md mx-auto">
          <div
            className="h-px w-full"
            style={{
              background:
                "linear-gradient(to right, transparent, rgba(200,162,74,0.4), transparent)",
            }}
          />
          <div className="mt-4 flex flex-col gap-1">
            <span
              className="font-body text-xs font-light tracking-wide md:text-sm"
              style={{ color: "#D4B86A" }}
            >
              RSVP até 15 de Agosto | HAXR Signature
            </span>
            <span
              className="font-body text-[10px] font-light tracking-wider md:text-xs"
              style={{ color: "rgba(212, 184, 106, 0.5)" }}
            >
              Confirme via WhatsApp
            </span>
          </div>
        </motion.div>
      </div>

      {/* ─── Scroll indicator ─── */}
      <motion.div
        variants={fadeIn}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20"
      >
        <div className="scroll-indicator flex flex-col items-center gap-2">
          <span
            className="font-body text-[8px] font-light uppercase tracking-[0.3em]"
            style={{ color: "rgba(212, 184, 106, 0.4)" }}
          >
            Scroll
          </span>
          <svg width="14" height="20" viewBox="0 0 14 20" fill="none">
            <rect
              x="1"
              y="1"
              width="12"
              height="18"
              rx="6"
              stroke="#D4B86A"
              strokeWidth="0.5"
              opacity="0.3"
            />
            <motion.circle
              cx="7"
              cy="7"
              r="1.5"
              fill="#D4B86A"
              opacity={0.4}
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </svg>
        </div>
      </motion.div>
    </motion.section>
  );
}
