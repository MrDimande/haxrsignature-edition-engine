"use client";

import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { AGENCY, COUPLE } from "@/lib/event-data";
import { formatCopyrightShort, formatStudioCredit } from "@lib/brand/authorship";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative py-12 sm:py-16">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />

      <div className="mx-auto max-w-4xl px-6 text-center">
        <RevealOnScroll>
          <p className="mb-2 font-playfair text-2xl font-bold text-off-white">
            {COUPLE.bride} & {COUPLE.groom}
          </p>
          <p className="mb-8 font-montserrat text-sm italic text-light-gray">
            Com amor, gratidão e alegria infinita.
          </p>
        </RevealOnScroll>

        <RevealOnScroll delay={0.15}>
          <div className="mx-auto mb-8 h-px w-16 bg-gold/30" />
        </RevealOnScroll>

        <RevealOnScroll delay={0.25}>
          <p className="font-montserrat text-[10px] uppercase tracking-[0.3em] text-light-gray/60">
            Convite Digital por{" "}
            <span className="text-gold/80">{AGENCY.name}</span>
          </p>
          <p className="mt-1 font-montserrat text-[10px] tracking-wider text-light-gray/40">
            {AGENCY.tagline}
          </p>
        </RevealOnScroll>

        <RevealOnScroll delay={0.35}>
          <p className="mt-8 font-montserrat text-[10px] text-light-gray/30">
            © {year} {COUPLE.displayNames}. {formatStudioCredit()}.
          </p>
          <p className="mt-1 font-montserrat text-[9px] text-light-gray/25">
            {formatCopyrightShort()}
          </p>
        </RevealOnScroll>
      </div>
    </footer>
  );
}
