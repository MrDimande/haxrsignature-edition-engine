"use client";

import Image from "next/image";
import { motion } from "motion/react";

export function BabyAyllaCoverBow({ opening, reducedMotion }: {
  opening: boolean;
  reducedMotion: boolean;
}) {
  return (
    <motion.div
      data-cover-bow
      aria-hidden="true"
      className="baby-aylla-cover-bow-art"
      initial={false}
      animate={opening && !reducedMotion
        ? { y: -7, rotate: 3, scaleX: 1.04, opacity: 0 }
        : { y: 0, rotate: 0, scaleX: 1, opacity: 1 }}
      transition={{ duration: reducedMotion ? 0 : 0.72, delay: opening && !reducedMotion ? 0.2 : 0, ease: [0.22, 1, 0.36, 1] }}
    >
      <Image
        src="/images/baby-aylla/satin-bow-hero.png"
        alt=""
        fill
        priority
        quality={95}
        sizes="(max-height: 480px) 100px, (min-width: 1024px) 160px, 126px"
        className="baby-aylla-cover-bow-image"
      />
    </motion.div>
  );
}
