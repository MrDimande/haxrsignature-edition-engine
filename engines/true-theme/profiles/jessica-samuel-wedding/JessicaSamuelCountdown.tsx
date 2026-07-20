"use client";

import {
    getWeddingChapterPhase,
    type WeddingChapterPhase,
} from "@lib/jessica-samuel-wedding/chapter-phase";
import {
    WEDDING_ASSETS,
    WEDDING_COPY,
    WEDDING_EVENT,
} from "@lib/jessica-samuel-wedding/event-details";
import { readWeddingRsvpStorage } from "@lib/jessica-samuel-wedding/rsvp-ritual";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useEffect, useState } from "react";
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

type ChapterPhase = WeddingChapterPhase;

/** Countdown até à cerimónia religiosa (WEDDING_EVENT.timeLabel = 10h30). */
function getCountdown(targetIso: string, timeLabel: string): CountdownParts {
  const match = timeLabel.match(/(\d{1,2})h(\d{2})?/i);
  const hours = match ? Number(match[1]) : 10;
  const minutes = match?.[2] ? Number(match[2]) : 30;
  const padded = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
  const target = new Date(`${targetIso}T${padded}+02:00`).getTime();
  const now = Date.now();
  const diff = target - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, complete: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hoursLeft = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutesLeft = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return {
    days,
    hours: hoursLeft,
    minutes: minutesLeft,
    seconds,
    complete: false,
  };
}

function getChapterPhase(dateIso: string): ChapterPhase {
  return getWeddingChapterPhase(dateIso);
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
    getCountdown(WEDDING_EVENT.dateIso, WEDDING_EVENT.timeLabel)
  );
  const [phase, setPhase] = useState<ChapterPhase>(() =>
    getChapterPhase(WEDDING_EVENT.dateIso)
  );
  const [guestName, setGuestName] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const tick = () => {
      setParts(getCountdown(WEDDING_EVENT.dateIso, WEDDING_EVENT.timeLabel));
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

                <div className="js-chapter-countdown__title-slot">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.h2
                      key={headline}
                      id="chapter-countdown-title"
                      className="js-chapter-countdown__title"
                      initial={
                        reduceMotion
                          ? { opacity: 0 }
                          : { opacity: 0, y: 16, filter: "blur(5px)" }
                      }
                      animate={{
                        opacity: 1,
                        y: 0,
                        filter: "blur(0px)",
                      }}
                      exit={
                        reduceMotion
                          ? { opacity: 0 }
                          : { opacity: 0, y: -12, filter: "blur(4px)" }
                      }
                      transition={{
                        duration: reduceMotion ? 0.2 : 0.7,
                        ease: EASE,
                      }}
                    >
                      {headline}
                    </motion.h2>
                  </AnimatePresence>
                </div>

                <AnimatePresence mode="wait" initial={false}>
                  {showTimer ? (
                    <motion.div
                      key="countdown-meter"
                      className="js-chapter-countdown__meter"
                      role="timer"
                      aria-live="polite"
                      aria-atomic="true"
                      initial={
                        reduceMotion
                          ? { opacity: 0 }
                          : { opacity: 0, y: 18 }
                      }
                      animate={{ opacity: 1, y: 0 }}
                      exit={
                        reduceMotion
                          ? { opacity: 0 }
                          : { opacity: 0, y: -10 }
                      }
                      transition={{
                        duration: reduceMotion ? 0.2 : 0.65,
                        ease: EASE,
                      }}
                    >
                      {units.map((unit, index) => (
                        <div
                          key={unit.label}
                          className="js-chapter-countdown__unit"
                        >
                          {index > 0 ? (
                            <span
                              className="js-chapter-countdown__rule"
                              aria-hidden
                            />
                          ) : null}
                          <p className="js-chapter-countdown__value">
                            {padUnit(unit.value)}
                          </p>
                          <p className="js-chapter-countdown__label">
                            {unit.label}
                          </p>
                        </div>
                      ))}
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                <div className="js-chapter-countdown__closing-slot">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.p
                      key={
                        phase === "after" || parts.complete
                          ? "complete"
                          : closingLine
                      }
                      className="js-chapter-countdown__closing"
                      initial={
                        reduceMotion
                          ? { opacity: 0 }
                          : { opacity: 0, y: 12 }
                      }
                      animate={{ opacity: 1, y: 0 }}
                      exit={
                        reduceMotion
                          ? { opacity: 0 }
                          : { opacity: 0, y: -8 }
                      }
                      transition={{
                        duration: reduceMotion ? 0.18 : 0.55,
                        ease: EASE,
                      }}
                    >
                      {phase === "after" || parts.complete
                        ? WEDDING_COPY.countdownComplete
                        : closingLine}
                    </motion.p>
                  </AnimatePresence>
                </div>
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
