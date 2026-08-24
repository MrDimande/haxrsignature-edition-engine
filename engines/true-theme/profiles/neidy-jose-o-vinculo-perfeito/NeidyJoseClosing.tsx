"use client";

import {
  HAXR_AUTH,
  formatCopyright,
  formatStudioCredit,
} from "@lib/brand/authorship";
import { NEIDY_JOSE_CONSTANTS } from "@lib/neidy-jose/constants";
import { Globe, Mail, Music } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";

interface NeidyJoseClosingProps {
  prefersReducedMotion?: boolean;
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

export function NeidyJoseClosing({
  prefersReducedMotion = false,
}: NeidyJoseClosingProps) {
  const duration = prefersReducedMotion ? 0.01 : 1.0;
  const { audio } = NEIDY_JOSE_CONSTANTS;

  const linkClass =
    "inline-flex items-center justify-center gap-1.5 rounded-full border border-[#CBB994]/28 bg-white/[0.04] px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-[#EBE4D5]/85 transition-colors hover:border-[#CBB994]/55 hover:text-[#FCFDFC]";

  return (
    <footer
      id="assinatura"
      aria-label="Encerramento e assinatura HAXR Signature"
      className="nj-section-rise nj-section-rise--slow relative flex w-full flex-col items-center justify-center overflow-hidden bg-[#0A211A] px-5 py-20 text-center text-[#FCFDFC] sm:px-8 md:py-28"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_500px_at_50%_28%,rgba(203,185,148,0.14)_0%,transparent_100%)]"
        aria-hidden
      />
      {/* Névoa de entrada — suaviza a transição do bloco escuro */}
      <div className="nj-section-fog nj-section-fog--top" aria-hidden />

