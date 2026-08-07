"use client";

import { useRef } from "react";
import {
  motion,
  useInView,
  useReducedMotion,
} from "motion/react";
import { HAXR_AUTH } from "@lib/brand/authorship";
import { NIAN_COLORS, NIAN_EASE } from "./nian-motion";
import {
  NianSoundtrackCreditsTrigger,
  type NianCreditsController,
} from "./NianSoundtrackCredits";
import { isNianAuthorizedTrackActive } from "@lib/nian/event-details";

type Props = {
  credits: NianCreditsController;
};

/**
 * Último frame / créditos finais — Nian · NIGHT OF THE WEB.
 * Aparece após o RSVP, independentemente do estado da confirmação.
 * Isolado a renderProfile "nian-night-of-the-web".
 */
export function NianExperienceSignature({ credits }: Props) {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.35 });
  const showCredits = isNianAuthorizedTrackActive();

  return (
    <section
      ref={sectionRef}
      id="assinatura"
      aria-label="Assinatura HAXR Signature"
      className="relative isolate overflow-hidden"
      style={{
        backgroundColor: NIAN_COLORS.bg,
        paddingTop: "clamp(4.5rem, 12vw, 8.5rem)",
        paddingBottom:
          "max(clamp(4rem, 10vw, 7rem), env(safe-area-inset-bottom))",
        paddingLeft: "max(1.25rem, env(safe-area-inset-left))",
        paddingRight: "max(1.25rem, env(safe-area-inset-right))",
      }}
    >
      {/* Atmosphere — royal / crimson haze, never a card */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 70% 45% at 50% 0%, rgba(65,105,225,0.10), transparent 62%),
            radial-gradient(ellipse 50% 40% at 82% 88%, rgba(225,6,0,0.05), transparent 55%),
            radial-gradient(ellipse 40% 35% at 12% 70%, rgba(65,105,225,0.04), transparent 50%)
          `,
        }}
      />

      {/* Urban web trajectory — thin geometric line */}
      <svg
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[18%] h-[42%] w-[min(28rem,88vw)] -translate-x-1/2 opacity-[0.22]"
        viewBox="0 0 320 220"
        fill="none"
      >
        <path
          d="M160 8 L160 210"
          stroke={NIAN_COLORS.royal}
          strokeWidth="0.6"
          strokeOpacity="0.55"
        />
        <path
          d="M160 48 L48 118 M160 48 L272 118 M160 118 L72 188 M160 118 L248 188"
          stroke={NIAN_COLORS.royal}
          strokeWidth="0.55"
          strokeOpacity="0.4"
        />
        <path
          d="M48 118 L160 118 L272 118"
          stroke={NIAN_COLORS.crimson}
          strokeWidth="0.45"
          strokeOpacity="0.28"
        />
        <circle
          cx="160"
          cy="48"
          r="2.2"
          fill={NIAN_COLORS.royal}
          fillOpacity="0.55"
        />
      </svg>

      <div className="relative z-10 mx-auto flex w-full max-w-xl flex-col items-center text-center">
        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.55, ease: NIAN_EASE }}
          className="text-[9px] font-semibold uppercase tracking-[0.42em] text-[#8FA3D1]/80 sm:text-[10px] sm:tracking-[0.48em]"
        >
          Fim da transmissão
        </motion.p>

        <motion.div
          aria-hidden
          initial={reduceMotion ? false : { scaleX: 0, opacity: 0 }}
          animate={inView ? { scaleX: 1, opacity: 1 } : undefined}
          transition={{ duration: 0.7, delay: 0.08, ease: NIAN_EASE }}
          className="mt-7 h-px w-16 origin-center bg-gradient-to-r from-transparent via-[#4169E1]/70 to-transparent sm:mt-8 sm:w-20"
        />

        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.6, delay: 0.12, ease: NIAN_EASE }}
          className="mt-8 text-[10px] font-medium uppercase tracking-[0.36em] text-[#A4B4D4] sm:mt-10 sm:text-[11px] sm:tracking-[0.4em]"
        >
          Uma experiência assinada por
        </motion.p>

        <motion.h2
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.7, delay: 0.18, ease: NIAN_EASE }}
          className="mt-4 text-[clamp(1.65rem,5.5vw,2.75rem)] font-semibold leading-[1.05] tracking-[0.14em] text-[#F4F6FB] sm:mt-5 sm:tracking-[0.18em]"
          style={{
            fontFamily:
              'var(--font-playfair-display), "Playfair Display", Georgia, serif',
          }}
        >
          HAXR SIGNATURE
        </motion.h2>

        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.6, delay: 0.26, ease: NIAN_EASE }}
          className="mt-5 max-w-[22rem] text-[11px] font-medium uppercase leading-relaxed tracking-[0.22em] text-[#8FA3D1] sm:mt-6 sm:text-[12px] sm:tracking-[0.26em]"
        >
          Conceito · Direcção Criativa · Experiência Digital
        </motion.p>

        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.55, delay: 0.34, ease: NIAN_EASE }}
          className="mt-8 max-w-sm font-[family-name:var(--font-cormorant)] text-[clamp(1.15rem,3.2vw,1.45rem)] italic leading-snug tracking-[0.01em] text-[#F4F6FB]/92 sm:mt-10"
        >
          {HAXR_AUTH.motto}
        </motion.p>

        <motion.a
          href={HAXR_AUTH.website}
          target="_blank"
          rel="noopener noreferrer"
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={inView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.5, delay: 0.4, ease: NIAN_EASE }}
          className="mt-6 min-h-10 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#4169E1] transition hover:text-[#F4F6FB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#4169E1] sm:mt-7 sm:text-[12px] sm:tracking-[0.32em]"
        >
          {HAXR_AUTH.domain}
        </motion.a>

        {showCredits ? (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.5, delay: 0.48, ease: NIAN_EASE }}
            className="mt-12 flex w-full flex-col items-center gap-3 sm:mt-14"
          >
            <NianSoundtrackCreditsTrigger
              credits={credits}
              label="Créditos da banda sonora"
              className="min-h-10 border border-[#4169E1]/30 bg-transparent px-4 text-[9px] font-semibold uppercase tracking-[0.3em] text-[#8FA3D1] transition hover:border-[#4169E1]/70 hover:text-[#F4F6FB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4169E1] sm:tracking-[0.34em]"
            />
          </motion.div>
        ) : null}
      </div>
    </section>
  );
}
