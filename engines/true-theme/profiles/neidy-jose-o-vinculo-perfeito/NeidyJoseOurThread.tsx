"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { motion, useInView } from "motion/react";
import { NEIDY_JOSE_CONSTANTS } from "@lib/neidy-jose/constants";

interface NeidyJoseOurThreadProps {
  prefersReducedMotion?: boolean;
}

const GOLD = "#CBB994";
const EMERALD_SOFT = "#2D5A4C";

/** Fallback abstracto — só se um beat não tiver foto nem vídeo */
function VignetteWeave() {
  return (
    <svg viewBox="0 0 160 200" className="h-full w-full" aria-hidden>
      <rect width="160" height="200" fill="#F7F5F0" />
      <path
        d="M28 160 C48 70 72 170 88 90 C98 40 112 55 132 48"
        fill="none"
        stroke={GOLD}
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.95"
      />
      <path
        d="M28 48 C48 130 72 40 88 110 C98 155 112 140 132 148"
        fill="none"
        stroke={EMERALD_SOFT}
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.85"
      />
      <circle cx="80" cy="100" r="3" fill={GOLD} />
      <circle cx="80" cy="100" r="10" fill="none" stroke={GOLD} strokeWidth="0.55" opacity="0.4" />
    </svg>
  );
}

function ThreadVideo({
  src,
  objectPosition,
  prefersReducedMotion,
}: {
  src: string;
  objectPosition?: string;
  prefersReducedMotion: boolean;
}) {
  const shellRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const inView = useInView(shellRef, { margin: "-10% 0px -10% 0px" });

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (prefersReducedMotion) {
      el.pause();
      return;
    }
    if (inView) {
      void el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [inView, prefersReducedMotion]);

  return (
    <div ref={shellRef} className="absolute inset-0">
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: objectPosition || "center center" }}
        src={src}
        muted
        playsInline
        loop
        preload="metadata"
        aria-hidden
      />
    </div>
  );
}

/**
 * O nosso fio — prólogo híbrido:
 * I Fé = vídeo editorial · II Amor = foto · III Vitória = família · IV Aliança = foto.
 */
