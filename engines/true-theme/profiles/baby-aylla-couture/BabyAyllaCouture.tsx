"use client";

import Image from "next/image";
import { useId, type ReactNode } from "react";
import { motion } from "motion/react";
import styles from "./BabyAyllaCelebration.module.css";

const ease = [0.22, 1, 0.36, 1] as const;

/** Paper settles into place once; the invitation remains readable before hydration. */
export function CoutureReveal({ children, className, id, variant = "paper" }: {
  children: ReactNode;
  className?: string;
  id?: string;
  variant?: "paper" | "fabric" | "signature";
}) {
  const entrance = variant === "fabric" ? { rotateX: 7, y: 0 } : variant === "signature" ? { scale: 1, y: 8, opacity: 0.65 } : { rotateX: 3, y: 16 };
  return (
    <motion.div id={id} data-couture-reveal={variant} className={className}
      initial={entrance} whileInView={{ rotateX: 0, y: 0, scale: 1, opacity: 1 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: variant === "signature" ? 1.5 : 1.15, ease }}>
      {children}
    </motion.div>
  );
}

export function CoutureBow({ placement }: { placement: "calendar" | "farewell" }) {
  // The farewell bow and family signature share their parent's single reveal.
  if (placement === "farewell") return (
    <span aria-hidden="true" data-couture-bow="farewell" className={`${styles.coutureBow} ${styles.farewellBow}`}>
      <Image src="/images/baby-aylla/satin-bow-hero.png" alt="" fill sizes="140px" quality={95} className={styles.coutureBowImage} />
    </span>
  );
  return (
    <motion.span aria-hidden="true" data-couture-bow={placement}
      className={`${styles.coutureBow} ${placement === "calendar" ? styles.calendarBow : styles.farewellBow}`}
      initial={{ rotate: -5, scale: 0.94 }} whileInView={{ rotate: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.3 }} transition={{ duration: 1.4, ease }}>
      <Image src="/images/baby-aylla/satin-bow-hero.png" alt="" fill
        sizes={placement === "calendar" ? "180px" : "140px"} quality={95} className={styles.coutureBowImage} />
    </motion.span>
  );
}

export function PearlTransition() {
  const pearlId = useId();
  return (
    <div aria-hidden="true" className={styles.pearlTransition} data-pearl-transition>
      <svg viewBox="0 0 300 88" fill="none" className={styles.pearlStrand}>
        <defs>
          <radialGradient id={pearlId} cx="30%" cy="25%" r="75%">
            <stop stopColor="#fffef8" /><stop offset=".55" stopColor="#f9efdf" /><stop offset="1" stopColor="#bfa783" />
          </radialGradient>
        </defs>
        <motion.path data-pearl-thread d="M35 16 Q150 96 265 16" stroke="#ccb69a" strokeWidth=".7"
          initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }}
          viewport={{ once: true }} transition={{ duration: 1.7, ease }} />
        {Array.from({ length: 27 }, (_, index) => {
          const t = index / 26;
          return <circle key={index} cx={35 + 230 * t} cy={16 + 160 * t * (1 - t)} r={index === 13 ? 4.2 : 2.7} fill={`url(#${pearlId})`} stroke="#c6ae8a" strokeWidth=".35" />;
        })}
        <path d="M150 62 L150 76" stroke="#baa080" strokeWidth=".7" />
        <circle cx="150" cy="78" r="3" fill={`url(#${pearlId})`} stroke="#c6ae8a" strokeWidth=".35" />
      </svg>
    </div>
  );
}

export function CoutureMedallion() {
  return (
    <span aria-hidden="true" data-couture-medallion className={styles.coutureMedallion}>
      <span className={styles.medallionRibbon} />
      <span className={`aylla-font-calligraphy ${styles.medallionSeal}`}>A</span>
    </span>
  );
}
