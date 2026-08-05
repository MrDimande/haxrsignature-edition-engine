"use client";

import type { CSSProperties } from "react";

type MaskIntensity = "soft" | "medium";

export interface NianImageArtifactMaskProps {
  /** soft ≈ 3% corner veil; medium ≈ 4–5% */
  intensity?: MaskIntensity;
  className?: string;
  style?: CSSProperties;
}

/**
 * Soft corner veil for the small sparkle / losango that appears
 * on several Nian cinematic plates (bottom-right).
 *
 * Non-destructive — CSS overlay only. No rectangular blocks.
 * Isolated to nian-night-of-the-web.
 */
export function NianImageArtifactMask({
  intensity = "soft",
  className = "",
  style,
}: NianImageArtifactMaskProps) {
  const size = intensity === "medium" ? "22%" : "16%";
  const opacity = intensity === "medium" ? 0.92 : 0.78;

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 z-[2] ${className}`}
      style={style}
    >
      {/* Local radial — blends into night lighting */}
      <div
        className="absolute bottom-0 right-0"
        style={{
          width: size,
          height: size,
          opacity,
          background: `
            radial-gradient(
              ellipse 100% 100% at 100% 100%,
              rgba(5, 6, 10, 0.88) 0%,
              rgba(5, 6, 10, 0.45) 38%,
              rgba(5, 6, 10, 0.12) 62%,
              transparent 78%
            )
          `,
        }}
      />
      {/* Secondary warm-edge mix — matches city glow, not a hard patch */}
      <div
        className="absolute bottom-0 right-0 mix-blend-multiply"
        style={{
          width: `calc(${size} * 0.85)`,
          height: `calc(${size} * 0.7)`,
          opacity: intensity === "medium" ? 0.55 : 0.4,
          background: `
            radial-gradient(
              ellipse 90% 80% at 100% 100%,
              rgba(10, 12, 22, 0.75) 0%,
              rgba(65, 105, 225, 0.08) 45%,
              transparent 72%
            )
          `,
        }}
      />
    </div>
  );
}
