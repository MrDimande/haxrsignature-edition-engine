"use client";

import { QUEEN_COLORS } from "./queen-motion";

type QueenMonogramProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
};

/**
 * Monograma contemporâneo QKC — círculo incompleto + tipografia editorial.
 * Sem brasão; sem ostentação aristocrática.
 */
export function QueenMonogram({ className = "", size = "md" }: QueenMonogramProps) {
  const dim =
    size === "sm" ? "h-16 w-16" : size === "lg" ? "h-28 w-28" : "h-20 w-20";
  const text =
    size === "sm" ? "text-[0.7rem]" : size === "lg" ? "text-base" : "text-xs";

  return (
    <div
      className={`relative inline-flex items-center justify-center ${dim} ${className}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="none"
          stroke={QUEEN_COLORS.champagne}
          strokeWidth="0.75"
          strokeDasharray="220 70"
          strokeDashoffset="18"
          opacity="0.85"
        />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke={QUEEN_COLORS.goldMatte}
          strokeWidth="0.55"
          strokeDasharray="180 90"
          strokeDashoffset="40"
          opacity="0.65"
        />
      </svg>
      <span
        className={`relative z-[1] tracking-[0.35em] font-medium ${text}`}
        style={{
          fontFamily:
            'var(--font-jost), var(--font-montserrat), system-ui, sans-serif',
          color: QUEEN_COLORS.inkSoft,
        }}
      >
        QKC
      </span>
    </div>
  );
}
