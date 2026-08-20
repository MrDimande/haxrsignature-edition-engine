"use client";

import Image from "next/image";
import { useRef } from "react";
import {
  motion,
  useInView,
  useReducedMotion,
} from "motion/react";
import {
  formatCopyright,
  HAXR_AUTH,
} from "@lib/brand/authorship";
import { NIAN_COLORS, NIAN_EASE } from "./nian-motion";
import {
  NianSoundtrackCreditsPanel,
  NianSoundtrackCreditsTrigger,
  type NianCreditsController,
} from "./NianSoundtrackCredits";
import { isNianAuthorizedTrackActive } from "@lib/nian/event-details";

type Props = {
  credits: NianCreditsController;
};

/**
 * Último frame / assinatura final — NIGHT OF THE WEB.
 * Dock de áudio fica só play/pause; créditos da banda sonora vivem aqui.
 * Isolado a renderProfile "nian-night-of-the-web".
 */
export function NianExperienceSignature({ credits }: Props) {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.28 });
  const showCredits = isNianAuthorizedTrackActive();

  return (
    <section
      ref={sectionRef}
      id="assinatura"
      aria-label="Assinatura HAXR Signature"
      className="relative isolate overflow-hidden"
      style={{
        backgroundColor: NIAN_COLORS.bg,
        paddingTop: "clamp(5rem, 14vw, 9.5rem)",
        paddingBottom:
          "max(clamp(4.5rem, 11vw, 7.5rem), env(safe-area-inset-bottom))",
        paddingLeft: "max(1.25rem, env(safe-area-inset-left))",
        paddingRight: "max(1.25rem, env(safe-area-inset-right))",
      }}
    >
      {/* City / night atmosphere */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 75% 48% at 50% -8%, rgba(65,105,225,0.18), transparent 58%),
            radial-gradient(ellipse 45% 38% at 88% 72%, rgba(225,6,0,0.09), transparent 55%),
            radial-gradient(ellipse 40% 34% at 8% 78%, rgba(65,105,225,0.07), transparent 52%),
            linear-gradient(180deg, #03050b 0%, #050814 48%, #020308 100%)
          `,
        }}
      />

      {/* Soft vignette */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 65% at 50% 42%, transparent 30%, rgba(2,3,8,0.72) 100%)",
        }}
      />

      {/* Web network — transmission end */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.28]"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <line x1="50" y1="0" x2="50" y2="100" stroke="#4169E1" strokeWidth="0.12" />
        <line x1="8" y1="0" x2="42" y2="100" stroke="#4169E1" strokeWidth="0.1" />
        <line x1="92" y1="0" x2="58" y2="100" stroke="#E10600" strokeWidth="0.1" opacity="0.8" />
        <line x1="0" y1="38" x2="100" y2="44" stroke="#F4F6FB" strokeWidth="0.06" opacity="0.28" />
        <line x1="0" y1="72" x2="100" y2="66" stroke="#4169E1" strokeWidth="0.07" opacity="0.35" />
        <circle cx="50" cy="28" r="0.55" fill="#4169E1" fillOpacity="0.7" />
        <circle cx="36" cy="58" r="0.32" fill="#4169E1" fillOpacity="0.45" />
        <circle cx="64" cy="52" r="0.28" fill="#E10600" fillOpacity="0.4" />
      </svg>

      <div className="relative z-10 mx-auto flex w-full max-w-lg flex-col items-center text-center">
        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.55, ease: NIAN_EASE }}
          className="text-[9px] font-semibold uppercase tracking-[0.42em] text-[#4169E1] sm:text-[10px] sm:tracking-[0.48em]"
        >
          Fim da transmissão // Signal end
        </motion.p>

        <motion.div
          aria-hidden
          initial={reduceMotion ? false : { scaleX: 0, opacity: 0 }}
          animate={inView ? { scaleX: 1, opacity: 1 } : undefined}
          transition={{ duration: 0.75, delay: 0.06, ease: NIAN_EASE }}
          className="mt-6 h-px w-20 origin-center bg-gradient-to-r from-transparent via-[#4169E1]/75 to-transparent sm:mt-7 sm:w-24"
        />

        {/* HAXR mark */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={inView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.65, delay: 0.12, ease: NIAN_EASE }}
          className="relative mt-9 sm:mt-11"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70 sm:h-32 sm:w-32"
            style={{
              background:
                "radial-gradient(circle, rgba(65,105,225,0.22) 0%, transparent 68%)",
            }}
          />
          <Image
            src={HAXR_AUTH.assets.logoVertical}
            alt={HAXR_AUTH.brand}
            width={112}
            height={140}
            className="relative mx-auto h-auto w-[4.75rem] object-contain opacity-95 sm:w-[5.5rem]"
            priority={false}
          />
        </motion.div>

        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.55, delay: 0.18, ease: NIAN_EASE }}
          className="mt-7 text-[10px] font-medium uppercase tracking-[0.36em] text-[#A4B4D4] sm:mt-8 sm:text-[11px] sm:tracking-[0.4em]"
        >
          Uma experiência assinada por
        </motion.p>

        <motion.h2
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.7, delay: 0.22, ease: NIAN_EASE }}
          className="mt-3 text-[clamp(1.55rem,5.2vw,2.55rem)] font-semibold uppercase leading-[1.02] tracking-[0.16em] text-[#F4F6FB] sm:mt-4 sm:tracking-[0.2em]"
          style={{
            fontFamily:
              "var(--font-jost), var(--font-montserrat), sans-serif",
            textShadow: "0 0 42px rgba(65,105,225,0.18)",
          }}
        >
          HAXR Signature
        </motion.h2>

        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.55, delay: 0.28, ease: NIAN_EASE }}
          className="mt-4 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#4169E1]/90 sm:text-[11px]"
        >
          {HAXR_AUTH.tagline}
        </motion.p>

        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.55, delay: 0.32, ease: NIAN_EASE }}
          className="mt-5 max-w-[22rem] text-[11px] font-medium uppercase leading-relaxed tracking-[0.2em] text-[#8FA3D1] sm:text-[12px] sm:tracking-[0.24em]"
        >
          Conceito · Direcção Criativa · Experiência Digital
        </motion.p>

        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.55, delay: 0.36, ease: NIAN_EASE }}
          className="mt-8 max-w-sm font-[family-name:var(--font-cormorant)] text-[clamp(1.12rem,3.1vw,1.4rem)] italic leading-snug tracking-[0.01em] text-[#F4F6FB]/92 sm:mt-9"
        >
          {HAXR_AUTH.motto}
        </motion.p>

        {/* Contact — few links, high tracking, film credits silence */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.55, delay: 0.42, ease: NIAN_EASE }}
          className="mt-14 flex w-full max-w-sm flex-col items-center gap-5 sm:mt-16"
        >
          <a
            href={`mailto:${HAXR_AUTH.email.hello}`}
            className="min-h-10 text-[11px] font-semibold uppercase tracking-[0.36em] text-[#F4F6FB]/90 transition hover:text-[#4169E1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#4169E1] sm:tracking-[0.42em]"
          >
            {HAXR_AUTH.email.hello}
          </a>
          <a
            href={HAXR_AUTH.website}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-9 text-[10px] font-semibold uppercase tracking-[0.4em] text-[#4169E1]/85 transition hover:text-[#F4F6FB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#4169E1] sm:text-[11px]"
          >
            {HAXR_AUTH.domain}
          </a>
        </motion.div>

        {/* Soundtrack — transmission log */}
        {showCredits ? (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.55, delay: 0.5, ease: NIAN_EASE }}
            className="mt-12 flex w-full flex-col items-center gap-4 sm:mt-14"
          >
            <div
              aria-hidden
              className="h-px w-14 bg-gradient-to-r from-transparent via-[#E10600]/45 to-transparent"
            />
            <p className="text-[8px] font-semibold uppercase tracking-[0.36em] text-[#8FA3D1]/80">
              Banda sonora do universo
            </p>
            <NianSoundtrackCreditsTrigger
              credits={credits}
              label="Créditos da banda sonora"
              className="min-h-10 border border-[#4169E1]/35 bg-[#070a14]/55 px-5 text-[9px] font-semibold uppercase tracking-[0.32em] text-[#A4B4D4] transition hover:border-[#4169E1]/75 hover:text-[#F4F6FB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4169E1] sm:tracking-[0.36em]"
            />
            <NianSoundtrackCreditsPanel credits={credits} variant="signature" />
          </motion.div>
        ) : null}

        <motion.p
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={inView ? { opacity: 1 } : undefined}
          transition={{ duration: 0.5, delay: 0.58, ease: NIAN_EASE }}
          className="mt-14 text-[8px] uppercase tracking-[0.28em] text-[#8FA3D1]/65 sm:mt-16"
        >
          {formatCopyright()}
        </motion.p>
      </div>
    </section>
  );
}
