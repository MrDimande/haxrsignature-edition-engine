"use client";

import { motion, useReducedMotion } from "motion/react";

type StanleyWordmarkSize = "gate" | "hero";

const SIZE_STYLE: Record<
  StanleyWordmarkSize,
  { fontSize?: string; className: string }
> = {
  gate: {
    fontSize: "clamp(2.15rem, 11.2vw, 4.25rem)",
    className: "tracking-[-0.055em] sm:tracking-[-0.05em]",
  },
  hero: {
    // Mobile: cabe STANLEY inteiro (7 letras) na largura útil
    // Desktop: escala editorial original
    className:
      "max-w-full whitespace-nowrap text-[clamp(3.05rem,calc((100vw-2.25rem)/5.95),4.95rem)] tracking-[-0.06em] md:text-[clamp(5.5rem,22cqi,7.75rem)] md:tracking-[-0.045em]",
  },
};

/**
 * STANLEY — cream principal, camel metálico, ouro só em detalhe.
 * Partilhado pela capa (gate) e pelo Hero.
 */
export function StanleyWordmark({
  size = "gate",
  className = "",
  as: Tag = "h1",
  id,
}: {
  size?: StanleyWordmarkSize;
  className?: string;
  as?: "h1" | "span";
  id?: string;
}) {
  const reduceMotion = useReducedMotion();
  const sizing = SIZE_STYLE[size];

  return (
    <Tag
      id={id}
      className={`relative inline-block max-w-full font-display font-semibold uppercase leading-[0.78] ${sizing.className} ${className}`}
      style={sizing.fontSize ? { fontSize: sizing.fontSize } : undefined}
    >
      <span
        aria-hidden
        className="absolute inset-0 select-none"
        style={{
          color: "#121820",
          transform: "translate(0.035em, 0.045em)",
          opacity: 0.72,
          textShadow: "0.02em 0.03em 0 rgba(12, 10, 18, 0.45)",
        }}
      >
        Stanley
      </span>
      <span
        aria-hidden
        className="absolute inset-0 select-none"
        style={{
          color: "transparent",
          WebkitTextStroke: "0.016em rgba(232, 220, 200, 0.55)",
          textShadow: `
            -0.01em -0.008em 0 rgba(247, 244, 239, 0.5),
            0.01em 0.008em 0 rgba(184, 149, 108, 0.35),
            0 0 0.06em rgba(201, 168, 106, 0.18),
            0.045em 0.06em 0.1em rgba(90, 72, 40, 0.28)
          `,
        }}
      >
        Stanley
      </span>
      <motion.span
        className="relative"
        animate={
          reduceMotion
            ? undefined
            : { backgroundPosition: ["0% 42%", "100% 58%", "0% 42%"] }
        }
        transition={
          reduceMotion
            ? undefined
            : { duration: 5.5, repeat: Infinity, ease: "easeInOut" }
        }
        style={{
          backgroundImage: `
            linear-gradient(
              158deg,
              #F7F4EF 0%,
              #F2EBE0 12%,
              #E8DCC8 24%,
              #C9B08A 34%,
              #F7F4EF 46%,
              #E8D4B0 56%,
              #B8956C 64%,
              #F2E6C9 74%,
              #C9A86A 82%,
              #F7F4EF 92%,
              #E8DCC8 100%
            )
          `,
          backgroundSize: "220% 220%",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          WebkitTextStroke: "0.005em rgba(247, 244, 239, 0.4)",
          filter: `
            drop-shadow(0 1px 0 rgba(247,244,239,0.55))
            drop-shadow(0 -1px 0 rgba(184,149,108,0.28))
            drop-shadow(0 0 0.5px rgba(201,168,106,0.28))
          `,
        }}
      >
        Stanley
      </motion.span>
    </Tag>
  );
}
