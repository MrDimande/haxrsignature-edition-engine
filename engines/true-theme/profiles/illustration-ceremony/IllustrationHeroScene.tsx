"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "motion/react";
import { Calendar, ChevronDown } from "lucide-react";
import { HAXR_AUTH } from "@lib/brand/authorship";
import { useExperience } from "../../context";
import { createMotionVariants } from "../../motion";
import { ChampagneFlutes, FloatingRose } from "../../illustrations/BrideIllustrations";

function formatEventDate(isoDate: string): string {
  const date = new Date(isoDate + "T12:00:00");
  return date.toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function GoldCorner({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 80"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M0 0 L0 48 M0 0 L48 0"
        stroke="#B89B5E"
        strokeWidth="0.75"
        opacity="0.55"
      />
      <path
        d="M4 4 L4 32 M4 4 L32 4"
        stroke="#B89B5E"
        strokeWidth="0.4"
        opacity="0.35"
      />
      <circle cx="4" cy="4" r="1.5" fill="#B89B5E" opacity="0.45" />
    </svg>
  );
}

export function IllustrationHeroScene() {
  const { theme, tokens, config, introComplete } = useExperience();
  const variants = createMotionVariants(tokens);
  const containerRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const imageY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 40]);
  const opacityFade = useTransform(scrollYProgress, [0, 0.45], [1, 0.35]);

  if (!introComplete) return null;

  const storyTitle = theme.copy.story?.title ?? config.metadata.eventType;
  const storySubtitle = theme.copy.story?.subtitle ?? config.metadata.description;
  const titleWords = storyTitle.split(" ");
  const titleLead = titleWords.slice(0, -1).join(" ");
  const titleAccent = titleWords.length > 1 ? titleWords[titleWords.length - 1] : storyTitle;
  const heroArt = theme.assets.heroImage ?? "/images/bridal_editorial_art.png";

  return (
    <motion.section
      ref={containerRef}
      initial="hidden"
      animate="visible"
      variants={variants.staggerContainer}
      className="relative min-h-[100svh] w-full flex items-center justify-center overflow-hidden"
      id="hero"
      style={{ backgroundColor: theme.colors.background }}
    >
      {/* Ambient layers */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(255,255,255,0.92) 0%, rgba(255,240,243,0.6) 45%, rgba(247,241,236,0.95) 100%)",
        }}
      />
      <div className="absolute inset-0 pattern-hearts opacity-60 pointer-events-none" />

      <motion.div
        className="absolute top-[18%] left-1/2 -translate-x-1/2 w-[min(90vw,720px)] h-[min(90vw,720px)] rounded-full pointer-events-none filter blur-[100px] -z-10"
        style={{
          background: `radial-gradient(circle, ${theme.colors.secondary}18 0%, transparent 70%)`,
        }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.65, 0.4] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Editorial frame */}
      <div className="absolute inset-5 sm:inset-8 md:inset-10 border border-[#B89B5E]/25 pointer-events-none z-20" />
      <div className="absolute inset-6 sm:inset-9 md:inset-11 border border-dashed border-[#B89B5E]/12 pointer-events-none z-20" />

      <GoldCorner className="absolute top-6 left-6 sm:top-8 sm:left-8 w-14 h-14 z-20 opacity-80" />
      <GoldCorner className="absolute top-6 right-6 sm:top-8 sm:right-8 w-14 h-14 z-20 opacity-80 rotate-90" />
      <GoldCorner className="absolute bottom-6 left-6 sm:bottom-8 sm:left-8 w-14 h-14 z-20 opacity-80 -rotate-90" />
      <GoldCorner className="absolute bottom-6 right-6 sm:bottom-8 sm:right-8 w-14 h-14 z-20 opacity-80 rotate-180" />

      {/* Floating accents */}
      <motion.div
        className="absolute top-[12%] left-[8%] hidden md:block opacity-30"
        animate={{ y: [0, -12, 0], rotate: [0, 4, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      >
        <ChampagneFlutes className="w-16 h-20" accent={theme.colors.secondary} primary={theme.colors.primary} />
      </motion.div>
      <motion.div
        className="absolute bottom-[18%] right-[10%] hidden md:block opacity-25"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <FloatingRose className="w-14 h-14" accent={theme.colors.accent} />
      </motion.div>

      <motion.div
        style={{ y: contentY, opacity: opacityFade }}
        className="relative z-10 w-full max-w-6xl mx-auto px-6 sm:px-10 md:px-16 pt-24 pb-28 md:pt-28 md:pb-32"
      >
        {/* Masthead */}
        <motion.div variants={variants.fadeUp} className="flex flex-col items-center text-center mb-10 md:mb-14">
          <div className="flex items-center gap-4 mb-5">
            <span className="h-px w-10 sm:w-16 bg-[#B89B5E]/40" />
            <div className="w-11 h-11 rounded-full border border-[#B89B5E]/45 flex items-center justify-center font-display italic text-sm text-[#B89B5E]">
              {theme.assets.monogram}
            </div>
            <span className="h-px w-10 sm:w-16 bg-[#B89B5E]/40" />
          </div>
          <span className="font-body text-[9px] uppercase tracking-[0.55em] text-[#B89B5E]/80">
            {HAXR_AUTH.brand}
          </span>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Couture art frame */}
          <motion.div
            variants={variants.fadeIn}
            style={{ y: imageY }}
            className="lg:col-span-5 flex justify-center order-2 lg:order-1"
          >
            <div className="relative group">
              <div
                className="absolute -inset-3 sm:-inset-4 rounded-sm opacity-60 pointer-events-none"
                style={{
                  background: `linear-gradient(135deg, ${theme.colors.accent}22, transparent 50%, ${theme.colors.secondary}15)`,
                }}
              />
              <div className="relative w-[min(72vw,280px)] sm:w-[min(55vw,320px)] lg:w-[min(38vw,360px)] aspect-[3/4] border border-[#B89B5E]/40 bg-white/90 p-2 sm:p-3 shadow-[0_25px_60px_rgba(208,72,123,0.12)]">
                <div className="relative w-full h-full overflow-hidden">
                  <Image
                    src={heroArt}
                    alt={storyTitle}
                    fill
                    priority
                    sizes="(max-width: 640px) 72vw, (max-width: 1024px) 55vw, 360px"
                    className="object-cover scale-[1.02] group-hover:scale-[1.07] transition-transform duration-[1.4s] ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1C1612]/15 via-transparent to-white/10 pointer-events-none" />
                </div>
              </div>
              <motion.div
                className="absolute -bottom-4 -right-4 w-20 h-20 border border-[#B89B5E]/25 bg-[#FFF0F3]/80 backdrop-blur-sm hidden sm:flex items-center justify-center"
                animate={{ rotate: [0, 3, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              >
                <span className="font-display italic text-[10px] text-[#D0487B] tracking-widest uppercase text-center leading-tight px-2">
                  Bride
                  <br />
                  to Be
                </span>
              </motion.div>
            </div>
          </motion.div>

          {/* Typography */}
          <motion.div
            variants={variants.fadeUp}
            className="lg:col-span-7 text-center lg:text-left space-y-7 order-1 lg:order-2"
          >
            <span className="inline-block font-body text-[10px] uppercase tracking-[0.5em] text-[#D0487B] font-medium">
              {theme.copy.heroEyebrow}
            </span>

            <h1 className="font-display font-light text-[#1C1612] leading-[0.95] tracking-tight">
              {titleWords.length > 1 ? (
                <>
                  <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-[4.5rem]">
                    {titleLead}
                  </span>
                  <span className="block font-display italic font-normal text-[#D0487B] text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] mt-2 sm:mt-3">
                    {titleAccent}
                  </span>
                </>
              ) : (
                <span className="block text-4xl sm:text-5xl md:text-6xl">{storyTitle}</span>
              )}
            </h1>

            <p className="font-display italic text-[#D0487B]/90 font-light max-w-md mx-auto lg:mx-0 text-base sm:text-lg leading-relaxed tracking-wide">
              &ldquo;{storySubtitle}&rdquo;
            </p>

            <div className="w-20 h-px bg-gradient-to-r from-transparent via-[#B89B5E]/50 to-transparent mx-auto lg:mx-0" />

            <div className="inline-flex items-center gap-4 px-5 py-3 border border-[#B89B5E]/25 bg-white/40 backdrop-blur-sm rounded-sm mx-auto lg:mx-0">
              <Calendar size={16} strokeWidth={1.2} className="text-[#B89B5E] shrink-0" />
              <div className="text-left">
                <span className="block font-body text-[8px] uppercase tracking-[0.35em] text-[#A24B5A]/80 mb-0.5">
                  Data do evento
                </span>
                <span className="font-body text-xs sm:text-sm text-[#1C1612] font-medium capitalize tracking-wide">
                  {formatEventDate(config.metadata.date)}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll cue */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 1 }}
      >
        <span className="font-body text-[8px] uppercase tracking-[0.4em] text-[#B89B5E]/70">
          Descobrir
        </span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown size={16} className="text-[#B89B5E]/60" strokeWidth={1.2} />
        </motion.div>
      </motion.div>
    </motion.section>
  );
}
