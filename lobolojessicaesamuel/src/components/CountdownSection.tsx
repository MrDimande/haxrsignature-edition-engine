"use client";

import { defaultViewport, fadeUp, staggerContainer } from "@/lib/animations";
import { AnimatePresence, motion } from "motion/react";
import { memo, useCallback, useEffect, useState } from "react";
import GoldDivider from "./GoldDivider";

const TARGET_DATE = new Date("2026-08-29T13:30:00+02:00");

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

const CountdownUnit = memo(function CountdownUnit({
  value,
  label,
}: CountdownUnitProps) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden md:h-28 md:w-28 lg:h-32 lg:w-32">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={value}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="font-display text-4xl font-light text-charcoal md:text-5xl lg:text-6xl"
          >
            {String(value).padStart(2, "0")}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="mt-2 font-body text-[9px] font-medium uppercase tracking-[0.25em] text-warm-gray md:text-[10px]">
        {label}
      </span>
    </div>
  );
});

function CountdownSeparator() {
  return (
    <div className="flex flex-col items-center justify-center pb-6">
      <div className="flex flex-col gap-2">
        <div className="h-1 w-1 rounded-full bg-gold/40" />
        <div className="h-1 w-1 rounded-full bg-gold/40" />
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

  // Prevent hydration mismatch by rendering placeholder until mounted
  if (!mounted) {
    return (
      <section className="section-padding bg-white" id="countdown">
        <div className="mx-auto max-w-4xl px-6 text-center md:px-8">
          <span className="mb-6 inline-block font-body text-[10px] font-medium uppercase tracking-[0.35em] text-gold md:text-xs">
            Contagem Regressiva
          </span>
          <div className="flex items-center justify-center gap-4 md:gap-6 lg:gap-8">
            {["Dias", "Horas", "Minutos", "Segundos"].map((label) => (
              <div key={label} className="flex flex-col items-center">
                <div className="flex h-20 w-20 items-center justify-center md:h-28 md:w-28 lg:h-32 lg:w-32">
                  <span className="font-display text-4xl font-light text-charcoal/20 md:text-5xl lg:text-6xl">
                    --
                  </span>
                </div>
                <span className="mt-2 font-body text-[9px] font-medium uppercase tracking-[0.25em] text-warm-gray md:text-[10px]">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <motion.section
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={defaultViewport}
      className="section-padding relative overflow-hidden bg-white"
      id="countdown"
    >
      {/* Subtle warm glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(200,162,74,0.03)_0%,transparent_60%)]" />

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center md:px-8">
        <motion.span
          variants={fadeUp}
          className="mb-6 inline-block font-body text-[10px] font-medium uppercase tracking-[0.35em] text-gold md:text-xs"
        >
          Contagem Regressiva
        </motion.span>

        <GoldDivider withDiamond className="mx-auto mb-12 max-w-xs" />

        <motion.div
          variants={fadeUp}
          className="flex items-center justify-center gap-2 sm:gap-4 md:gap-6 lg:gap-8"
        >
          <CountdownUnit value={timeLeft.dias} label="Dias" />
          <CountdownSeparator />
          <CountdownUnit value={timeLeft.horas} label="Horas" />
          <CountdownSeparator />
          <CountdownUnit value={timeLeft.minutos} label="Minutos" />
          <CountdownSeparator />
          <CountdownUnit value={timeLeft.segundos} label="Segundos" />
        </motion.div>

        <motion.div variants={fadeUp} className="mt-12">
          <p className="font-body text-xs font-light tracking-wider text-warm-gray/60">
            29 de Agosto de 2026 — 13h30
          </p>
        </motion.div>
      </div>
    </motion.section>
  );
}
