"use client";

import React, { memo, useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { defaultViewport, fadeUp, staggerContainer } from "@/lib/motion";
import { COLORS } from "@/styles/tokens";

const TARGET_DATE = new Date("2026-08-01T10:00:00+02:00");

interface TimeLeft {
  dias: number;
  horas: number;
  minutos: number;
  segundos: number;
}

function calculateTimeLeft(): TimeLeft {
  const now = new Date();
  const difference = TARGET_DATE.getTime() - now.getTime();

  if (difference <= 0) {
    return { dias: 0, horas: 0, minutos: 0, segundos: 0 };
  }

  return {
    dias: Math.floor(difference / (1000 * 60 * 60 * 24)),
    horas: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutos: Math.floor((difference / (1000 * 60)) % 60),
    segundos: Math.floor((difference / 1000) % 60),
  };
}

interface CountdownUnitProps {
  value: number;
  label: string;
}

const CountdownUnit = memo(function CountdownUnit({ value, label }: CountdownUnitProps) {
  return (
    <div className="flex flex-col items-center">
      {/* 
        Custom Editorial Box:
        Uses transparent background with thin custom border,
        and tiny gold corners (representing handcrafted cultural geometry).
      */}
      <div className="relative flex h-16 w-16 min-w-[4rem] sm:h-20 sm:w-20 md:h-24 md:w-24 items-center justify-center overflow-hidden border border-[#FAF5F0]/5 bg-[#120A07]/40">
        
        {/* Decorative Gold African Tine corners */}
        <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-[#D4AF37]/50" />
        <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-[#D4AF37]/50" />
        <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-[#D4AF37]/50" />
        <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-[#D4AF37]/50" />

        <AnimatePresence mode="popLayout">
          <motion.span
            key={value}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-3xl sm:text-4xl md:text-5xl font-light select-none"
            style={{ color: COLORS.burntGoldLight }}
          >
            {String(value).padStart(2, "0")}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Label */}
      <span 
        className="mt-3 font-body text-[8px] sm:text-[9px] uppercase tracking-[0.3em] font-light"
        style={{ color: COLORS.organicBeigeLight, opacity: 0.4 }}
      >
        {label}
      </span>
    </div>
  );
});

// Custom Diamond (Losango) Separators instead of circles, a common African graphic motif
function CountdownSeparator() {
  return (
    <div className="flex flex-col items-center justify-center pb-5 select-none">
      <div className="flex flex-col gap-2.5">
        <div 
          className="w-1.5 h-1.5 rotate-45 border border-[#D4AF37]/40" 
          style={{ backgroundColor: `${COLORS.burntGoldLight}15` }} 
        />
        <div 
          className="w-1.5 h-1.5 rotate-45 border border-[#D4AF37]/40" 
          style={{ backgroundColor: `${COLORS.burntGoldLight}15` }} 
        />
      </div>
    </div>
  );
}

export default function CountdownSection() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());
  const [mounted, setMounted] = useState(false);

  const tick = useCallback(() => {
    setTimeLeft(calculateTimeLeft());
  }, []);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [tick]);

  if (!mounted) return null;

  return (
    <div className="relative w-full flex flex-col items-center justify-center">
      {/* ─── Top Horizontal Tribal Graphic Frise ─── */}
      <motion.div 
        variants={fadeUp}
        className="flex items-center justify-center gap-2 mb-10 opacity-30 select-none"
      >
        <svg width="180" height="12" viewBox="0 0 180 12" fill="none" className="text-[#D4AF37]">
          {/* Symmetrical repeating zig-zag and diamond frise */}
          <path d="M 0,6 L 15,1 L 30,6 L 45,1 L 60,6 L 75,1 L 90,6 L 105,1 L 120,6 L 135,1 L 150,6 L 165,1 L 180,6" stroke="currentColor" strokeWidth="0.8" />
          <path d="M 0,6 L 15,11 L 30,6 L 45,11 L 60,6 L 75,11 L 90,6 L 105,11 L 120,6 L 135,11 L 150,6 L 165,11 L 180,6" stroke="currentColor" strokeWidth="0.8" />
          <circle cx="90" cy="6" r="2.5" fill="currentColor" />
        </svg>
      </motion.div>

      {/* Citação cultural */}
      <motion.h3
        variants={fadeUp}
        className="font-display text-base md:text-lg font-extralight text-[#FAF5F0]/80 tracking-[0.06em] mb-10 max-w-sm text-center"
      >
        A antevisão da nossa transição e afirmação.
      </motion.h3>

      {/* Ticking Units Container */}
      <motion.div
        variants={fadeUp}
        className="flex flex-wrap items-center justify-center gap-x-1 gap-y-4 sm:gap-4 md:gap-6 max-w-full px-1"
      >
        <CountdownUnit value={timeLeft.dias} label="Dias" />
        <CountdownSeparator />
        <CountdownUnit value={timeLeft.horas} label="Horas" />
        <CountdownSeparator />
        <CountdownUnit value={timeLeft.minutos} label="Minutos" />
        <CountdownSeparator />
        <CountdownUnit value={timeLeft.segundos} label="Segundos" />
      </motion.div>
    </div>
  );
}
