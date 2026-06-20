"use client";

import Image from "next/image";
import { MapPin } from "lucide-react";
import { COUPLE, FAMILIES } from "@/lib/event-data";
import { COVER } from "@/lib/cover-design";
import {
  CANVAS,
  CLOSING_TEXT,
  COUPLE_NAMES,
  DATE_BLOCK,
  EMBLEM,
  FAMILIES_SECTION,
  INTRO_TEXT,
  INVITATION_LINE,
  LEFT_PANEL,
  LOCATION_BLOCK,
  REF_COLORS,
  RIGHT_OVERLAY,
  TIME_BLOCK,
  TRADITION_ICONS,
  DOT_TITLE,
} from "@/lib/cover-blueprint";

export function HeroSection() {
  const scrollToContent = () => {
    document.getElementById("traditional")?.scrollIntoView({ behavior: "smooth" });
  };

  const brideFirst = COUPLE.bride.split(" ")[0];
  const groomFirst = COUPLE.groom.split(" ")[0];

  return (
    <section className="relative w-full bg-[#0a0a0a] py-0 md:py-6">
      {/* Canvas A5 — replica exacta 723x1024 */}
      <div
        className="cover-canvas relative mx-auto w-full max-w-[723px] overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
        style={{
          aspectRatio: CANVAS.aspectRatio,
          backgroundColor: REF_COLORS.cream,
        }}
      >
        {/* ── PAINEL ESQUERDO 28% ── */}
        <div
          className="absolute inset-y-0 left-0 z-[1]"
          style={{
            width: LEFT_PANEL.width,
            backgroundColor: REF_COLORS.leftBrown,
            backgroundImage: `url('${COVER.assets.lateralPattern}')`,
            backgroundRepeat: "repeat",
            backgroundSize: `${CANVAS.width * 0.28}px auto`,
          }}
          aria-hidden
        />

        {/* ── PAINEL DIREITO 72% ── */}
        <div
          className="absolute inset-y-0 right-0 z-[1]"
          style={{
            width: "72%",
            backgroundColor: REF_COLORS.cream,
          }}
        >
          {/* Overlay ornamental subtil */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url('${COVER.assets.lateralPattern}')`,
              backgroundRepeat: "repeat",
              backgroundSize: "180px auto",
              opacity: RIGHT_OVERLAY.opacity,
            }}
            aria-hidden
          />
        </div>

        {/* ── OBJECTOS CULTURAIS (acima do titulo) ── */}
        <div
          className="absolute z-[5]"
          style={{
            left: TRADITION_ICONS.left,
            top: TRADITION_ICONS.top,
            width: TRADITION_ICONS.width,
            height: TRADITION_ICONS.height,
          }}
        >
          <Image
            src={COVER.assets.traditionIcons}
            alt=""
            fill
            className="object-contain object-left-bottom"
            priority
            sizes="196px"
          />
        </div>

        {/* ── DOT ── */}
        <h1
          className="absolute z-[5] font-playfair font-bold uppercase leading-none"
          style={{
            left: DOT_TITLE.left,
            top: DOT_TITLE.top,
            fontSize: "clamp(2.5rem, 10.2cqw, 4.6rem)",
            color: REF_COLORS.dotGold,
            letterSpacing: "0.02em",
          }}
        >
          {COVER.term}
        </h1>

        {/* ── TEXTO INTRODUTORIO ── */}
        <p
          className="absolute z-[5] text-center font-montserrat font-light leading-[1.65]"
          style={{
            left: INTRO_TEXT.left,
            top: INTRO_TEXT.top,
            width: INTRO_TEXT.width,
            fontSize: "clamp(0.5625rem, 1.85cqw, 0.75rem)",
            color: REF_COLORS.textGrey,
          }}
        >
          {COVER.subtitle}
        </p>

        {/* ── NOMES (abaixo do intro) ── */}
        <p
          className="absolute z-[5] text-center font-script leading-[1.05]"
          style={{
            left: COUPLE_NAMES.left,
            top: COUPLE_NAMES.top,
            width: COUPLE_NAMES.width,
            fontSize: "clamp(2.25rem, 11.5cqw, 5rem)",
            color: REF_COLORS.nameGold,
          }}
        >
          {brideFirst} & {groomFirst}
        </p>

        {/* ── LINHA DE CONVITE ── */}
        <p
          className="absolute z-[5] text-center font-montserrat font-light"
          style={{
            left: INVITATION_LINE.left,
            top: INVITATION_LINE.top,
            width: INVITATION_LINE.width,
            fontSize: "clamp(0.5625rem, 1.8cqw, 0.6875rem)",
            color: REF_COLORS.textSoft,
          }}
        >
          {COVER.invitationLine}
        </p>

        {/* ── DATA — bloco castanho largura total ── */}
        <div
          className="absolute z-[5] flex items-center justify-center"
          style={{
            left: DATE_BLOCK.left,
            top: DATE_BLOCK.top,
            width: DATE_BLOCK.width,
            height: DATE_BLOCK.height,
            backgroundColor: REF_COLORS.barBrown,
          }}
        >
          <p
            className="font-montserrat font-semibold text-white"
            style={{ fontSize: "clamp(0.5625rem, 1.9cqw, 0.75rem)" }}
          >
            {COVER.dateLine}
          </p>
        </div>

        {/* ── HORA — bloco alinhado a direita ── */}
        <div
          className="absolute z-[5] flex items-center justify-center"
          style={{
            right: TIME_BLOCK.right,
            top: TIME_BLOCK.top,
            width: TIME_BLOCK.width,
            height: TIME_BLOCK.height,
            backgroundColor: REF_COLORS.barBrown,
          }}
        >
          <p
            className="font-montserrat font-semibold text-white"
            style={{ fontSize: "clamp(0.5625rem, 1.9cqw, 0.75rem)" }}
          >
            {COVER.timeLine}
          </p>
        </div>

        {/* ── LOCALIZACAO — caixa com borda ── */}
        <a
          href={COVER.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute z-[5] flex items-center justify-center gap-1.5 border bg-white"
          style={{
            left: LOCATION_BLOCK.left,
            top: LOCATION_BLOCK.top,
            width: LOCATION_BLOCK.width,
            height: LOCATION_BLOCK.height,
            borderColor: `${REF_COLORS.borderGold}88`,
          }}
        >
          <MapPin
            className="shrink-0"
            style={{
              width: "clamp(0.75rem, 2cqw, 0.875rem)",
              height: "clamp(0.75rem, 2cqw, 0.875rem)",
              color: REF_COLORS.dotGold,
            }}
            strokeWidth={1.75}
          />
          <span
            className="font-montserrat font-medium"
            style={{
              fontSize: "clamp(0.5625rem, 1.85cqw, 0.6875rem)",
              color: REF_COLORS.textGrey,
            }}
          >
            {COVER.locationLine}
          </span>
        </a>

        {/* ── MENSAGEM DE FECHO ── */}
        <p
          className="absolute z-[5] text-center font-montserrat font-light leading-[1.7]"
          style={{
            left: CLOSING_TEXT.left,
            top: CLOSING_TEXT.top,
            width: CLOSING_TEXT.width,
            fontSize: "clamp(0.5625rem, 1.75cqw, 0.6875rem)",
            color: REF_COLORS.textSoft,
          }}
        >
          {COVER.closingLine}
        </p>

        {/* ── FAMILIAS ── */}
        <div
          className="absolute z-[5] grid grid-cols-2"
          style={{
            left: FAMILIES_SECTION.left,
            bottom: FAMILIES_SECTION.bottom,
            width: FAMILIES_SECTION.width,
            height: FAMILIES_SECTION.height,
          }}
        >
          <div className="flex flex-col items-start justify-end">
            <p
              className="font-script leading-none"
              style={{
                fontSize: "clamp(1rem, 3.5cqw, 1.375rem)",
                color: "#1A1A1A",
              }}
            >
              Família
            </p>
            <p
              className="font-montserrat font-bold uppercase tracking-[0.2em]"
              style={{
                fontSize: "clamp(0.5625rem, 1.85cqw, 0.6875rem)",
                color: "#1A1A1A",
              }}
            >
              {FAMILIES.bride}
            </p>
          </div>
          <div className="flex flex-col items-end justify-end">
            <p
              className="font-script leading-none"
              style={{
                fontSize: "clamp(1rem, 3.5cqw, 1.375rem)",
                color: "#1A1A1A",
              }}
            >
              Família
            </p>
            <p
              className="font-montserrat font-bold uppercase tracking-[0.2em]"
              style={{
                fontSize: "clamp(0.5625rem, 1.85cqw, 0.6875rem)",
                color: "#1A1A1A",
              }}
            >
              {FAMILIES.groom}
            </p>
          </div>
        </div>

        {/* ── EMBLEMA CIRCULAR — sobrepoe ambos os paineis ── */}
        <div
          className="absolute z-[20]"
          style={{
            left: EMBLEM.left,
            top: EMBLEM.top,
            width: EMBLEM.width,
            aspectRatio: "1 / 1",
          }}
        >
          <Image
            src={COVER.assets.mandalaEmblemPng}
            alt=""
            fill
            className="object-contain"
            priority
            sizes="130px"
          />
        </div>
      </div>

      {/* Scroll — fora do canvas de replica */}
      <button
        type="button"
        onClick={scrollToContent}
        aria-label="Descer para o conteudo do convite"
        className="mx-auto mt-4 block font-montserrat text-[9px] uppercase tracking-[0.4em] text-white/40 transition-opacity hover:text-white/70"
      >
        Descer
      </button>
    </section>
  );
}
