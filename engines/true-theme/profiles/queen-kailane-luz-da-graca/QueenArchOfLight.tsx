"use client";

import { motion, useReducedMotion } from "motion/react";
import { QUEEN_COLORS, QUEEN_EASE } from "./queen-motion";

type QueenArchOfLightProps = {
  className?: string;
  /** Visual weight of the light beam */
  intensity?: "soft" | "medium" | "strong";
  animate?: boolean;
  /** Decorative only — hide from AT */
  decorative?: boolean;
};

/**
 * Motif proprietário — O ARCO DE LUZ.
 * Janela / portal sagrado minimalista; luz champagne emergente.
 */
export function QueenArchOfLight({
  className = "",
  intensity = "medium",
  animate = true,
  decorative = true,
}: QueenArchOfLightProps) {
  const reduceMotion = useReducedMotion();
  const beamOpacity =
    intensity === "soft" ? 0.28 : intensity === "strong" ? 0.55 : 0.4;

  return (
    <div
      className={`pointer-events-none relative ${className}`}
      aria-hidden={decorative ? true : undefined}
    >
      <svg
        viewBox="0 0 240 360"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full"
      >
        <defs>
          <linearGradient id="queen-arch-stroke" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={QUEEN_COLORS.goldLight} stopOpacity="0.95" />
            <stop offset="55%" stopColor={QUEEN_COLORS.goldMatte} stopOpacity="0.75" />
            <stop offset="100%" stopColor={QUEEN_COLORS.champagne} stopOpacity="0.35" />
          </linearGradient>
          <linearGradient id="queen-arch-beam" x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stopColor={QUEEN_COLORS.pearl} stopOpacity="0.9" />
            <stop offset="35%" stopColor={QUEEN_COLORS.champagne} stopOpacity={beamOpacity} />
            <stop offset="100%" stopColor={QUEEN_COLORS.goldLight} stopOpacity="0" />
          </linearGradient>
          <radialGradient id="queen-arch-glow" cx="50%" cy="18%" r="55%">
            <stop offset="0%" stopColor={QUEEN_COLORS.goldLight} stopOpacity="0.45" />
            <stop offset="100%" stopColor={QUEEN_COLORS.pearl} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Glow apex */}
        <ellipse cx="120" cy="70" rx="70" ry="48" fill="url(#queen-arch-glow)" />

        {/* Inner light volume */}
        <path
          d="M48 340 V128 C48 68 78 36 120 36 C162 36 192 68 192 128 V340"
          fill="url(#queen-arch-beam)"
          opacity={0.85}
        />

        {/* Arch stroke */}
        <motion.path
          d="M52 340 V130 C52 72 80 40 120 40 C160 40 188 72 188 130 V340"
          stroke="url(#queen-arch-stroke)"
          strokeWidth="1.15"
          strokeLinecap="round"
          fill="none"
          initial={
            animate && !reduceMotion
              ? { pathLength: 0, opacity: 0 }
              : { pathLength: 1, opacity: 1 }
          }
          whileInView={
            animate && !reduceMotion
              ? { pathLength: 1, opacity: 1 }
              : undefined
          }
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 1.8, ease: QUEEN_EASE }}
        />

        {/* Thin light ray */}
        <motion.line
          x1="120"
          y1="42"
          x2="120"
          y2="300"
          stroke={QUEEN_COLORS.goldLight}
          strokeWidth="0.6"
          strokeOpacity="0.35"
          initial={
            animate && !reduceMotion ? { opacity: 0 } : { opacity: 0.35 }
          }
          whileInView={
            animate && !reduceMotion ? { opacity: 0.35 } : undefined
          }
          viewport={{ once: true }}
          transition={{ duration: 2.2, delay: 0.4, ease: QUEEN_EASE }}
        />
      </svg>
    </div>
  );
}
