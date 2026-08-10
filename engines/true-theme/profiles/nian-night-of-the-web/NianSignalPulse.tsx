"use client";

import { motion, useReducedMotion } from "motion/react";
import { NIAN_EASE } from "./nian-motion";

/**
 * One-shot signal pulse under section titles — transmission continuity.
 * Does not invent copy. Reduced motion: no animation.
 */
export function NianSignalPulse({ active }: { active: boolean }) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) {
    return (
      <span
        aria-hidden
        className="mt-3 block h-px w-12 bg-gradient-to-r from-[#4169E1]/70 to-transparent"
      />
    );
  }

  return (
    <motion.span
      aria-hidden
      className="mt-3 block h-px w-[min(9rem,42%)] origin-left bg-gradient-to-r from-[#4169E1] via-[#4169E1]/70 to-transparent"
      initial={{ scaleX: 0, opacity: 0 }}
      animate={
        active
          ? { scaleX: [0, 1, 1], opacity: [0, 1, 0.4] }
          : { scaleX: 0, opacity: 0 }
      }
      transition={{ duration: 0.95, ease: NIAN_EASE }}
      style={{
        boxShadow: active ? "0 0 18px rgba(65,105,225,0.35)" : undefined,
      }}
    />
  );
}
