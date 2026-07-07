export const EASE_APPLE = [0.16, 1, 0.3, 1] as const;

/** Uma animação por secção — sem re-blur ao scroll */
export const cinematicViewport = { once: true, amount: 0.12 } as const;

export const cinematicRevealVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 1, ease: EASE_APPLE },
  },
};

export const cinematicStagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.18, delayChildren: 0.2 },
  },
};
