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
 * Team-Up — afecto e vínculo; fotografia como protagonista.
 * Isolado a nian-night-of-the-web.
 */
export function NianTeamUpSection() {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.28 });
  const image = getNianStoryImage("teamUp");

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // Push-in máximo ~2%
  const imgScale = useTransform(
    scrollYProgress,
    [0, 1],
    reduceMotion ? [1, 1] : [1.02, 1]
  );
  const copyY = useTransform(
    scrollYProgress,
    [0, 1],
    reduceMotion ? [0, 0] : [16, -4]
  );

  return (
    <section
      ref={sectionRef}
      id="team-up"
      aria-labelledby="nian-team-up-title"
      className="relative flex min-h-[100svh] w-full flex-col overflow-hidden md:justify-center"
      style={{ backgroundColor: NIAN_COLORS.bg }}
    >
      {image ? (
        <>
          {/* Mobile — full-bleed editorial crop; faces in upper safe area */}
          <motion.div
            className="absolute inset-0 md:hidden"
            style={{ scale: imgScale }}
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes={NIAN_CINEMATIC_SIZES}
              className="object-cover object-[center_18%]"
              priority={false}
            />
            {image.hasCornerArtifact ? (
              <NianImageArtifactMask intensity="medium" />
            ) : null}
          </motion.div>

          {/* Desktop — blurred atmosphere + asymmetric sharp plate */}
          <div
            className="absolute inset-0 z-0 hidden overflow-hidden md:block"
            aria-hidden
          >
            <Image
              src={image.src}
              alt=""
              fill
              sizes="100vw"
              className="scale-[1.12] object-cover object-[center_20%] brightness-[0.82] saturate-[0.92] blur-[22px]"
            />
            <div
              className="absolute inset-0"
              style={{
                background: `
                  linear-gradient(100deg, rgba(3,5,11,0.72) 0%, rgba(3,5,11,0.2) 42%, rgba(3,5,11,0.55) 100%),
                  radial-gradient(ellipse 70% 60% at 28% 40%, rgba(65,105,225,0.18) 0%, transparent 55%),
                  radial-gradient(ellipse 50% 50% at 78% 55%, rgba(225,6,0,0.12) 0%, transparent 60%)
                `,
              }}
            />
          </div>

          <motion.div
            className="absolute inset-y-[6%] left-[4%] z-[1] hidden w-[min(42vw,520px)] overflow-hidden md:block"
            style={{ scale: imgScale }}
            initial={reduceMotion ? false : { opacity: 0, x: -18 }}
            animate={inView ? { opacity: 1, x: 0 } : undefined}
            transition={{ duration: 0.85, ease: NIAN_EASE }}
          >
            <div className="relative h-full w-full overflow-hidden">
              {/* ~4% scale crop — hides BR sparkle; faces/hands/arm stay in frame */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{
                  transform: "scale(1.04)",
                  transformOrigin: "center 18%",
                }}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(min-width: 768px) 42vw, 100vw"
                  className="object-cover object-[center_14%]"
                  priority={false}
                />
              </div>
              {image.hasCornerArtifact ? (
                <NianImageArtifactMask intensity="medium" />
              ) : null}
              {/* Soft rooftop veil — Team-Up desktop only, no rectangular block */}
              <div
                aria-hidden
                className="pointer-events-none absolute bottom-0 right-0 z-[3]"
                style={{
                  width: "36%",
                  height: "28%",
                  background: `
                    radial-gradient(
                      ellipse 110% 105% at 100% 100%,
                      rgba(5, 7, 12, 0.96) 0%,
                      rgba(8, 10, 18, 0.62) 34%,
                      rgba(12, 14, 22, 0.22) 58%,
                      transparent 78%
                    )
                  `,
                }}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  boxShadow:
                    "inset 0 0 40px 14px rgba(3,5,11,0.5), inset -24px 0 48px 8px rgba(3,5,11,0.35)",
                }}
              />
            </div>
          </motion.div>
        </>
      ) : null}

      {/* Soft support light — blue / red only as atmosphere */}
      {!reduceMotion ? (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[2] mix-blend-soft-light md:hidden"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: [0, 0.28, 0.14] } : undefined}
          transition={{ duration: 2.8, ease: NIAN_EASE }}
          style={{
            background: `
              linear-gradient(120deg, rgba(65,105,225,0.28) 0%, transparent 48%, rgba(225,6,0,0.18) 100%)
            `,
          }}
        />
      ) : null}

      {/* Mobile bottom wash — keeps faces clear; copy in negative zone */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-[52%] md:hidden"
        style={{
          background: `
            linear-gradient(180deg, transparent 0%, rgba(3,5,11,0.35) 28%, rgba(3,5,11,0.9) 68%, #03050b 100%)
          `,
        }}
      />

      {/* Copy */}
      <motion.div
        className="relative z-10 mt-auto px-5 pb-[calc(env(safe-area-inset-bottom,0px)+6.75rem)] pt-[48svh] text-left sm:px-8 md:ml-auto md:mt-0 md:w-[min(44%,34rem)] md:self-center md:px-10 md:pb-16 md:pt-0 md:pr-14"
        style={{ y: copyY }}
      >
        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.55, ease: NIAN_EASE }}
          className="text-[10px] font-semibold uppercase tracking-[0.42em] text-[#4169E1]"
        >
          Team-Up
        </motion.p>

        <motion.h2
          id="nian-team-up-title"
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.75, delay: 0.1, ease: NIAN_EASE }}
          className="mt-4 text-[clamp(1.75rem,5.2vw,2.85rem)] font-semibold uppercase leading-[1.05] tracking-[0.04em] text-[#F4F6FB]"
          style={{
            fontFamily: "var(--font-jost), var(--font-montserrat), sans-serif",
          }}
        >
          Ninguém vive
          <br />
          uma grande aventura
          <br />
          sozinho.
        </motion.h2>

        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.65, delay: 0.22, ease: NIAN_EASE }}
          className="mt-5 max-w-md text-[1.02rem] leading-relaxed text-[#B0BED8] md:text-[1.08rem]"
        >
          Os melhores capítulos
          <br />
          são vividos lado a lado.
        </motion.p>
      </motion.div>
    </section>
  );
}
