"use client";

import { motion } from "motion/react";
import { expandWidth, defaultViewport } from "@/lib/animations";

interface GoldDividerProps {
  className?: string;
  withDiamond?: boolean;
  withSpringFloral?: boolean;
}

export default function GoldDivider({
  className = "",
  withDiamond = false,
  withSpringFloral = false,
}: GoldDividerProps) {
  return (
    <motion.div
      variants={expandWidth}
      initial="hidden"
      whileInView="visible"
      viewport={defaultViewport}
      className={`flex items-center justify-center gap-3 ${className}`}
    >
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

      {withDiamond && (
        <div className="relative flex items-center justify-center">
          <div className="h-2 w-2 rotate-45 border border-gold/50 bg-transparent" />
        </div>
      )}

      {withSpringFloral && (
        <div className="relative flex items-center justify-center gap-1">
          <svg width="8" height="8" viewBox="0 0 8 8" className="text-orange-soft opacity-60">
            <circle cx="4" cy="4" r="3" fill="currentColor" />
          </svg>
          <div className="h-1.5 w-1.5 rotate-45 border border-gold/50" />
          <svg width="8" height="8" viewBox="0 0 8 8" className="text-gold opacity-50">
            <circle cx="4" cy="4" r="3" fill="currentColor" />
          </svg>
        </div>
      )}

      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
    </motion.div>
  );
}
