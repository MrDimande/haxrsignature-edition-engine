"use client";

import {
    HAXR_AUTH,
    formatCopyright,
    formatStudioCredit,
} from "@lib/brand/authorship";
import {
    WEDDING_ASSETS,
    WEDDING_COPY,
    WEDDING_COUPLE,
    WEDDING_EVENT,
    WEDDING_ITINERARY,
    WEDDING_PARENTS,
    WEDDING_VENUE,
    buildWeddingGoogleCalendarUrl,
    downloadWeddingIcsFile,
    formatWeddingEventDate,
    formatWeddingHeroDateDots,
} from "@lib/jessica-samuel-wedding/event-details";
import { JESSICA_SAMUEL_GIFT_QUOTATION } from "@lib/jessica-samuel-wedding/gifts/quotation-meta";
import { Calendar, Clock, MapPin, Navigation } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useId } from "react";
import { useExperience } from "../../context";
import { JessicaSamuelEditorialHeading } from "./jessica-samuel-editorial-heading";
import { jsReveal, jsStagger, jsViewport } from "./jessica-samuel-motion";
import {
    JS_LAYOUT,
    JS_SECTION_BG,
    JS_SURFACES,
} from "./jessica-samuel-surfaces";
import { jsType } from "./jessica-samuel-typography";

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
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
    <span className="flex flex-col items-center leading-none">
      <motion.span
        animate={{ y: [0, 11, 0], opacity: [0.55, 1, 0.55] }}
        transition={scrollDown}
      >
        {chev}
      </motion.span>
      <motion.span
        className="-mt-1"
        animate={{ y: [0, 11, 0], opacity: [0.35, 0.9, 0.35] }}
        transition={{ ...scrollDown, delay: 0.18 }}
      >
        {chev}
      </motion.span>
    </span>
  );
}

function HeroBottomCurve() {
  return (
    <div className="js-wedding-hero__transition" aria-hidden>
      <div className="js-wedding-hero__feather" />
      <svg
        className="js-wedding-hero__curve"
        viewBox="0 0 1440 132"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill={JS_SURFACES.champagne}
          d="M0,20 Q720,126 1440,20 L1440,132 L0,132 Z"
        />
      </svg>
    </div>
  );
}

/** Rota editorial em “8” — altos, baixos e continuidade da jornada. */
const JOURNEY_FLIGHT_PATH =
  "M54 310 C156 350 304 302 350 222 C395 143 326 74 224 84 C116 94 88 168 150 214 C224 269 354 226 452 176 C552 124 682 143 710 218 C738 292 628 342 526 302 C426 263 396 170 458 98 C516 31 630 36 716 72";

