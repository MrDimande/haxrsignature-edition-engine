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
import { NianSignalPulse } from "./NianSignalPulse";

/**
 * Squad Mode — alegria e brincadeira; painéis azul/vermelho da fotografia.
 * Sem “Spider-Man”, logos oficiais ou galeria.
 * Isolado a nian-night-of-the-web.
 */
export function NianSquadModeSection() {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.28 });
  const image = getNianStoryImage("spiderSquad");

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // Push-in máximo ~2.5%
  const imgScale = useTransform(
    scrollYProgress,
    [0, 1],
    reduceMotion ? [1, 1] : [1.025, 1]
  );
  const bandX = useTransform(
    scrollYProgress,
    [0, 1],
    reduceMotion ? [0, 0] : [-8, 6]
  );

  return (
    <section
      ref={sectionRef}
      id="squad-mode"
      aria-labelledby="nian-squad-mode-title"
      className="relative flex min-h-[100svh] w-full flex-col justify-end overflow-hidden"
      style={{ backgroundColor: NIAN_COLORS.bg }}
    >
      {image ? (
        <>
          {/* Mobile full-bleed — slight top bias; bottom crop hides floor sparkle */}
          <motion.div
            className="absolute inset-0 md:hidden"
            style={{ scale: imgScale }}
          >
            <div
              className="absolute inset-0 overflow-hidden"
              style={{
                transform: "scale(1.07)",
                transformOrigin: "center 30%",
              }}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes={NIAN_CINEMATIC_SIZES}
                className="object-cover object-[center_26%]"
                priority={false}
              />
            </div>
            {image.hasCornerArtifact ? (
              <NianImageArtifactMask intensity="medium" />
            ) : null}
            {/* Non-destructive floor veil — hides bottom sparkle */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-[24%]"
              style={{
                background: `
                  linear-gradient(180deg, transparent 0%, rgba(3,5,11,0.35) 35%, rgba(3,5,11,0.82) 68%, #03050b 100%),
                  radial-gradient(ellipse 40% 55% at 88% 100%, rgba(3,5,11,0.95) 0%, transparent 70%)
                `,
              }}
            />
          </motion.div>

          {/* Desktop — dual layer preserving blue/red panels */}
          <div
            className="absolute inset-0 z-0 hidden overflow-hidden md:block"
            aria-hidden
          >
            <Image
              src={image.src}
              alt=""
              fill
              sizes="100vw"
              className="scale-[1.1] object-cover object-[center_30%] brightness-[0.88] saturate-[1.05] blur-[18px]"
            />
            <div
              className="absolute inset-0"
              style={{
                background: `
                  linear-gradient(90deg, rgba(3,5,11,0.55) 0%, rgba(3,5,11,0.08) 38%, rgba(3,5,11,0.5) 100%),
                  linear-gradient(180deg, rgba(65,105,225,0.12) 0%, transparent 40%, rgba(3,5,11,0.55) 100%)
                `,
              }}
            />
          </div>

          <motion.div
            className="absolute inset-y-[5%] right-[5%] z-[1] hidden w-[min(44vw,540px)] overflow-hidden md:block"
            style={{ scale: imgScale }}
            initial={reduceMotion ? false : { opacity: 0, x: 20 }}
            animate={inView ? { opacity: 1, x: 0 } : undefined}
            transition={{ duration: 0.8, ease: NIAN_EASE }}
          >
            <div
              className="relative h-full w-full overflow-hidden"
              style={{
                transform: "scale(1.06)",
                transformOrigin: "center 28%",
              }}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes="(min-width: 768px) 44vw, 100vw"
                className="object-cover object-[center_24%]"
                priority={false}
              />
              {image.hasCornerArtifact ? (
                <NianImageArtifactMask intensity="medium" />
              ) : null}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-[22%]"
                style={{
                  background: `
                    linear-gradient(180deg, transparent 0%, rgba(3,5,11,0.45) 40%, rgba(3,5,11,0.88) 100%),
                    radial-gradient(ellipse 35% 60% at 92% 100%, rgba(3,5,11,0.95) 0%, transparent 72%)
                  `,
                }}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  boxShadow:
                    "inset 0 0 44px 16px rgba(3,5,11,0.45)",
                }}
              />
            </div>
          </motion.div>
        </>
      ) : null}

      {/* Subtle diagonal type band — avoids faces/hands zone */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-[-12%] top-[18%] z-[3] hidden origin-left -rotate-[11deg] md:block"
        style={{ x: bandX }}
      >
        <motion.p
          initial={reduceMotion ? false : { opacity: 0, x: -24 }}
          animate={inView ? { opacity: 0.22, x: 0 } : undefined}
          transition={{ duration: 0.9, delay: 0.2, ease: NIAN_EASE }}
          className="whitespace-nowrap text-[clamp(2.5rem,5vw,4.5rem)] font-semibold uppercase tracking-[0.35em] text-[#F4F6FB]"
          style={{
            fontFamily: "var(--font-jost), var(--font-montserrat), sans-serif",
          }}
        >
          Squad Mode · Squad Mode · Squad Mode
        </motion.p>
      </motion.div>

      {/* Mobile diagonal whisper — low opacity, upper third only */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-[-20%] top-[10%] z-[3] origin-left -rotate-[14deg] md:hidden"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={inView ? { opacity: 0.14 } : undefined}
        transition={{ duration: 0.8, delay: 0.15, ease: NIAN_EASE }}
      >
        <p
          className="whitespace-nowrap text-[2.4rem] font-semibold uppercase tracking-[0.32em] text-[#F4F6FB]"
          style={{
            fontFamily: "var(--font-jost), var(--font-montserrat), sans-serif",
          }}
        >
          Squad Mode
        </p>
      </motion.div>

      {/* Energy wash — calmer than Action, livelier than Team-Up */}
      {!reduceMotion ? (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[2] mix-blend-soft-light"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: [0, 0.38, 0.18] } : undefined}
          transition={{ duration: 2.2, ease: NIAN_EASE }}
          style={{
            background: `
              linear-gradient(125deg, rgba(65,105,225,0.32) 0%, transparent 40%, rgba(225,6,0,0.26) 100%)
            `,
          }}
        />
      ) : null}

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-[54%] md:h-[42%] md:w-[52%]"
        style={{
          background: `
            linear-gradient(180deg, transparent 0%, rgba(3,5,11,0.4) 30%, rgba(3,5,11,0.92) 72%, #03050b 100%)
          `,
        }}
      />

      {/* Typography */}
      <div className="relative z-10 px-5 pb-[calc(env(safe-area-inset-bottom,0px)+6.75rem)] pt-28 text-left sm:px-8 md:max-w-xl md:px-12 md:pb-20">
        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.5, ease: NIAN_EASE }}
          className="text-[10px] font-semibold uppercase tracking-[0.42em] text-[#E10600]"
        >
          Squad Mode
        </motion.p>

        <div className="mt-4 overflow-hidden">
          <motion.h2
            id="nian-squad-mode-title"
            initial={
              reduceMotion ? false : { opacity: 0, y: "110%" }
            }
            animate={inView ? { opacity: 1, y: "0%" } : undefined}
            transition={{
              duration: reduceMotion ? 0.4 : 0.72,
              delay: 0.08,
              ease: NIAN_EASE,
            }}
            className="text-[clamp(2rem,6vw,3.4rem)] font-semibold uppercase leading-[0.98] tracking-[0.04em] text-[#F4F6FB]"
            style={{
              fontFamily:
                "var(--font-jost), var(--font-montserrat), sans-serif",
            }}
          >
            A aventura
            <br />
            já começou.
          </motion.h2>
        </div>
        <NianSignalPulse active={inView} />

        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.6, delay: 0.22, ease: NIAN_EASE }}
          className="mt-5 max-w-sm text-[1.02rem] leading-relaxed text-[#B0BED8] md:text-[1.08rem]"
        >
          Duas poses.
          <br />
          Dois pequenos heróis.
          <br />
          Uma noite inesquecível.
        </motion.p>
      </div>
    </section>
  );
}
