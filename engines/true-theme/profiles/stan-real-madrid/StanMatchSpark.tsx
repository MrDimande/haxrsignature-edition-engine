"use client";

import React, { useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";

const SPARKS = 12;

/**
 * Burst ouro curto no sucesso RSVP — Matchday spark, sem loop.
 */
export function StanMatchSpark({ className = "" }: { className?: string }) {
  const reduceMotion = useReducedMotion();
  const particles = useMemo(
    () =>
      Array.from({ length: SPARKS }, (_, i) => {
        const angle = (i / SPARKS) * Math.PI * 2 + (i % 2) * 0.2;
        const dist = 42 + (i % 4) * 18;
        return {
          id: i,
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist - 8,
          size: 3 + (i % 3),
          color: i % 3 === 0 ? "#F7F4EF" : "#C9A86A",
          delay: (i % 5) * 0.04,
        };
      }),
    []
  );

  if (reduceMotion) return null;

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 z-20 overflow-hidden ${className}`}
    >
      <div className="absolute left-1/2 top-[28%] -translate-x-1/2">
        {particles.map((p) => (
          <motion.span
            key={p.id}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              left: 0,
              top: 0,
              boxShadow: `0 0 8px ${p.color}`,
            }}
            initial={{ opacity: 0, x: 0, y: 0, scale: 0.4 }}
            animate={{
              opacity: [0, 1, 0],
              x: p.x,
              y: p.y,
              scale: [0.4, 1.15, 0.2],
            }}
            transition={{
              duration: 1.45,
              delay: p.delay,
              ease: [0.22, 1, 0.36, 1],
            }}
          />
        ))}
      </div>
    </div>
  );
}
