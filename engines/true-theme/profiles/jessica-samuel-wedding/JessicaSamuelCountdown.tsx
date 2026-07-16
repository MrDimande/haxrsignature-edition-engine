"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import {
  WEDDING_ASSETS,
  WEDDING_COPY,
  WEDDING_EVENT,
} from "@lib/jessica-samuel-wedding/event-details";
import { readWeddingRsvpStorage } from "@lib/jessica-samuel-wedding/rsvp-ritual";
import { useExperience } from "../../context";
import { JessicaSamuelEditorialHeading } from "./jessica-samuel-editorial-heading";
import { jsReveal, jsStagger, jsViewport } from "./jessica-samuel-motion";

type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  complete: boolean;
};

type ChapterPhase = "before" | "today" | "after";

/** Lógica funcional preservada — não alterar o alvo nem o cálculo.
 * Horário T18:00+02:00 no tick do countdown é legado do componente.
 * Calendário Google/.ics usa WEDDING_EVENT.timeLabel (provisório: 10h30;
 * divergência 08h00 vs 10h30 ainda por confirmar — não tratar como final). */
function getCountdown(targetIso: string): CountdownParts {
  const target = new Date(`${targetIso}T18:00:00+02:00`).getTime();
  const now = Date.now();
  const diff = target - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, complete: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds, complete: false };
}

function maputoCalendarDay(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Maputo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getChapterPhase(dateIso: string, now: Date = new Date()): ChapterPhase {
  const today = maputoCalendarDay(now);
  if (today < dateIso) return "before";
  if (today === dateIso) return "today";
  return "after";
}

function padUnit(value: number): string {
  return String(Math.max(0, value)).padStart(2, "0");
}

const EASE = [0.22, 1, 0.36, 1] as const;

type JessicaSamuelCountdownSectionProps = {
  /** Fotografia editorial — por omissão usa WEDDING_ASSETS.countdownImage */
  imageSrc?: string;
  imageAlt?: string;
};

export function JessicaSamuelCountdownSection({
  imageSrc = WEDDING_ASSETS.countdownImage,
  imageAlt = WEDDING_COPY.countdownImageAlt,
}: JessicaSamuelCountdownSectionProps = {}) {
  const { config } = useExperience();
  const reduceMotion = useReducedMotion();
  const [parts, setParts] = useState<CountdownParts>(() =>
    getCountdown(WEDDING_EVENT.dateIso)
  );
  const [phase, setPhase] = useState<ChapterPhase>(() =>
    getChapterPhase(WEDDING_EVENT.dateIso)
  );
  const [guestName, setGuestName] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const tick = () => {
      setParts(getCountdown(WEDDING_EVENT.dateIso));
      setPhase(getChapterPhase(WEDDING_EVENT.dateIso));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const stored = readWeddingRsvpStorage(config.slug);
    if (stored?.name?.trim()) {
      setGuestName(stored.name.trim());
    }
  }, [config.slug]);

  const units = [
    { label: "Dias", value: parts.days },
    { label: "Horas", value: parts.hours },
    { label: "Minutos", value: parts.minutes },
    { label: "Segundos", value: parts.seconds },
  ] as const;

  const headline =
    phase === "after" || parts.complete
      ? WEDDING_COPY.countdownTitleAfter
      : phase === "today"
        ? WEDDING_COPY.countdownTitleToday
        : WEDDING_COPY.countdownTitle;

  const closingLine = guestName
    ? `${WEDDING_COPY.countdownLeadWithGuest}, ${guestName}.`
    : WEDDING_COPY.countdownLead;

  const showTimer = phase !== "after" && !parts.complete;

  return (
    <motion.section
      id="contagem"
      className="js-chapter-countdown js-wedding-couple-section relative z-[1] py-10 sm:py-14 md:py-20"
      initial="hidden"
      whileInView="visible"
      viewport={{ ...jsViewport, amount: 0.2 }}
      onViewportEnter={() => setRevealed(true)}
      variants={jsStagger}
      aria-labelledby="chapter-countdown-title"
    >
      <div className="js-wedding-couple-section__shell">
        <motion.div
          variants={jsReveal}
          className="js-wedding-couple-section__title"
        >
          <JessicaSamuelEditorialHeading
            eyebrow="Contagem"
            title="O próximo capítulo"
            compact
          />
        </motion.div>

        <motion.div
          variants={jsReveal}
          className="js-chapter-countdown__jewel js-wedding-couple-wrap"
        >
          <div className="js-chapter-countdown__inner js-wedding-couple-wrap__inner">
            <div className="js-chapter-countdown__stage">
              <div className="js-chapter-countdown__narrative">
                <motion.p
                  className="js-chapter-countdown__eyebrow"
                  variants={{
                    hidden: { opacity: 0, y: 12 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.7, ease: EASE },
                    },
                  }}
                >
                  {WEDDING_COPY.countdownEyebrow}
                </motion.p>

                <motion.p
                  className="js-chapter-countdown__quote"
                  variants={{
                    hidden: { opacity: 0, y: 16 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.8, ease: EASE },
                    },
                  }}
                >
                  {WEDDING_COPY.countdownQuote}
                </motion.p>

                <motion.h2
                  id="chapter-countdown-title"
                  className="js-chapter-countdown__title"
                  variants={{
                    hidden: { opacity: 0, y: 18 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.85, ease: EASE },
                    },
                  }}
                >
                  {headline}
                </motion.h2>

                {showTimer ? (
                  <motion.div
                    className="js-chapter-countdown__meter"
                    role="timer"
                    aria-live="polite"
                    aria-atomic="true"
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.9, ease: EASE },
                      },
                    }}
                  >
                    {units.map((unit, index) => (
                      <div key={unit.label} className="js-chapter-countdown__unit">
                        {index > 0 ? (
                          <span
                            className="js-chapter-countdown__rule"
                            aria-hidden
                          />
                        ) : null}
                        <p className="js-chapter-countdown__value">
                          {padUnit(unit.value)}
                        </p>
                        <p className="js-chapter-countdown__label">{unit.label}</p>
                      </div>
                    ))}
                  </motion.div>
                ) : null}

                <motion.p
                  className="js-chapter-countdown__closing"
                  variants={{
                    hidden: { opacity: 0, y: 14 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.75, ease: EASE },
                    },
                  }}
                >
                  {phase === "after" || parts.complete
                    ? WEDDING_COPY.countdownComplete
                    : closingLine}
                </motion.p>
              </div>

              <motion.figure
                className="js-chapter-countdown__photo-shell"
                initial={false}
                animate={
                  reduceMotion || revealed
                    ? {
                        clipPath: "inset(0% 0% 0% 0% round 22px)",
                        opacity: 1,
                        scale: 1,
                      }
                    : {
                        clipPath: "inset(12% 38% 12% 38% round 22px)",
                        opacity: 0.72,
                        scale: 1.04,
                      }
                }
                transition={{
                  duration: reduceMotion ? 0 : 1.2,
                  ease: EASE,
                }}
              >
                <div className="js-chapter-countdown__photo">
                  <Image
                    src={imageSrc}
                    alt={imageAlt}
                    fill
                    sizes="(max-width: 767px) 78vw, (max-width: 1100px) 42vw, 420px"
                    className="js-chapter-countdown__img"
                    priority={false}
                  />
                  <div className="js-chapter-countdown__photo-veil" aria-hidden />
                </div>
                <figcaption className="sr-only">{imageAlt}</figcaption>
              </motion.figure>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}
