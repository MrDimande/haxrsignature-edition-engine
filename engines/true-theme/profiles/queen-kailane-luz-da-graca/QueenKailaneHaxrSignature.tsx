"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { Globe, Mail, Music } from "lucide-react";
import { HAXR_AUTH, formatCopyright } from "@lib/brand/authorship";
import { QUEEN_KAILANE_COPY } from "@lib/queen-kailane/event-details";
import { QUEEN_COLORS, QUEEN_EASE } from "./queen-motion";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

export function QueenKailaneHaxrSignature() {
  const reduceMotion = useReducedMotion();

  const linkStyle =
    "inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-[0.62rem] tracking-[0.18em] uppercase transition-all duration-300 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#B9975B]";

  return (
    <footer
      id="queen-haxr"
      className="relative px-6 pb-20 pt-12"
      style={{ backgroundColor: QUEEN_COLORS.pearl }}
    >
      <motion.div
        className="mx-auto flex max-w-lg flex-col items-center text-center"
        initial={reduceMotion ? false : { opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1.15, ease: QUEEN_EASE }}
      >
        {/* Eyebrow */}
        <p
          className="text-[0.6rem] uppercase tracking-[0.38em]"
          style={{
            fontFamily:
              "var(--font-jost), var(--font-montserrat), system-ui, sans-serif",
            color: QUEEN_COLORS.taupe,
          }}
        >
          {QUEEN_KAILANE_COPY.haxrLine}
        </p>

        {/* HAXR Signature Emblem */}
        <a
          href={HAXR_AUTH.website}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative mt-6 block focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#B9975B]"
          aria-label={`${HAXR_AUTH.brand} — ${HAXR_AUTH.tagline}`}
        >
          <div className="relative h-14 w-14 transition-transform duration-500 group-hover:scale-105">
            <Image
              src={HAXR_AUTH.assets.logoVertical}
              alt={HAXR_AUTH.brand}
              fill
              sizes="56px"
              className="object-contain opacity-85 transition-opacity duration-300 group-hover:opacity-100"
            />
          </div>
        </a>

        {/* Brand Name */}
        <p
          className="mt-5 text-[0.82rem] font-medium uppercase tracking-[0.3em]"
          style={{
            fontFamily:
              "var(--font-jost), var(--font-montserrat), system-ui, sans-serif",
            color: QUEEN_COLORS.ink,
          }}
        >
          {HAXR_AUTH.brand}
        </p>

        {/* Tagline / Alta-Costura Digital */}
        <p
          className="mt-1.5 text-[0.6rem] uppercase tracking-[0.24em]"
          style={{
            fontFamily:
              "var(--font-jost), var(--font-montserrat), system-ui, sans-serif",
            color: QUEEN_COLORS.goldMatte,
          }}
        >
          {HAXR_AUTH.tagline}
        </p>

        {/* Subtitle */}
        <p
          className="mt-3 max-w-xs text-[0.62rem] tracking-[0.16em]"
          style={{
            fontFamily:
              "var(--font-jost), var(--font-montserrat), system-ui, sans-serif",
            color: QUEEN_COLORS.taupe,
          }}
        >
          {QUEEN_KAILANE_COPY.haxrSub}
        </p>

        {/* Motto */}
        <p
          className="mt-6 text-[0.82rem] italic leading-relaxed"
          style={{
            fontFamily:
              'var(--font-cormorant), "Cormorant Garamond", Georgia, serif',
            color: QUEEN_COLORS.inkSoft,
          }}
        >
          {HAXR_AUTH.motto}
        </p>

        {/* Social & Contact Links */}
        <nav
          aria-label="Contacto e Redes Sociais HAXR Signature"
          className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3"
        >
          <a
            href={HAXR_AUTH.website}
            target="_blank"
            rel="noopener noreferrer"
            className={linkStyle}
            style={{
              backgroundColor: "rgba(246, 241, 232, 0.7)",
              color: QUEEN_COLORS.ink,
              border: `1px solid ${QUEEN_COLORS.champagne}`,
            }}
          >
            <Globe size={12} strokeWidth={1.5} aria-hidden />
            <span>{HAXR_AUTH.domain}</span>
          </a>

          <a
            href={HAXR_AUTH.social.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className={linkStyle}
            style={{
              backgroundColor: "rgba(246, 241, 232, 0.7)",
              color: QUEEN_COLORS.ink,
              border: `1px solid ${QUEEN_COLORS.champagne}`,
            }}
          >
            <InstagramIcon />
            <span>{HAXR_AUTH.social.handle}</span>
          </a>

          <a
            href={`mailto:${HAXR_AUTH.email.hello}`}
            className={linkStyle}
            style={{
              backgroundColor: "rgba(246, 241, 232, 0.7)",
              color: QUEEN_COLORS.ink,
              border: `1px solid ${QUEEN_COLORS.champagne}`,
            }}
          >
            <Mail size={12} strokeWidth={1.5} aria-hidden />
            <span>{HAXR_AUTH.email.hello}</span>
          </a>
        </nav>

        {/* Divider */}
        <div
          className="my-9 h-px w-16"
          style={{
            background: `linear-gradient(90deg, transparent, ${QUEEN_COLORS.champagne}, transparent)`,
          }}
          aria-hidden="true"
        />

        {/* Music & Soundtrack Credits */}
        <aside
          className="w-full rounded-sm p-5 text-left transition-all duration-300"
          style={{
            backgroundColor: "rgba(246, 241, 232, 0.55)",
            border: `1px solid ${QUEEN_COLORS.champagne}`,
          }}
          aria-label="Créditos da trilha sonora"
        >
          <div className="flex items-start gap-3">
            <div
              className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full"
              style={{
                backgroundColor: "rgba(185, 151, 91, 0.12)",
                color: QUEEN_COLORS.goldMatte,
              }}
            >
              <Music size={13} strokeWidth={1.5} aria-hidden />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-[0.58rem] font-semibold uppercase tracking-[0.24em]"
                style={{
                  fontFamily:
                    "var(--font-jost), var(--font-montserrat), system-ui, sans-serif",
                  color: QUEEN_COLORS.goldMatte,
                }}
              >
                Música de Ambiente · Sacramento do Crisma
              </p>
              <p
                className="mt-1 text-[0.8rem] font-medium tracking-wide"
                style={{
                  fontFamily:
                    'var(--font-cormorant), "Cormorant Garamond", Georgia, serif',
                  color: QUEEN_COLORS.ink,
                }}
              >
                Tatana Yamukela Mhamba
              </p>
              <p
                className="mt-0.5 text-[0.62rem] tracking-wider"
                style={{
                  fontFamily:
                    "var(--font-jost), var(--font-montserrat), system-ui, sans-serif",
                  color: QUEEN_COLORS.taupe,
                }}
              >
                Cântico Litúrgico · Paróquia de São Estêvão e Lourenço
              </p>
              <p
                className="mt-2.5 text-[0.58rem] leading-relaxed"
                style={{
                  fontFamily:
                    "var(--font-jost), var(--font-montserrat), system-ui, sans-serif",
                  color: QUEEN_COLORS.taupe,
                }}
              >
                Música de ambiente no convite digital. Todos os direitos da obra
                pertencem aos respectivos autores e titulares. A HAXR Signature
                não detém nem reivindica qualquer direito sobre este conteúdo
                musical.
              </p>
            </div>
          </div>
        </aside>

        {/* Copyright & Location */}
        <div className="mt-8 space-y-1 text-center">
          <p
            className="text-[0.58rem] tracking-[0.22em] uppercase"
            style={{
              fontFamily:
                "var(--font-jost), var(--font-montserrat), system-ui, sans-serif",
              color: QUEEN_COLORS.taupe,
            }}
          >
            {formatCopyright()}
          </p>
          <p
            className="text-[0.55rem] tracking-[0.2em] uppercase"
            style={{
              fontFamily:
                "var(--font-jost), var(--font-montserrat), system-ui, sans-serif",
              color: QUEEN_COLORS.goldMatte,
            }}
          >
            {HAXR_AUTH.location}
          </p>
        </div>
      </motion.div>
    </footer>
  );
}
