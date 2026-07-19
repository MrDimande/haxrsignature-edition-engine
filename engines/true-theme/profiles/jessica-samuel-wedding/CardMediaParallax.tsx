"use client";

import { useRef, type ReactNode } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";

type CardMediaParallaxProps = {
  children: ReactNode;
  className?: string;
  /** Deslocamento máximo vertical (percentagem). Default suave. */
  amplitude?: number;
};

/**
 * Parallax editorial no media dos cartões.
 * Desactiva-se com prefers-reduced-motion — não altera layout.
 */
export function CardMediaParallax({
  children,
  className,
  amplitude = 7,
}: CardMediaParallaxProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    reduceMotion ? ["0%", "0%"] : [`-${amplitude}%`, `${amplitude}%`]
  );

  return (
    <span ref={ref} className={className} aria-hidden>
      <motion.span className="js-celeb-guide__card-parallax" style={{ y }}>
        {children}
      </motion.span>
    </span>
  );
}
