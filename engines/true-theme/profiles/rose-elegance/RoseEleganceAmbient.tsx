"use client";

import { useExperience } from "../../context";

/**
 * Rose Elegance ambient layer — CSS-only drifting petals.
 * No canvas, no WebGL. Pure CSS transforms for performance safety.
 * 6 SVG petals at opacity ≤ 0.15 with randomised drift timing.
 */

const PETAL_CONFIGS = [
  { left: "7%", top: "10%", delay: "0s", duration: "18s", rotate: 15 },
  { left: "82%", top: "5%", delay: "2.5s", duration: "22s", rotate: -20 },
  { left: "65%", top: "40%", delay: "4s", duration: "20s", rotate: 12 },
  { left: "12%", top: "55%", delay: "1.5s", duration: "24s", rotate: -18 },
  { left: "45%", top: "75%", delay: "3s", duration: "19s", rotate: 25 },
  { left: "88%", top: "65%", delay: "5.5s", duration: "21s", rotate: -15 },
];

function RosePetalSVG({ accent }: { accent: string }) {
  return (
    <svg
      viewBox="0 0 32 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-6 h-8 md:w-8 md:h-10"
    >
      <path
        d="M16 2 C22 8, 28 16, 28 24 C28 32, 22 38, 16 38 C10 38, 4 32, 4 24 C4 16, 10 8, 16 2Z"
        fill={accent}
        opacity="0.5"
      />
      <path
        d="M16 6 C20 12, 24 18, 24 24 C24 30, 20 34, 16 34 C12 34, 8 30, 8 24 C8 18, 12 12, 16 6Z"
        fill={accent}
        opacity="0.3"
      />
      <path
        d="M16 2 C16 14, 16 26, 16 38"
        stroke={accent}
        strokeWidth="0.4"
        opacity="0.4"
      />
    </svg>
  );
}

export function RoseEleganceAmbient() {
  const { theme } = useExperience();

  return (
    <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none">
      {/* Soft gradient base */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(170deg, ${theme.colors.background} 0%, rgba(216, 167, 177, 0.06) 40%, ${theme.colors.background} 100%)`,
        }}
      />

      {/* Drifting petals — CSS animations only */}
      {PETAL_CONFIGS.map((petal, i) => (
        <div
          key={i}
          className="absolute animate-rose-drift"
          style={{
            left: petal.left,
            top: petal.top,
            opacity: 0.1,
            animationDelay: petal.delay,
            animationDuration: petal.duration,
            transform: `rotate(${petal.rotate}deg)`,
            willChange: "transform",
          }}
        >
          <RosePetalSVG accent={theme.colors.secondary} />
        </div>
      ))}

      {/* Subtle accent radials */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(circle at 25% 30%, ${theme.colors.accent} 0%, transparent 45%), radial-gradient(circle at 75% 70%, ${theme.colors.secondary} 0%, transparent 40%)`,
        }}
      />

      {/* Editorial side lines */}
      <div className="absolute left-0 top-0 h-full w-px opacity-[0.06] hidden md:block">
        <div
          className="h-full w-full"
          style={{
            background: `linear-gradient(to bottom, transparent, ${theme.colors.accent}, transparent)`,
          }}
        />
      </div>
      <div className="absolute right-0 top-0 h-full w-px opacity-[0.06] hidden md:block">
        <div
          className="h-full w-full"
          style={{
            background: `linear-gradient(to bottom, transparent, ${theme.colors.accent}, transparent)`,
          }}
        />
      </div>
    </div>
  );
}
