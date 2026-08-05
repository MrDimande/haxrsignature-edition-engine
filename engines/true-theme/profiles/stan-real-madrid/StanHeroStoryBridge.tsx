"use client";

import React, { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Ponte visual Hero (navy) → História (bege editorial).
 * Isolado a stan-real-madrid.
 */
export function StanHeroStoryBridge() {
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const animateIn = mounted && !reduceMotion;

  return (
    <div
      aria-hidden
      className="relative z-[5] -mt-px w-full overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #F7F4EF 0%, #F7F4EF 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-24 sm:h-28"
        style={{
          background: `
            linear-gradient(
              180deg,
              rgba(5,10,18,0.22) 0%,
              rgba(201,168,106,0.08) 35%,
              transparent 100%
            )
          `,
        }}
      />

      <motion.div
        initial={animateIn ? { opacity: 0, scaleX: 0.4 } : false}
        whileInView={animateIn ? { opacity: 1, scaleX: 1 } : undefined}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 1.1, ease: EASE }}
        className="relative mx-auto flex h-16 w-full max-w-xs flex-col items-center justify-center sm:h-20 sm:max-w-sm"
      >
        <div className="flex w-full items-center gap-4">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#C9A86A]/55" />
          <span className="font-body text-[9px] font-semibold uppercase tracking-[0.42em] text-[#C9A86A] sm:text-[10px]">
            Os cinco actos
          </span>
          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#C9A86A]/55" />
        </div>
      </motion.div>
    </div>
  );
}
