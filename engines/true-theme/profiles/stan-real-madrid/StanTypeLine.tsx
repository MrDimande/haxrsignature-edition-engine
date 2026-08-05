"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

const CHAR_MS = 38;

/**
 * Typewriter curto — Matchday editorial.
 * SSR: texto completo (sem mismatch). Animação só após mount.
 */
export function StanTypeLine({
  text,
  className = "",
  style,
  charMs = CHAR_MS,
  startDelay = 0,
}: {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  charMs?: number;
  startDelay?: number;
}) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLParagraphElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.55 });
  const [mounted, setMounted] = useState(false);
  const [count, setCount] = useState(text.length);
  const [done, setDone] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (reduceMotion) {
      setCount(text.length);
      setDone(true);
      return;
    }
    if (!inView) return;

    let i = 0;
    let intervalId = 0;
    setCount(0);
    setDone(false);
    const startId = window.setTimeout(() => {
      intervalId = window.setInterval(() => {
        i += 1;
        setCount(i);
        if (i >= text.length) {
          window.clearInterval(intervalId);
          setDone(true);
        }
      }, charMs);
    }, startDelay);

    return () => {
      window.clearTimeout(startId);
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [mounted, inView, reduceMotion, text, charMs, startDelay]);

  const visible = text.slice(0, count);
  const showCursor = mounted && !done && !reduceMotion;

  return (
    <p ref={ref} className={className} style={style} aria-label={text}>
      <span aria-hidden>{visible}</span>
      {showCursor ? (
        <motion.span
          aria-hidden
          className="ml-0.5 inline-block h-[0.95em] w-px translate-y-[0.08em] bg-[#C9A86A] align-baseline"
          animate={{ opacity: [1, 0.15, 1] }}
          transition={{ duration: 0.75, repeat: Infinity, ease: "easeInOut" }}
        />
      ) : null}
    </p>
  );
}
