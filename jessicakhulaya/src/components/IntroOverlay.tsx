"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useApp } from "@/lib/context";
import { kalimbaPlayer, shouldAutoPlayKulayaAudio } from "@/lib/audio";
import { COLORS } from "@/styles/tokens";
import { HAXR_AUTH } from "@lib/brand/authorship";

export default function IntroOverlay() {
  const { introComplete, setIntroComplete, setAudioEnabled } = useApp();
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    if (introComplete) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.classList.add("lenis-stopped");

    return () => {
      document.body.style.overflow = previousOverflow;
      document.documentElement.classList.remove("lenis-stopped");
    };
  }, [introComplete]);

  useEffect(() => {
    if (introComplete) {
      const timer = setTimeout(() => setMounted(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [introComplete]);

  const handleEnter = async () => {
    if (kalimbaPlayer && shouldAutoPlayKulayaAudio()) {
      const started = await kalimbaPlayer.start();
      setAudioEnabled(started);
    } else {
      setAudioEnabled(false);
    }
    setIntroComplete(true);
  };

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {!introComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
          <motion.div
            initial={{ x: 0 }}
            animate={{ x: 0 }}
            exit={{
              x: "-100%",
              transition: { duration: 1.6, ease: [0.76, 0, 0.24, 1] },
            }}
            className="absolute left-0 top-0 w-1/2 h-full z-10 select-none border-r border-[#D4AF37]/15"
            style={{
              backgroundColor: COLORS.terracottaDeep,
              backgroundImage: `linear-gradient(to right, ${COLORS.woodBrownDeep}, ${COLORS.terracottaDeep})`,
            }}
          >
            <div
              className="absolute inset-0 opacity-[0.02]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0 L100 100 M100 0 L0 100' stroke='%23fff' strokeWidth='1'/%3E%3C/svg%3E")`,
                backgroundSize: "40px 40px",
              }}
            />
          </motion.div>

          <motion.div
            initial={{ x: 0 }}
            animate={{ x: 0 }}
            exit={{
              x: "100%",
              transition: { duration: 1.6, ease: [0.76, 0, 0.24, 1] },
            }}
            className="absolute right-0 top-0 w-1/2 h-full z-10 select-none border-l border-[#D4AF37]/15"
            style={{
              backgroundColor: COLORS.terracottaDeep,
              backgroundImage: `linear-gradient(to left, ${COLORS.woodBrownDeep}, ${COLORS.terracottaDeep})`,
            }}
          >
            <div
              className="absolute inset-0 opacity-[0.02]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0 L100 100 M100 0 L0 100' stroke='%23fff' strokeWidth='1'/%3E%3C/svg%3E")`,
                backgroundSize: "40px 40px",
              }}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 1, scale: 0.95 }}
            exit={{
              opacity: 0,
              scale: 1.05,
              transition: { duration: 0.8, ease: "easeInOut" },
            }}
            className="intro-overlay-content relative z-20"
          >
            <span className="intro-overlay-brand">{HAXR_AUTH.brand}</span>

            <div className="intro-overlay-mandala">
              <svg viewBox="0 0 100 100" className="w-full h-full animate-slow-spin">
                <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
                <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="0.8" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.6" />
                <path d="M 50 8 L 92 50 L 50 92 L 8 50 Z" fill="none" stroke="currentColor" strokeWidth="0.8" />
                <path d="M 50 14 L 86 50 L 50 86 L 14 50 Z" fill="none" stroke="currentColor" strokeWidth="0.4" opacity="0.6" />
                <path d="M 20 20 L 80 20 L 80 80 L 20 80 Z" fill="none" stroke="currentColor" strokeWidth="0.5" transform="rotate(45 50 50)" />
                <path d="M 50 20 L 60 40 L 80 50 L 60 60 L 50 80 L 40 60 L 20 50 L 40 40 Z" fill="none" stroke="currentColor" strokeWidth="0.8" />
                <circle cx="50" cy="50" r="8" fill="none" stroke="currentColor" strokeWidth="1" />
                <circle cx="50" cy="50" r="3" fill="currentColor" />
              </svg>
            </div>

            <h2 className="intro-overlay-subtitle">Cerimónia de Transição</h2>

            <h1 className="intro-overlay-title">KULAYA</h1>

            <div className="intro-overlay-divider" aria-hidden />

            <h3 className="intro-overlay-name">Jessica Muege</h3>

            <button
              type="button"
              onClick={handleEnter}
              className="ceremony-enter-btn"
            >
              Entrar na Cerimónia
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
