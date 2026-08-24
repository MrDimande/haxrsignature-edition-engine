"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Clock } from "lucide-react";
import { NEIDY_JOSE_CONSTANTS } from "@lib/neidy-jose/constants";

interface NeidyJoseCountdownProps {
  prefersReducedMotion?: boolean;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function NeidyJoseCountdown({
  prefersReducedMotion = false,
}: NeidyJoseCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const target = new Date(NEIDY_JOSE_CONSTANTS.eventDateTimeIso).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = target - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const duration = prefersReducedMotion ? 0.01 : 1.0;

  const timeUnits = [
    { label: "Dias", value: isMounted ? timeLeft.days : 0 },
    { label: "Horas", value: isMounted ? timeLeft.hours : 0 },
    { label: "Minutos", value: isMounted ? timeLeft.minutes : 0 },
    { label: "Segundos", value: isMounted ? timeLeft.seconds : 0 },
  ];

  return (
    <section
      id="countdown"
      className="relative w-full py-16 md:py-24 px-6 sm:px-8 bg-[#0A211A] text-[#FCFDFC] flex flex-col items-center justify-center border-y border-[#CBB994]/20 overflow-hidden"
    >
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_600px_at_50%_50%,rgba(203,185,148,0.12)_0%,transparent_100%)]" />

      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center text-center">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration }}
          className="flex items-center gap-3 mb-4"
        >
          <span className="h-[1px] w-8 sm:w-12 bg-[#CBB994]" />
          <span className="font-body text-[11px] sm:text-xs tracking-[0.35em] uppercase text-[#CBB994] font-semibold">
            A Contagem Regressiva
          </span>
          <span className="h-[1px] w-8 sm:w-12 bg-[#CBB994]" />
        </motion.div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration, delay: 0.1 }}
          className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#FCFDFC] tracking-[0.04em] mb-10"
        >
          À Espera do Grande Dia
        </motion.h2>

        {/* Time Units Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 w-full max-w-2xl mb-8">
          {timeUnits.map((unit, index) => (
            <motion.div
              key={unit.label}
              initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration, delay: 0.1 * index }}
              className="flex flex-col items-center justify-center p-5 sm:p-6 rounded-2xl bg-white/5 border border-[#CBB994]/30 shadow-inner backdrop-blur-sm"
            >
              <span className="font-serif text-3xl sm:text-4xl md:text-5xl font-light text-[#CBB994] tracking-wider mb-1">
                {String(unit.value).padStart(2, "0")}
              </span>
              <span className="font-body text-[10px] sm:text-xs tracking-[0.3em] uppercase text-[#FCFDFC]/70 font-medium">
                {unit.label}
              </span>
            </motion.div>
          ))}
        </div>

        <p className="font-body text-xs sm:text-sm tracking-[0.25em] uppercase text-[#CBB994]/80">
          5 de Dezembro de 2026 · Maputo, Moçambique
        </p>
      </div>
    </section>
  );
}
