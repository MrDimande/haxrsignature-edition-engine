"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { NeidyJoseTecituraSvg, type TecituraPhase } from "./NeidyJoseTecituraSvg";
import { NEIDY_JOSE_CONSTANTS } from "@lib/neidy-jose/constants";
import "./neidy-jose.css";

interface NeidyJoseTecituraGateProps {
  onComplete: () => void;
}

export function NeidyJoseTecituraGate({ onComplete }: NeidyJoseTecituraGateProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const [phase, setPhase] = useState<TecituraPhase>("silence");
  const [progress, setProgress] = useState<number>(0);
  const isTransitioningRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [dragStartX, setDragStartX] = useState<number | null>(null);

  const startConvergence = useCallback(() => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;

    setPhase("converging");
    setProgress(1);

    const monogramDelay = prefersReducedMotion ? 200 : 800;
    const revealDelay = prefersReducedMotion ? 500 : 2000;

    setTimeout(() => {
      setPhase("tecitura");
      setTimeout(() => {
        setPhase("monogram");
        setTimeout(() => {
          setPhase("revealed");
          setTimeout(() => {
            onComplete();
          }, prefersReducedMotion ? 100 : 500);
        }, revealDelay);
      }, monogramDelay);
    }, prefersReducedMotion ? 100 : 500);
  }, [onComplete, prefersReducedMotion]);

  // Timeline auto-advance
  useEffect(() => {
    if (prefersReducedMotion) {
      setPhase("prompt");
      return;
    }

    const t1 = setTimeout(() => {
      setPhase((prev) => (prev === "silence" ? "filaments" : prev));
    }, 2000);

    const t2 = setTimeout(() => {
      setPhase((prev) => (prev === "filaments" ? "prompt" : prev));
    }, 4800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [prefersReducedMotion]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setDragStartX(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragStartX === null || isTransitioningRef.current) return;
    const deltaX = Math.abs(e.clientX - dragStartX);
    const width = containerRef.current?.clientWidth || window.innerWidth;
    const calculatedProgress = Math.min(1, deltaX / (width * 0.35));
    setProgress(calculatedProgress);

    if (calculatedProgress > 0.6) {
      startConvergence();
    }
  };

  const handlePointerUp = () => {
    if (isTransitioningRef.current) return;
    startConvergence();
    setDragStartX(null);
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="nj-gate-container cursor-pointer"
      role="button"
      tabIndex={0}
      aria-label="Toque para unir o vínculo e abrir o convite"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          startConvergence();
        }
      }}
    >
      {/* Ambient background */}
      <div className="nj-bg-ambient" />
      <div className="nj-subtle-mesh" />

      {/* Top Header Identity */}
      <header className="relative z-20 flex flex-col items-center select-none text-center pt-2">
        <span className="font-body text-[11px] md:text-xs tracking-[0.35em] uppercase text-[#0A211A] font-semibold">
          {NEIDY_JOSE_CONSTANTS.scriptureTheme}
        </span>
        <span className="font-body text-[10px] md:text-[11px] tracking-[0.25em] uppercase text-[#3B6456] font-medium mt-1">
          {NEIDY_JOSE_CONSTANTS.scriptureReference}
        </span>
      </header>

      {/* Main Interactive Stage */}
      <main className="relative z-10 w-full flex flex-col items-center justify-center max-w-4xl mx-auto flex-1">
        {/* Left & Right Names Indicators */}
        <div className="w-full flex items-center justify-between px-6 md:px-16 text-xs md:text-sm tracking-[0.35em] uppercase font-medium text-[#0A211A] mb-1">
          <div className="flex items-center gap-2">
            <span className="w-3 h-[1.5px] bg-[#0A211A]" />
            <span>Neidy</span>
          </div>

          <div className="flex items-center gap-2">
            <span>José</span>
            <span className="w-3 h-[1.5px] bg-[#0A211A]" />
          </div>
        </div>

        {/* Dynamic SVG Tecitura Stage */}
        <NeidyJoseTecituraSvg
          phase={phase}
          progress={progress}
          prefersReducedMotion={prefersReducedMotion}
        />

        {/* Force Indicators: Fé · Vitória · Amor */}
        <div className="h-8 flex items-center justify-center">
          <AnimatePresence>
            {(phase === "filaments" || phase === "prompt") && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.6 }}
                className="flex items-center gap-6 text-[11px] md:text-xs tracking-[0.45em] uppercase"
              >
                <span className="text-[#0A211A] font-semibold">Fé</span>
                <span className="text-[#CBB994] font-bold">•</span>
                <span className="text-[#2D5A4C] font-semibold">Vitória</span>
                <span className="text-[#CBB994] font-bold">•</span>
                <span className="text-[#0A211A] font-semibold">Amor</span>
              </motion.div>
            )}

            {phase === "monogram" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="font-serif italic text-base md:text-lg tracking-[0.2em] text-[#0A211A] font-medium"
              >
                O Vínculo Perfeito
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom Gesture Touchpoint / Call to Action */}
      <footer className="relative z-20 flex flex-col items-center text-center pb-2">
        <AnimatePresence>
          {phase !== "revealed" && phase !== "monogram" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center gap-2.5"
            >
              {/* Pulsing gesture indicator */}
              <div className="relative flex items-center justify-center">
                <span className="absolute w-7 h-7 rounded-full bg-[#CBB994]/30 animate-ping" />
                <div className="w-3 h-3 rounded-full bg-[#0A211A]" />
              </div>

              <p className="font-body text-xs md:text-sm tracking-[0.25em] uppercase text-[#0A211A] font-medium">
                Toque para unir o que a Fé, a Vitória e o Amor selaram
              </p>

              <span className="text-[10px] tracking-[0.2em] uppercase text-[#3B6456] font-normal">
                (toque para acelerar)
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </footer>
    </div>
  );
}
