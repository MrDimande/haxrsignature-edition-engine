"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { HAXR_AUTH } from "@lib/brand/authorship";
import { useExperience } from "../../context";
import { ChampagneFlutes, FabricDrape, FloatingRose } from "../../illustrations/BrideIllustrations";

export function IllustrationIntroFlow() {
  const { theme, introComplete, setIntroComplete, audioPlayer } = useExperience();

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
      {!introComplete && <IllustrationIntroOverlay onEnter={handleEnter} />}
    </AnimatePresence>
  );
}

function IllustrationIntroOverlay({ onEnter }: { onEnter: () => void | Promise<void> }) {
  const { theme, config, introComplete } = useExperience();
  const [mounted, setMounted] = useState(true);
  const accent = theme.colors.accent;
  const secondary = theme.colors.secondary;
  const headline = theme.copy.intro?.headline ?? config.metadata.eventType;
  const subline = theme.copy.intro?.subline ?? config.metadata.subtitle;

  useEffect(() => {
    if (introComplete) {
      const t = setTimeout(() => setMounted(false), 2400);
      return () => clearTimeout(t);
    }
  }, [introComplete]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
      {/* Rich backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 70% 55% at 50% 45%, #FFFFFF 0%, ${theme.colors.background} 55%, #F7E8EC 100%)`,
        }}
      />
      <div className="absolute inset-0 pattern-hearts opacity-40 pointer-events-none" />

      {/* Curtain panels */}
      <motion.div
        initial={{ x: 0 }}
        exit={{ x: "-100%", transition: { duration: 1.9, ease: [0.76, 0, 0.24, 1] } }}
        className="absolute left-0 top-0 w-1/2 h-full z-10 overflow-hidden"
        style={{ backgroundColor: theme.colors.background }}
      >
        <FabricDrape className="absolute bottom-0 w-[200%] h-48 opacity-90" accent={accent} />
        <div
          className="absolute inset-y-0 right-0 w-px"
          style={{ background: `linear-gradient(to bottom, transparent, ${accent}55, transparent)` }}
        />
      </motion.div>
      <motion.div
        initial={{ x: 0 }}
        exit={{ x: "100%", transition: { duration: 1.9, ease: [0.76, 0, 0.24, 1] } }}
        className="absolute right-0 top-0 w-1/2 h-full z-10 overflow-hidden"
        style={{ backgroundColor: theme.colors.background }}
      >
        <FabricDrape className="absolute bottom-0 w-[200%] h-48 opacity-90 -scale-x-100" accent={accent} />
        <div
          className="absolute inset-y-0 left-0 w-px"
          style={{ background: `linear-gradient(to bottom, transparent, ${accent}55, transparent)` }}
        />
      </motion.div>

      {/* Corner ornaments */}
      <motion.div
        className="absolute top-[10%] left-[12%] hidden sm:block opacity-20 z-20"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <ChampagneFlutes className="w-14 h-18" accent={secondary} primary={theme.colors.primary} />
      </motion.div>
      <motion.div
        className="absolute bottom-[14%] right-[12%] hidden sm:block opacity-25 z-20"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <FloatingRose className="w-12 h-12" accent={accent} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.03, transition: { duration: 0.85 } }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-20 flex flex-col items-center text-center px-8 max-w-xl"
      >
        {/* Monogram seal */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.9 }}
          className="mb-8"
        >
          <div className="relative w-20 h-20 flex items-center justify-center">
            <div
              className="absolute inset-0 rounded-full border"
              style={{ borderColor: `${accent}44` }}
            />
            <div
              className="absolute inset-1.5 rounded-full border border-dashed"
              style={{ borderColor: `${accent}30` }}
            />
            <span className="font-display italic text-xl text-[#B89B5E]">{theme.assets.monogram}</span>
          </div>
        </motion.div>

        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.8 }}
          className={`text-[8px] font-body tracking-[0.55em] uppercase mb-5 ${theme.palette.textSecondary}`}
        >
          {HAXR_AUTH.brand}
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 1 }}
          className={`font-display text-4xl sm:text-5xl md:text-6xl font-light leading-[1.05] tracking-tight mb-4 ${theme.palette.textPrimary}`}
        >
          {headline}
        </motion.h1>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="w-16 h-px mb-6 origin-center"
          style={{ background: `linear-gradient(to right, transparent, ${accent}, transparent)` }}
        />

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.9 }}
          className={`font-display italic text-sm sm:text-base font-light leading-relaxed mb-12 max-w-sm ${theme.palette.textSecondary}`}
        >
          {subline}
        </motion.p>

        <motion.button
          type="button"
          onClick={onEnter}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.8 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="relative px-14 py-4 font-body text-[10px] uppercase tracking-[0.4em] font-medium border transition-all duration-500 group cursor-pointer overflow-hidden"
          style={{
            borderColor: `${accent}55`,
            color: theme.colors.primary,
            backgroundColor: "rgba(255,255,255,0.35)",
            backdropFilter: "blur(8px)",
          }}
        >
          <span
            className="absolute inset-0 -z-10 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"
            style={{ backgroundColor: theme.colors.primary }}
          />
          <span className="group-hover:text-white transition-colors duration-500">
            {theme.copy.enterCta}
          </span>
        </motion.button>
      </motion.div>
    </div>
  );
}
