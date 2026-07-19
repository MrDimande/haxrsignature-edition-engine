"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Pause, Play } from "lucide-react";
import { getFlowExitTransition } from "../../theme/experience-tokens";
import { formatStudioCredit, HAXR_AUTH } from "@lib/brand/authorship";
import { useExperience } from "./context";

export function ExperienceFlow() {
  const { theme, config, introComplete, setIntroComplete, audioPlayer } =
    useExperience();

  useEffect(() => {
    if (theme.flow === "direct") {
      setIntroComplete(true);
    }
  }, [theme.flow, setIntroComplete]);

  if (theme.flow === "direct" || introComplete) {
    return null;
  }

  return (
    <FlowOverlay
      onEnter={async () => {
        if (audioPlayer && theme.audio.type !== "silent") {
          await audioPlayer.start();
        }
        setIntroComplete(true);
      }}
    />
  );
}

interface FlowOverlayProps {
  onEnter: () => void | Promise<void>;
}

function FlowOverlay({ onEnter }: FlowOverlayProps) {
  const { theme, config, introComplete } = useExperience();
  const [mounted, setMounted] = useState(true);
  const exitTransition = getFlowExitTransition(theme.flow);

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

  useEffect(() => {
    if (introComplete) {
      const t = setTimeout(() => setMounted(false), exitTransition.duration * 1000 + 400);
      return () => clearTimeout(t);
    }
  }, [introComplete, exitTransition.duration]);

  if (!mounted) return null;

  const clientName =
    config.admin?.clientName ?? config.metadata.title.split("—").pop()?.trim() ?? config.metadata.title;

  return (
    <AnimatePresence>
      {!introComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
          {theme.flow === "reveal" && <RevealCurtains />}
          {theme.flow === "ritual-entry" && <RitualVeil />}
          {theme.flow === "story-driven" && <StoryVeil />}

          <motion.div
            initial={{ opacity: 1, scale: theme.flow === "ritual-entry" ? 0.92 : 0.95 }}
            exit={{
              opacity: 0,
              scale: theme.flow === "reveal" ? 1.05 : 1,
              transition: {
                duration: exitTransition.duration * 0.5,
                ease: exitTransition.ease,
              },
            }}
            className="relative z-20 flex flex-col items-center text-center px-6 max-w-lg select-none"
          >
            <span
              className={`text-[9px] font-body tracking-[0.45em] uppercase mb-8 ${theme.palette.textSecondary}`}
            >
              {HAXR_AUTH.brand}
            </span>

            <MonogramOrnament />

            <h2
              className={`font-display text-[10px] font-light uppercase tracking-[0.4em] mb-4 ${theme.palette.textPrimary}`}
            >
              {config.metadata.subtitle}
            </h2>

            <h1
              className={`font-display text-4xl sm:text-5xl font-light uppercase tracking-[0.2em] mb-6 ${theme.palette.textPrimary}`}
            >
              {config.metadata.eventType}
            </h1>

            <div
              className="w-24 h-[1px] mb-8"
              style={{
                background: `linear-gradient(to right, transparent, ${theme.colors.accent}55, transparent)`,
              }}
            />

            <h3
              className={`font-display text-xl sm:text-2xl font-light tracking-[0.05em] mb-12 ${theme.palette.textPrimary}`}
            >
              {clientName}
            </h3>

            <button
              type="button"
              onClick={onEnter}
              className="relative inline-flex items-center justify-center px-10 py-4 font-body text-[10px] uppercase tracking-[0.3em] font-light overflow-hidden transition-all duration-500 group cursor-pointer"
              style={{
                border: `1px solid ${theme.colors.primary}30`,
                color: theme.colors.primary,
              }}
            >
              <span
                className="absolute inset-0 -z-10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-600"
                style={{ backgroundColor: theme.colors.primary }}
              />
              <span className="group-hover:text-white transition-colors duration-500">
                {theme.copy.enterCta}
              </span>
            </button>

            {theme.flow === "story-driven" && (
              <p
                className={`mt-8 font-body text-[10px] font-light leading-relaxed max-w-xs ${theme.palette.textSecondary}`}
              >
                {config.metadata.description}
              </p>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function RevealCurtains() {
  const { theme } = useExperience();
  const exit = getFlowExitTransition("reveal");

  return (
    <>
      <motion.div
        initial={{ x: 0 }}
        exit={{ x: "-100%", transition: { duration: exit.duration, ease: exit.ease } }}
        className="absolute left-0 top-0 w-1/2 h-full z-10"
        style={{
          backgroundColor: theme.colors.background,
          backgroundImage: `linear-gradient(to right, ${theme.colors.background}, ${theme.colors.accent}15)`,
        }}
      />
      <motion.div
        initial={{ x: 0 }}
        exit={{ x: "100%", transition: { duration: exit.duration, ease: exit.ease } }}
        className="absolute right-0 top-0 w-1/2 h-full z-10"
        style={{
          backgroundColor: theme.colors.background,
          backgroundImage: `linear-gradient(to left, ${theme.colors.background}, ${theme.colors.accent}15)`,
        }}
      />
    </>
  );
}

function RitualVeil() {
  const { theme } = useExperience();
  const exit = getFlowExitTransition("ritual-entry");

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: exit.duration, ease: exit.ease } }}
      className="absolute inset-0 z-10"
      style={{
        background: `radial-gradient(ellipse at center, transparent 20%, ${theme.colors.background} 80%)`,
      }}
    />
  );
}

function StoryVeil() {
  const { theme } = useExperience();

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 0.85 }}
      className="absolute inset-0 z-10"
      style={{
        background: `linear-gradient(180deg, ${theme.colors.background} 0%, ${theme.colors.accent}08 50%, ${theme.colors.background} 100%)`,
      }}
    />
  );
}

