/** Queen Kailane — LUZ DA GRAÇA · tokens de cor e movimento */

export const QUEEN_COLORS = {
  pearl: "#FFFDFC",
  ivory: "#F6F1E8",
  champagne: "#E7D7C1",
  goldMatte: "#B9975B",
  goldLight: "#D8BE87",
  sage: "#AEB2A1",
  taupe: "#736B62",
  /** Warm beige — depth without weight */
  warmBeige: "#EFE6D8",
  ink: "#3F3832",
  inkSoft: "#5A524A",
} as const;

/** Ease — luz natural, sem spring chamativo */
export const QUEEN_EASE = [0.22, 1, 0.36, 1] as const;

export const QUEEN_MOTION = {
  fadeUp: {
    hidden: { opacity: 0, y: 14 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 1.05, ease: QUEEN_EASE },
    },
  },
  fade: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 1.2, ease: QUEEN_EASE },
    },
  },
  line: {
    hidden: { scaleX: 0 },
    visible: {
      scaleX: 1,
      transition: { duration: 1.4, ease: QUEEN_EASE },
    },
  },
  stagger: 0.14,
} as const;
