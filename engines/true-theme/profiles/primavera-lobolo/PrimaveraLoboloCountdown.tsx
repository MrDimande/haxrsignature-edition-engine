"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { TRADITIONAL_COPY } from "@lib/jessica-samuel-traditional/event-details";
import { useExperience } from "../../context";
import { primaveraType } from "./primavera-typography";
import {
  primaveraReveal,
  primaveraStagger,
  primaveraViewport,
} from "./primavera-motion";
import { PrimaveraEditorialHeading } from "./primavera-editorial-heading";
import { PRIMAVERA_LAYOUT, PRIMAVERA_SURFACES } from "./primavera-surfaces";

type TimeLeft = {
  dias: number;
  horas: number;
  minutos: number;
  segundos: number;
};

function parseEventDateTime(dateIso: string, timeLabel: string): Date {
  const match = timeLabel.match(/(\d{1,2})h(\d{2})?/i);
  const hours = match ? Number(match[1]) : 14;
  const minutes = match && match[2] ? Number(match[2]) : 0;
  const padded = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
  return new Date(`${dateIso}T${padded}+02:00`);
}

function calculateTimeLeft(target: Date): TimeLeft {
  const difference = target.getTime() - Date.now();
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

const CountdownUnit = memo(function CountdownUnit({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center min-w-[4.25rem] sm:min-w-[5rem]">
      <div
        className="relative flex h-14 w-14 sm:h-16 sm:w-16 md:h-[4.5rem] md:w-[4.5rem] items-center justify-center overflow-hidden rounded-sm border"
        style={{
          borderColor: `${PRIMAVERA_SURFACES.gold}40`,
          backgroundColor: `${PRIMAVERA_SURFACES.ivoryLight}ee`,
        }}
      >
        <span
          className="absolute top-0 left-0 w-2 h-2 border-t border-l opacity-60"
          style={{ borderColor: PRIMAVERA_SURFACES.gold }}
          aria-hidden
        />
        <span
          className="absolute bottom-0 right-0 w-2 h-2 border-b border-r opacity-60"
          style={{ borderColor: PRIMAVERA_SURFACES.gold }}
          aria-hidden
        />
        <AnimatePresence mode="popLayout">
          <motion.span
            key={value}
            initial={{ y: -14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 14, opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-2xl sm:text-3xl md:text-4xl font-light tabular-nums select-none"
            style={{ color: PRIMAVERA_SURFACES.terracottaDeep }}
          >
            {String(value).padStart(2, "0")}
          </motion.span>
        </AnimatePresence>
      </div>
      <span
        className={`mt-2.5 text-[9px] tracking-[0.22em] uppercase opacity-70`}
        style={{ color: PRIMAVERA_SURFACES.inkSoft }}
      >
        {label}
      </span>
    </div>
  );
});

function CountdownSeparator() {
  return (
    <div className="hidden sm:flex flex-col items-center justify-center gap-1.5 pb-4 opacity-50">
      <span
        className="w-1 h-1 rotate-45 border"
        style={{
          borderColor: PRIMAVERA_SURFACES.gold,
          backgroundColor: `${PRIMAVERA_SURFACES.gold}18`,
        }}
      />
      <span
        className="w-1 h-1 rotate-45 border"
        style={{
          borderColor: PRIMAVERA_SURFACES.gold,
          backgroundColor: `${PRIMAVERA_SURFACES.gold}18`,
        }}
      />
    </div>
  );
}

export function PrimaveraCountdownSection() {
  const { theme, config } = useExperience();
  const target = parseEventDateTime(config.metadata.date, config.metadata.time);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() =>
    calculateTimeLeft(target),
  );
  const [mounted, setMounted] = useState(false);

  const tick = useCallback(() => {
    setTimeLeft(calculateTimeLeft(target));
  }, [target]);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [tick]);

  const isPast =
    timeLeft.dias + timeLeft.horas + timeLeft.minutos + timeLeft.segundos === 0;

  if (!mounted) return null;

  return (
    <motion.section
      id="contagem"
      initial="hidden"
      whileInView="visible"
      viewport={primaveraViewport}
      variants={primaveraStagger}
      className={`${PRIMAVERA_LAYOUT.section} py-16 md:py-24 ${theme.palette.textPrimary}`}
      style={{ backgroundColor: PRIMAVERA_SURFACES.ivoryLight }}
    >
      <div className={`${PRIMAVERA_LAYOUT.containerNarrow} text-center`}>
        <motion.div variants={primaveraReveal}>
          <PrimaveraEditorialHeading
            eyebrow={TRADITIONAL_COPY.countdownEyebrow}
            title={TRADITIONAL_COPY.countdownTitle}
          />
        </motion.div>

        <motion.p
          variants={primaveraReveal}
          className={`${primaveraType.bodyPoetic} max-w-lg mx-auto mt-8 mb-10 opacity-85`}
        >
          {isPast ? TRADITIONAL_COPY.countdownComplete : TRADITIONAL_COPY.countdownLead}
        </motion.p>

        {!isPast ? (
          <motion.div
            variants={primaveraReveal}
            className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 md:gap-6"
          >
            <CountdownUnit value={timeLeft.dias} label="Dias" />
            <CountdownSeparator />
            <CountdownUnit value={timeLeft.horas} label="Horas" />
            <CountdownSeparator />
            <CountdownUnit value={timeLeft.minutos} label="Minutos" />
            <CountdownSeparator />
            <CountdownUnit value={timeLeft.segundos} label="Segundos" />
          </motion.div>
        ) : null}
      </div>
    </motion.section>
  );
}
