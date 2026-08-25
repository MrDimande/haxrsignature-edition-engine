"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { NEIDY_JOSE_CONSTANTS } from "@lib/neidy-jose/constants";

interface NeidyJoseTheWeddingDayProps {
  prefersReducedMotion?: boolean;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];
/** Distinct from hero plates */
const CARD_PHOTO = "/images/neidy-jose/couple-standing.jpg";

/** December 2026 starts on Tuesday (index 2) */
function buildDecember2026Cells(): (number | null)[] {
  const cells: (number | null)[] = [];
  const startPad = 2;
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= 31; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function NeidyJoseTheWeddingDay({
  prefersReducedMotion = false,
}: NeidyJoseTheWeddingDayProps) {
  const duration = prefersReducedMotion ? 0.01 : 1.0;
  const ease = [0.16, 1, 0.3, 1] as const;
  const cells = buildDecember2026Cells();

  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isMounted, setIsMounted] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const springX = useSpring(mx, { stiffness: 120, damping: 18 });
  const springY = useSpring(my, { stiffness: 120, damping: 18 });
  const rotateX = useTransform(springY, [-0.5, 0.5], [4, -4]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-5, 5]);

  useEffect(() => {
    setIsMounted(true);
    const target = new Date(NEIDY_JOSE_CONSTANTS.eventDateTimeIso).getTime();
    const updateTimer = () => {
      const difference = target - Date.now();
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

  const onMove = (e: React.MouseEvent) => {
    if (prefersReducedMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  const units = [
    { label: "Dias", value: isMounted ? timeLeft.days : 0 },
    { label: "Horas", value: isMounted ? timeLeft.hours : 0 },
    { label: "Min", value: isMounted ? timeLeft.minutes : 0 },
    { label: "Seg", value: isMounted ? timeLeft.seconds : 0 },
  ];

  return (
    <section
      id="the-wedding-day"
      className="nj-section-full nj-section-rise nj-section-rise--slow relative w-full overflow-hidden bg-[#FBFBFA] py-16 sm:py-24"
    >
      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-5 text-center sm:px-8">
        <motion.p
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration, ease }}
          className="mb-3 font-body text-[10px] uppercase tracking-[0.42em] text-[#3B6456]"
        >
          O capítulo que o tempo reserva
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration, delay: 0.05, ease }}
          className="nj-script-font mb-3 text-4xl text-[#CBB994] sm:text-6xl md:text-7xl"
        >
          O Dia do Casamento
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, scaleX: prefersReducedMotion ? 1 : 0.4 }}
          whileInView={{ opacity: 1, scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration, delay: 0.1, ease }}
          className="nj-hero-rule mb-5"
          aria-hidden
        />

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration, delay: 0.15 }}
          className="mb-10 max-w-lg font-serif text-sm italic leading-relaxed text-[#3B6456] sm:mb-12 sm:text-base"
        >
          Onde o tempo se ajoelha perante o amor —
          <br className="hidden sm:block" />
          e duas almas se fazem, finalmente, uma.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration, delay: 0.25, ease }}
          style={{ perspective: 1000 }}
          className="w-full max-w-3xl"
        >
          <motion.div
            ref={cardRef}
            onMouseMove={onMove}
            onMouseLeave={onLeave}
            style={
              prefersReducedMotion
                ? undefined
                : { rotateX, rotateY, transformStyle: "preserve-3d" }
            }
            className="nj-depth-card relative grid overflow-hidden rounded-[1.75rem] border border-[#CBB994]/40 bg-[#0A211A] text-[#FCFDFC] shadow-[0_24px_60px_-28px_rgba(10,33,26,0.55)] sm:rounded-[2rem] md:grid-cols-2"
          >
            {/* Photo panel */}
            <div className="relative aspect-[4/5] w-full md:aspect-auto md:min-h-[440px]">
              <Image
                src={CARD_PHOTO}
                alt={`${NEIDY_JOSE_CONSTANTS.brideName} e ${NEIDY_JOSE_CONSTANTS.groomName}`}
                fill
                unoptimized
                quality={100}
                className="object-cover object-[center_22%]"
                sizes="(max-width: 768px) 90vw, 420px"
              />
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#0A211A]/50 to-transparent md:inset-y-0 md:left-auto md:right-0 md:h-full md:w-1/4 md:bg-gradient-to-l"
                aria-hidden
              />
              <p className="absolute bottom-5 left-5 right-5 font-serif text-sm italic leading-snug text-[#FCFDFC]/90 md:bottom-8 md:left-6 md:right-8">
                “Que este dia escreva o que o coração já conhece.”
              </p>
            </div>

            {/* Emerald panel — calendar + countdown */}
            <div className="relative flex flex-col justify-center px-6 py-9 text-center sm:px-9 sm:py-11">
              <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_15%,rgba(45,90,76,0.5),transparent_55%),radial-gradient(ellipse_at_20%_90%,rgba(203,185,148,0.1),transparent_45%)]"
                aria-hidden
              />

              <div className="relative z-10 flex flex-col">
                <p className="mb-1 font-body text-[9px] uppercase tracking-[0.4em] text-[#CBB994]/70">
                  O almanaque do nosso sim
                </p>
                <p className="mb-5 font-body text-[10px] uppercase tracking-[0.38em] text-[#CBB994]">
                  Dezembro · 2026
                </p>

                <div className="mb-2 grid grid-cols-7 gap-1">
                  {WEEKDAYS.map((d, i) => (
                    <span
                      key={`${d}-${i}`}
                      className="text-center font-body text-[9px] tracking-wider text-[#CBB994]/80"
                    >
                      {d}
                    </span>
                  ))}
                </div>

                <div className="mb-7 grid grid-cols-7 gap-1">
                  {cells.map((day, i) => {
                    const isWedding = day === 5;
                    return (
                      <span
                        key={i}
                        className={`relative flex aspect-square items-center justify-center font-serif text-xs sm:text-sm ${
                          day == null
                            ? ""
                            : isWedding
                              ? "text-[#0A211A]"
                              : "text-[#EBE4D5]/55"
                        }`}
                      >
                        {isWedding ? (
                          <span className="relative flex h-8 w-8 items-center justify-center sm:h-9 sm:w-9">
                            <svg
                              viewBox="0 0 24 24"
                              className="absolute inset-0 h-full w-full text-[#CBB994]"
                              fill="currentColor"
                              aria-hidden
                            >
                              <path d="M12 21s-6.2-4.35-9.2-8.1C.9 10.4 1.2 7.2 3.5 5.6c1.9-1.3 4.4-.9 5.8.8L12 9l2.7-2.6c1.4-1.7 3.9-2.1 5.8-.8 2.3 1.6 2.6 4.8.7 7.3C18.2 16.65 12 21 12 21z" />
                            </svg>
                            <span className="relative z-10 text-[11px] font-semibold text-[#0A211A]">
                              5
                            </span>
                          </span>
                        ) : (
                          day
                        )}
                      </span>
                    );
                  })}
                </div>

                <div className="mb-5 h-px w-full bg-gradient-to-r from-transparent via-[#CBB994]/40 to-transparent" />

                <p className="mb-1 font-serif text-xs italic text-[#EBE4D5]/70">
                  Até que o relógio diga: chegou.
                </p>
                <p className="mb-5 font-body text-[9px] uppercase tracking-[0.32em] text-[#CBB994]/75">
                  Contagem
                </p>

                <div className="grid grid-cols-4 gap-2 sm:gap-3">
                  {units.map((u) => (
                    <div key={u.label} className="text-center">
                      <p className="font-serif text-2xl font-light tracking-wider text-[#FCFDFC] sm:text-3xl">
                        {String(u.value).padStart(2, "0")}
                      </p>
                      <p className="mt-1.5 font-body text-[8px] uppercase tracking-[0.28em] text-[#EBE4D5]/55">
                        {u.label}
                      </p>
                    </div>
                  ))}
                </div>

                <p className="mt-8 font-body text-[9px] uppercase tracking-[0.28em] text-[#EBE4D5]/50">
                  Civil 13:00 · Copo de Água 15:00
                </p>
                <p className="mt-2 font-serif text-[11px] italic text-[#CBB994]/65">
                  Espaço Águia · Marracuene
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
