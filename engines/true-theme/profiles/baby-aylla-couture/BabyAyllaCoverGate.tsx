"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { motion, useMotionValue, useReducedMotion } from "motion/react";
import { BABY_AYLLA_EVENT } from "@lib/aylla/event-details";
import { BabyAyllaCoverBow } from "./BabyAyllaCoverBow";
import styles from "./BabyAyllaCoverGate.module.css";

interface BabyAyllaCoverGateProps {
  isOpen: boolean;
  onOpen: () => void;
  onReveal: () => void;
  onStartOpening: () => void;
  onOpenMenu?: () => void;
}

export function BabyAyllaCoverGate({ isOpen, onOpen, onReveal, onStartOpening }: BabyAyllaCoverGateProps) {
  const [isOpening, setIsOpening] = useState(false);
  const reducedMotion = useReducedMotion();
  const openButton = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const revealSent = useRef(false);
  const coverOpacity = useMotionValue(1);

  useEffect(() => {
    if (!isOpen) return;
    revealSent.current = false;
    openButton.current?.focus({ preventScroll: true });
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [isOpen]);

  if (!isOpen && !isOpening) return null;

  return (
    <motion.section
      role="dialog"
      aria-modal="true"
      data-cover-phase={isOpening ? "opening" : "sealed"}
      aria-labelledby={titleId}
      style={{ opacity: coverOpacity }}
      initial={{ opacity: 1 }}
      animate={{ opacity: isOpening ? (reducedMotion ? 0 : [1, 1, 0]) : 1 }}
      transition={isOpening && !reducedMotion
        ? { duration: 1.65, times: [0, 0.55, 1], ease: [0.22, 1, 0.36, 1] }
        : { duration: reducedMotion ? 0.15 : 0 }}
      onUpdate={latest => {
        // Reveal the hero during the silk dissolve, while the gate still owns focus.
        if (isOpening && Number(latest.opacity) < 0.98 && !revealSent.current) {
          revealSent.current = true;
          onReveal();
        }
      }}
      onAnimationComplete={() => {
        if (isOpening && coverOpacity.get() < 0.001) {
          onOpen();
          setIsOpening(false);
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Tab") {
          event.preventDefault();
          openButton.current?.focus();
        }
      }}
      className={styles.cover}
    >
      <h2 id={titleId} className="sr-only">Convite da Baby Aylla</h2>
      <div aria-hidden="true" className={styles.backdrop}>
        <Image
          src="/images/baby-aylla/silk-drape-bg.webp"
          alt=""
          fill
          priority
          quality={100}
          unoptimized
          sizes="100vw"
          className={styles.silk}
        />
      </div>
      <div className={styles.composition}>
        <div className={styles.bow}>
          <BabyAyllaCoverBow opening={isOpening} reducedMotion={Boolean(reducedMotion)} />
        </div>
        <h1 className={styles.name}>
          <span className={`aylla-font-serif ${styles.baby}`}>Baby</span>
          <span className={`aylla-font-calligraphy ${styles.aylla}`}>{BABY_AYLLA_EVENT.celebrant}</span>
        </h1>
        <p className={`aylla-font-serif ${styles.date}`}>
          <span className={styles.weekday}>{BABY_AYLLA_EVENT.eventDayOfWeek}</span>
          <time dateTime={BABY_AYLLA_EVENT.eventDateIso}>{BABY_AYLLA_EVENT.eventDateFormatted}</time>
        </p>
        <button
          ref={openButton}
          type="button"
          onClick={() => {
            if (isOpening) return;
            // Start within the user gesture, before the opening animation.
            onStartOpening();
            setIsOpening(true);
          }}
          disabled={isOpening}
          aria-label="Abrir convite da Baby Aylla"
          className={styles.open}
        >
          <motion.span
            data-cover-seal-motion
            animate={isOpening && !reducedMotion
              ? { y: -10, x: 6, rotate: -8, scale: 1.06, opacity: [1, 1, 0] }
              : { y: 0, x: 0, rotate: 0, scale: 1, opacity: 1 }}
            transition={{ duration: reducedMotion ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <span data-cover-seal aria-hidden="true" className={`aylla-font-calligraphy ${styles.seal}`}>A</span>
          </motion.span>
          <span className={`aylla-font-serif ${styles.openLabel}`}>Abrir convite</span>
        </button>
      </div>
    </motion.section>
  );
}
