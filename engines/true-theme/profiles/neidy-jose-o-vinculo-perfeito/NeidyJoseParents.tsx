"use client";

import { NEIDY_JOSE_CONSTANTS } from "@lib/neidy-jose/constants";
import { motion } from "motion/react";
import Image from "next/image";

interface NeidyJoseParentsProps {
  prefersReducedMotion?: boolean;
}

/** Distinct from hero / wedding-day plates */
const SEAL_PHOTO = "/images/neidy-jose/couple-primary.jpg";

/**
 * A Bênção — selo editorial:
 * duas casas ligadas por um medalhão oval do casal (fora do layout de cards clássicos).
 */
export function NeidyJoseParents({ prefersReducedMotion = false }: NeidyJoseParentsProps) {
  const duration = prefersReducedMotion ? 0.01 : 1.1;
  const ease = [0.16, 1, 0.3, 1] as const;
  const { blessing, parents } = NEIDY_JOSE_CONSTANTS;

  return (
    <section
      id="parents"
      className="nj-section-full nj-section-rise nj-section-rise--slow relative w-full overflow-hidden bg-[#FBFBFA] py-16 sm:py-20 md:py-28"
      aria-labelledby="nj-blessing-heading"
    >
      <div className="relative z-10 mx-auto w-full max-w-5xl px-5 sm:px-8">
        <header className="mb-10 flex flex-col items-center text-center sm:mb-12">
          <motion.p
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration, ease }}
            className="mb-3 font-body text-[10px] uppercase tracking-[0.4em] text-[#3B6456] sm:text-[11px]"
          >
            {blessing.eyebrow}
          </motion.p>

          <motion.h2
            id="nj-blessing-heading"
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration, delay: 0.08, ease }}
            className="nj-script-font mb-4 text-3xl font-normal leading-snug text-[#CBB994] sm:text-4xl md:text-5xl"
          >
            {blessing.title}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration, delay: 0.15 }}
            className="max-w-md font-serif text-sm italic leading-relaxed text-[#3B6456] sm:text-base"
          >
            Duas famílias. Um altar. A bênção que nos precede.
          </motion.p>
        </header>

        {/* Full-bleed emerald tablet */}
        <motion.div
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration, delay: 0.18, ease }}
          className="relative overflow-hidden rounded-[1.75rem] border border-[#CBB994]/35 bg-[#0A211A] shadow-[0_28px_70px_-32px_rgba(10,33,26,0.55)] sm:rounded-[2.25rem]"
        >
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(45,90,76,0.55),transparent_50%),radial-gradient(ellipse_at_10%_90%,rgba(203,185,148,0.08),transparent_40%),radial-gradient(ellipse_at_90%_80%,rgba(203,185,148,0.08),transparent_40%)]"
            aria-hidden
          />

          {/* Gold continuity thread — desktop */}
          <svg
            className="pointer-events-none absolute left-[12%] right-[12%] top-1/2 hidden h-px -translate-y-1/2 opacity-40 md:block"
            viewBox="0 0 100 2"
            preserveAspectRatio="none"
            aria-hidden
          >
            <line
              x1="0"
              y1="1"
              x2="100"
              y2="1"
              stroke="#CBB994"
              strokeWidth="0.35"
              strokeDasharray="1.2 1.8"
            />
          </svg>

          <div className="relative z-10 grid grid-cols-1 items-center gap-2 px-6 py-10 sm:px-8 sm:py-12 md:grid-cols-[1fr_auto_1fr] md:gap-6 md:px-10 md:py-14">
            {/* Família Marino */}
            <motion.div
              initial={{ opacity: 0, x: prefersReducedMotion ? 0 : -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration, delay: 0.28, ease }}
              className="flex flex-col items-center text-center md:items-end md:pr-4 md:text-right"
            >
              <p className="mb-1 font-body text-[9px] uppercase tracking-[0.38em] text-[#CBB994]/70">
                Oferecem
              </p>
              <p className="mb-5 font-body text-[10px] uppercase tracking-[0.35em] text-[#CBB994]">
                {blessing.brideHouse}
              </p>
              <p className="font-serif text-base tracking-wide text-[#FCFDFC] sm:text-lg md:text-xl">
                {parents.bride.father}
              </p>
              <span className="nj-hero-and my-1.5 text-sm text-[#CBB994]/80">e</span>
              <p className="font-serif text-base tracking-wide text-[#FCFDFC] sm:text-lg md:text-xl">
                {parents.bride.mother}
              </p>
            </motion.div>

            {/* Seal — oval cameo — plano mais próximo */}
            <motion.div
              initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration, delay: 0.32, ease }}
              className="nj-medallion-front relative mx-auto my-6 flex flex-col items-center md:my-0"
            >
              <div className="relative">
                {/* Outer gold rings */}
                <div
                  className="absolute -inset-2 rounded-[50%] border border-[#CBB994]/35 sm:-inset-2.5"
                  aria-hidden
                />
                <div
                  className="absolute -inset-1 rounded-[50%] border border-[#CBB994]/55"
                  aria-hidden
                />
                <div className="relative h-44 w-32 overflow-hidden rounded-[50%] border border-[#CBB994]/70 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.55)] sm:h-52 sm:w-36 md:h-56 md:w-40">
                  <Image
                    src={SEAL_PHOTO}
                    alt={`${NEIDY_JOSE_CONSTANTS.brideName} e ${NEIDY_JOSE_CONSTANTS.groomName}`}
                    fill
                    unoptimized
                    quality={100}
                    className="object-cover object-[center_22%]"
                    sizes="160px"
                  />
                </div>
              </div>
              <p className="mt-4 max-w-[11rem] text-center font-serif text-[11px] italic leading-snug text-[#EBE4D5]/75 sm:text-xs">
                Onde duas linhagens se encontram.
              </p>
            </motion.div>

            {/* Família Mateus */}
            <motion.div
              initial={{ opacity: 0, x: prefersReducedMotion ? 0 : 16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration, delay: 0.36, ease }}
              className="flex flex-col items-center text-center md:items-start md:pl-4 md:text-left"
            >
              <p className="mb-1 font-body text-[9px] uppercase tracking-[0.38em] text-[#CBB994]/70">
                Oferecem
              </p>
              <p className="mb-5 font-body text-[10px] uppercase tracking-[0.35em] text-[#CBB994]">
                {blessing.groomHouse}
              </p>
              <p className="font-serif text-base tracking-wide text-[#FCFDFC] sm:text-lg md:text-xl">
                {parents.groom.father}
              </p>
              <span className="nj-hero-and my-1.5 text-sm text-[#CBB994]/80">e</span>
              <p className="font-serif text-base tracking-wide text-[#FCFDFC] sm:text-lg md:text-xl">
                {parents.groom.mother}
              </p>
            </motion.div>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration, delay: 0.45 }}
            className="relative z-10 pb-8 text-center font-serif text-[11px] italic text-[#CBB994]/55 sm:pb-10 sm:text-xs"
          >
            Com reverência · Com gratidão · Com amor
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
