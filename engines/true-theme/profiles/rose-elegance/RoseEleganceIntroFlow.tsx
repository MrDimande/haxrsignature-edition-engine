"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { HAXR_AUTH } from "@lib/brand/authorship";
import { getFlowExitTransition } from "../../../../theme/experience-tokens";
import { useExperience } from "../../context";
import { roseType } from "./rose-typography";

/**
 * Rose Elegance intro flow — ceremonial reveal overlay.
 * Follows IllustrationIntroFlow.tsx pattern with restrained editorial tone.
 */
export function RoseEleganceIntroFlow() {
  const { theme, introComplete, setIntroComplete, audioPlayer } =
    useExperience();

  useEffect(() => {
    if (introComplete) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.classList.add("lenis-stopped");
    return () => {
      document.body.style.overflow = prev;
      document.documentElement.classList.remove("lenis-stopped");
    };
  }, [introComplete]);

  if (introComplete) return null;

  const handleEnter = async () => {
    if (audioPlayer && theme.audio.type !== "silent") {
      await audioPlayer.start();
    }
    setIntroComplete(true);
  };

  return (
    <AnimatePresence>
      {!introComplete && <RoseEleganceOverlay onEnter={handleEnter} />}
    </AnimatePresence>
  );
}

function IntroPetal({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const { theme } = useExperience();
  return (
    <div className={className} style={style}>
      <svg
        viewBox="0 0 32 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-5 h-6 md:w-6 md:h-8"
      >
        <path
          d="M16 2 C22 8, 28 16, 28 24 C28 32, 22 38, 16 38 C10 38, 4 32, 4 24 C4 16, 10 8, 16 2Z"
          fill={theme.colors.secondary}
          opacity="0.35"
        />
        <path
          d="M16 6 C20 12, 24 18, 24 24 C24 30, 20 34, 16 34 C12 34, 8 30, 8 24 C8 18, 12 12, 16 6Z"
          fill={theme.colors.secondary}
          opacity="0.2"
        />
      </svg>
    </div>
  );
}

function useCoarsePointer(): boolean {
  const [coarse, setCoarse] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(hover: none), (pointer: coarse)");
    const update = () => setCoarse(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return coarse;
}

function IntroEnterCta({
  label,
  onEnter,
}: {
  label: string;
  onEnter: () => void | Promise<void>;
}) {
  const { theme } = useExperience();
  const isCoarsePointer = useCoarsePointer();
  const [isEntering, setIsEntering] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const showFill = isEntering || isPressed;
  const accent = theme.colors.accent;
  const primary = theme.colors.primary;
  const secondary = theme.colors.secondary;
  const roseFill = `linear-gradient(135deg, ${secondary} 0%, #D9156A 100%)`;

  const handleClick = async () => {
    if (isEntering) return;
    setIsEntering(true);
    await new Promise((resolve) => setTimeout(resolve, 420));
    await onEnter();
  };

  const handlePointerDown = () => {
    if (!isEntering) setIsPressed(true);
  };

  const handlePointerUp = () => {
    if (!isEntering) setIsPressed(false);
  };

  const idleShadow = isCoarsePointer
    ? `0 6px 28px ${accent}22, 0 1px 0 rgba(255, 255, 255, 0.45) inset`
    : [
        `0 0 0 0 ${accent}00`,
        `0 0 22px 3px ${accent}28`,
        `0 0 0 0 ${accent}00`,
      ];

  return (
    <div className="relative inline-flex">
      <motion.button
        type="button"
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerCancel={handlePointerUp}
        disabled={isEntering}
        initial={{ opacity: 0, y: 10 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
          boxShadow: isEntering
            ? `0 10px 36px ${secondary}45`
            : idleShadow,
        }}
        transition={{
          opacity: { delay: 0.85, duration: 0.8 },
          y: { delay: 0.85, duration: 0.8 },
          boxShadow: isEntering
            ? { duration: 0.35 }
            : isCoarsePointer
              ? { duration: 0.3 }
              : {
                  duration: 2.6,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1.1,
                },
        }}
        whileHover={isEntering || isCoarsePointer ? undefined : { scale: 1.03 }}
        whileTap={isEntering ? undefined : { scale: isCoarsePointer ? 0.98 : 0.97 }}
        className="relative px-10 py-4 sm:py-3.5 min-h-[48px] font-body text-[10px] uppercase tracking-[0.28em] font-light border rounded-full transition-colors duration-300 group cursor-pointer overflow-hidden mb-4 disabled:cursor-wait touch-manipulation select-none backdrop-blur-md"
        style={{
          borderColor: showFill ? `${accent}cc` : `${accent}66`,
          color: primary,
          backgroundColor: isCoarsePointer
            ? showFill
              ? "transparent"
              : "rgba(255, 255, 255, 0.42)"
            : "rgba(255, 255, 255, 0.42)",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        {/* Shimmer dourado — subtil em mobile */}
        {!isEntering && (
          <motion.span
            aria-hidden
            className="absolute inset-0 z-[1] pointer-events-none rounded-full overflow-hidden"
          >
            <motion.span
              className="absolute inset-y-0 w-[38%]"
              style={{
                background: `linear-gradient(90deg, transparent, ${accent}${isCoarsePointer ? "45" : "35"}, transparent)`,
              }}
              animate={{ x: ["-120%", "280%"] }}
              transition={{
                duration: isCoarsePointer ? 3.2 : 2.8,
                repeat: Infinity,
                ease: "easeInOut",
                repeatDelay: isCoarsePointer ? 1.4 : 1.2,
              }}
            />
          </motion.span>
        )}

        {isCoarsePointer ? (
          <motion.span
            aria-hidden
            className="absolute inset-0 z-0 rounded-full pointer-events-none"
            style={{ background: roseFill }}
            animate={{ opacity: showFill ? 1 : 0 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          />
        ) : (
          <span
            className={`absolute inset-0 z-0 rounded-full transition-transform duration-300 origin-left ${
              showFill ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
            }`}
            style={{ backgroundColor: primary }}
          />
        )}

        <span
          className={`relative z-10 flex items-center justify-center gap-2.5 transition-colors duration-300 ${
            showFill ? "text-white" : isCoarsePointer ? "" : "group-hover:text-white"
          }`}
        >
          {isEntering ? (
            <>
              <motion.span
                className="inline-block w-3.5 h-3.5 rounded-full border-2 border-white/25 border-t-white"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
              />
              A abrir…
            </>
          ) : (
            <>
              {label}
              <motion.span
                aria-hidden
                className="inline-block text-sm leading-none opacity-80"
                animate={{ x: isCoarsePointer ? [0, 5, 0] : [0, 3, 0] }}
                transition={{
                  duration: isCoarsePointer ? 1.2 : 1.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                →
              </motion.span>
            </>
          )}
        </span>
      </motion.button>
    </div>
  );
}

function RoseEleganceOverlay({
  onEnter,
}: {
  onEnter: () => void | Promise<void>;
}) {
  const { theme, config, introComplete } = useExperience();
  const [mounted, setMounted] = useState(true);
  const exit = getFlowExitTransition(theme.flow);
  const headline = theme.copy.intro?.headline ?? config.metadata.eventType;
  const surname = theme.copy.intro?.surname;
  const subline = theme.copy.intro?.subline ?? config.metadata.subtitle;

  useEffect(() => {
    if (introComplete) {
      const t = setTimeout(() => setMounted(false), exit.duration * 1000 + 600);
      return () => clearTimeout(t);
    }
  }, [introComplete, exit.duration]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
      {/* Solid underlay behind curtains, fading out slowly on exit */}
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 2, ease: "easeInOut" } }}
        className="absolute inset-0 -z-10"
        style={{ backgroundColor: theme.colors.background }}
      />

      {/* LEFT STAGE CURTAIN (Blush Silk with gathering folds) */}
      <motion.div
        initial={{ scaleX: 1, x: 0, opacity: 1 }}
        exit={{
          scaleX: 0.02,
          x: "-12%",
          opacity: 0,
          transition: { duration: 1.8, ease: [0.25, 1, 0.5, 1] }
        }}
        style={{
          originX: 0,
          backgroundColor: theme.colors.secondary,
          background: `linear-gradient(135deg, ${theme.colors.secondary} 30%, #D9156A 100%)`,
        }}
        className="absolute left-0 top-0 w-1/2 h-full z-10 shadow-[8px_0_24px_rgba(0,0,0,0.2)] overflow-hidden"
      >
        {/* Curvature Fold Shadows (Compressed during exit scaleX) */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-full absolute top-0 w-[18%] border-r border-black/[0.01]"
            style={{
              left: `${i * 16.66}%`,
              background: `linear-gradient(to right, 
                rgba(0, 0, 0, 0.14) 0%, 
                rgba(255, 255, 255, 0.05) 20%, 
                rgba(0, 0, 0, 0.01) 60%, 
                rgba(0, 0, 0, 0.18) 100%)`,
            }}
          />
        ))}
        {/* Gold Braid/Trim Vertical Line on the meeting edge */}
        <div
          className="absolute top-0 right-0 w-[2px] h-full"
          style={{
            background: "linear-gradient(to bottom, #C59E66 0%, #E2C394 50%, #C59E66 100%)",
            boxShadow: "0 0 10px rgba(197, 158, 102, 0.6)",
          }}
        />
      </motion.div>

      {/* RIGHT STAGE CURTAIN (Blush Silk with gathering folds) */}
      <motion.div
        initial={{ scaleX: 1, x: 0, opacity: 1 }}
        exit={{
          scaleX: 0.02,
          x: "12%",
          opacity: 0,
          transition: { duration: 1.8, ease: [0.25, 1, 0.5, 1] }
        }}
        style={{
          originX: 1,
          backgroundColor: theme.colors.secondary,
          background: `linear-gradient(225deg, ${theme.colors.secondary} 30%, #D9156A 100%)`,
        }}
        className="absolute right-0 top-0 w-1/2 h-full z-10 shadow-[-8px_0_24px_rgba(0,0,0,0.2)] overflow-hidden"
      >
        {/* Curvature Fold Shadows (Compressed during exit scaleX) */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-full absolute top-0 w-[18%] border-r border-black/[0.01]"
            style={{
              left: `${i * 16.66}%`,
              background: `linear-gradient(to right, 
                rgba(0, 0, 0, 0.14) 0%, 
                rgba(255, 255, 255, 0.05) 20%, 
                rgba(0, 0, 0, 0.01) 60%, 
                rgba(0, 0, 0, 0.18) 100%)`,
            }}
          />
        ))}
        {/* Gold Braid/Trim Vertical Line on the meeting edge */}
        <div
          className="absolute top-0 left-0 w-[2px] h-full"
          style={{
            background: "linear-gradient(to bottom, #C59E66 0%, #E2C394 50%, #C59E66 100%)",
            boxShadow: "0 0 10px rgba(197, 158, 102, 0.6)",
          }}
        />
      </motion.div>

      {/* Gentle drifting petals (ambient cover experience) */}
      <motion.div
        initial={{ opacity: 0.22, scale: 1 }}
        exit={{
          opacity: 0,
          scale: 1.15,
          transition: { duration: 1.8, ease: "easeOut" }
        }}
        className="absolute inset-0 pointer-events-none z-15 overflow-hidden"
      >
        <IntroPetal className="absolute top-[12%] left-[8%] animate-rose-drift" style={{ animationDuration: "20s" }} />
        <IntroPetal className="absolute top-[28%] right-[10%] animate-rose-drift" style={{ animationDuration: "24s", animationDelay: "2s" }} />
        <IntroPetal className="absolute top-[62%] left-[14%] animate-rose-drift" style={{ animationDuration: "22s", animationDelay: "4s" }} />
        <IntroPetal className="absolute top-[78%] right-[12%] animate-rose-drift" style={{ animationDuration: "18s", animationDelay: "1s" }} />
      </motion.div>

      {/* Central Editorial Card (Translucent Blush Paper) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{
          opacity: 0,
          scale: 0.92,
          y: -30,
          transition: { duration: 0.7, ease: [0.32, 0, 0.67, 0] },
        }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-20 flex flex-col items-center text-center px-6 py-10 md:py-14 md:px-12 max-w-md w-[88%] select-none rounded-2xl border border-white/50 shadow-2xl backdrop-blur-md"
        style={{
          background: `rgba(252, 246, 245, 0.88)`,
          boxShadow: "0 24px 60px -15px rgba(45, 29, 33, 0.15)",
        }}
      >
        {/* Monogram seal */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 1 }}
          className="mb-8"
        >
          <div
            className="relative w-18 h-18 flex items-center justify-center"
            style={{ color: theme.colors.accent }}
          >
            <svg
              viewBox="0 0 100 100"
              className="absolute w-full h-full"
            >
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                opacity="0.4"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.3"
                opacity="0.2"
              />
            </svg>
            <span
              className={`${roseType.monogram} ${theme.palette.textPrimary}`}
            >
              {theme.assets.monogram}
            </span>
          </div>
        </motion.div>

        {/* Brand */}
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.9 }}
          className={`text-[9px] sm:text-[10px] font-body tracking-[0.45em] uppercase mb-5 ${theme.palette.textSecondary} opacity-85`}
        >
          {HAXR_AUTH.brand}
        </motion.span>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1 }}
          className={`text-center mb-4 ${theme.palette.textPrimary}`}
        >
          <span
            className={`${roseType.heroName} block`}
            style={{ color: theme.colors.secondary }}
          >
            {headline}
          </span>
          {surname ? (
            <span
              className={`${roseType.heroSurname} block -mt-1`}
              style={{ color: theme.colors.primary }}
            >
              {surname}
            </span>
          ) : null}
        </motion.h1>

        {/* Gold divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="w-14 h-px mb-5 origin-center"
          style={{
            background: `linear-gradient(to right, transparent, ${theme.colors.accent}, transparent)`,
          }}
        />

        {/* Subline */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.9 }}
          className={`${roseType.bodyPoetic} text-xs sm:text-sm mb-10 max-w-[280px] ${theme.palette.textSecondary}`}
        >
          {subline}
        </motion.p>

        {/* CTA */}
        <IntroEnterCta label={theme.copy.enterCta} onEnter={onEnter} />

        {/* Dynamic sound notice */}
        {theme.audio.type !== "silent" && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.72 }}
            transition={{ delay: 1, duration: 0.8 }}
            className={`text-[9px] sm:text-[10px] uppercase tracking-[0.18em] font-body ${theme.palette.textPrimary} opacity-80 select-none max-w-[18rem] text-center leading-relaxed`}
          >
            ♫ Recomenda-se ligar o som para uma experiência imersiva
          </motion.span>
        )}
      </motion.div>
    </div>
  );
}
