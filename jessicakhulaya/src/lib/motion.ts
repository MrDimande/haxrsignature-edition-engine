import type { Variants } from "motion/react";

/**
 * Subtle editorial fade-up transition (8-16px max) as requested.
 */
export const fadeUp: Variants = {
  hidden: { 
    opacity: 0, 
    y: 12 
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: { 
      duration: 1.2, 
      ease: [0.16, 1, 0.3, 1] // Custom luxury easeOutExpo
    },
  },
};

/**
 * Standard slow luxury fade-in
 */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { 
      duration: 1.5, 
      ease: [0.16, 1, 0.3, 1] 
    },
  },
};

/**
 * Staggered container for parent elements
 */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.25,
      delayChildren: 0.1,
    },
  },
};

/**
 * Expansion of decorative lines (from center)
 */
export const expandLine: Variants = {
  hidden: { scaleX: 0 },
  visible: {
    scaleX: 1,
    transition: { 
      duration: 1.6, 
      ease: [0.16, 1, 0.3, 1] 
    },
  },
};

/**
 * Viewport configuration for on-scroll animations
 */
export const defaultViewport = {
  once: true,
  amount: 0.15,
};
