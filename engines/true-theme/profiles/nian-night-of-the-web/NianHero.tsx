"use client";

import React, { useRef, useSyncExternalStore } from "react";
import Image from "next/image";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { useExperience } from "../../context";
import { NIAN_EVENT } from "@lib/nian/event-details";
import { getNianHeroPhotoSrc } from "@lib/nian/assets-manifest";
import { NIAN_COLORS, NIAN_EASE } from "./nian-motion";

function subscribeMd(onStoreChange: () => void) {
  const mq = window.matchMedia("(min-width: 768px)");
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function useIsDesktopMd() {
  return useSyncExternalStore(
    subscribeMd,
    () => window.matchMedia("(min-width: 768px)").matches,
    () => false
  );
}

/** SVG web overlay — discreto, editorial */
function WebOverlay({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g stroke="#F4F6FB" strokeWidth="0.15" fill="none" opacity="0.45">
        <path d="M0 12 L48 52 L100 8" />
        <path d="M0 88 L52 48 L100 92" />
        <path d="M12 0 L50 55 L18 100" />
        <path d="M88 0 L52 50 L90 100" />
        <path d="M0 50 L100 46" opacity="0.5" />
      </g>
      <g stroke="#4169E1" strokeWidth="0.2" fill="none" opacity="0.35">
        <path d="M5 5 L50 50 L95 5" />
      </g>
      <g stroke="#E10600" strokeWidth="0.18" fill="none" opacity="0.28">
        <path d="M8 95 L50 48 L92 95" />
      </g>
    </svg>
  );
}

/**
 * Hero cinematográfico — Foto 1 como protagonista quando disponível.
 * Isolado a nian-night-of-the-web.
 */
export function NianHeroSection() {
  const { introComplete } = useExperience();
  if (!introComplete) return null;
  return <NianHeroMounted />;
}

function NianHeroMounted() {
  const reduceMotion = useReducedMotion();
  const isDesktop = useIsDesktopMd();
  const sectionRef = useRef<HTMLElement>(null);
  const heroPhoto = getNianHeroPhotoSrc();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const enableParallax = Boolean(isDesktop && !reduceMotion);
  const bgY = useTransform(scrollYProgress, [0, 1], [0, enableParallax ? 40 : 0]);
  const photoY = useTransform(
    scrollYProgress,
    [0, 1],
    [0, enableParallax ? 18 : 0]
  );
  const copyY = useTransform(
    scrollYProgress,
    [0, 1],
    [0, enableParallax ? 8 : 0]
  );

  return (
    <section
      ref={sectionRef}
      id="hero"
      aria-labelledby="nian-hero-title"
      className="relative flex min-h-[100svh] w-full scroll-mt-20 flex-col overflow-hidden"
      style={{ backgroundColor: NIAN_COLORS.bg }}
    >
      {/* Skyline / atmosphere */}
      <motion.div className="absolute inset-0" style={{ y: bgY }}>
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 55% 40% at 50% 0%, rgba(65,105,225,0.32) 0%, transparent 58%),
              radial-gradient(ellipse 45% 35% at 78% 35%, rgba(225,6,0,0.16) 0%, transparent 55%),
              linear-gradient(180deg, #070A12 0%, #05060A 42%, #020208 100%)
            `,
          }}
        />
        {/* City silhouette blocks */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[42%] opacity-70"
          style={{
            background: `
              linear-gradient(90deg,
                transparent 0%,
                #0A0C14 4%, #0A0C14 7%, transparent 7.2%,
                #0B0E18 11%, #0B0E18 14%, transparent 14.2%,
                #090B12 18%, #090B12 26%, transparent 26.2%,
                #0C101C 32%, #0C101C 36%, transparent 36.2%,
                #0A0D16 42%, #0A0D16 55%, transparent 55.2%,
                #0B0F1A 62%, #0B0F1A 68%, transparent 68.2%,
                #090C14 74%, #090C14 88%, transparent 88.2%,
                #0A0E18 92%, #0A0E18 97%, transparent 100%
              ),
              linear-gradient(180deg, transparent 0%, rgba(5,6,10,0.4) 40%, #05060A 100%)
            `,
            maskImage:
              "linear-gradient(180deg, transparent 0%, #000 28%, #000 100%)",
          }}
        />
        <WebOverlay className="absolute inset-0 h-full w-full opacity-40 mix-blend-screen" />
      </motion.div>

      {/* Protagonist — Foto 1 or cinematic light stand-in (no label in frame) */}
      <motion.div
        className="pointer-events-none absolute inset-x-0 top-[8%] z-[2] mx-auto flex h-[48%] max-w-3xl items-center justify-center sm:top-[6%] sm:h-[52%]"
        style={{ y: photoY }}
      >
        {heroPhoto ? (
          <div className="relative h-full w-full max-w-lg">
            <Image
              src={heroPhoto}
              alt="Nian"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 512px"
              className="object-contain object-bottom"
              style={{
                filter:
                  "drop-shadow(0 24px 48px rgba(0,0,0,0.55)) saturate(1.05) contrast(1.04)",
              }}
            />
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background: `
                  radial-gradient(ellipse 50% 35% at 50% 20%, rgba(65,105,225,0.22) 0%, transparent 70%),
                  radial-gradient(ellipse 40% 30% at 60% 40%, rgba(225,6,0,0.12) 0%, transparent 65%),
                  linear-gradient(180deg, transparent 55%, rgba(5,6,10,0.55) 82%, rgba(5,6,10,0.95) 100%)
                `,
              }}
            />
          </div>
        ) : (
          <div
            aria-hidden
            className="relative h-[85%] w-[min(58vw,280px)]"
          >
            {/* Poster-light stand-in until Foto 1 is received — no competing copy */}
            <div
              className="absolute inset-0 rounded-[42%_42%_18%_18%/32%_32%_14%_14%]"
              style={{
                background: `
                  radial-gradient(ellipse 55% 45% at 50% 28%, rgba(65,105,225,0.5) 0%, transparent 70%),
                  radial-gradient(ellipse 40% 35% at 58% 48%, rgba(225,6,0,0.3) 0%, transparent 65%),
                  linear-gradient(180deg, rgba(20,28,55,0.45) 0%, rgba(8,10,18,0.2) 70%, transparent 100%)
                `,
                boxShadow:
                  "0 0 90px rgba(65,105,225,0.28), 0 0 48px rgba(225,6,0,0.14)",
              }}
            />
          </div>
        )}
      </motion.div>

      {/* Bottom wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-[55%]"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, rgba(5,6,10,0.35) 28%, rgba(5,6,10,0.92) 68%, #05060A 100%)",
        }}
      />

      {/* Copy — brand first, clear of stand-in */}
      <motion.div
        className="relative z-10 mt-auto flex w-full flex-col items-center px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[42vh] text-center sm:pb-12 sm:pt-[38vh]"
        style={{ y: copyY }}
      >
        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05, ease: NIAN_EASE }}
          className="text-[10px] font-semibold uppercase tracking-[0.48em] text-[#4169E1] sm:text-[11px]"
        >
          {NIAN_EVENT.conceptualTitle}
        </motion.p>

        <motion.h1
          id="nian-hero-title"
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.12, ease: NIAN_EASE }}
          className="mt-3 text-[clamp(3.4rem,14vw,6.5rem)] font-semibold uppercase leading-[0.88] tracking-[0.06em] text-[#F4F6FB]"
          style={{
            fontFamily: "var(--font-jost), var(--font-montserrat), sans-serif",
            textShadow: "0 8px 40px rgba(0,0,0,0.45)",
          }}
        >
          NIAN
        </motion.h1>

        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.22, ease: NIAN_EASE }}
          className="mt-4 text-[11px] font-medium uppercase tracking-[0.36em] text-[#F4F6FB]/85 sm:text-xs"
        >
          {NIAN_EVENT.dateDisplayShort}
        </motion.p>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.32, ease: NIAN_EASE }}
          className="mt-6 max-w-sm space-y-1.5 text-[0.95rem] leading-snug text-[#8FA3D1] sm:text-base"
        >
          <p>Uma cidade em movimento.</p>
          <p>Um pequeno herói.</p>
          <p className="text-[#F4F6FB]/90">Uma celebração inesquecível.</p>
        </motion.div>

        <motion.p
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-10 text-[9px] uppercase tracking-[0.4em] text-[#8FA3D1]"
        >
          Desce pela noite
        </motion.p>
        <motion.span
          aria-hidden
          animate={
            reduceMotion
              ? undefined
              : { y: [0, 6, 0], opacity: [0.4, 0.85, 0.4] }
          }
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          className="mt-2 block h-8 w-px bg-gradient-to-b from-[#4169E1] to-transparent"
        />
      </motion.div>
    </section>
  );
}
