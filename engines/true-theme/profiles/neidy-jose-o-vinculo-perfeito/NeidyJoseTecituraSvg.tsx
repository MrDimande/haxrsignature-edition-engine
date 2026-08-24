"use client";

import React from "react";
import { motion } from "motion/react";

export type TecituraPhase =
  | "silence"
  | "filaments"
  | "prompt"
  | "converging"
  | "tecitura"
  | "monogram"
  | "revealed";

interface NeidyJoseTecituraSvgProps {
  phase: TecituraPhase;
  progress: number; // 0 to 1
  prefersReducedMotion?: boolean;
}

export function NeidyJoseTecituraSvg({
  phase,
  progress,
  prefersReducedMotion = false,
}: NeidyJoseTecituraSvgProps) {
  const isPostConvergence =
    phase === "tecitura" || phase === "monogram" || phase === "revealed";
  const isConvergingOrBeyond =
    phase === "converging" || isPostConvergence;

  const duration = prefersReducedMotion ? 0.01 : 1.2;

  // Filament opacities based on phase
  const filamentsVisible = phase !== "silence";
  const promptVisible = phase === "prompt" || phase === "filaments";
  const monogramVisible = phase === "monogram" || phase === "revealed";

  // Interpolated convergence values
  const leftX = 140 + (500 - 140) * Math.min(1, progress * 1.15);
  const rightX = 860 - (860 - 500) * Math.min(1, progress * 1.15);

  return (
    <div className="relative w-full max-w-[860px] h-[320px] md:h-[420px] flex items-center justify-center pointer-events-none select-none my-4">
      <svg
        viewBox="0 0 1000 600"
        className="w-full h-full overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          {/* Subtle champagne-gold gradient */}
          <linearGradient id="nj-champagne" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#CBB994" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#E6D7B8" stopOpacity="1" />
            <stop offset="100%" stopColor="#A8946E" stopOpacity="0.9" />
          </linearGradient>

          {/* Deep mineral green gradient */}
          <linearGradient id="nj-mineral" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#0A211A" stopOpacity="0.3" />
            <stop offset="30%" stopColor="#0A211A" stopOpacity="1" />
            <stop offset="70%" stopColor="#0A211A" stopOpacity="1" />
            <stop offset="100%" stopColor="#0A211A" stopOpacity="0.3" />
          </linearGradient>

          {/* Sage weave gradient */}
          <linearGradient id="nj-sage" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#2D5A4C" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#3B6456" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#2D5A4C" stopOpacity="0.3" />
          </linearGradient>

          {/* Center glow filter */}
          <filter id="nj-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* ======================================================== */}
        {/* 1. INITIAL OPPOSITE THREADS (NEIDY & JOSÉ)               */}
        {/* ======================================================== */}
        {/* Left Thread (Neidy) */}
        <motion.path
          d={`M 60 300 L ${leftX} 300`}
          stroke="url(#nj-mineral)"
          strokeWidth="1.8"
          strokeLinecap="round"
          initial={{ opacity: 0.9 }}
          animate={{
            opacity: isPostConvergence ? 0.35 : 0.95,
          }}
          transition={{ duration: prefersReducedMotion ? 0.01 : 1.2 }}
        />
        <motion.circle
          cx="60"
          cy="300"
          r="3.5"
          fill="#0A211A"
          initial={{ scale: 1 }}
          animate={{ opacity: isPostConvergence ? 0.3 : 0.9 }}
        />

        {/* Right Thread (José) */}
        <motion.path
          d={`M 940 300 L ${rightX} 300`}
          stroke="url(#nj-mineral)"
          strokeWidth="1.8"
          strokeLinecap="round"
          initial={{ opacity: 0.9 }}
          animate={{
            opacity: isPostConvergence ? 0.35 : 0.95,
          }}
          transition={{ duration: prefersReducedMotion ? 0.01 : 1.2 }}
        />
        <motion.circle
          cx="940"
          cy="300"
          r="3.5"
          fill="#0A211A"
          initial={{ scale: 1 }}
          animate={{ opacity: isPostConvergence ? 0.3 : 0.9 }}
        />

        {/* ======================================================== */}
        {/* 2. THE THREE FORCES FILAMENTS (FÉ · VITÓRIA · AMOR)      */}
        {/* ======================================================== */}
        {filamentsVisible && (
          <g className="nj-filaments-layer">
            {/* --- FÉ: Foundation Spine --- */}
            <motion.path
              d={
                isConvergingOrBeyond
                  ? "M 140 300 Q 500 300 860 300"
                  : "M 140 300 Q 500 285 860 300"
              }
              stroke="url(#nj-mineral)"
              strokeWidth="1.6"
              strokeDasharray={isConvergingOrBeyond ? "none" : "8 5"}
              initial={{ opacity: 0 }}
              animate={{
                opacity: isPostConvergence ? 0.4 : 0.85,
              }}
              transition={{ duration: 1 }}
            />
            {/* Fé node */}
            <circle
              cx="300"
              cy="300"
              r="3"
              fill="#0A211A"
              opacity={promptVisible ? 0.8 : 0.2}
            />

            {/* --- VITÓRIA: Ascending Dynamic Vector --- */}
            <motion.path
              d={
                isConvergingOrBeyond
                  ? "M 180 370 C 380 300 620 300 820 230"
                  : "M 180 400 C 400 320 600 280 820 200"
              }
              stroke="url(#nj-sage)"
              strokeWidth="1.8"
              initial={{ opacity: 0 }}
              animate={{
                opacity: isPostConvergence ? 0.4 : 0.9,
              }}
              transition={{ duration: 1.2, delay: 0.15 }}
            />
            {/* Vitória node */}
            <circle
              cx="700"
              cy={isConvergingOrBeyond ? 250 : 220}
              r="3"
              fill="#2D5A4C"
              opacity={promptVisible ? 0.85 : 0.25}
            />

            {/* --- AMOR: Enveloping Harmonic Curve --- */}
            <motion.path
              d={
                isConvergingOrBeyond
                  ? "M 160 230 C 360 280 640 320 840 370"
                  : "M 160 200 C 360 260 640 340 840 400"
              }
              stroke="url(#nj-champagne)"
              strokeWidth="2"
              initial={{ opacity: 0 }}
              animate={{
                opacity: isPostConvergence ? 0.5 : 0.95,
              }}
              transition={{ duration: 1.4, delay: 0.3 }}
            />
            {/* Amor counter-curve */}
            <motion.path
              d={
                isConvergingOrBeyond
                  ? "M 280 220 C 420 260 580 340 720 380"
                  : "M 260 180 C 420 250 580 350 740 420"
              }
              stroke="url(#nj-champagne)"
              strokeWidth="1.2"
              strokeDasharray="5 5"
              initial={{ opacity: 0 }}
              animate={{
                opacity: isPostConvergence ? 0.3 : 0.6,
              }}
              transition={{ duration: 1.5, delay: 0.4 }}
            />
          </g>
        )}

        {/* ======================================================== */}
        {/* 3. TECITURA MESH (WARP & WEFT GEOMETRIC INTERSECTION)    */}
        {/* ======================================================== */}
        {isConvergingOrBeyond && (
          <g className="nj-weave-layer">
            {[45, 85, 125, 165].map((radius, index) => (
              <motion.ellipse
                key={radius}
                cx="500"
                cy="300"
                rx={radius * 1.4}
                ry={radius * 0.85}
                stroke={index % 2 === 0 ? "url(#nj-champagne)" : "url(#nj-mineral)"}
                strokeWidth={index === 0 ? "1.6" : "1.0"}
                strokeDasharray={index % 2 === 1 ? "4 4" : "none"}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: 1,
                  opacity: isPostConvergence ? (0.45 - index * 0.08) : 0.8 - index * 0.12,
                }}
                transition={{
                  duration: duration * 1.1,
                  delay: index * 0.08,
                  ease: "easeOut",
                }}
              />
            ))}

            {/* Diagonal cross-threads of high-couture weaving */}
            <motion.path
              d="M 400 200 L 600 400 M 400 400 L 600 200"
              stroke="url(#nj-sage)"
              strokeWidth="1.2"
              initial={{ opacity: 0 }}
              animate={{ opacity: isPostConvergence ? 0.35 : 0.7 }}
              transition={{ duration: 0.7 }}
            />
            <motion.path
              d="M 440 180 L 560 420 M 440 420 L 560 180"
              stroke="url(#nj-champagne)"
              strokeWidth="1.0"
              initial={{ opacity: 0 }}
              animate={{ opacity: isPostConvergence ? 0.3 : 0.6 }}
              transition={{ duration: 0.7, delay: 0.15 }}
            />

            {/* Central focal node with soft champagne glow */}
            <motion.circle
              cx="500"
              cy="300"
              r="5"
              fill="#CBB994"
              filter="url(#nj-glow)"
              initial={{ scale: 0 }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
              }}
            />
          </g>
        )}

        {/* ======================================================== */}
        {/* 4. MONOGRAM N&J (EMERGES DIRECTLY FROM THE WEAVE LINES)  */}
        {/* ======================================================== */}
        {monogramVisible && (
          <g className="nj-monogram-layer" filter="url(#nj-glow)">
            {/* The 'N' letterform continuous with weave */}
            <motion.path
              d="M 445 340 L 445 260"
              stroke="#0A211A"
              strokeWidth="2.4"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: duration * 0.7 }}
            />
            <motion.path
              d="M 445 260 L 485 340"
              stroke="#0A211A"
              strokeWidth="2.0"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: duration * 0.7, delay: 0.15 }}
            />
            <motion.path
              d="M 485 340 L 485 260 Q 485 250 495 250 C 508 250 512 268 500 286"
              stroke="#0A211A"
              strokeWidth="2.2"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: duration * 0.8, delay: 0.3 }}
            />

            {/* The '&' central ligature in Champagne Gold */}
            <motion.path
              d="M 500 286 C 490 300 486 320 498 332 C 508 340 520 330 524 316 L 502 286"
              stroke="url(#nj-champagne)"
              strokeWidth="2.0"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: duration * 0.8, delay: 0.4 }}
            />

            {/* The 'J' letterform continuous with right weave */}
            <motion.path
              d="M 530 260 L 560 260"
              stroke="#0A211A"
              strokeWidth="2.0"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: duration * 0.6, delay: 0.5 }}
            />
            <motion.path
              d="M 550 260 L 550 324 Q 550 342 532 342 C 520 342 515 332 515 322"
              stroke="#0A211A"
              strokeWidth="2.4"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: duration * 0.8, delay: 0.6 }}
            />
          </g>
        )}
      </svg>
    </div>
  );
}
