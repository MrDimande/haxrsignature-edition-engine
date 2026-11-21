"use client";

import React, { useMemo } from "react";

interface Particle {
  id: number;
  top: string;
  left: string;
  size: number;
  duration: string;
  delay: string;
}

export function BabyAyllaAmbient() {
  const particles: Particle[] = useMemo(() => {
    return Array.from({ length: 18 }, (_, i) => ({
      id: i,
      top: `${(i * 19 + 7) % 94}%`,
      left: `${(i * 23 + 11) % 92}%`,
      size: (i % 3) * 2 + 3,
      duration: `${7 + (i % 5) * 2}s`,
      delay: `${(i * 0.7) % 4}s`,
    }));
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
    >
      {particles.map((p) => (
        <span
          key={p.id}
          className="aylla-particle"
          style={{
            top: p.top,
            left: p.left,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDuration: p.duration,
            animationDelay: p.delay,
          }}
        />
      ))}
    </div>
  );
}