function MonogramOrnament() {
  const { theme } = useExperience();
  const isShield = theme.visuals.shapes === "shield";

  if (isShield) {
    return (
      <div className="w-28 h-28 mb-10 flex items-center justify-center relative opacity-80">
        <svg viewBox="0 0 100 120" className="absolute w-full h-full" style={{ color: theme.colors.accent }}>
          <path
            d="M50 5 L90 25 L90 65 Q90 95 50 115 Q10 95 10 65 L10 25 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.8"
          />
          <path
            d="M50 15 L80 30 L80 62 Q80 85 50 100 Q20 85 20 62 L20 30 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.4"
            opacity="0.5"
          />
        </svg>
        <span className={`font-display text-lg tracking-[0.1em] font-light ${theme.palette.textPrimary}`}>
          {theme.assets.monogram}
        </span>
      </div>
    );
  }

  return (
    <div
      className="w-24 h-24 mb-10 opacity-80 flex items-center justify-center relative"
      style={{ color: theme.colors.accent }}
    >
      <svg viewBox="0 0 100 100" className="absolute w-full h-full animate-slow-spin">
        <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
        <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="0.8" />
        <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
        <path d="M 50 14 Q 86 50 50 86 Q 14 50 50 14 Z" fill="none" stroke="currentColor" strokeWidth="0.4" opacity="0.4" />
        <circle cx="50" cy="50" r="8" fill="none" stroke="currentColor" strokeWidth="0.8" />
      </svg>
      <span className={`font-display text-lg tracking-[0.1em] font-light ${theme.palette.textPrimary}`}>
        {theme.assets.monogram}
      </span>
    </div>
  );
}

export function AudioToggle() {
  const { audioEnabled, audioPlayer, introComplete, theme } = useExperience();
  const isRose = theme.renderProfile === "rose-elegance";
  const isWedding = theme.renderProfile === "jessica-samuel-wedding";
  const useBrandToggle = isRose || isWedding;

  if (!introComplete || theme.audio.type === "silent") return null;

  const handleToggle = async () => {
    if (!audioPlayer) return;
    if (audioEnabled) {
      audioPlayer.pause();
      return;
    }
    if (audioPlayer.hasLoadedTrack()) {
      await audioPlayer.resume();
      return;
    }
    await audioPlayer.start();
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`fixed z-40 flex items-center justify-center rounded-full border backdrop-blur-md cursor-pointer transition-all duration-300 ease-out select-none touch-manipulation shadow-sm ${
        useBrandToggle
          ? "top-5 right-5 h-12 w-12"
          : "top-6 right-6 h-11 w-11"
      }`}
      style={{
        borderColor: isRose
          ? `${theme.colors.secondary}66`
          : isWedding
            ? "rgba(255, 249, 242, 0.28)"
            : `${theme.colors.accent}25`,
        backgroundColor: isRose
          ? theme.colors.secondary
          : isWedding
            ? "rgba(122, 35, 50, 0.88)"
            : "rgba(255, 255, 255, 0.42)",
        color: useBrandToggle
          ? "#FFF9F2"
          : audioEnabled
            ? theme.colors.accent
            : theme.colors.primary,
        boxShadow: isRose
          ? `0 4px 24px ${theme.colors.secondary}45`
          : isWedding
            ? "0 8px 28px rgba(122, 35, 50, 0.35)"
            : undefined,
      }}
      aria-label={audioEnabled ? "Pausar música" : "Reproduzir música"}
      aria-pressed={audioEnabled}
    >
      <span
        className="absolute inset-0 rounded-full border pointer-events-none"
        style={{
          borderColor: useBrandToggle
            ? "rgba(255, 249, 242, 0.28)"
            : `${theme.colors.accent}15`,
        }}
        aria-hidden
      />
      <AnimatePresence mode="wait" initial={false}>
        {audioEnabled ? (
          <motion.span
            key="pause"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.2 }}
            className="relative flex items-center justify-center"
          >
            <Pause
              size={useBrandToggle ? 18 : 16}
              strokeWidth={1.35}
              fill="currentColor"
            />
          </motion.span>
        ) : (
          <motion.span
            key="play"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.2 }}
            className="relative flex items-center justify-center pl-0.5"
          >
            <Play
              size={useBrandToggle ? 18 : 16}
              strokeWidth={1.35}
              fill="currentColor"
            />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
