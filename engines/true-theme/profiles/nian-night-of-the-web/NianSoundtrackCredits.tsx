"use client";

import {
  useEffect,
  useRef,
  type RefObject,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { isNianAuthorizedTrackActive } from "@lib/nian/event-details";
import { NIAN_EASE } from "./nian-motion";

/** Single source of truth — Nian soundtrack credits copy. */
export const NIAN_SOUNDTRACK_CREDIT = {
  track: "Sunflower",
  artists: "Post Malone & Swae Lee",
  work: "Spider-Man: Into the Spider-Verse",
} as const;

export type NianCreditsController = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  panelId: string;
  /** Last trigger that opened the panel — used for focus return. */
  lastTriggerRef: RefObject<HTMLElement | null>;
};

type TriggerProps = {
  credits: NianCreditsController;
  label: string;
  className?: string;
};

/**
 * Trigger only — does not touch audio playback / currentTime / mute / volume.
 */
export function NianSoundtrackCreditsTrigger({
  credits,
  label,
  className,
}: TriggerProps) {
  if (!isNianAuthorizedTrackActive()) return null;

  const toggle = () => {
    const next = !credits.open;
    if (next) {
      credits.lastTriggerRef.current =
        (document.activeElement as HTMLElement | null) ?? null;
    }
    credits.onOpenChange(next);
  };

  return (
    <button
      type="button"
      aria-expanded={credits.open}
      aria-controls={credits.panelId}
      onClick={toggle}
      className={className}
    >
      {label}
    </button>
  );
}

type PanelProps = {
  credits: NianCreditsController;
  /** Compact floating panel beside the audio control. */
  variant?: "floating" | "signature";
};

/**
 * Créditos discretos da banda sonora — exclusivo nian-night-of-the-web.
 * Não inicia, pausa, reinicia nem altera currentTime do áudio.
 */
export function NianSoundtrackCreditsPanel({
  credits,
  variant = "floating",
}: PanelProps) {
  const reduceMotion = useReducedMotion();
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!credits.open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        credits.onOpenChange(false);
        queueMicrotask(() => credits.lastTriggerRef.current?.focus());
      }
    };

    window.addEventListener("keydown", onKey);
    queueMicrotask(() => closeBtnRef.current?.focus());
    return () => window.removeEventListener("keydown", onKey);
  }, [credits.open, credits.onOpenChange, credits.lastTriggerRef]);

  if (!isNianAuthorizedTrackActive()) return null;

  const floating =
    variant === "floating"
      ? "w-[min(16.5rem,calc(100vw-5.5rem))]"
      : "w-full max-w-sm mx-auto";

  return (
    <AnimatePresence initial={false}>
      {credits.open ? (
        <motion.aside
          id={credits.panelId}
          key="nian-credits-panel"
          role="region"
          aria-label="Créditos da banda sonora"
          initial={
            reduceMotion ? { opacity: 1 } : { opacity: 0, y: 8, scale: 0.98 }
          }
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={
            reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.98 }
          }
          transition={{
            duration: reduceMotion ? 0.15 : 0.28,
            ease: NIAN_EASE,
          }}
          className={`${floating} border border-[#4169E1]/35 bg-[#0A0A0C]/92 px-3.5 py-3 text-left shadow-[0_12px_32px_rgba(3,5,11,0.55)] backdrop-blur-sm`}
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-[9px] font-semibold uppercase tracking-[0.32em] text-[#4169E1]">
              Créditos da banda sonora
            </p>
            <button
              ref={closeBtnRef}
              type="button"
              aria-label="Fechar créditos da banda sonora"
              onClick={() => {
                credits.onOpenChange(false);
                queueMicrotask(() => credits.lastTriggerRef.current?.focus());
              }}
              className="min-h-8 min-w-8 shrink-0 text-[11px] text-[#8FA3D1] transition hover:text-[#F4F6FB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4169E1]"
            >
              ✕
            </button>
          </div>
          <p className="mt-2 text-[13px] font-medium leading-snug tracking-[0.02em] text-[#F4F6FB]">
            &ldquo;{NIAN_SOUNDTRACK_CREDIT.track}&rdquo;
          </p>
          <p className="mt-1 text-[11px] leading-snug text-[#8FA3D1]">
            {NIAN_SOUNDTRACK_CREDIT.artists}
          </p>
          <p className="mt-2 text-[10px] uppercase tracking-[0.14em] text-[#8FA3D1]/85">
            {NIAN_SOUNDTRACK_CREDIT.work}
          </p>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}

/**
 * Compat — floating trigger + panel for the audio dock.
 * Prefer controlled `NianSoundtrackCreditsTrigger` + `Panel` when sharing state.
 */
export function NianSoundtrackCredits({
  credits,
}: {
  credits: NianCreditsController;
}) {
  return (
    <div className="pointer-events-auto flex flex-col items-start gap-2">
      <NianSoundtrackCreditsPanel credits={credits} variant="floating" />
      <NianSoundtrackCreditsTrigger
        credits={credits}
        label="Créditos"
        className="min-h-9 border border-[#4169E1]/40 bg-[#0A0A0C]/85 px-3 text-[9px] font-semibold uppercase tracking-[0.28em] text-[#8FA3D1] transition hover:border-[#4169E1] hover:text-[#F4F6FB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4169E1]"
      />
    </div>
  );
}
