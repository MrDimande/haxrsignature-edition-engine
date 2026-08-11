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
 * Closing — convocação final; CTA scrolla para #rsvp sem tocar no áudio.
 * Isolado a nian-night-of-the-web.
 */
export function NianClosingSection() {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.28 });
  const image = getNianStoryImage("closing");

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const imgScale = useTransform(
    scrollYProgress,
    [0, 1],
    reduceMotion ? [1, 1] : [1.02, 1]
  );

  const scrollToRsvp = () => {
    const el = document.getElementById("rsvp");
    if (!el) return;
    el.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  return (
    <section
      ref={sectionRef}
      id="closing"
      aria-labelledby="nian-closing-title"
      className="relative flex min-h-[100svh] w-full flex-col justify-end overflow-hidden"
      style={{ backgroundColor: NIAN_COLORS.bg }}
    >
      {image ? (
        <>
          <motion.div
            className="absolute inset-0 md:hidden"
            style={{ scale: imgScale }}
          >
            <div
              className="absolute inset-0 overflow-hidden"
              style={{
                transform: "scale(1.06)",
                transformOrigin: "center 26%",
              }}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes={NIAN_CINEMATIC_SIZES}
                className="object-cover object-[center_20%]"
                priority={false}
              />
            </div>
            {image.hasCornerArtifact ? (
              <NianImageArtifactMask intensity="medium" />
            ) : null}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-[26%]"
              style={{
                background: `
                  linear-gradient(180deg, transparent 0%, rgba(3,5,11,0.5) 36%, #03050b 100%),
                  radial-gradient(ellipse 42% 65% at 92% 100%, rgba(3,5,11,0.97) 0%, transparent 70%)
                `,
              }}
            />
          </motion.div>

          <div
            className="absolute inset-0 z-0 hidden overflow-hidden md:block"
            aria-hidden
          >
            <Image
              src={image.src}
              alt=""
              fill
              sizes="100vw"
              className="scale-[1.12] object-cover object-[center_24%] brightness-[0.84] saturate-[0.95] blur-[20px]"
            />
            <div
              className="absolute inset-0"
              style={{
                background: `
                  linear-gradient(100deg, rgba(3,5,11,0.7) 0%, rgba(3,5,11,0.15) 40%, rgba(3,5,11,0.55) 100%),
                  radial-gradient(ellipse 60% 50% at 70% 40%, rgba(65,105,225,0.14) 0%, transparent 55%)
                `,
              }}
            />
            {/* Hide BR sparkle on blurred plate bleed */}
            <div
              className="absolute bottom-0 right-0"
              style={{
                width: "28%",
                height: "34%",
                background: `
                  radial-gradient(
                    ellipse 110% 110% at 100% 100%,
                    #03050b 0%,
                    rgba(3,5,11,0.85) 40%,
                    transparent 72%
                  )
                `,
              }}
            />
          </div>

          {/* Desktop plate — ~5% crop + BR veil; soft bottom fade (no rigid grey bar) */}
          <motion.div
            className="absolute top-[3%] bottom-0 right-[4%] z-[1] hidden w-[min(42vw,560px)] overflow-hidden md:block lg:right-[6%] xl:right-[8%]"
            style={{
              scale: imgScale,
              maskImage:
                "linear-gradient(180deg, #000 0%, #000 86%, rgba(0,0,0,0.55) 94%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(180deg, #000 0%, #000 86%, rgba(0,0,0,0.55) 94%, transparent 100%)",
            }}
            initial={reduceMotion ? false : { opacity: 0, x: 16 }}
            animate={inView ? { opacity: 1, x: 0 } : undefined}
            transition={{ duration: 0.85, ease: NIAN_EASE }}
          >
            <div
              className="relative h-full w-full overflow-hidden"
              style={{
                transform: "scale(1.05)",
                transformOrigin: "38% 16%",
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
              {image.hasCornerArtifact ? (
                <NianImageArtifactMask intensity="medium" />
              ) : null}
              {/* Localized BR veil — definitively hides losango on wide desktop */}
              <div
                aria-hidden
                className="pointer-events-none absolute bottom-0 right-0 z-[4]"
                style={{
                  width: "52%",
                  height: "40%",
                  background: `
                    radial-gradient(
                      ellipse 125% 120% at 100% 100%,
                      rgba(3, 5, 11, 1) 0%,
                      rgba(3, 5, 11, 0.95) 24%,
                      rgba(3, 5, 11, 0.55) 52%,
                      rgba(3, 5, 11, 0.16) 70%,
                      transparent 84%
                    )
                  `,
                }}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 z-[3]"
                style={{
                  background: `
                    linear-gradient(180deg, transparent 84%, rgba(3,5,11,0.2) 94%, rgba(3,5,11,0.45) 100%),
                    linear-gradient(90deg, rgba(3,5,11,0.2) 0%, transparent 14%)
                  `,
                  boxShadow: "inset 0 0 28px 6px rgba(3,5,11,0.25)",
                }}
              />
            </div>
          </motion.div>
        </>
      ) : null}

      {/* Copy wash — desktop limited to left column so it does not paint a grey bar under the plate */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-[58%] md:h-[46%] md:w-[min(52%,36rem)]"
        style={{
          background: `
            linear-gradient(180deg, transparent 0%, rgba(3,5,11,0.28) 30%, rgba(3,5,11,0.88) 72%, #03050b 100%)
          `,
        }}
      />

      <div className="relative z-10 px-5 pb-[calc(env(safe-area-inset-bottom,0px)+6.75rem)] pt-32 text-left sm:px-8 md:max-w-xl md:px-12 md:pb-20">
        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.5, ease: NIAN_EASE }}
          className="text-[10px] font-semibold uppercase tracking-[0.42em] text-[#4169E1]"
        >
          Convocação final
        </motion.p>

        <div className="mt-4 overflow-hidden">
          <motion.h2
            id="nian-closing-title"
            initial={reduceMotion ? false : { opacity: 0, y: "110%" }}
            animate={inView ? { opacity: 1, y: "0%" } : undefined}
            transition={{
              duration: reduceMotion ? 0.4 : 0.75,
              delay: 0.08,
              ease: NIAN_EASE,
            }}
            className="text-[clamp(1.9rem,5.8vw,3.2rem)] font-semibold uppercase leading-[1.02] tracking-[0.04em] text-[#F4F6FB]"
            style={{
              fontFamily:
                "var(--font-jost), var(--font-montserrat), sans-serif",
            }}
          >
            A missão está
            <br />
            prestes a começar.
          </motion.h2>
        </div>
        <NianSignalPulse active={inView} />

        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.6, delay: 0.2, ease: NIAN_EASE }}
          className="mt-5 text-[clamp(1rem,2.6vw,1.25rem)] font-medium uppercase leading-snug tracking-[0.06em] text-[#E10600]/90"
        >
          E não será a mesma
          <br />
          sem ti.
        </motion.p>

        {/* Existing crimson line — slow residual motion, no new copy */}
        {!reduceMotion ? (
          <motion.div
            aria-hidden
            className="mt-8 h-px origin-left bg-gradient-to-r from-[#E10600] via-[#4169E1]/45 to-transparent"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={
              inView
                ? { scaleX: 1, opacity: [0, 1, 0.55] }
                : undefined
            }
            transition={{ duration: 1.35, delay: 0.28, ease: NIAN_EASE }}
          />
        ) : (
          <div
            aria-hidden
            className="mt-8 h-px bg-gradient-to-r from-[#E10600] via-[#4169E1]/45 to-transparent"
          />
        )}

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.55, delay: 0.32, ease: NIAN_EASE }}
          className="mt-10"
        >
          <button
            type="button"
            onClick={scrollToRsvp}
            className="inline-flex min-h-12 min-w-[12rem] items-center justify-center border border-[#4169E1] bg-[#4169E1] px-8 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#F4F6FB] transition hover:bg-[#3558c7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F4F6FB]"
          >
            Confirmar presença
          </button>
        </motion.div>
      </div>
    </section>
  );
}
