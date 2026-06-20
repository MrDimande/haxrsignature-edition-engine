"use client";

import { motion } from "framer-motion";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { padTime, useCountdown } from "@/hooks/useCountdown";
import { EVENT_DATE } from "@/lib/event-data";

type TimeUnitProps = {
  value: string;
  label: string;
  index: number;
};

function TimeUnit({ value, label, index }: TimeUnitProps) {
  return (
    <RevealOnScroll delay={index * 0.1} className="flex flex-col items-center">
      <motion.div
        key={value}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative"
      >
        <span className="font-playfair text-5xl font-bold tabular-nums text-gold sm:text-6xl md:text-7xl lg:text-8xl">
          {value}
        </span>
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 font-playfair text-5xl font-bold tabular-nums text-gold blur-xl opacity-30 sm:text-6xl md:text-7xl lg:text-8xl"
        >
          {value}
        </span>
      </motion.div>
      <span className="mt-3 font-montserrat text-[10px] uppercase tracking-[0.3em] text-light-gray sm:text-xs">
        {label}
      </span>
    </RevealOnScroll>
  );
}

export function CountdownSection() {
  const { days, hours, minutes, seconds, isComplete } = useCountdown(EVENT_DATE);

  const units = [
    { value: padTime(days), label: "Dias" },
    { value: padTime(hours), label: "Horas" },
    { value: padTime(minutes), label: "Minutos" },
    { value: padTime(seconds), label: "Segundos" },
  ];

  return (
    <section className="relative py-20 sm:py-28">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />

      <div className="mx-auto max-w-4xl px-6 text-center">
        <RevealOnScroll>
          <p className="mb-3 font-montserrat text-xs uppercase tracking-[0.35em] text-gold/80">
            Marquem na Agenda
          </p>
        </RevealOnScroll>

        <RevealOnScroll delay={0.1}>
          <h2 className="mb-16 font-playfair text-3xl font-bold text-off-white sm:text-4xl md:text-5xl">
            O Momento Aproxima-se
          </h2>
        </RevealOnScroll>

        {isComplete ? (
          <RevealOnScroll delay={0.2}>
            <p className="font-playfair text-2xl italic text-gold">
              O grande dia chegou!
            </p>
          </RevealOnScroll>
        ) : (
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 sm:gap-6">
            {units.map((unit, index) => (
              <TimeUnit
                key={unit.label}
                value={unit.value}
                label={unit.label}
                index={index}
              />
            ))}
          </div>
        )}

        <RevealOnScroll delay={0.5}>
          <div className="mx-auto mt-16 h-px w-24 bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        </RevealOnScroll>
      </div>
    </section>
  );
}
