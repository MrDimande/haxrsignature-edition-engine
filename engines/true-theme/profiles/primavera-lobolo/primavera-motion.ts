export const primaveraEase = [0.16, 1, 0.3, 1] as const;

export const primaveraViewport = { once: true, amount: 0.15 } as const;

export const primaveraReveal = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 1.05, ease: primaveraEase },
  },
};

export const primaveraStagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.18, delayChildren: 0.12 },
  },
};
