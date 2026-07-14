"use client";

import React from "react";
import Image from "next/image";
import { motion } from "motion/react";
import {
  Calendar,
  Clock,
  MapPin,
  Music2,
  Navigation,
  Shirt,
} from "lucide-react";
import {
  formatCopyright,
  formatStudioCredit,
  HAXR_AUTH,
} from "@lib/brand/authorship";
import {
  buildTraditionalGoogleCalendarUrl,
  downloadTraditionalIcsFile,
  TRADITIONAL_COPY,
  TRADITIONAL_ASSETS,
  TRADITIONAL_COUPLE,
  TRADITIONAL_EVENT,
  TRADITIONAL_PARENTS,
  TRADITIONAL_VENUE,
  formatTraditionalEventDate,
  formatTraditionalHeroDateDots,
} from "@lib/jessica-samuel-traditional/event-details";
import { useExperience } from "../../context";
import { primaveraType } from "./primavera-typography";
import {
  primaveraReveal,
  primaveraStagger,
  primaveraViewport,
} from "./primavera-motion";
import {
  PrimaveraHeroWave,
  LoboloCrest,
  SpringPetalCluster,
  WovenDivider,
} from "./primavera-motifs";
import { PrimaveraEditorialHeading } from "./primavera-editorial-heading";
import { PRIMAVERA_LAYOUT, PRIMAVERA_SURFACES } from "./primavera-surfaces";

type DetailIconProps = {
  className?: string;
  strokeWidth?: number;
};

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function PrimaveraCta({
  children,
  onClick,
  variant = "primary",
  href,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "outline" | "gold";
  href?: string;
}) {
  const className =
    "inline-flex items-center justify-center gap-2 px-8 py-3.5 text-[10px] sm:text-[11px] tracking-[0.26em] uppercase transition-all duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded-sm";

  const style =
    variant === "primary"
      ? {
          backgroundColor: PRIMAVERA_SURFACES.terracotta,
          color: PRIMAVERA_SURFACES.ivoryLight,
          boxShadow: "0 8px 24px rgba(196, 92, 38, 0.28)",
        }
      : variant === "gold"
        ? {
            backgroundColor: PRIMAVERA_SURFACES.gold,
            color: PRIMAVERA_SURFACES.ink,
            boxShadow: "0 8px 24px rgba(201, 162, 39, 0.25)",
          }
        : {
            border: `1px solid ${PRIMAVERA_SURFACES.gold}`,
            color: PRIMAVERA_SURFACES.ink,
            backgroundColor: "rgba(255, 250, 245, 0.5)",
          };

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className} style={style}>
        {children}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className} style={style}>
      {children}
    </button>
  );
}

export { PrimaveraEditorialHeading } from "./primavera-editorial-heading";

function PrimaveraThemeDetailIcon({ className }: DetailIconProps) {
  return (
    <SpringPetalCluster
      className={className}
      fill={PRIMAVERA_SURFACES.terracotta}
    />
  );
}

