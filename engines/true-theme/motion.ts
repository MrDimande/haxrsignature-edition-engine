import type { Variants } from "motion/react";
import type { ExperienceTokens } from "../../theme/true-types";

export function createMotionVariants(tokens: ExperienceTokens): {
  fadeUp: Variants;
  fadeIn: Variants;
  staggerContainer: Variants;
} {
  const { duration, stagger, ease } = tokens.motion;

  return {
    fadeUp: {
      hidden: { opacity: 0, y: 12 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration, ease },
      },
    },
    fadeIn: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: { duration: duration * 1.2, ease },
      },
    },
    staggerContainer: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: { staggerChildren: stagger, delayChildren: 0.1 },
      },
    },
  };
}

export const defaultViewport = { once: true, amount: 0.15 } as const;
