"use client";

import Image from "next/image";
import { useId } from "react";
import { motion, useReducedMotion } from "motion/react";
import { BABY_AYLLA_EVENT } from "@lib/aylla/event-details";
import { BabyAyllaScrollCue } from "./BabyAyllaScrollCue";
import styles from "./BabyAyllaHero.module.css";

interface BabyAyllaHeroProps {
  isRevealed: boolean;
}

export function BabyAyllaHero({ isRevealed }: BabyAyllaHeroProps) {
  const reducedMotion = useReducedMotion();
  const ribbonId = useId();
  const { celebrant, editorial, eventDateIso, eventDateFormatted, venue } = BABY_AYLLA_EVENT;
  const city = venue.address.split(",").slice(-2).join(",").trim();
  const reveal = {
    hidden: { opacity: 0, y: reducedMotion ? 0 : 16 },
    visible: { opacity: 1, y: 0 },
  };
  const transition = (delay: number) => ({
    duration: reducedMotion ? 0.15 : 0.65,
    delay: reducedMotion ? 0 : delay,
    ease: [0.22, 1, 0.36, 1] as const,
  });

  return (
    <motion.section
      id="inicio"
      aria-labelledby="aylla-hero-title"
      data-revealed={isRevealed}
      initial="hidden"
      animate={isRevealed ? "visible" : "hidden"}
      className={styles.hero}
    >
      <div aria-hidden="true" className={styles.scenery}>
        <Image data-hero-silk src="/images/baby-aylla/silk-drape-bg.webp" alt="" fill quality={90} sizes="100vw" className={styles.silk} />
      </div>
      <div className={styles.layout}>
        <motion.header data-hero-reveal variants={reveal} transition={transition(0.12)} className={styles.heading}>
          <h1 id="aylla-hero-title" className={styles.title}>
            <span className={`aylla-font-serif ${styles.baby}`}>Baby</span>
            <span className={`aylla-font-calligraphy ${styles.name}`}>{celebrant}</span>
          </h1>
          <p className={`aylla-font-serif ${styles.collection}`}>{BABY_AYLLA_EVENT.collection}</p>
        </motion.header>

        <motion.figure data-hero-reveal variants={reveal} transition={transition(0)} className={styles.portrait}>
          <svg aria-hidden="true" className={styles.ribbonSupport} viewBox="0 0 240 140" fill="none">
            <defs>
              <linearGradient id={ribbonId} x1="72" y1="28" x2="126" y2="93" gradientUnits="userSpaceOnUse">
                <stop stopColor="#A87269" />
                <stop offset="0.28" stopColor="#E8C2B4" />
                <stop offset="0.52" stopColor="#F6DBCA" />
                <stop offset="0.72" stopColor="#CB9789" />
                <stop offset="1" stopColor="#9C665E" />
              </linearGradient>
            </defs>
            <path d="M27 101C52 53 96 22 152 18C171 17 186 20 200 26L197 43C150 27 84 50 49 108C42 112 32 110 27 101Z" fill={`url(#${ribbonId})`} />
            <path d="M30 100C59 50 105 21 153 21C169 20 184 23 197 27" stroke="#FFE7D3" strokeOpacity="0.7" strokeWidth="1" />
            <path d="M28 101L43 99L49 108C40 112 31 110 28 101Z" fill="#AD756B" />
          </svg>
          <div className={styles.frame}>
            <Image
              src="/images/baby-aylla/baby-aylla-portrait.jpg"
              alt="Aylla sentada num cenário de lua, estrelas e nuvens cor-de-rosa"
              fill
              priority
              quality={95}
              sizes="(min-width: 1024px) 440px, (min-width: 640px) 400px, calc(100vw - 56px)"
              className={styles.photo}
            />
          </div>
          <motion.div
            aria-hidden="true"
            variants={{ hidden: { opacity: 0, rotate: reducedMotion ? 0 : -6, scale: reducedMotion ? 1 : 0.94 }, visible: { opacity: 1, rotate: 0, scale: 1 } }}
            transition={transition(0.18)}
            className={styles.bow}
          >
            <div className={styles.bowLoops}>
              <Image data-hero-bow src="/images/baby-aylla/satin-bow-hero.png" alt="" fill priority quality={95} sizes="(min-width: 1024px) 300px, 230px" className={styles.bowImage} />
            </div>
            <div className={styles.bowTails}>
              <Image src="/images/baby-aylla/satin-bow-hero.png" alt="" fill quality={95} sizes="(min-width: 1024px) 300px, 230px" className={styles.bowImage} />
            </div>
          </motion.div>
        </motion.figure>

        <motion.div data-hero-reveal variants={reveal} transition={transition(0.24)} className={styles.invitation}>
          <p className={`aylla-font-serif ${styles.message}`}>{editorial.storyLead}</p>

          <div className={`aylla-font-serif ${styles.details}`}>
            <time dateTime={eventDateIso} aria-label={eventDateFormatted} className={styles.date}>
              <span className={styles.day}>{editorial.saveTheDateDay}</span>
              <span className={styles.monthYear}>
                <span className={styles.month}>{editorial.saveTheDateMonth.toLocaleLowerCase("pt")}</span>
                <span className={styles.year}>{editorial.saveTheDateYear}</span>
              </span>
            </time>
            <p>{venue.name}<span className={styles.city}>{city}</span></p>
          </div>

        </motion.div>
      </div>
      <BabyAyllaScrollCue isRevealed={isRevealed} />
    </motion.section>
  );
}