function PrimaveraCalendarActions({
  dateIso,
  timeLabel,
  className = "",
}: {
  dateIso: string;
  timeLabel: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center gap-4 ${className}`.trim()}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
        <a
          href={buildTraditionalGoogleCalendarUrl(dateIso, timeLabel)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-[9px] sm:text-[10px] tracking-[0.24em] uppercase rounded-sm border transition-all duration-300 hover:opacity-90"
          style={{
            borderColor: `${PRIMAVERA_SURFACES.gold}70`,
            color: PRIMAVERA_SURFACES.terracottaDeep,
            backgroundColor: `${PRIMAVERA_SURFACES.gold}12`,
          }}
        >
          <Calendar className="w-4 h-4" strokeWidth={1.5} />
          Google Calendar
        </a>
        <button
          type="button"
          onClick={downloadTraditionalIcsFile}
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-[9px] sm:text-[10px] tracking-[0.24em] uppercase rounded-sm border transition-all duration-300 hover:opacity-90"
          style={{
            borderColor: `${PRIMAVERA_SURFACES.terracotta}45`,
            color: PRIMAVERA_SURFACES.terracottaDeep,
            backgroundColor: `${PRIMAVERA_SURFACES.ivory}`,
          }}
        >
          <Calendar className="w-4 h-4" strokeWidth={1.5} />
          Outlook / Apple
        </button>
      </div>
      <p className="text-[9px] tracking-[0.18em] uppercase opacity-45">
        Guarde a data no seu calendário
      </p>
    </div>
  );
}

function HeroScrollChevrons() {
  const chev = (
    <svg
      width="22"
      height="14"
      viewBox="0 0 20 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M1.5 2.5L10 9.5 18.5 2.5"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const scrollDown = {
    duration: 1.35,
    repeat: Infinity,
    ease: "easeInOut" as const,
  };

  return (
    <span className="primavera-hero-intro__chevrons">
      <motion.span
        className="primavera-hero-intro__chev"
        animate={{ y: [0, 11, 0], opacity: [0.55, 1, 0.55] }}
        transition={scrollDown}
      >
        {chev}
      </motion.span>
      <motion.span
        className="primavera-hero-intro__chev primavera-hero-intro__chev--2"
        animate={{ y: [0, 11, 0], opacity: [0.35, 0.9, 0.35] }}
        transition={{ ...scrollDown, delay: 0.18 }}
      >
        {chev}
      </motion.span>
    </span>
  );
}

export function PrimaveraHeroSection() {
  const { introComplete, config } = useExperience();
  const heroDate = formatTraditionalHeroDateDots(config.metadata.date);

  if (!introComplete) return null;

  return (
    <motion.section
      id="hero"
      initial="hidden"
      animate="visible"
      variants={primaveraStagger}
      className="primavera-hero-intro relative overflow-hidden"
      aria-labelledby="primavera-hero-heading"
    >
      <div className="absolute inset-0 z-0">
        <Image
          src={TRADITIONAL_ASSETS.heroImage}
          alt={`${TRADITIONAL_COUPLE.display} — Casamento Tradicional Lobolo`}
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_36%]"
        />
      </div>

      <div className="primavera-hero-intro__gradient" aria-hidden />
      <div className="primavera-hero-intro__bottom-veil" aria-hidden />
      <div className="primavera-hero-intro__film" aria-hidden />

      <div className="primavera-hero-intro__content">
        <motion.div variants={primaveraReveal} className="primavera-hero-intro__copy">
          <p className="primavera-hero-intro__eyebrow">{TRADITIONAL_COPY.heroEyebrow}</p>

          <h1
            className="primavera-hero-intro__names"
            id="primavera-hero-heading"
          >
            <span className="primavera-hero-intro__names-inner">
              <span className="primavera-hero-intro__names-part">
                {TRADITIONAL_COUPLE.bride}
              </span>
              <span className="primavera-hero-intro__names-amp">&amp;</span>
              <span className="primavera-hero-intro__names-part">
                {TRADITIONAL_COUPLE.groom}
              </span>
            </span>
          </h1>

          <p className="primavera-hero-intro__date">{heroDate}</p>
        </motion.div>

        <motion.a
          href="#cerimonia"
          className="primavera-hero-intro__scroll"
          aria-label="Descer para continuar a ler o convite"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          onClick={(event) => {
            event.preventDefault();
            scrollToId("cerimonia");
          }}
        >
          <HeroScrollChevrons />
        </motion.a>
      </div>

      <PrimaveraHeroWave />
    </motion.section>
  );
}

export function PrimaveraIntroSection() {
  const { theme } = useExperience();

  return (
    <motion.section
      id="cerimonia"
      initial="hidden"
      whileInView="visible"
      viewport={primaveraViewport}
      variants={primaveraStagger}
      className={`primavera-quote-section relative z-[1] -mt-px ${PRIMAVERA_LAYOUT.section} py-16 sm:py-20 md:py-28 lg:py-32 ${theme.palette.textPrimary}`}
    >
      <div className={`${PRIMAVERA_LAYOUT.containerWide}`}>
        <motion.div variants={primaveraReveal} className="primavera-quote-section__inner">
          <h2 className="primavera-quote-section__title">
            {TRADITIONAL_COPY.introQuoteTitle}
          </h2>

          <p className="primavera-quote-section__body">{TRADITIONAL_COPY.intro}</p>

          <div className="primavera-quote-section__divider" aria-hidden />

          <p className="primavera-quote-section__attribution">
            {TRADITIONAL_COPY.introQuoteAttribution}
          </p>
        </motion.div>
      </div>
    </motion.section>
  );
}

function CoupleParentBlock({
  firstName,
  lineageLabel,
  parents,
  className = "",
}: {
  firstName: string;
  lineageLabel: string;
  parents: readonly string[];
  className?: string;
}) {
  return (
    <div className={`primavera-couple-profile ${className}`.trim()}>
      <h3 className="primavera-couple-profile__name">{firstName}</h3>
      <p className="primavera-couple-profile__lineage">{lineageLabel}</p>
      <div className="primavera-couple-profile__parents">
        {parents.map((name) => (
          <p key={name} className="primavera-couple-profile__parent">
            {name}
          </p>
        ))}
      </div>
    </div>
  );
}

export function PrimaveraFamiliesSection() {
  const { theme } = useExperience();

  return (
    <motion.section
      id="familias"
      initial="hidden"
      whileInView="visible"
      viewport={primaveraViewport}
      variants={primaveraStagger}
      className={`primavera-families-section relative z-[1] ${PRIMAVERA_LAYOUT.section} py-12 sm:py-16 md:py-20 lg:py-24 ${theme.palette.textPrimary}`}
    >
      <div className={PRIMAVERA_LAYOUT.containerNarrow}>
        <motion.div variants={primaveraReveal} className="primavera-families-card">
          <div className="primavera-families-card__arch" aria-hidden>
            <svg viewBox="0 0 400 48" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
              <path
                fill="currentColor"
                d="M0,48 Q200,0 400,48 Z"
              />
            </svg>
          </div>

          <div className="primavera-families-card__photo-wrap">
            <div className="primavera-families-card__photo-ring">
              <Image
                src={TRADITIONAL_ASSETS.heroImage}
                alt={`${TRADITIONAL_COUPLE.bride} e ${TRADITIONAL_COUPLE.groom}`}
                width={168}
                height={168}
                className="primavera-families-card__photo"
                sizes="168px"
              />
            </div>
            <div className="primavera-families-card__crest" aria-hidden>
              <LoboloCrest className="w-full h-full" />
            </div>
          </div>

          <div className="primavera-families-card__body">
            <PrimaveraEditorialHeading
              eyebrow="União das Famílias"
              title={TRADITIONAL_COPY.coupleSectionTitle}
              compact
              className="mb-2 md:mb-4"
            />

            <div className="primavera-families-card__couple">
              <CoupleParentBlock
                className="primavera-couple-profile--groom"
                firstName="Samuel"
                lineageLabel={TRADITIONAL_COPY.sonOfLabel}
                parents={TRADITIONAL_PARENTS.groom.names}
              />
              <div className="primavera-families-card__couple-divider" aria-hidden />
              <CoupleParentBlock
                className="primavera-couple-profile--bride"
                firstName="Jessica"
                lineageLabel={TRADITIONAL_COPY.daughterOfLabel}
                parents={TRADITIONAL_PARENTS.bride.names}
              />
            </div>

            <WovenDivider className="w-36 sm:w-44 h-3 mx-auto my-8 md:my-10" color={PRIMAVERA_SURFACES.gold} />

            <div className="primavera-families-card__invitation">
              <p className="primavera-families-card__invitation-lead">
                {TRADITIONAL_COPY.invitationLead}
              </p>
              <p className="primavera-families-card__invitation-body">
                {TRADITIONAL_COPY.invitationBody}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}

export function PrimaveraDetailsSection() {
  const { theme, config } = useExperience();
  const eventDate = formatTraditionalEventDate(config.metadata.date);

  const details = [
    { icon: Calendar, label: "Cerimónia", value: "Casamento Tradicional · Lobolo" },
    { icon: PrimaveraThemeDetailIcon, label: "Tema", value: TRADITIONAL_EVENT.themeName },
    { icon: Shirt, label: "Dress Code", value: TRADITIONAL_EVENT.dressCode },
    { icon: Clock, label: TRADITIONAL_EVENT.waterToastLabel, value: TRADITIONAL_EVENT.waterToastTime },
    { icon: MapPin, label: "Local", value: TRADITIONAL_EVENT.locationName },
    { icon: Calendar, label: "Data", value: eventDate },
  ] as const;

  return (
    <motion.section
      id="detalhes"
      initial="hidden"
      whileInView="visible"
      viewport={primaveraViewport}
      variants={primaveraStagger}
      className={`${PRIMAVERA_LAYOUT.section} py-20 md:py-28 ${theme.palette.textPrimary}`}
      style={{ backgroundColor: PRIMAVERA_SURFACES.ivoryLight }}
    >
      <div className={PRIMAVERA_LAYOUT.container}>
        <motion.div variants={primaveraReveal} className="mb-12 md:mb-16">
          <PrimaveraEditorialHeading
            eyebrow={theme.copy.detailsTitle}
            title="Quando & Onde"
          />
        </motion.div>

        <motion.div
          variants={primaveraReveal}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5"
        >
          {details.map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="p-6 md:p-7 rounded-sm border transition-shadow duration-500 hover:shadow-lg"
              style={{
                backgroundColor: PRIMAVERA_SURFACES.ivory,
                borderColor: `${PRIMAVERA_SURFACES.gold}35`,
              }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center mb-4"
                style={{
                  backgroundColor: `${PRIMAVERA_SURFACES.gold}22`,
                  color: PRIMAVERA_SURFACES.terracottaDeep,
                }}
              >
                <Icon className="w-4 h-4" strokeWidth={1.5} />
              </div>
              <p className="text-[9px] tracking-[0.26em] uppercase opacity-55 mb-2">{label}</p>
              <p className={`${primaveraType.detailValue} capitalize`}>{value}</p>
            </div>
          ))}
        </motion.div>

        <motion.div variants={primaveraReveal} className="mt-12 md:mt-16">
          <PrimaveraCalendarActions
            dateIso={config.metadata.date}
            timeLabel={config.metadata.time}
          />
        </motion.div>
      </div>
    </motion.section>
  );
}

export function PrimaveraLocationSection() {
  const { theme } = useExperience();
  const { location } = theme.copy;

  return (
    <motion.section
      id="localizacao"
      initial="hidden"
      whileInView="visible"
      viewport={primaveraViewport}
      variants={primaveraStagger}
      className={`${PRIMAVERA_LAYOUT.section} py-20 md:py-28 ${theme.palette.textPrimary}`}
    >
      <div className={PRIMAVERA_LAYOUT.containerWide}>
        <motion.div variants={primaveraReveal} className="mb-10 md:mb-14">
          <PrimaveraEditorialHeading eyebrow="Localização" title={location.name ?? "O Nosso Encontro"} />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
        <motion.div
          variants={primaveraReveal}
          className="p-8 md:p-10 lg:p-12 rounded-sm flex flex-col justify-center"
          style={{
            background: `linear-gradient(145deg, ${PRIMAVERA_SURFACES.terracottaDeep} 0%, ${PRIMAVERA_SURFACES.ink} 100%)`,
            color: PRIMAVERA_SURFACES.ivoryLight,
          }}
        >
          <p className={`${primaveraType.heroSubtitle} opacity-85 mb-8`}>
            {location.directions}
          </p>
          <div>
            <PrimaveraCta variant="gold" href={location.externalMapUrl}>
              <Navigation className="w-4 h-4" strokeWidth={1.5} />
              Abrir no Google Maps
            </PrimaveraCta>
          </div>
        </motion.div>
        <motion.div
          variants={primaveraReveal}
          className="hidden lg:flex items-center justify-center p-12 rounded-sm border"
          style={{
            backgroundColor: PRIMAVERA_SURFACES.terracottaWash,
            borderColor: `${PRIMAVERA_SURFACES.terracotta}25`,
          }}
        >
          <div className="text-center">
            <MapPin
              className="w-12 h-12 mx-auto mb-6"
              style={{ color: PRIMAVERA_SURFACES.terracotta }}
              strokeWidth={1.25}
            />
            <p className={primaveraType.bodyPoetic} style={{ color: PRIMAVERA_SURFACES.inkSoft }}>
              {TRADITIONAL_VENUE.short}
            </p>
            <WovenDivider className="w-48 h-3 mx-auto mt-8" color={PRIMAVERA_SURFACES.gold} />
          </div>
        </motion.div>
        </div>
      </div>
    </motion.section>
  );
}

export function PrimaveraDressCodeSection() {
  const { theme } = useExperience();

  return (
    <motion.section
      id="dress-code"
      initial="hidden"
      whileInView="visible"
      viewport={primaveraViewport}
      variants={primaveraStagger}
      className={`${PRIMAVERA_LAYOUT.section} py-20 md:py-28 ${theme.palette.textPrimary}`}
      style={{ backgroundColor: PRIMAVERA_SURFACES.terracottaWash }}
    >
      <div className={`${PRIMAVERA_LAYOUT.containerNarrow} text-center`}>
        <motion.div
          variants={primaveraReveal}
          className="p-10 md:p-14 rounded-sm border relative overflow-hidden"
          style={{
            backgroundColor: PRIMAVERA_SURFACES.ivoryLight,
            borderColor: `${PRIMAVERA_SURFACES.gold}50`,
          }}
        >
          <div
            className="absolute inset-x-0 top-0 h-1"
            style={{ background: PRIMAVERA_SURFACES.gold }}
          />
          <PrimaveraEditorialHeading
            eyebrow={theme.copy.dressCode?.label ?? "Dress Code"}
            title={theme.copy.dressCode?.title ?? TRADITIONAL_EVENT.dressCode}
            compact
          />
          <p className={`${primaveraType.bodyPoetic} mt-8 mb-4`}>{TRADITIONAL_COPY.dressCodeLead}</p>
          <p className={`${primaveraType.heroSubtitle} opacity-75`}>
            {TRADITIONAL_COPY.dressCodeBody}
          </p>
        </motion.div>
      </div>
    </motion.section>
  );
}

export function PrimaveraGiftSection() {
  const { theme } = useExperience();
  const hasStoreMaps = Boolean(TRADITIONAL_EVENT.giftStoreMapsUrl);

  return (
    <motion.section
      id="lista-presentes"
      initial="hidden"
      whileInView="visible"
      viewport={primaveraViewport}
      variants={primaveraStagger}
      className={`${PRIMAVERA_LAYOUT.section} py-20 md:py-28 ${theme.palette.textPrimary}`}
    >
      <div className={`${PRIMAVERA_LAYOUT.containerNarrow} text-center`}>
        <motion.div variants={primaveraReveal}>
          <PrimaveraEditorialHeading
            eyebrow="Lista de Presentes"
            title="Com Carinho & Respeito"
          />
          <p className={`${primaveraType.heroSubtitle} mt-8 opacity-80 max-w-xl mx-auto`}>
            {TRADITIONAL_COPY.giftsLead}
          </p>

          <div
            className="mt-10 p-8 md:p-10 rounded-sm border text-left relative overflow-hidden"
            style={{
              background: `linear-gradient(155deg, ${PRIMAVERA_SURFACES.ivoryLight} 0%, ${PRIMAVERA_SURFACES.ivory} 55%, ${PRIMAVERA_SURFACES.terracottaWash} 100%)`,
              borderColor: `${PRIMAVERA_SURFACES.gold}50`,
              boxShadow: "0 18px 48px rgba(158, 66, 24, 0.08)",
            }}
          >
            <div
              className="absolute inset-x-0 top-0 h-1"
              style={{ background: PRIMAVERA_SURFACES.gold }}
            />
            <p className="text-[9px] tracking-[0.3em] uppercase opacity-55 mb-3">
              Consulta presencial
            </p>
            <p
              className={`${primaveraType.sectionTitle} text-2xl sm:text-3xl mb-4`}
              style={{ color: PRIMAVERA_SURFACES.terracottaDeep }}
            >
              {TRADITIONAL_EVENT.giftStoreName}
            </p>
            <p className={`${primaveraType.bodyPoetic} mb-4 opacity-90`}>
              {TRADITIONAL_COPY.giftsConsultNote}
            </p>
            <p className={`${primaveraType.heroSubtitle} opacity-75`}>
              {TRADITIONAL_COPY.giftsStoreNote}
            </p>

            {hasStoreMaps ? (
              <div className="mt-8">
                <PrimaveraCta
                  variant="outline"
                  href={TRADITIONAL_EVENT.giftStoreMapsUrl}
                >
                  <Navigation className="w-4 h-4" strokeWidth={1.5} />
                  Abrir localização da loja
                </PrimaveraCta>
              </div>
            ) : null}
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}

export function PrimaveraFooterSection() {
  const { theme, config } = useExperience();
  const audioCredit =
    theme.audio.type !== "silent" ? theme.audio.credit : undefined;

  return (
    <footer
      className={`${PRIMAVERA_LAYOUT.section} py-16 md:py-24 text-center border-t ${theme.palette.textPrimary}`}
      style={{
        borderColor: `${PRIMAVERA_SURFACES.gold}35`,
        backgroundColor: PRIMAVERA_SURFACES.panelDark,
        color: PRIMAVERA_SURFACES.ivoryLight,
      }}
    >
      <WovenDivider className="w-40 h-3 mx-auto mb-10" color={PRIMAVERA_SURFACES.gold} />
      <p className={`${primaveraType.bodyPoetic} max-w-lg mx-auto mb-10 opacity-90`}>
        {TRADITIONAL_COPY.closing}
      </p>

      {audioCredit ? (
        <aside
          className="max-w-sm mx-auto mb-10 rounded-sm border px-4 py-4 text-left"
          style={{
            borderColor: `${PRIMAVERA_SURFACES.gold}30`,
            backgroundColor: `${PRIMAVERA_SURFACES.terracotta}18`,
          }}
          aria-label="Créditos musicais"
        >
          <div className="flex items-start gap-3">
            <Music2
              size={14}
              strokeWidth={1.25}
              className="shrink-0 mt-0.5 opacity-55"
              style={{ color: PRIMAVERA_SURFACES.gold }}
              aria-hidden
            />
            <div className="space-y-2 min-w-0">
              <p className="text-[7px] tracking-[0.35em] uppercase opacity-50">
                Música de ambiente
              </p>
              <p className="text-[11px] leading-snug opacity-90">
                <span className={`${primaveraType.bodyPoetic} italic`}>
                  {audioCredit.title}
                </span>
                <span className="opacity-50"> · </span>
                <span>{audioCredit.artist}</span>
              </p>
              <p className="text-[8px] leading-relaxed opacity-55">
                {audioCredit.rightsHolder}
              </p>
              <p
                className="text-[7px] leading-relaxed opacity-45 border-t pt-2"
                style={{ borderColor: `${PRIMAVERA_SURFACES.gold}22` }}
              >
                {audioCredit.disclaimer}
              </p>
            </div>
          </div>
        </aside>
      ) : null}

      <div className="flex flex-col items-center gap-4 mb-8">
        <a
          href={HAXR_AUTH.website}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative block transition-opacity duration-500 hover:opacity-100 opacity-90"
          aria-label={`${HAXR_AUTH.brand} — site oficial`}
        >
          <div className="relative w-24 h-24 md:hidden">
            <Image
              src={theme.assets.logoImage}
              alt={HAXR_AUTH.brand}
              fill
              sizes="96px"
              className="object-contain transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </div>
          <div className="relative hidden md:block w-48 h-[3.25rem] lg:w-56 lg:h-[3.75rem]">
            <Image
              src={HAXR_AUTH.assets.logoHorizontal}
              alt={HAXR_AUTH.brand}
              fill
              sizes="224px"
              className="object-contain object-center transition-transform duration-500 group-hover:scale-[1.02]"
            />
          </div>
        </a>
        <p className="text-[8px] tracking-[0.28em] uppercase opacity-45 max-w-xs leading-relaxed">
          {HAXR_AUTH.tagline}
        </p>
      </div>

      <p className="text-[10px] tracking-[0.28em] uppercase opacity-45 mb-2">
        {config.metadata.title}
      </p>
      <p className="text-[10px] tracking-[0.2em] opacity-35">{formatCopyright()}</p>
      <p className="text-[9px] tracking-[0.18em] opacity-30 mt-2">{formatStudioCredit()}</p>
      <a
        href={HAXR_AUTH.website}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block text-[9px] tracking-[0.22em] uppercase opacity-35 mt-4 transition-opacity duration-300 hover:opacity-70"
      >
        {HAXR_AUTH.brand}
      </a>
    </footer>
  );
}
