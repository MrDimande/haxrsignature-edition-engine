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

function SubtleWeb({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g fill="none" stroke="#F4F6FB" strokeWidth="0.12" opacity="0.28">
        <path d="M0 18 L52 55 L100 12" />
        <path d="M8 100 L50 48 L95 100" />
        <path d="M0 55 L100 48" />
      </g>
      <g fill="none" stroke="#4169E1" strokeWidth="0.14" opacity="0.22">
        <path d="M12 0 L50 52 L20 100" />
      </g>
    </svg>
  );
}

/**
 * Action Beat — full-bleed rooftop intensity.
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
  const webY = useTransform(
    scrollYProgress,
    [0, 1],
    reduceMotion ? [0, 0] : [10, -8]
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
        <motion.div className="absolute inset-0" style={{ scale: imgScale }}>
          {/* Desktop support blur — avoids stretching small plate */}
          <div className="absolute inset-0 hidden md:block" aria-hidden>
            <Image
              src={image.src}
              alt=""
              fill
              sizes="100vw"
              className="scale-110 object-cover opacity-50 blur-3xl"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 70% 60% at 50% 40%, transparent 0%, rgba(5,6,10,0.55) 100%)",
              }}
            />
          </div>
          <div className="absolute inset-0 md:inset-y-0 md:left-1/2 md:w-[min(100%,720px)] md:-translate-x-1/2">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes={NIAN_CINEMATIC_SIZES}
              className="object-cover object-[center_22%] md:object-[center_18%]"
              priority={false}
            />
            {image.hasCornerArtifact ? (
              <NianImageArtifactMask intensity="medium" />
            ) : null}
          </div>
        </motion.div>
      ) : null}

      <motion.div className="pointer-events-none absolute inset-0 z-[1]" style={{ y: webY }}>
        <SubtleWeb className="h-full w-full opacity-70 mix-blend-screen" />
      </motion.div>

      {/* Controlled bottom wash — keep face/hands clear */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-[58%]"
        style={{
          background: `
            linear-gradient(180deg, transparent 0%, rgba(5,6,10,0.35) 32%, rgba(5,6,10,0.88) 68%, #05060A 100%)
          `,
        }}
      />

      {/* Soft blue/red light pass */}
      {!reduceMotion ? (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[2] mix-blend-soft-light"
          initial={{ opacity: 0 }}
          animate={
            inView
              ? { opacity: [0, 0.35, 0.15] }
              : undefined
          }
          transition={{ duration: 2.4, ease: NIAN_EASE }}
          style={{
            background: `
              linear-gradient(115deg, rgba(65,105,225,0.35) 0%, transparent 42%, rgba(225,6,0,0.22) 100%)
            `,
          }}
        />
      ) : null}

      <motion.div
        className="relative z-10 px-5 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-32 text-center sm:px-8 sm:pb-14"
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
            initial={
              reduceMotion
                ? false
                : { opacity: 0, y: "110%" }
            }
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
          className="mt-4 text-[clamp(0.95rem,2.5vw,1.25rem)] font-medium uppercase tracking-[0.28em] text-[#E10600]/90"
        >
          Nian entrou em acção.
        </motion.p>
      </motion.div>
    </section>
  );
}
