"use client";

import { NEIDY_JOSE_CONSTANTS } from "@lib/neidy-jose/constants";
import { motion } from "motion/react";

interface NeidyJoseScriptureProps {
  prefersReducedMotion?: boolean;
}

export function NeidyJoseScripture({
  prefersReducedMotion = false,
}: NeidyJoseScriptureProps) {
  const duration = prefersReducedMotion ? 0.01 : 1.0;

  return (
    <section
      id="scripture"
      className="nj-section-rise relative w-full overflow-hidden bg-[#FBFBFA] px-6 py-16 sm:px-8 sm:py-20 md:py-24"
    >
      {/* Névoa de separação de planos — reforço de rack focus */}
      <div className="nj-section-fog nj-section-fog--top" aria-hidden />
      <div className="nj-section-fog nj-section-fog--bottom" aria-hidden />

      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center text-center">
        <motion.p
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration }}
          className="mb-6 max-w-lg font-serif text-base italic leading-relaxed text-[#3B6456] sm:mb-8 sm:text-lg"
        >
          E sob essa mesma bênção, a Palavra que tecemos no coração.
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration, delay: 0.08 }}
          className="nj-script-font mb-10 text-4xl text-[#CBB994] sm:mb-12 sm:text-5xl md:text-6xl"
        >
          {NEIDY_JOSE_CONSTANTS.scriptureTheme}
        </motion.h2>

        <motion.blockquote
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration, delay: 0.15 }}
          className="max-w-2xl"
        >
          <p className="font-serif text-xl font-normal italic leading-relaxed text-[#0A211A] sm:text-2xl md:text-3xl">
            {NEIDY_JOSE_CONSTANTS.scriptureFullVerse}
          </p>
          <footer className="mt-6 flex flex-col items-center">
            <span className="mb-3 h-px w-16 bg-[#CBB994]" aria-hidden />
            <cite className="font-body text-xs font-semibold not-italic uppercase tracking-[0.3em] text-[#3B6456] sm:text-sm">
              {NEIDY_JOSE_CONSTANTS.scriptureReference}
            </cite>
          </footer>
        </motion.blockquote>
      </div>
    </section>
  );
}