export function NeidyJoseOurThread({ prefersReducedMotion = false }: NeidyJoseOurThreadProps) {
  const duration = prefersReducedMotion ? 0.01 : 0.95;
  const ease = [0.16, 1, 0.3, 1] as const;
  const { ourThread } = NEIDY_JOSE_CONSTANTS;

  return (
    <section
      id="our-thread"
      className="nj-section-full nj-section-rise relative w-full overflow-hidden bg-[#FBFBFA] text-[#0A211A]"
      aria-labelledby="nj-our-thread-heading"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(203,185,148,0.12) 0%, transparent 55%), radial-gradient(ellipse 50% 40% at 80% 80%, rgba(45,90,76,0.06) 0%, transparent 50%)",
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-5 sm:px-8 py-16 sm:py-20 md:py-28">
        <header className="mb-12 flex flex-col items-center text-center sm:mb-16 md:mb-20">
          <motion.p
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration, ease }}
            className="mb-4 font-body text-[10px] uppercase tracking-[0.4em] text-[#3B6456] sm:text-[11px]"
          >
            {ourThread.eyebrow}
          </motion.p>

          <motion.h2
            id="nj-our-thread-heading"
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration, delay: 0.08, ease }}
            className="nj-script-font text-4xl font-normal leading-none text-[#CBB994] sm:text-5xl md:text-6xl"
          >
            {ourThread.title}
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, scaleX: prefersReducedMotion ? 1 : 0.4 }}
            whileInView={{ opacity: 1, scaleX: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration, delay: 0.16, ease }}
            className="nj-hero-rule mb-5 mt-5"
            aria-hidden
          />

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration, delay: 0.22, ease }}
            className="max-w-md font-serif text-sm italic leading-relaxed text-[#3B6456]/90 sm:text-base"
          >
            {ourThread.subtitle}
          </motion.p>
        </header>

        <div className="relative">
          {/* Fio Dourado Vivo — SVG progressivo cerimonial bordado (Desktop: horizontal através de Fé → Amor → Vitória → Aliança) */}
          <div className="pointer-events-none absolute inset-0 z-0 hidden lg:block overflow-visible" aria-hidden>
            <svg
              viewBox="0 0 1200 480"
              preserveAspectRatio="none"
              className="h-full w-full"
            >
              <defs>
                <linearGradient id="nj-golden-thread-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#CBB994" stopOpacity="0.08" />
                  <stop offset="12%" stopColor="#CBB994" stopOpacity="0.45" />
                  <stop offset="50%" stopColor="#CBB994" stopOpacity="0.55" />
                  <stop offset="88%" stopColor="#CBB994" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#CBB994" stopOpacity="0.08" />
                </linearGradient>
              </defs>
              {/* Linha principal com pathLength progressivo */}
              <motion.path
                d="M 30 215 C 130 185, 200 245, 315 210 C 430 170, 520 255, 635 200 C 750 150, 835 245, 945 195 C 1035 155, 1105 215, 1170 200"
                fill="none"
                stroke="url(#nj-golden-thread-grad)"
                strokeWidth="1.15"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 0.4 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{
                  duration: prefersReducedMotion ? 0.01 : 2.8,
                  ease: [0.16, 1, 0.3, 1],
                }}
              />
              {/* Fio secundário subtil de tecitura bordada */}
              <motion.path
                d="M 30 218 C 132 188, 198 242, 315 213 C 428 173, 522 252, 635 203 C 748 153, 837 242, 945 198 C 1033 158, 1107 218, 1170 203"
                fill="none"
                stroke="#CBB994"
                strokeWidth="0.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 0.2 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{
                  duration: prefersReducedMotion ? 0.01 : 3.2,
                  delay: prefersReducedMotion ? 0 : 0.25,
                  ease: [0.16, 1, 0.3, 1],
                }}
              />
            </svg>
          </div>

          {/* Fio Dourado Vivo — SVG progressivo cerimonial bordado (Mobile / Tablet: vertical através das virtudes) */}
          <div className="pointer-events-none absolute inset-0 z-0 block lg:hidden overflow-visible" aria-hidden>
            <svg
              viewBox="0 0 320 1200"
              preserveAspectRatio="none"
              className="h-full w-full"
            >
              <defs>
                <linearGradient id="nj-golden-thread-grad-v" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#CBB994" stopOpacity="0.08" />
                  <stop offset="10%" stopColor="#CBB994" stopOpacity="0.4" />
                  <stop offset="50%" stopColor="#CBB994" stopOpacity="0.5" />
                  <stop offset="90%" stopColor="#CBB994" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#CBB994" stopOpacity="0.08" />
                </linearGradient>
              </defs>
              <motion.path
                d="M 160 30 C 125 160, 195 290, 160 430 C 125 570, 195 700, 160 840 C 125 970, 195 1100, 160 1170"
                fill="none"
                stroke="url(#nj-golden-thread-grad-v)"
                strokeWidth="1.15"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 0.35 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{
                  duration: prefersReducedMotion ? 0.01 : 2.8,
                  ease: [0.16, 1, 0.3, 1],
                }}
              />
            </svg>
          </div>

          <ol className="m-0 grid list-none grid-cols-1 gap-12 p-0 md:grid-cols-2 md:gap-10 lg:grid-cols-4 lg:gap-6">
            {ourThread.beats.map((beat, index) => {
              const videoSrc =
                "video" in beat && typeof beat.video === "string" ? beat.video : null;
              const imageSrc =
                "image" in beat && typeof beat.image === "string" ? beat.image : null;
              const objectPosition =
                ("imageObjectPosition" in beat && beat.imageObjectPosition) || "center center";

              return (
                <motion.li
                  key={beat.id}
                  initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{
                    duration,
                    delay: prefersReducedMotion ? 0 : 0.1 * index,
                    ease,
                  }}
                  className="relative flex flex-col items-center text-center"
                >
                  <span className="mb-3 font-serif text-[11px] tracking-[0.35em] text-[#CBB994]">
                    {beat.numeral}
                  </span>

                  <div
                    className="nj-midplane nj-depth-card relative mb-5 aspect-[3/4] w-full max-w-[13.5rem] overflow-hidden rounded-sm border border-[#CBB994]/40 bg-[#F5F7F4]"
                    style={{
                      boxShadow: "0 16px 36px -20px rgba(10,33,26,0.18)",
                    }}
                  >
                    {videoSrc ? (
                      <ThreadVideo
                        src={videoSrc}
                        objectPosition={objectPosition}
                        prefersReducedMotion={prefersReducedMotion}
                      />
                    ) : imageSrc ? (
                      <Image
                        src={imageSrc}
                        alt=""
                        fill
                        unoptimized
                        quality={100}
                        className="object-cover"
                        style={{ objectPosition }}
                        sizes="(max-width: 640px) 55vw, 220px"
                        aria-hidden
                      />
                    ) : (
                      <div className="absolute inset-0">
                        <VignetteWeave />
                      </div>
                    )}
                  </div>

                  <h3 className="mb-2 font-serif text-lg font-normal tracking-wide text-[#0A211A] sm:text-xl">
                    {beat.title}
                  </h3>
                  <p className="max-w-[15rem] font-body text-[12px] leading-relaxed text-[#3B6456] sm:text-[13px]">
                    {beat.line}
                  </p>

                  {index < ourThread.beats.length - 1 && (
                    <span
                      className="mt-8 h-6 w-px bg-gradient-to-b from-[#CBB994] to-transparent sm:hidden"
                      aria-hidden
                    />
                  )}
                </motion.li>
              );
            })}
          </ol>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration, delay: 0.35, ease }}
          className="mt-14 text-center font-serif text-sm italic text-[#0A211A]/55 sm:mt-16 md:mt-20"
        >
          {ourThread.closingWhisper}
        </motion.p>
      </div>
    </section>
  );
}
