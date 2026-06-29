"use client";

import {
  HAXR_AUTH,
  formatCopyright,
  formatStudioCredit,
} from "@lib/brand/authorship";
import { Calendar, Clock, MapPin, Music2, Navigation } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import React from "react";
import { useExperience } from "../../context";
import { createMotionVariants, defaultViewport } from "../../motion";
import { roseType } from "./rose-typography";
import {
  cinematicRevealVariants,
  cinematicStagger,
  cinematicViewport,
} from "./rose-motion";

export { RoseRSVPSection } from "./RoseRSVPExperience";
export { RoseCountdownSection } from "./RoseCountdownSection";

function formatEventDate(isoDate: string): string {
  const date = new Date(isoDate + "T12:00:00");
  return date.toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const CLOTHESLINE_VARAL = "/images/farewell-clothesline-varal.webp";
const HERO_COCKTAIL = "/images/kulaya-cocktail-hero.webp";

export function RoseHeroSection() {
  const { introComplete, theme, tokens, config } = useExperience();
  const variants = createMotionVariants(tokens);
  const eventDateLabel = formatEventDate(config.metadata.date);

  if (!introComplete) return null;

  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={cinematicStagger}
      className="relative w-full min-h-[100dvh] min-h-screen overflow-x-clip overflow-y-visible z-10"
      id="hero"
      style={{ backgroundColor: theme.colors.background }}
    >
      {/* Varal / estendal — canto superior, acima do cocktail */}
      <motion.div
        variants={cinematicRevealVariants}
        className="absolute z-[4] pointer-events-none select-none left-[-8%] md:left-[-6%] w-[min(84vw,500px)] sm:w-[min(90vw,560px)] md:w-[min(104vw,620px)] top-[max(-5rem,calc(env(safe-area-inset-top)-3.25rem))] md:top-[max(-2.75rem,calc(env(safe-area-inset-top)-1.5rem))]"
        style={{
          transformOrigin: "0% 0%",
        }}
        aria-hidden
      >
        <motion.div
          animate={{ rotate: [-2.5, 1.5, -2.5] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "8% 12%" }}
        >
          <Image
            src={CLOTHESLINE_VARAL}
            alt=""
            width={445}
            height={287}
            priority
            className="w-full h-auto opacity-[0.92] drop-shadow-[0_10px_28px_rgba(255,45,138,0.18)]"
          />
        </motion.div>
      </motion.div>

      {/* Ambiente rosa choque */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 90% 70% at 50% 18%, ${theme.colors.secondary}28 0%, transparent 58%), radial-gradient(ellipse 80% 50% at 80% 80%, ${theme.colors.secondary}14 0%, transparent 55%)`,
        }}
        aria-hidden
      />

      {/* Mobile — fade inferior para o texto */}
      <div
        className="absolute bottom-0 inset-x-0 h-[46%] z-[1] pointer-events-none md:hidden"
        style={{
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          maskImage:
            "linear-gradient(to top, black 0%, black 34%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to top, black 0%, black 34%, transparent 100%)",
        }}
        aria-hidden
      />
      <div
        className="absolute bottom-0 inset-x-0 h-52 z-[1] pointer-events-none md:hidden"
        style={{
          background: `linear-gradient(to top, ${theme.colors.background} 0%, ${theme.colors.background}e8 40%, transparent 78%)`,
        }}
        aria-hidden
      />

      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 min-h-[100dvh] min-h-screen flex flex-col items-center justify-center gap-2 pt-[max(2.75rem,env(safe-area-inset-top))] pb-10 md:grid md:grid-cols-12 md:gap-12 md:items-center md:justify-start md:py-20 md:pb-20 md:min-h-screen">
        {/* Ilustração hero */}
        <motion.div
          variants={cinematicRevealVariants}
          className="flex justify-center shrink-0 w-full translate-y-3 md:translate-y-0 md:pt-0 md:py-0 md:col-span-5 md:col-start-8 md:row-start-1 order-1 md:order-2"
        >
          <div className="relative group">
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(80vw,320px)] sm:w-[min(62vw,340px)] md:w-[min(40vw,380px)] aspect-square rounded-full pointer-events-none blur-3xl opacity-50"
              style={{ backgroundColor: `${theme.colors.secondary}35` }}
              aria-hidden
            />
            <div className="relative w-[min(76vw,300px)] sm:w-[min(58vw,320px)] md:w-[min(36vw,360px)] translate-y-2 md:translate-y-0 transition-transform duration-[1.4s] ease-out group-hover:scale-[1.03]">
              <Image
                src={HERO_COCKTAIL}
                alt=""
                width={355}
                height={440}
                priority
                className="w-full h-auto drop-shadow-[0_24px_40px_rgba(255,45,138,0.22)]"
              />
            </div>
          </div>
        </motion.div>

        {/* Copy */}
        <motion.div
          variants={cinematicStagger}
          className="flex flex-col items-center md:items-start text-center md:text-left w-full max-w-sm md:max-w-none -mt-2 md:mt-0 md:col-span-6 md:col-start-1 order-2 md:order-1"
        >
          <motion.div
            variants={cinematicRevealVariants}
            className="mb-2 md:mb-6 flex items-center gap-3"
          >
            <span
              className="h-px w-10 md:w-14"
              style={{
                background: `linear-gradient(to right, transparent, ${theme.colors.secondary})`,
              }}
              aria-hidden
            />
            <span
              className={`${roseType.monogram} ${theme.palette.textPrimary}`}
            >
              {theme.assets.monogram}
            </span>
            <span
              className="h-px w-10 md:w-14"
              style={{
                background: `linear-gradient(to left, transparent, ${theme.colors.secondary})`,
              }}
              aria-hidden
            />
          </motion.div>

          <motion.span
            variants={cinematicRevealVariants}
            className={`${roseType.eyebrow} mb-2 md:mb-5 ${theme.palette.textPrimary} opacity-90`}
          >
            {theme.copy.heroEyebrow}
          </motion.span>

          <motion.h1
            variants={cinematicRevealVariants}
            className={`text-center md:text-left mb-2 md:mb-4 ${theme.palette.textPrimary}`}
          >
            <span
              className={`${roseType.heroName} block`}
              style={{ color: theme.colors.secondary }}
            >
              Jessica
            </span>
            <span
              className={`${roseType.heroSurname} block -mt-1`}
              style={{ color: theme.colors.primary }}
            >
              Muege
            </span>
          </motion.h1>

          <motion.div
            variants={cinematicRevealVariants}
            className="w-20 md:w-28 h-px mb-2 md:mb-5 mx-auto md:mx-0"
            style={{
              background: `linear-gradient(to right, transparent, ${theme.colors.accent}, transparent)`,
            }}
            aria-hidden
          />

          <motion.p
            variants={cinematicRevealVariants}
            className={`${roseType.bodyPoetic} text-sm sm:text-base max-w-sm mb-4 md:mb-5 ${theme.palette.textSecondary} hidden md:block`}
          >
            {theme.copy.intro?.subline ?? "Chá de lingerie · despedida de solteira"}
          </motion.p>

          <motion.p
            variants={cinematicRevealVariants}
            className={`${roseType.eyebrow} mb-1 md:hidden ${theme.palette.textPrimary} opacity-90 normal-case tracking-[0.1em]`}
          >
            Chá de lingerie · despedida de solteira
          </motion.p>

          <motion.p
            variants={cinematicRevealVariants}
            className="font-display italic text-sm sm:text-base font-light tracking-[0.06em] capitalize [text-shadow:0_1px_14px_rgba(255,229,240,0.85)] mb-1 md:mb-0"
            style={{ color: theme.colors.secondary }}
          >
            {eventDateLabel}
          </motion.p>
        </motion.div>
      </div>

      <motion.button
        type="button"
        variants={variants.fadeIn}
        className="absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] md:bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1.5 cursor-pointer bg-transparent border-0 p-0"
        onClick={() => {
          document.getElementById("story")?.scrollIntoView({ behavior: "smooth" });
        }}
        aria-label="Deslizar para a história"
      >
        <span
          className={`${roseType.eyebrow} opacity-75 ${theme.palette.textPrimary}`}
        >
          Desliza
        </span>
        <motion.div
          className="w-px h-7 opacity-35"
          style={{
            background: `linear-gradient(to bottom, ${theme.colors.secondary}, transparent)`,
          }}
          animate={{ y: [0, 5, 0], opacity: [0.35, 0.65, 0.35] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        />
      </motion.button>
    </motion.section>
  );
}

/* ═══════════════════════════════════════════
   2. INTRO STORY SECTION
   Editorial narrative · staggered reveal
   ═══════════════════════════════════════════ */

export function RoseIntroStorySection() {
  const { theme, tokens } = useExperience();
  const variants = createMotionVariants(tokens);

  const paragraphs = [
    "Antes do véu, há uma tarde só para mim.",
    <>
      Entre amigas que me conhecem de cor, vou ser{" "}
      <em className="italic" style={{ color: theme.colors.secondary }}>
        mimada, ousada e um bocadinho travessa
      </em>
      — sem pressa, sem formalidades.
    </>,
    "É o meu chá de lingerie: risos partilhados, segredos sussurrados e aquele brinde que sabe a despedida bonita.",
    <>
      Veste o teu rosa, traz o teu charme. Eu prometo{" "}
      <em className="italic" style={{ color: theme.colors.secondary }}>
        receber-te com carinho
      </em>{" "}
      e um ambiente só de mulheres.
    </>,
  ];

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={cinematicViewport}
      variants={cinematicStagger}
      className="relative w-full py-12 md:py-24 md:min-h-screen px-6 flex flex-col items-center justify-center z-10"
      id="story"
    >
      <motion.span
        variants={cinematicRevealVariants}
        className={`${roseType.sectionLabel} mb-10 md:mb-16 ${theme.palette.textSecondary}`}
      >
        A minha história
      </motion.span>

      <div className="max-w-lg space-y-8 text-center">
        {paragraphs.map((text, i) => (
          <motion.p
            key={i}
            variants={cinematicRevealVariants}
            className={`font-display italic text-sm sm:text-base font-light leading-[2] ${theme.palette.textPrimary} opacity-90`}
          >
            {text}
          </motion.p>
        ))}
      </div>

      <motion.div
        variants={cinematicRevealVariants}
        className="w-12 h-[1px] mt-16"
        style={{
          background: `linear-gradient(to right, transparent, ${theme.colors.accent}80, transparent)`,
        }}
      />
    </motion.section>
  );
}

/* ═══════════════════════════════════════════
   3. DETAILS SECTION
   Structured cards · champagne gold dividers
   ═══════════════════════════════════════════ */

export function RoseDetailsSection() {
  const { theme, config } = useExperience();

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={cinematicViewport}
      variants={cinematicStagger}
      className="relative w-full min-h-screen py-24 px-6 flex flex-col items-center justify-center z-10 scroll-mt-6"
      style={{ backgroundColor: theme.palette.blob1 }}
      id="details"
    >
      <motion.span
        variants={cinematicRevealVariants}
        className={`${roseType.sectionLabel} mb-4 ${theme.palette.textSecondary}`}
      >
        Os detalhes
      </motion.span>

      <motion.h2
        variants={cinematicRevealVariants}
        className={`${roseType.sectionTitle} mb-16 ${theme.palette.textPrimary}`}
      >
        {theme.copy.detailsTitle}
      </motion.h2>

      {/* Detail cards */}
      <motion.div
        variants={cinematicRevealVariants}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl w-full mb-16"
      >
        <RoseDetailCard
          icon={<Calendar size={18} strokeWidth={1} />}
          label="Data"
          value={formatEventDate(config.metadata.date)}
        />
        <RoseDetailCard
          icon={<Clock size={18} strokeWidth={1} />}
          label="Horário"
          value={config.metadata.time}
        />
        <RoseDetailCard
          icon={<MapPin size={18} strokeWidth={1} />}
          label="Local"
          value={config.metadata.location}
        />
      </motion.div>

      {/* Gold divider */}
      <motion.div
        variants={cinematicRevealVariants}
        className="w-24 h-[1px] mb-16"
        style={{
          background: `linear-gradient(to right, transparent, ${theme.colors.accent}, transparent)`,
        }}
      />

      {/* Quote */}
      <motion.p
        variants={cinematicRevealVariants}
        className={`${roseType.bodyPoetic} text-sm max-w-sm mx-auto text-center ${theme.palette.textSecondary} opacity-80`}
      >
        &ldquo;{theme.copy.detailsQuote}&rdquo;
      </motion.p>
    </motion.section>
  );
}

/* ═══════════════════════════════════════════
   3b. LOCATION SECTION
   Map embed · editorial directions
   ═══════════════════════════════════════════ */

export function RoseLocationSection() {
  const { theme } = useExperience();
  const { location } = theme.copy;

  if (!location) return null;

  const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(location.mapCoordinates)}&z=16&output=embed`;

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={cinematicViewport}
      variants={cinematicStagger}
      className="relative w-full min-h-screen py-24 px-6 flex flex-col items-center justify-center z-10 border-t scroll-mt-6"
      style={{ borderColor: `${theme.colors.accent}10` }}
      id="location"
    >
      <motion.span
        variants={cinematicRevealVariants}
        className={`${roseType.sectionLabel} mb-4 ${theme.palette.textSecondary}`}
      >
        O endereço
      </motion.span>

      <motion.h2
        variants={cinematicRevealVariants}
        className={`${roseType.sectionTitle} mb-16 ${theme.palette.textPrimary}`}
      >
        Como chegar
      </motion.h2>

      <motion.div
        variants={cinematicRevealVariants}
        className="grid grid-cols-1 md:grid-cols-12 gap-10 max-w-5xl w-full items-center"
      >
        <div className="md:col-span-5 text-center md:text-left space-y-6">
          <div>
            <h3
              className={`font-display italic text-2xl sm:text-3xl font-light ${theme.palette.textPrimary}`}
            >
              {location.name}
            </h3>
            <p
              className={`font-body text-xs sm:text-sm mt-3 font-light leading-relaxed ${theme.palette.textSecondary}`}
            >
              {location.address}
            </p>
          </div>
          <p
            className={`font-body text-xs sm:text-sm font-light leading-relaxed ${theme.palette.textSecondary} opacity-90`}
          >
            {location.directions}
          </p>
          <a
            href={location.externalMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-3 w-full min-h-[48px] py-3.5 border font-body text-[11px] uppercase tracking-[0.2em] font-medium transition-all duration-500 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{
              borderColor: theme.colors.accent,
              color: theme.colors.accent,
              backgroundColor: `${theme.colors.accent}08`,
            }}
          >
            <Navigation size={11} />
            Abrir no Google Maps
          </a>
        </div>

        <div
          className="md:col-span-7 h-72 sm:h-80 md:h-96 relative border overflow-hidden shadow-lg"
          style={{ borderColor: `${theme.colors.accent}18` }}
        >
          <iframe
            title={`Localização — ${location.name}`}
            src={mapEmbedUrl}
            width="100%"
            height="100%"
            style={{ border: 0, filter: location.mapFilter }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </motion.div>
    </motion.section>
  );
}

function RoseDetailCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  const { theme, tokens } = useExperience();
  const variants = createMotionVariants(tokens);
  const isMap = label.toLowerCase() === "local" || label.toLowerCase() === "localização";
  const url = isMap ? theme.copy.location?.externalMapUrl : undefined;

  const content = (
    <>
      <div
        className="w-9 h-9 flex items-center justify-center mb-5"
        style={{ color: theme.colors.accent }}
      >
        {icon}
      </div>
      <span
        className={`text-[9px] sm:text-[10px] uppercase tracking-[0.26em] ${theme.palette.textPrimary} opacity-75 mb-3`}
      >
        {label}
      </span>
      <span
        suppressHydrationWarning
        className={`font-display text-base sm:text-lg ${theme.palette.textPrimary} font-light leading-snug capitalize text-center`}
      >
        {value}
      </span>
    </>
  );

  if (url) {
    return (
      <motion.a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        variants={variants.fadeUp}
        className={`flex flex-col items-center p-8 backdrop-blur-lg rounded-sm transition-all duration-500 shadow-sm cursor-pointer hover:opacity-90 hover:scale-[1.02] border border-black/5 ${theme.palette.cardBg}`}
        style={{ borderColor: `${theme.colors.accent}15` }}
      >
        {content}
      </motion.a>
    );
  }

  return (
    <motion.div
      variants={variants.fadeUp}
      className={`flex flex-col items-center p-8 backdrop-blur-lg rounded-sm transition-all duration-500 shadow-sm ${theme.palette.cardBg}`}
    >
      {content}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   4. EXPERIENCE MOMENTS SECTION
   Timeline · horizontal (desktop) / vertical (mobile)
   ═══════════════════════════════════════════ */

const EXPERIENCE_MOMENTS = [
  {
    title: "Boas-vindas mimosas",
    description: "Champanhe gelado, perfume no ar e o primeiro abraço apertado.",
    index: "01",
  },
  {
    title: "Brinde à noiva",
    description: "Copos erguidos, risos altos e promessas ditas em tom de segredo.",
    index: "02",
  },
  {
    title: "Jogos & surpresas",
    description: "Pequenas travessuras entre amigas — o tipo de memória que fica para sempre.",
    index: "03",
  },
  {
    title: "Registo & selfies",
    description: "Fotos espontâneas, poses ousadas e um álbum cheio de carinho.",
    index: "04",
  },
];

export function RoseExperienceMomentsSection() {
  const { theme, tokens } = useExperience();
  const variants = createMotionVariants(tokens);

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={cinematicViewport}
      variants={cinematicStagger}
      className="relative w-full py-16 md:py-20 px-6 flex flex-col items-center z-10"
      id="moments"
    >
      <motion.span
        variants={cinematicRevealVariants}
        className={`${roseType.sectionLabel} mb-4 ${theme.palette.textSecondary}`}
      >
        O que te espera
      </motion.span>

      <motion.h2
        variants={cinematicRevealVariants}
        className={`${roseType.sectionTitle} mb-12 md:mb-16 ${theme.palette.textPrimary}`}
      >
        Momentos de despedida
      </motion.h2>

      {/* Desktop: horizontal timeline / Mobile: vertical stack */}
      <div className="w-full max-w-5xl">
        {/* Horizontal connecting line (desktop only) */}
        <div className="hidden md:block relative mb-12">
          <div
            className="absolute top-1/2 left-0 right-0 h-px"
            style={{
              background: `linear-gradient(to right, transparent, ${theme.colors.accent}40, ${theme.colors.accent}40, transparent)`,
            }}
          />
          <div className="grid grid-cols-4 gap-6 relative z-10">
            {EXPERIENCE_MOMENTS.map((moment) => (
              <motion.div
                key={moment.index}
                variants={cinematicRevealVariants}
                className="flex flex-col items-center text-center"
              >
                <div
                  className="w-10 h-10 rounded-full border flex items-center justify-center mb-6 bg-white/80 backdrop-blur-sm"
                  style={{ borderColor: `${theme.colors.accent}55` }}
                >
                  <span
                    className="font-body text-[10px] font-medium tracking-wider"
                    style={{ color: theme.colors.accent }}
                  >
                    {moment.index}
                  </span>
                </div>
                <h4
                  className={`font-display italic text-sm font-light tracking-[0.02em] mb-3 ${theme.palette.textPrimary}`}
                >
                  {moment.title}
                </h4>
                <p
                  className={`font-body text-[11px] font-light leading-relaxed max-w-[200px] ${theme.palette.textSecondary} opacity-75`}
                >
                  {moment.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Mobile: vertical stack */}
        <div className="md:hidden space-y-10">
          {EXPERIENCE_MOMENTS.map((moment) => (
            <motion.div
              key={moment.index}
              variants={cinematicRevealVariants}
              className="flex gap-5 items-start"
            >
              <div className="flex flex-col items-center shrink-0">
                <div
                  className="w-9 h-9 rounded-full border flex items-center justify-center bg-white/80"
                  style={{ borderColor: `${theme.colors.accent}55` }}
                >
                  <span
                    className="font-body text-[9px] font-medium tracking-wider"
                    style={{ color: theme.colors.accent }}
                  >
                    {moment.index}
                  </span>
                </div>
                <div
                  className="w-px h-full mt-2 opacity-20"
                  style={{ backgroundColor: theme.colors.accent }}
                />
              </div>
              <div className="pt-1.5">
                <h4
                  className={`font-display italic text-sm font-light tracking-[0.02em] mb-2 ${theme.palette.textPrimary}`}
                >
                  {moment.title}
                </h4>
                <p
                  className={`font-body text-xs font-light leading-relaxed ${theme.palette.textSecondary} opacity-75`}
                >
                  {moment.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

/* ═══════════════════════════════════════════
   6. FOOTER SECTION
   HAXR Signature · minimal centered
   ═══════════════════════════════════════════ */

export function RoseFooterSection() {
  const { theme, tokens, config } = useExperience();
  const variants = createMotionVariants(tokens);
  const audioCredit =
    theme.audio.type !== "silent" ? theme.audio.credit : undefined;

  return (
    <motion.footer
      initial="hidden"
      whileInView="visible"
      viewport={cinematicViewport}
      variants={variants.staggerContainer}
      className="relative w-full py-20 md:py-24 px-6 flex flex-col items-center z-10 border-t"
      style={{ borderColor: `${theme.colors.accent}12` }}
    >
      <div className="max-w-md mx-auto flex flex-col items-center text-center space-y-6">
        <motion.div variants={variants.fadeUp} className="flex flex-col items-center gap-4">
          <a
            href={HAXR_AUTH.website}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative block transition-opacity duration-500 hover:opacity-100 opacity-90"
            aria-label={`${HAXR_AUTH.brand} — site oficial`}
          >
            <div className="relative w-28 h-28 md:hidden">
              <Image
                src={HAXR_AUTH.assets.logoVertical}
                alt={HAXR_AUTH.brand}
                fill
                sizes="112px"
                className="object-contain transition-transform duration-500 group-hover:scale-[1.03]"
              />
            </div>
            <div className="relative hidden md:block w-52 h-[3.75rem] lg:w-60 lg:h-[4.25rem]">
              <Image
                src={HAXR_AUTH.assets.logoHorizontal}
                alt={HAXR_AUTH.brand}
                fill
                sizes="240px"
                className="object-contain object-center transition-transform duration-500 group-hover:scale-[1.02]"
              />
            </div>
          </a>

          <p
            className={`text-[8px] tracking-[0.28em] uppercase ${theme.palette.textSecondary} opacity-45 max-w-xs leading-relaxed`}
          >
            {HAXR_AUTH.tagline}
          </p>
        </motion.div>

        <motion.p
          variants={variants.fadeUp}
          className={`text-[8px] tracking-[0.22em] uppercase max-w-sm leading-relaxed ${theme.palette.textSecondary} opacity-40`}
        >
          Experiências digitais com intenção, assinatura e elegância.
        </motion.p>

        <motion.div
          variants={variants.fadeUp}
          className="w-12 h-px"
          style={{
            background: `linear-gradient(to right, transparent, ${theme.colors.accent}50, transparent)`,
          }}
        />

        <motion.p
          variants={variants.fadeUp}
          className={`font-display italic text-[10px] md:text-[11px] tracking-[0.2em] ${theme.palette.textPrimary} opacity-70`}
        >
          {config.metadata.subtitle}
        </motion.p>

        {audioCredit ? (
          <motion.aside
            variants={variants.fadeUp}
            className="w-full max-w-sm rounded-sm border px-4 py-4 text-left"
            style={{
              borderColor: `${theme.colors.accent}22`,
              backgroundColor: `${theme.colors.accent}06`,
            }}
            aria-label="Créditos musicais"
          >
            <div className="flex items-start gap-3">
              <Music2
                size={14}
                strokeWidth={1.25}
                className="shrink-0 mt-0.5 opacity-50"
                style={{ color: theme.colors.accent }}
                aria-hidden
              />
              <div className="space-y-2 min-w-0">
                <p
                  className={`font-mono text-[7px] tracking-[0.35em] uppercase ${theme.palette.textSecondary} opacity-50`}
                >
                  Música de ambiente
                </p>
                <p
                  className={`text-[11px] leading-snug ${theme.palette.textPrimary} opacity-85`}
                >
                  <span className="font-display italic font-light">
                    {audioCredit.title}
                  </span>
                  <span className="opacity-50"> · </span>
                  <span>{audioCredit.artist}</span>
                </p>
                <p
                  className={`text-[8px] leading-relaxed ${theme.palette.textSecondary} opacity-55`}
                >
                  {audioCredit.rightsHolder}
                </p>
                <p
                  className={`text-[7px] leading-relaxed ${theme.palette.textSecondary} opacity-45 border-t pt-2`}
                  style={{ borderColor: `${theme.colors.accent}18` }}
                >
                  {audioCredit.disclaimer}
                </p>
              </div>
            </div>
          </motion.aside>
        ) : null}

        <motion.div
          variants={variants.fadeUp}
          className="space-y-1.5 pt-2 w-full"
        >
          <p className={`text-[8px] opacity-35 ${theme.palette.textPrimary}`}>
            {formatCopyright()}
          </p>
          <p className={`text-[8px] opacity-30 ${theme.palette.textPrimary}`}>
            {formatStudioCredit()}
          </p>
          <a
            href={HAXR_AUTH.website}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-block text-[8px] tracking-[0.2em] uppercase pt-1 transition-opacity duration-300 hover:opacity-80 ${theme.palette.textSecondary} opacity-40`}
          >
            {HAXR_AUTH.domain}
          </a>
        </motion.div>
      </div>
    </motion.footer>
  );
}
