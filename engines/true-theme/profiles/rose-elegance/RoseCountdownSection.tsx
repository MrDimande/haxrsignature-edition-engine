"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useExperience } from "../../context";
import { roseType } from "./rose-typography";
import {
  cinematicRevealVariants,
  cinematicStagger,
  cinematicViewport,
} from "./rose-motion";

type TimeLeft = {
  dias: number;
  horas: number;
  minutos: number;
  segundos: number;
};

function parseEventDateTime(dateIso: string, timeLabel: string): Date {
  const match = timeLabel.match(/(\d{1,2})h(\d{2})?/i);
  const hours = match ? Number(match[1]) : 11;
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
  accent,
  secondary,
  labelClass,
}: {
  value: number;
  label: string;
  accent: string;
  secondary: string;
  labelClass: string;
}) {
  return (
    <div className="flex flex-col items-center min-w-[4.25rem] sm:min-w-[5rem]">
      <div
        className="relative flex h-14 w-14 sm:h-16 sm:w-16 md:h-[4.5rem] md:w-[4.5rem] items-center justify-center overflow-hidden rounded-sm border bg-white/70 backdrop-blur-sm"
        style={{ borderColor: `${secondary}35` }}
      >
        <span
          className="absolute top-0 left-0 w-2 h-2 border-t border-l opacity-60"
          style={{ borderColor: accent }}
          aria-hidden
        />
        <span
          className="absolute bottom-0 right-0 w-2 h-2 border-b border-r opacity-60"
          style={{ borderColor: accent }}
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
            style={{ color: secondary }}
          >
            {String(value).padStart(2, "0")}
          </motion.span>
        </AnimatePresence>
      </div>
      <span
        className={`mt-2.5 ${roseType.sectionLabel} normal-case tracking-[0.18em] opacity-80 ${labelClass}`}
      >
        {label}
      </span>
    </div>
  );
});

function RoseCountdownSeparator({ accent }: { accent: string }) {
  return (
    <div className="hidden sm:flex flex-col items-center justify-center gap-1.5 pb-4 opacity-50">
      <span
        className="w-1 h-1 rotate-45 border"
        style={{ borderColor: accent, backgroundColor: `${accent}18` }}
      />
      <span
        className="w-1 h-1 rotate-45 border"
        style={{ borderColor: accent, backgroundColor: `${accent}18` }}
      />
    </div>
  );
}

export function RoseCountdownSection() {
  const { theme, config } = useExperience();
  const target = parseEventDateTime(config.metadata.date, config.metadata.time);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() =>
    calculateTimeLeft(target)
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

  const isPast = timeLeft.dias + timeLeft.horas + timeLeft.minutos + timeLeft.segundos === 0;

  if (!mounted) return null;

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={cinematicViewport}
      variants={cinematicStagger}
      className="relative w-full py-14 md:py-16 px-6 flex flex-col items-center z-10 border-t"
      style={{ borderColor: `${theme.colors.accent}12` }}
      id="countdown"
    >
      <motion.span
        variants={cinematicRevealVariants}
        className={`${roseType.sectionLabel} mb-3 ${theme.palette.textSecondary}`}
      >
        Falta pouco
      </motion.span>

      <motion.h2
        variants={cinematicRevealVariants}
        className={`${roseType.sectionTitle} mb-3 text-center ${theme.palette.textPrimary}`}
      >
        Contagem para o nosso encontro
      </motion.h2>

      <motion.p
        variants={cinematicRevealVariants}
        className={`${roseType.bodyPoetic} text-sm max-w-md text-center mb-10 ${theme.palette.textSecondary} opacity-85`}
      >
        {isPast
          ? "O grande dia chegou — mal posso esperar por vocês."
          : "Cada segundo aproxima-nos da tarde só de mulheres que preparei com carinho."}
      </motion.p>

      {!isPast && (
        <motion.div
          variants={cinematicRevealVariants}
          className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 md:gap-6"
        >
          <CountdownUnit
            value={timeLeft.dias}
            label="Dias"
            accent={theme.colors.accent}
            secondary={theme.colors.secondary}
            labelClass={theme.palette.textPrimary}
          />
          <RoseCountdownSeparator accent={theme.colors.accent} />
          <CountdownUnit
            value={timeLeft.horas}
            label="Horas"
            accent={theme.colors.accent}
            secondary={theme.colors.secondary}
            labelClass={theme.palette.textPrimary}
          />
          <RoseCountdownSeparator accent={theme.colors.accent} />
          <CountdownUnit
            value={timeLeft.minutos}
            label="Minutos"
            accent={theme.colors.accent}
            secondary={theme.colors.secondary}
            labelClass={theme.palette.textPrimary}
          />
          <RoseCountdownSeparator accent={theme.colors.accent} />
          <CountdownUnit
            value={timeLeft.segundos}
            label="Segundos"
            accent={theme.colors.accent}
            secondary={theme.colors.secondary}
            labelClass={theme.palette.textPrimary}
          />
        </motion.div>
      )}
    </motion.section>
  );
}
