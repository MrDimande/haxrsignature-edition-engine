"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import styles from "./BabyAyllaScrollCue.module.css";

export function BabyAyllaScrollCue({ isRevealed }: { isRevealed: boolean }) {
  const cueRef = useRef<HTMLDivElement>(null);
  const inView = useInView(cueRef, { once: true, amount: 0.5 });
  const reducedMotion = useReducedMotion();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!isRevealed || !inView || dismissed) return;
    const startingPosition = window.scrollY;
    const handleScroll = () => {
      if (window.scrollY - startingPosition > 64) setDismissed(true);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isRevealed, inView, dismissed]);

  return (
    <div className={styles.continuation}>
      <motion.div
        ref={cueRef}
        data-scroll-cue
        data-dismissed={dismissed}
        data-ready={isRevealed && inView}
        className={styles.cue}
        initial={{ opacity: 0 }}
        animate={{ opacity: isRevealed && !dismissed ? 1 : 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.4 }}
      >
        <p className={`aylla-font-serif ${styles.label}`}>A nossa história continua…</p>
        <div aria-hidden="true" className={styles.thread}>
          {[0, 1, 2, 3, 4].map(pearl => <span key={pearl} className={styles.pearl} />)}
          <motion.span
            data-scroll-ribbon
            className={styles.ribbon}
            animate={isRevealed && inView && !dismissed && !reducedMotion ? { y: [0, 4, 0] } : { y: 0 }}
            transition={{ duration: reducedMotion ? 0 : 1.4, delay: reducedMotion ? 0 : 0.6 }}
          />
        </div>
      </motion.div>
    </div>
  );
}