      <div className="relative z-10 mx-auto flex w-full max-w-lg flex-col items-center">
        <motion.div
          initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration }}
          className="nj-medallion-front mb-8"
        >
          <div className="relative flex h-40 w-40 items-center justify-center sm:h-44 sm:w-44">
            <span
              className="pointer-events-none absolute inset-[7%] rounded-full border border-[#CBB994]/45 shadow-[0_18px_40px_-16px_rgba(0,0,0,0.45)]"
              aria-hidden
            />
            <span
              className="pointer-events-none absolute inset-[5%] rounded-full border border-[#CBB994]/20"
              aria-hidden
            />
            <Image
              src={NEIDY_JOSE_CONSTANTS.hero.monogram}
              alt="Monograma Neidy e José"
              fill
              unoptimized
              quality={100}
              className="object-contain"
              sizes="176px"
            />
          </div>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration, delay: 0.1 }}
          className="mb-4 font-serif text-3xl font-normal tracking-[0.06em] text-[#FCFDFC] sm:text-4xl md:text-5xl"
        >
          {NEIDY_JOSE_CONSTANTS.coupleTitle}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration, delay: 0.2 }}
          className="mb-6 max-w-lg font-serif text-base italic leading-relaxed text-[#CBB994] sm:text-lg"
        >
          “A vossa presença é a nossa maior bênção e honra nesta celebração do amor que Deus uniu.”
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration, delay: 0.3 }}
          className="mb-14 flex flex-col items-center gap-2 text-center text-[10px] uppercase tracking-[0.28em] text-[#FCFDFC]/70 sm:flex-row sm:gap-4 sm:text-xs sm:tracking-[0.3em]"
        >
          <span>5 de Dezembro de 2026</span>
          <span className="text-[#CBB994]">•</span>
          <span>Espaço Águia, Maputo, Moçambique</span>
        </motion.div>

        <div
          className="mb-10 h-px w-16 bg-gradient-to-r from-transparent via-[#CBB994]/55 to-transparent"
          aria-hidden
        />

        <motion.p
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration, delay: 0.08 }}
          className="font-body text-[10px] uppercase tracking-[0.38em] text-[#CBB994]"
        >
          Uma experiência assinada por
        </motion.p>

        <motion.a
          href={HAXR_AUTH.website}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration, delay: 0.12 }}
          className="group relative mt-6 block"
          aria-label={`${HAXR_AUTH.brand} — site oficial`}
        >
          <span
            className="pointer-events-none absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#CBB994]/12 blur-3xl"
            aria-hidden
          />
          <span className="relative mx-auto block h-28 w-[7.5rem] sm:h-32 sm:w-36">
            <Image
              src={HAXR_AUTH.assets.logoVerticalWhite}
              alt={HAXR_AUTH.brand}
              fill
              unoptimized
              quality={100}
              sizes="144px"
              className="object-contain mix-blend-screen opacity-95 transition-opacity group-hover:opacity-100"
            />
          </span>
        </motion.a>

        <p className="mt-5 font-body text-[10px] uppercase tracking-[0.26em] text-[#CBB994]">
          {HAXR_AUTH.tagline}
        </p>
        <p className="mt-3 max-w-xs font-body text-[10px] uppercase tracking-[0.16em] text-[#EBE4D5]/55">
          Conceito · Direcção Criativa · Experiência Digital
        </p>
        <p className="mt-6 max-w-sm font-serif text-base italic leading-relaxed text-[#EBE4D5]/90">
          {HAXR_AUTH.motto}
        </p>

        <nav
          aria-label="Contacto HAXR Signature"
          className="mt-8 flex flex-wrap items-center justify-center gap-2"
        >
          <a
            href={HAXR_AUTH.website}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            <Globe className="h-3 w-3" strokeWidth={1.5} aria-hidden />
            {HAXR_AUTH.domain}
          </a>
          <a
            href={HAXR_AUTH.social.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            <InstagramIcon />
            {HAXR_AUTH.social.handle}
          </a>
          <a href={`mailto:${HAXR_AUTH.email.hello}`} className={linkClass}>
            <Mail className="h-3 w-3" strokeWidth={1.5} aria-hidden />
            {HAXR_AUTH.email.hello}
          </a>
        </nav>

        <aside
          className="mt-10 w-full rounded-[1.15rem] border border-[#CBB994]/25 bg-[#F7F3EB]/[0.06] px-5 py-5 text-left"
          aria-label="Créditos da música de ambiente"
        >
          <div className="flex items-start gap-3">
            <span
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#CBB994]/35 text-[#CBB994]"
              aria-hidden
            >
              <Music className="h-3.5 w-3.5" strokeWidth={1.5} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-body text-[9px] uppercase tracking-[0.28em] text-[#CBB994]">
                Música de ambiente
              </p>
              <p className="mt-2 font-serif text-base italic leading-snug text-[#FCFDFC]">
                {audio.title}
                <span className="mx-1.5 not-italic text-[#CBB994]/50">·</span>
                <span className="not-italic font-body text-sm tracking-wide text-[#EBE4D5]/85">
                  {audio.artist}
                </span>
              </p>
              <p className="mt-1.5 font-body text-[10px] tracking-wide text-[#EBE4D5]/50">
                {audio.rightsHolder}
              </p>
              <p className="mt-3 border-t border-[#CBB994]/15 pt-3 font-body text-[9px] leading-relaxed text-[#EBE4D5]/42">
                {audio.disclaimer}
              </p>
            </div>
          </div>
        </aside>

        <div className="mt-10 space-y-1.5 pb-8 text-center">
          <p className="font-body text-[9px] uppercase tracking-[0.28em] text-[#EBE4D5]/40">
            {formatCopyright()}
          </p>
          <p className="font-body text-[9px] uppercase tracking-[0.22em] text-[#CBB994]/45">
            {formatStudioCredit()}
          </p>
          <p className="font-body text-[9px] uppercase tracking-[0.2em] text-[#CBB994]/35">
            {HAXR_AUTH.location}
          </p>
        </div>
      </div>
    </footer>
  );
}
