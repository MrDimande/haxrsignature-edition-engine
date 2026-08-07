"use client";

import { useRef } from "react";
import Image from "next/image";
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import {
  getNianStoryImage,
  NIAN_CINEMATIC_SIZES,
} from "@lib/nian/assets-manifest";
import { NIAN_COLORS, NIAN_EASE } from "./nian-motion";
import { NianImageArtifactMask } from "./NianImageArtifactMask";

/**
 * Action Beat — full-bleed intensity (mobile) / dual-layer editorial (desktop).
 * Isolado a nian-night-of-the-web.
 */
export function NianActionBeatSection() {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.25 });
  const image = getNianStoryImage("action");

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const imgScale = useTransform(
    scrollYProgress,
    [0, 1],
    reduceMotion ? [1, 1] : [1.03, 1]
  );
  const copyY = useTransform(
    scrollYProgress,
    [0, 1],
    reduceMotion ? [0, 0] : [24, -6]
  );

  return (
    <section
      ref={sectionRef}
      id="action"
      aria-labelledby="nian-action-title"
      className="relative flex min-h-[100svh] w-full flex-col justify-end overflow-hidden"
      style={{ backgroundColor: NIAN_COLORS.bg }}
    >
      {image ? (
        <>
          {/* —— Mobile: single full-bleed plate —— */}
          <motion.div
            className="absolute inset-0 md:hidden"
            style={{ scale: imgScale }}
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes={NIAN_CINEMATIC_SIZES}
              className="object-cover object-[center_22%]"
              priority={false}
            />
            {image.hasCornerArtifact ? (
              <NianImageArtifactMask intensity="medium" />
            ) : null}
          </motion.div>

          {/* —— Desktop: blurred full-bleed + sharp vertical plate —— */}
          <div className="absolute inset-0 z-0 hidden overflow-hidden md:block" aria-hidden>
            <Image
              src={image.src}
              alt=""
              fill
              sizes="100vw"
              className="scale-[1.1] object-cover object-center brightness-[0.85] saturate-[0.95] blur-[20px]"
            />
            <div
              className="absolute inset-0"
              style={{
                background: `
                  linear-gradient(90deg, rgba(3,5,11,0.4) 0%, rgba(3,5,11,0.05) 32%, rgba(3,5,11,0.05) 68%, rgba(3,5,11,0.4) 100%),
                  radial-gradient(ellipse 85% 75% at 50% 35%, transparent 0%, rgba(3,5,11,0.28) 100%),
                  linear-gradient(180deg, rgba(65,105,225,0.16) 0%, transparent 36%, rgba(3,5,11,0.42) 100%)
                `,
              }}
            />
          </div>

          <motion.div
            className="absolute inset-x-0 top-[2%] bottom-[14%] z-[1] hidden md:block"
            style={{ scale: imgScale }}
          >
            <div className="relative mx-auto h-full w-[min(46vw,560px)] overflow-hidden rounded-[2px]">
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes="(min-width: 768px) 46vw, 100vw"
                className="object-cover object-[center_16%]"
                priority={false}
              />
              {image.hasCornerArtifact ? (
                <NianImageArtifactMask intensity="medium" />
              ) : null}
              {/* Soft edge integration — no hard letterbox bars */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  boxShadow:
                    "inset 0 0 48px 18px rgba(3,5,11,0.55), inset 0 -40px 60px 10px rgba(3,5,11,0.65)",
                }}
              />
            </div>
          </motion.div>
        </>
      ) : null}

      {/* No radial SVG across the viewport — photo webs only */}

      {/* Controlled bottom wash — keep face/hands clear */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-[58%] md:h-[48%]"
        style={{
          background: `
            linear-gradient(180deg, transparent 0%, rgba(3,5,11,0.3) 32%, rgba(3,5,11,0.88) 68%, #03050b 100%)
          `,
        }}
      />

      {/* Soft blue/red light pass */}
      {!reduceMotion ? (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[2] mix-blend-soft-light"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: [0, 0.35, 0.15] } : undefined}
          transition={{ duration: 2.4, ease: NIAN_EASE }}
          style={{
            background: `
              linear-gradient(115deg, rgba(65,105,225,0.35) 0%, transparent 42%, rgba(225,6,0,0.22) 100%)
            `,
          }}
        />
      ) : null}

      {/* Typography — elevated above fixed audio control (~88×88 reserved) */}
      <motion.div
        className="relative z-10 px-5 pt-32 text-center sm:px-8 pb-[calc(env(safe-area-inset-bottom,0px)+7rem)]"
        style={{ y: copyY }}
      >
        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.55, ease: NIAN_EASE }}
          className="text-[10px] font-semibold uppercase tracking-[0.42em] text-[#4169E1]"
        >
          Sinal detectado
        </motion.p>

        <div className="mx-auto mt-4 max-w-3xl overflow-hidden">
          <motion.h2
            id="nian-action-title"
            initial={reduceMotion ? false : { opacity: 0, y: "110%" }}
            animate={inView ? { opacity: 1, y: "0%" } : undefined}
            transition={{ duration: 0.75, delay: 0.08, ease: NIAN_EASE }}
            className="text-[clamp(2.1rem,7vw,4rem)] font-semibold uppercase leading-[0.98] tracking-[0.05em] text-[#F4F6FB]"
            style={{
              fontFamily: "var(--font-jost), var(--font-montserrat), sans-serif",
            }}
          >
            A cidade acordou.
          </motion.h2>
        </div>

        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={inView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.65, delay: 0.22, ease: NIAN_EASE }}
          className="mt-4 text-[clamp(0.95rem,2.5vw,1.25rem)] font-medium uppercase text-[#E10600]/90"
          style={{
            letterSpacing: "clamp(0.18em, 0.55vw, 0.28em)",
          }}
        >
          Nian entrou em acção.
        </motion.p>
      </motion.div>
    </section>
  );
}