function JourneyPlaneIllustration() {
  const reduceMotion = useReducedMotion();
  const reactId = useId().replace(/:/g, "");
  const pathId = `js-journey-path-${reactId}`;
  const softGlowId = `js-journey-glow-${reactId}`;

  return (
    <div
      className="js-wedding-journey-flight"
      aria-hidden
    >
      <svg
        viewBox="0 0 766 380"
        className="js-wedding-journey-flight__svg"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={softGlowId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={JS_SURFACES.rose} stopOpacity="0" />
            <stop offset="35%" stopColor={JS_SURFACES.rose} stopOpacity="0.55" />
            <stop offset="70%" stopColor={JS_SURFACES.champagneDeep} stopOpacity="0.7" />
            <stop offset="100%" stopColor={JS_SURFACES.wine} stopOpacity="0.15" />
          </linearGradient>
          <filter id={`${reactId}-plane-shadow`} x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow
              dx="0"
              dy="3"
              stdDeviation="3.5"
              floodColor={JS_SURFACES.ink}
              floodOpacity="0.22"
            />
          </filter>
        </defs>

        {/* Elementos de mapa — nuvens, coordenadas e pontos de passagem */}
        <g className="js-wedding-journey-flight__atmosphere">
          <g transform="translate(112 66)">
            <path
              d="M0 18C0 12.5 4.5 8 10 8C11.8 3.4 16.3 0 21.7 0C28.6 0 34.2 5.2 34.8 11.9C40.4 12.1 45 16.7 45 22.4H0V18Z"
              fill={JS_SURFACES.ivory}
              stroke={JS_SURFACES.champagneDeep}
              strokeWidth="0.9"
            />
          </g>
          <g transform="translate(550 254) scale(0.85)">
            <path
              d="M0 18C0 12.5 4.5 8 10 8C11.8 3.4 16.3 0 21.7 0C28.6 0 34.2 5.2 34.8 11.9C40.4 12.1 45 16.7 45 22.4H0V18Z"
              fill={JS_SURFACES.ivory}
              stroke={JS_SURFACES.champagneDeep}
              strokeWidth="0.9"
            />
          </g>
          <g transform="translate(654 116) scale(0.66)">
            <path
              d="M0 18C0 12.5 4.5 8 10 8C11.8 3.4 16.3 0 21.7 0C28.6 0 34.2 5.2 34.8 11.9C40.4 12.1 45 16.7 45 22.4H0V18Z"
              fill={JS_SURFACES.ivory}
              stroke={JS_SURFACES.champagneDeep}
              strokeWidth="1"
            />
          </g>

          <g transform="translate(195 274)">
            <path
              d="M0 -9C5 -9 9 -5 9 0C9 6.5 0 15 0 15C0 15 -9 6.5 -9 0C-9 -5 -5 -9 0 -9Z"
              fill={JS_SURFACES.rose}
              fillOpacity="0.2"
              stroke={JS_SURFACES.rose}
              strokeWidth="1"
            />
            <circle r="2.6" fill={JS_SURFACES.rose} />
          </g>
          <g transform="translate(482 72)">
            <path
              d="M0 -9C5 -9 9 -5 9 0C9 6.5 0 15 0 15C0 15 -9 6.5 -9 0C-9 -5 -5 -9 0 -9Z"
              fill={JS_SURFACES.wine}
              fillOpacity="0.12"
              stroke={JS_SURFACES.wine}
              strokeWidth="1"
            />
            <circle r="2.6" fill={JS_SURFACES.wine} />
          </g>

          <g className="js-wedding-journey-flight__compass" transform="translate(76 116)">
            <circle r="16" stroke={JS_SURFACES.champagneDeep} strokeWidth="0.8" />
            <circle r="11" stroke={JS_SURFACES.champagneDeep} strokeWidth="0.5" />
            <path
              d="M0 -12L3 0L0 12L-3 0Z"
              fill={JS_SURFACES.wine}
              fillOpacity="0.7"
            />
            <path
              d="M-12 0L0 -3L12 0L0 3Z"
              fill={JS_SURFACES.rose}
              fillOpacity="0.55"
            />
          </g>
        </g>

        {/* Aura subtil — leitura de rota em ecrã de bordo */}
        <path
          d={JOURNEY_FLIGHT_PATH}
          stroke={`url(#${softGlowId})`}
          strokeWidth="12"
          strokeLinecap="round"
          opacity="0.22"
        />

        {/* Linha contínua inferior para preservar a forma do “8” */}
        <path
          d={JOURNEY_FLIGHT_PATH}
          stroke={JS_SURFACES.wine}
          strokeWidth="0.8"
          strokeLinecap="round"
          opacity="0.2"
        />

        {/* Rota principal tracejada */}
        <path
          id={pathId}
          className={
            reduceMotion
              ? "js-wedding-journey-flight__path"
              : "js-wedding-journey-flight__path js-wedding-journey-flight__path--live"
          }
          d={JOURNEY_FLIGHT_PATH}
          stroke={JS_SURFACES.champagneDeep}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="2 10"
          opacity="0.95"
        />

        {/* Partida, cruzamentos e destino */}
        <g className="js-wedding-journey-flight__markers">
          <circle cx="54" cy="310" r="4.5" fill={JS_SURFACES.rose} opacity="0.9" />
          <circle
            cx="54"
            cy="310"
            r="9"
            stroke={JS_SURFACES.rose}
            strokeWidth="1"
            opacity="0.35"
            fill="none"
          />
          <circle cx="350" cy="222" r="2.4" fill={JS_SURFACES.champagneDeep} />
          <circle cx="452" cy="176" r="2.4" fill={JS_SURFACES.champagneDeep} />
          <circle cx="716" cy="72" r="4.5" fill={JS_SURFACES.wine} opacity="0.95" />
          <circle
            cx="716"
            cy="72"
            r="9"
            stroke={JS_SURFACES.wine}
            strokeWidth="1"
            opacity="0.35"
            fill="none"
          />
          <text
            x="38"
            y="340"
            className="js-wedding-journey-flight__label"
            fill={JS_SURFACES.wine}
          >
            PARTIDA
          </text>
          <text
            x="662"
            y="48"
            className="js-wedding-journey-flight__label"
            fill={JS_SURFACES.wine}
          >
            DESTINO
          </text>
        </g>

        {/* Avião de papel — leve, editorial e luxuoso */}
        <g
          className="js-wedding-journey-flight__plane"
          filter={`url(#${reactId}-plane-shadow)`}
        >
          <g transform="translate(-30 -24) scale(1.2)">
            <path
              d="M3 21 L53 3 L37 43 L26 27 L3 21 Z"
              fill={JS_SURFACES.ivory}
              stroke={JS_SURFACES.wine}
              strokeWidth="1.05"
              strokeLinejoin="round"
            />
            <path
              d="M3 21 L26 27 L53 3"
              stroke={JS_SURFACES.champagneDeep}
              strokeWidth="1"
              strokeLinejoin="round"
            />
            <path
              d="M26 27 L37 43 L32 28 L53 3"
              fill={JS_SURFACES.rose}
              fillOpacity="0.35"
              stroke={JS_SURFACES.wine}
              strokeWidth="0.85"
              strokeLinejoin="round"
            />
            <path
              d="M7 20 L53 3"
              stroke={JS_SURFACES.ivory}
              strokeWidth="0.7"
              opacity="0.8"
              strokeLinecap="round"
            />
          </g>

          {reduceMotion ? (
            <animateMotion
              dur="0.01s"
              fill="freeze"
              rotate="auto"
              keyPoints="0.52;0.52"
              keyTimes="0;1"
              calcMode="linear"
            >
              <mpath xlinkHref={`#${pathId}`} href={`#${pathId}`} />
            </animateMotion>
          ) : (
            <animateMotion
              dur="17s"
              repeatCount="indefinite"
              rotate="auto"
              calcMode="linear"
            >
              <mpath xlinkHref={`#${pathId}`} href={`#${pathId}`} />
            </animateMotion>
          )}
          {!reduceMotion ? (
            <animate
              attributeName="opacity"
              dur="17s"
              repeatCount="indefinite"
              values="0;1;1;0"
              keyTimes="0;0.04;0.95;1"
            />
          ) : null}
        </g>
      </svg>
    </div>
  );
}
function SectionHeading({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <JessicaSamuelEditorialHeading
      eyebrow={eyebrow}
      title={title}
      className="mb-12 md:mb-16"
    />
  );
}

export function JessicaSamuelHeroSection() {
  const { introComplete, config } = useExperience();
  const heroDate = formatWeddingHeroDateDots(config.metadata.date);

  if (!introComplete) return null;

  return (
    <motion.section
      id="hero"
      initial="hidden"
      animate="visible"
      variants={jsStagger}
      className="relative h-[100svh] max-h-[100svh] overflow-hidden"
      aria-labelledby="wedding-hero-heading"
    >
      <div className="absolute inset-0 z-0">
        <Image
          src={WEDDING_ASSETS.heroImage}
          alt={`${WEDDING_COUPLE.display} — Casamento`}
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_48%] sm:object-[center_42%] md:object-[center_38%]"
          style={{
            filter: "contrast(1.04) brightness(1.02) saturate(1.04)",
          }}
        />
      </div>

      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        aria-hidden
        style={{
          background: `linear-gradient(180deg, ${JS_SURFACES.heroWarm} 0%, transparent 32%, transparent 48%, ${JS_SURFACES.heroVeil} 100%)`,
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 z-[2] h-[36vh] pointer-events-none"
        aria-hidden
        style={{
          background: `linear-gradient(180deg, transparent 0%, rgba(23,19,18,0.28) 38%, rgba(23,19,18,0.62) 100%)`,
        }}
      />

      <div className="relative z-[3] flex h-full items-end justify-center px-5 pb-24 sm:px-8 md:pb-28 lg:pb-32">
        <motion.div
          variants={jsReveal}
          className="js-wedding-hero-intro__copy w-full max-w-3xl text-center"
        >
          <p className="js-wedding-hero-intro__eyebrow">
            {WEDDING_COPY.heroEyebrow}
          </p>

          <h1
            className="js-wedding-hero-intro__names"
            id="wedding-hero-heading"
          >
            <span className="js-wedding-hero-intro__names-inner">
              <span className="js-wedding-hero-intro__names-part">
                {WEDDING_COUPLE.bride}
              </span>
              <span className="js-wedding-hero-intro__names-amp">&amp;</span>
              <span className="js-wedding-hero-intro__names-part">
                {WEDDING_COUPLE.groom}
              </span>
            </span>
          </h1>

          <p className="js-wedding-hero-intro__date">{heroDate}</p>
        </motion.div>
      </div>

      <motion.a
        href="#intro"
        className="absolute bottom-8 left-1/2 z-[4] -translate-x-1/2 inline-flex items-center justify-center text-center"
        style={{ color: JS_SURFACES.ivory }}
        aria-label="Descer para continuar a ler o convite"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        onClick={(event) => {
          event.preventDefault();
          scrollToId("intro");
        }}
      >
        <HeroScrollChevrons />
      </motion.a>
      <HeroBottomCurve />
    </motion.section>
  );
}

export function JessicaSamuelIntroSection() {
  const { theme } = useExperience();

  return (
    <motion.section
      id="intro"
      initial="hidden"
      whileInView="visible"
      viewport={jsViewport}
      variants={jsStagger}
      className={`${JS_LAYOUT.section} py-20 md:py-28`}
      style={{ backgroundColor: JS_SECTION_BG.secondary }}
    >
      <motion.div variants={jsReveal} className={JS_LAYOUT.containerNarrow}>
        <div className="js-wedding-quote-section__inner">
          <h2 className="js-wedding-quote-section__title">
            {WEDDING_COPY.introScriptTitle}
          </h2>
          <p className="js-wedding-quote-section__body">
            {WEDDING_EVENT.bibleVerse}
          </p>
          <p className="js-wedding-quote-section__attribution">
            {WEDDING_EVENT.bibleReference}
          </p>
          <div className="js-wedding-quote-section__divider" aria-hidden />
          <p className="js-wedding-quote-section__body">
            {theme.copy.detailsQuote ?? WEDDING_COPY.intro}
          </p>
        </div>
      </motion.div>
    </motion.section>
  );
}

function CoupleParentBlock({
  fullName,
  lineageLabel,
  parents,
  className = "",
}: {
  fullName: string;
  lineageLabel: string;
  parents: readonly string[];
  className?: string;
}) {
  return (
    <div className={`js-wedding-couple-card ${className}`.trim()}>
      <h3 className="js-wedding-couple-card__name">{fullName}</h3>
      <p className="js-wedding-couple-card__lineage">
        {lineageLabel}{" "}
        {parents.map((name, index) => (
          <span key={name}>
            {index > 0 ? (
              <>
                {" "}
                <span className="js-wedding-couple-card__amp">&amp;</span>{" "}
              </>
            ) : null}
            {name}
          </span>
        ))}
      </p>
    </div>
  );
}

export function JessicaSamuelFamiliesSection() {
  return (
    <motion.section
      id="familias"
      initial="hidden"
      whileInView="visible"
      viewport={jsViewport}
      variants={jsStagger}
      className="js-wedding-couple-section relative z-[1] py-10 sm:py-14 md:py-20"
    >
      <div className="js-wedding-couple-section__shell">
        <motion.div variants={jsReveal} className="js-wedding-couple-section__title">
          <JessicaSamuelEditorialHeading
            eyebrow={WEDDING_COPY.familiesEyebrow}
            title={WEDDING_COPY.coupleSectionTitle}
            compact
          />
        </motion.div>

        <motion.div variants={jsReveal} className="js-wedding-couple-wrap">
          <div className="js-wedding-couple-wrap__inner">
            <div className="js-wedding-couple-grid">
              <CoupleParentBlock
                className="js-wedding-couple-card--bride"
                fullName={WEDDING_COUPLE.bride}
                lineageLabel={WEDDING_COPY.daughterOfLabel}
                parents={WEDDING_PARENTS.bride.names}
              />

              <div className="js-wedding-couple-photo-column">
                <div className="js-wedding-couple-photo-frame">
                  <figure className="js-wedding-couple-photo">
                    <Image
                      src={WEDDING_ASSETS.coupleImage}
                      alt={`${WEDDING_COUPLE.bride} e ${WEDDING_COUPLE.groom}`}
                      width={416}
                      height={1040}
                      className="js-wedding-couple-photo__img"
                      sizes="(max-width: 980px) 72vw, 208px"
                    />
                  </figure>
                  <Image
                    src="/images/jessica-samuel-wedding/floral/floral-crown.webp"
                    alt=""
                    width={865}
                    height={570}
                    className="js-wedding-couple-crown"
                    sizes="(max-width: 980px) 90vw, 280px"
                    aria-hidden
                  />
                </div>
              </div>

              <CoupleParentBlock
                className="js-wedding-couple-card--groom"
                fullName={WEDDING_COUPLE.groom}
                lineageLabel={WEDDING_COPY.sonOfLabel}
                parents={WEDDING_PARENTS.groom.names}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}

export function JessicaSamuelJourneySection() {
  return (
    <motion.section
      id="journey"
      initial="hidden"
      whileInView="visible"
      viewport={jsViewport}
      variants={jsStagger}
      className={`${JS_LAYOUT.section} py-16 md:py-22`}
      style={{ backgroundColor: JS_SECTION_BG.primary }}
    >
      <motion.div variants={jsReveal} className={JS_LAYOUT.containerNarrow}>
        <JessicaSamuelEditorialHeading
          eyebrow={WEDDING_COPY.journeyEyebrow}
          title={WEDDING_COPY.journeyScriptTitle}
          className="mb-10 md:mb-12"
        />
        <p
          className="js-wedding-quote-section__body mx-auto text-center"
          style={{ maxWidth: "34rem" }}
        >
          Entre promessas, fé e destino, seguimos rumo ao nosso novo capítulo.
          Como numa viagem sonhada há muito tempo, cada passo trouxe-nos até
          este encontro de amor, família e celebração.
        </p>

        <JourneyPlaneIllustration />

        <p
          className={`${jsType.bodyPoetic} mt-8 text-center`}
          style={{ color: JS_SURFACES.rose }}
        >
          Do caminho percorrido ao futuro que vamos construir juntos.
        </p>
      </motion.div>
    </motion.section>
  );
}

export function JessicaSamuelDetailsSection() {
  const calendarUrl = buildWeddingGoogleCalendarUrl();

  return (
    <motion.section
      id="detalhes"
      initial="hidden"
      whileInView="visible"
      viewport={jsViewport}
      variants={jsStagger}
      className={`${JS_LAYOUT.section} py-16 md:py-24`}
      style={{ backgroundColor: JS_SECTION_BG.secondary }}
    >
      <motion.div variants={jsReveal} className={JS_LAYOUT.container}>
        <SectionHeading eyebrow="Agenda" title="Os Detalhes" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {[
            {
              icon: Calendar,
              label: "Data",
              value: formatWeddingEventDate(WEDDING_EVENT.dateIso),
            },
            {
              icon: Clock,
              label: "Horário",
              value: WEDDING_EVENT.timeLabel,
            },
            {
              icon: MapPin,
              label: "Local",
              value: "Consultar o itinerário",
              href: "#guia-celebracao" as string | undefined,
            },
          ].map(({ icon: Icon, label, value, href }) => (
            <div
              key={label}
              className="p-8 rounded-sm border text-center"
              style={{
                borderColor: JS_SURFACES.line,
                backgroundColor: JS_SURFACES.champagne,
              }}
            >
              <Icon
                className="w-5 h-5 mx-auto mb-4"
                style={{ color: JS_SURFACES.wine }}
                aria-hidden
              />
              <p
                className={`${jsType.micro} mb-2`}
                style={{ color: JS_SURFACES.wine }}
              >
                {label}
              </p>
              {href ? (
                <a
                  href={href}
                  className={`${jsType.body} underline-offset-4 hover:underline`}
                  style={{ color: JS_SURFACES.ink }}
                >
                  {value}
                </a>
              ) : (
                <p
                  className={`${jsType.body}${label === "Data" ? " capitalize" : ""}`}
                  style={{ color: JS_SURFACES.ink }}
                >
                  {value}
                </p>
              )}
            </div>
          ))}
        </div>
        {calendarUrl && (
          <div className="flex flex-wrap justify-center gap-4 mt-10">
            <a
              href={calendarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`${jsType.micro} inline-flex items-center gap-2 px-6 py-3 border-0 transition-colors`}
              style={{
                color: JS_SURFACES.ivory,
                backgroundColor: JS_SURFACES.wine,
              }}
            >
              <Calendar className="w-4 h-4" aria-hidden />
              Google Calendar
            </a>
            <button
              type="button"
              onClick={downloadWeddingIcsFile}
              className={`${jsType.micro} inline-flex items-center gap-2 px-6 py-3 border transition-colors`}
              style={{
                borderColor: JS_SURFACES.champagneDeep,
                color: JS_SURFACES.ink,
                backgroundColor: JS_SURFACES.ivory,
              }}
            >
              Descarregar .ics
            </button>
          </div>
        )}
      </motion.div>
    </motion.section>
  );
}

export function JessicaSamuelItinerarySection() {
  return (
    <motion.section
      id="o-nosso-dia"
      initial="hidden"
      whileInView="visible"
      viewport={jsViewport}
      variants={jsStagger}
      className={`${JS_LAYOUT.section} py-16 md:py-24`}
      style={{ backgroundColor: JS_SECTION_BG.primary }}
    >
      <motion.div variants={jsReveal} className={JS_LAYOUT.containerNarrow}>
        <JessicaSamuelEditorialHeading
          eyebrow={WEDDING_COPY.itineraryEyebrow}
          title={WEDDING_COPY.itineraryTitle}
          className="mb-6 md:mb-8"
        />
        <p
          className={`${jsType.body} text-center max-w-xl mx-auto mb-12 md:mb-14`}
          style={{ color: JS_SURFACES.inkSoft }}
        >
          {WEDDING_COPY.itineraryLead}
        </p>

        <ol className="js-wedding-itinerary">
          {WEDDING_ITINERARY.map((moment, index) => {
            const isLast = index === WEDDING_ITINERARY.length - 1;
            return (
              <motion.li
                key={moment.id}
                variants={jsReveal}
                className={`js-wedding-itinerary__item${isLast ? " js-wedding-itinerary__item--last" : ""}`}
              >
                <div className="js-wedding-itinerary__rail" aria-hidden>
                  <span className="js-wedding-itinerary__dot" />
                  {!isLast ? <span className="js-wedding-itinerary__line" /> : null}
                </div>

                <div className="js-wedding-itinerary__content">
                  <p className="js-wedding-itinerary__time">{moment.timeLabel}</p>
                  <h3 className="js-wedding-itinerary__title">{moment.title}</h3>
                  {(moment.locationLines ?? (moment.location ? [moment.location] : null))?.map(
                    (line) => (
                      <p key={line} className="js-wedding-itinerary__location">
                        {line}
                      </p>
                    )
                  )}
                  {moment.note ? (
                    <p className="js-wedding-itinerary__note">{moment.note}</p>
                  ) : null}
                  {moment.mapsUrl ? (
                    <a
                      href={moment.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="js-wedding-itinerary__maps"
                    >
                      <Navigation className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden />
                      {WEDDING_COPY.itineraryMapsCta}
                    </a>
                  ) : null}
                </div>
              </motion.li>
            );
          })}
        </ol>
      </motion.div>
    </motion.section>
  );
}

export function JessicaSamuelGiftSection() {
  const hasStoreMaps = Boolean(WEDDING_EVENT.giftStoreMapsUrl);
  const phoneHref = `tel:+${WEDDING_EVENT.giftStorePhoneTel}`;

  return (
    <motion.section
      id="lista-presentes"
      initial="hidden"
      whileInView="visible"
      viewport={jsViewport}
      variants={jsStagger}
      className={`${JS_LAYOUT.section} py-20 md:py-28`}
      style={{ backgroundColor: JS_SECTION_BG.secondary }}
    >
      <motion.div
        variants={jsReveal}
        className={`${JS_LAYOUT.containerNarrow} text-center`}
      >
        <JessicaSamuelEditorialHeading
          eyebrow="Lista de Presentes"
          title="Com Carinho & Respeito"
        />
        <p
          className={`${jsType.body} mt-8 max-w-xl mx-auto`}
          style={{ color: JS_SURFACES.inkSoft }}
        >
          {WEDDING_COPY.giftsLead}
        </p>

        <div className="mt-10 text-left max-w-md mx-auto">
          <p
            className={`${jsType.micro} mb-2`}
            style={{ color: JS_SURFACES.wine }}
          >
            Consulta presencial
          </p>
          <p
            className={`${jsType.sectionTitle} text-2xl sm:text-3xl mb-1`}
            style={{ color: JS_SURFACES.ink }}
          >
            {WEDDING_EVENT.giftStoreName}
          </p>
          <p
            className={`${jsType.bodyPoetic} mb-1`}
            style={{ color: JS_SURFACES.inkSoft }}
          >
            {WEDDING_EVENT.giftStoreAddress}
          </p>
          <a
            href={phoneHref}
            className={`${jsType.body} inline-block mb-4`}
            style={{ color: JS_SURFACES.wine }}
          >
            {WEDDING_EVENT.giftStorePhoneDisplay}
          </a>
          <div className="mb-3 space-y-1">
            <p
              className={`${jsType.bodyPoetic} text-lg`}
              style={{ color: JS_SURFACES.ink }}
            >
              {JESSICA_SAMUEL_GIFT_QUOTATION.listDisplayName}
            </p>
            <p className={jsType.body} style={{ color: JS_SURFACES.inkSoft }}>
              {JESSICA_SAMUEL_GIFT_QUOTATION.quotationLine}
            </p>
            <p
              className={`${jsType.bodyPoetic}`}
              style={{ color: JS_SURFACES.inkSoft }}
            >
              {JESSICA_SAMUEL_GIFT_QUOTATION.issuedLine}
            </p>
          </div>
          <p className={jsType.body} style={{ color: JS_SURFACES.inkSoft }}>
            {WEDDING_COPY.giftsConsultNote}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {hasStoreMaps ? (
              <a
                href={WEDDING_EVENT.giftStoreMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${jsType.micro} inline-flex items-center gap-2 px-6 py-3 border transition-colors`}
                style={{
                  borderColor: JS_SURFACES.champagneDeep,
                  color: JS_SURFACES.ink,
                  backgroundColor: JS_SURFACES.ivory,
                }}
              >
                <Navigation className="w-4 h-4" strokeWidth={1.5} aria-hidden />
                Abrir no Maps
              </a>
            ) : null}
            <a
              href={phoneHref}
              className={`${jsType.micro} inline-flex items-center gap-2 px-6 py-3 border transition-colors`}
              style={{
                borderColor: JS_SURFACES.champagneDeep,
                color: JS_SURFACES.ink,
                backgroundColor: JS_SURFACES.ivory,
              }}
            >
              Ligar
            </a>
          </div>
        </div>
      </motion.div>
    </motion.section>
  );
}

export function JessicaSamuelFooterSection() {
  const { theme } = useExperience();
  const eventDate = formatWeddingEventDate(WEDDING_EVENT.dateIso);
  const linkClass =
    "transition-colors duration-300 underline underline-offset-4 decoration-current/20 hover:opacity-100";
  const audioCredit =
    theme.audio.type !== "silent" ? theme.audio.credit : undefined;

  return (
    <footer
      id="footer"
      className={`${JS_LAYOUT.section} relative overflow-hidden pt-24 pb-12 border-t z-10`}
      style={{
        backgroundColor: JS_SECTION_BG.footer,
        borderColor: "rgba(255, 249, 242, 0.08)",
      }}
    >
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[280px] pointer-events-none opacity-[0.06] blur-[100px] rounded-full"
        style={{
          background: `radial-gradient(circle, ${JS_SURFACES.rose} 0%, transparent 80%)`,
        }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <div className="flex flex-col items-center text-center mb-8">
          <p
            className={`${jsType.monogram} mb-6`}
            style={{ color: JS_SURFACES.rose }}
          >
            {theme.assets.monogram}
          </p>
          <p
            className={`${jsType.bodyPoetic} max-w-lg mx-auto mb-10`}
            style={{ color: JS_SURFACES.ivory }}
          >
            {theme.copy.rsvpClosing ?? WEDDING_COPY.closing}
          </p>

          <a
            href={HAXR_AUTH.website}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex flex-col items-center"
            aria-label={`${HAXR_AUTH.brand} — site oficial`}
          >
            <div
              className="absolute inset-0 blur-2xl rounded-full scale-75 opacity-40 group-hover:scale-110 transition-all duration-700"
              style={{ backgroundColor: `${JS_SURFACES.rose}22` }}
              aria-hidden
            />
            <div className="relative z-10 w-44 h-44 sm:w-48 sm:h-48 transition-transform duration-700 group-hover:scale-105">
              <Image
                src={HAXR_AUTH.assets.logoVertical}
                alt={HAXR_AUTH.brand}
                fill
                className="object-contain"
                sizes="192px"
              />
            </div>
            <p
              className={`${jsType.micro} -mt-4 opacity-40 select-none`}
              style={{ color: JS_SURFACES.ivory }}
            >
              {HAXR_AUTH.tagline}
            </p>
          </a>
        </div>

        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 pb-14 border-b text-center md:text-left"
          style={{ borderColor: "rgba(255, 249, 242, 0.08)" }}
        >
          <div className="flex flex-col gap-3">
            <h3
              className={`${jsType.micro}`}
              style={{ color: JS_SURFACES.rose }}
            >
              {WEDDING_COPY.footerStudioLabel}
            </h3>
            <div
              className="h-px w-8 mx-auto md:mx-0 my-1"
              style={{ backgroundColor: `${JS_SURFACES.rose}55` }}
              aria-hidden
            />
            <p
              className={`${jsType.body} text-xs max-w-xs mx-auto md:mx-0 leading-relaxed`}
              style={{ color: "rgba(255, 249, 242, 0.55)" }}
            >
              {WEDDING_COPY.footerStudioBody}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <h3
              className={`${jsType.micro}`}
              style={{ color: JS_SURFACES.rose }}
            >
              {WEDDING_COPY.footerDirectoryLabel}
            </h3>
            <div
              className="h-px w-8 mx-auto md:mx-0 my-1"
              style={{ backgroundColor: `${JS_SURFACES.rose}55` }}
              aria-hidden
            />
            <ul
              className={`flex flex-col gap-2.5 ${jsType.body} text-xs`}
              style={{ color: "rgba(255, 249, 242, 0.6)" }}
            >
              <li>
                <span
                  className={`block ${jsType.micro} opacity-50 mb-0.5`}
                  style={{ color: JS_SURFACES.ivory }}
                >
                  Website Oficial
                </span>
                <a
                  href={HAXR_AUTH.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${linkClass} opacity-90 hover:opacity-100`}
                  style={{ color: JS_SURFACES.rose }}
                >
                  www.{HAXR_AUTH.domain}
                </a>
              </li>
              <li>
                <span
                  className={`block ${jsType.micro} opacity-50 mb-0.5`}
                  style={{ color: JS_SURFACES.ivory }}
                >
                  Correio Electrónico
                </span>
                <a
                  href={`mailto:${HAXR_AUTH.email.convites}`}
                  className={linkClass}
                  style={{ color: JS_SURFACES.ivory }}
                >
                  {HAXR_AUTH.email.convites}
                </a>
              </li>
              <li>
                <span
                  className={`block ${jsType.micro} opacity-50 mb-0.5`}
                  style={{ color: JS_SURFACES.ivory }}
                >
                  Presença Digital
                </span>
                <a
                  href={HAXR_AUTH.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                  style={{ color: JS_SURFACES.ivory }}
                >
                  {HAXR_AUTH.social.handle}
                </a>
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <h3
              className={`${jsType.micro}`}
              style={{ color: JS_SURFACES.rose }}
            >
              {WEDDING_COPY.footerInviteLabel}
            </h3>
            <div
              className="h-px w-8 mx-auto md:mx-0 my-1"
              style={{ backgroundColor: `${JS_SURFACES.rose}55` }}
              aria-hidden
            />
            <div
              className={`${jsType.body} text-xs`}
              style={{ color: "rgba(255, 249, 242, 0.5)" }}
            >
              <p
                className={`${jsType.bodyPoetic} text-sm mb-1`}
                style={{ color: "rgba(255, 249, 242, 0.88)" }}
              >
                {WEDDING_COUPLE.bride} &amp; {WEDDING_COUPLE.groom}
              </p>
              <p
                className={`${jsType.micro} opacity-70`}
                style={{ color: JS_SURFACES.ivory }}
              >
                {WEDDING_EVENT.ceremonyLabel}
              </p>
              <p className="mt-2 capitalize">{eventDate}</p>
              <p>{WEDDING_VENUE.city}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center pt-12 pb-6 text-center">
          <p
            className={`${jsType.bodyPoetic} text-sm tracking-wide`}
            style={{ color: "rgba(255, 249, 242, 0.55)" }}
          >
            &ldquo;{HAXR_AUTH.motto}&rdquo;
          </p>
        </div>

        {audioCredit ? (
          <aside
            className="mx-auto mb-10 max-w-md rounded-[18px] border px-5 py-4 text-left"
            style={{
              borderColor: "rgba(255, 249, 242, 0.12)",
              background:
                "linear-gradient(165deg, rgba(255, 249, 242, 0.06) 0%, rgba(255, 249, 242, 0.02) 100%)",
            }}
            aria-label="Créditos da música de ambiente"
          >
            <p
              className={`${jsType.micro} mb-2 opacity-55`}
              style={{ color: JS_SURFACES.ivory }}
            >
              Música de ambiente
            </p>
            <p
              className={`${jsType.body} text-sm mb-1`}
              style={{ color: "rgba(255, 249, 242, 0.9)" }}
            >
              <span className={`${jsType.bodyPoetic} text-base`}>
                {audioCredit.title}
              </span>
              <span className="opacity-45"> · </span>
              <span>{audioCredit.artist}</span>
            </p>
            <p
              className="text-[10px] leading-relaxed mb-2"
              style={{ color: "rgba(255, 249, 242, 0.48)" }}
            >
              {audioCredit.rightsHolder}
            </p>
            <p
              className="text-[9px] leading-relaxed border-t pt-2"
              style={{
                color: "rgba(255, 249, 242, 0.38)",
                borderColor: "rgba(255, 249, 242, 0.1)",
              }}
            >
              {audioCredit.disclaimer}
            </p>
          </aside>
        ) : null}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 text-center sm:text-left select-none">
          <p
            className={`${jsType.micro} opacity-40`}
            style={{ color: JS_SURFACES.ivory }}
          >
            {formatCopyright()}
          </p>
          <p
            className={`${jsType.micro} opacity-35`}
            style={{ color: JS_SURFACES.ivory }}
          >
            {formatStudioCredit()}
          </p>
          <p
            className={`${jsType.micro}`}
            style={{ color: `${JS_SURFACES.rose}80` }}
          >
            {WEDDING_COPY.footerSeasonLine}
          </p>
        </div>
      </div>
    </footer>
  );
}
