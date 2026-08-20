"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import {
  NIAN_EVENT,
  NIAN_VENUE,
  shouldShowNianEventTime,
  getNianEventTimeLabel,
} from "@lib/nian/event-details";
import { NIAN_COLORS, NIAN_EASE } from "./nian-motion";
import { NianSignalPulse } from "./NianSignalPulse";

function BriefLine({
  label,
  value,
  delay,
  inView,
  reduceMotion,
}: {
  label: string;
  value: string;
  delay: number;
  inView: boolean;
  reduceMotion: boolean | null;
}) {
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.55, delay, ease: NIAN_EASE }}
      className="border-t border-[#4169E1]/22 py-5 first:border-t-0 first:pt-0"
    >
      <p className="text-[9px] font-semibold uppercase tracking-[0.4em] text-[#4169E1]">
        {label}
      </p>
      <p className="mt-2 text-[clamp(1rem,2.8vw,1.35rem)] font-medium uppercase tracking-[0.14em] text-[#F4F6FB]">
        {value}
      </p>
    </motion.div>
  );
}

/**
 * Mission Brief — fixture editorial da celebração.
 * Isolado a nian-night-of-the-web.
 */
export function NianMissionBriefSection() {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.3 });
  const showTime = shouldShowNianEventTime();
  const timeLabel = getNianEventTimeLabel();

  return (
    <section
      ref={sectionRef}
      id="brief"
      aria-labelledby="nian-brief-title"
      className="relative w-full overflow-hidden"
      style={{ backgroundColor: NIAN_COLORS.bg }}
    >
      {/* Atmosphere — not a dashboard */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 55% 45% at 50% 0%, rgba(65,105,225,0.16) 0%, transparent 60%),
            radial-gradient(ellipse 42% 38% at 92% 88%, rgba(225,6,0,0.11) 0%, transparent 58%),
            linear-gradient(180deg, #03050b 0%, #070912 50%, #03050b 100%)
          `,
        }}
      />

      {/* Oversized date numeral — atmospheric only */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-[8%] top-[8%] z-0 select-none md:-right-[4%] md:top-[4%]"
        style={{
          fontFamily: "var(--font-jost), var(--font-montserrat), sans-serif",
          fontSize: "clamp(14rem, 42vw, 28rem)",
          fontWeight: 700,
          lineHeight: 0.85,
          letterSpacing: "-0.06em",
          color: "transparent",
          WebkitTextStroke: "1.5px rgba(65,105,225,0.9)",
          opacity: 0.026,
        }}
      >
        12
      </div>

      <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-3xl flex-col justify-start px-5 pb-20 pt-16 sm:justify-center sm:py-20 md:px-10 md:py-28">
        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.5, ease: NIAN_EASE }}
          className="text-[10px] font-semibold uppercase tracking-[0.42em] text-[#4169E1]"
        >
          Briefing
        </motion.p>

        <motion.h2
          id="nian-brief-title"
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.7, delay: 0.08, ease: NIAN_EASE }}
          className="mt-4 text-[clamp(2rem,6vw,3.4rem)] font-semibold uppercase leading-[1.02] tracking-[0.04em] text-[#F4F6FB]"
          style={{
            fontFamily: "var(--font-jost), var(--font-montserrat), sans-serif",
          }}
        >
          A missão em que
          <br />
          tudo acontece.
        </motion.h2>
        <NianSignalPulse active={inView} />

        <div className="mt-10 md:mt-14">
          <BriefLine
            label="Quando"
            value={NIAN_EVENT.dateDisplayShort}
            delay={0.16}
            inView={inView}
            reduceMotion={reduceMotion}
          />
          {showTime && timeLabel ? (
            <BriefLine
              label="Hora"
              value={timeLabel.toUpperCase()}
              delay={0.2}
              inView={inView}
              reduceMotion={reduceMotion}
            />
          ) : null}
          <BriefLine
            label="Onde"
            value={NIAN_VENUE.name.toUpperCase()}
            delay={0.24}
            inView={inView}
            reduceMotion={reduceMotion}
          />
          <BriefLine
            label="Cidade"
            value="MARRACUENE · MAPUTO"
            delay={0.3}
            inView={inView}
            reduceMotion={reduceMotion}
          />
          <BriefLine
            label="Missão"
            value="CELEBRAR NIAN"
            delay={0.36}
            inView={inView}
            reduceMotion={reduceMotion}
          />
        </div>

        <motion.div
          aria-hidden
          initial={reduceMotion ? false : { scaleX: 0 }}
          animate={inView ? { scaleX: 1 } : undefined}
          transition={{ duration: 0.8, delay: 0.42, ease: NIAN_EASE }}
          className="mt-10 h-px origin-left bg-gradient-to-r from-[#4169E1] via-[#E10600]/50 to-transparent"
        />
      </div>
    </section>
  );
}
