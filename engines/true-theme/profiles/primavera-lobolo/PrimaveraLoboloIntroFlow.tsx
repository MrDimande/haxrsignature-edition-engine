"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { HAXR_AUTH } from "@lib/brand/authorship";
import { TRADITIONAL_COPY } from "@lib/jessica-samuel-traditional/event-details";
import { getFlowExitTransition } from "../../../../theme/experience-tokens";
import { useExperience } from "../../context";
import { primaveraType } from "./primavera-typography";
import { PRIMAVERA_SURFACES } from "./primavera-surfaces";
import { SpringPetalCluster, WovenDivider } from "./primavera-motifs";

type IntroPhase = "active" | "exiting" | "hidden";

const EXIT_MS = 1900;

export function PrimaveraLoboloIntroFlow() {
  const { theme, introComplete, setIntroComplete, audioPlayer } =
    useExperience();
  const [phase, setPhase] = useState<IntroPhase>(
    introComplete ? "hidden" : "active",
  );

  useEffect(() => {
    if (introComplete && phase !== "hidden") {
      setPhase("hidden");
    }
  }, [introComplete, phase]);

  useEffect(() => {
    if (phase !== "active") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.classList.add("lenis-stopped");
    return () => {
      document.body.style.overflow = prev;
      document.documentElement.classList.remove("lenis-stopped");
    };
  }, [phase]);

  if (phase === "hidden") return null;

  const handleEnter = async () => {
    if (phase === "exiting") return;
    setPhase("exiting");

    if (audioPlayer && theme.audio.type !== "silent") {
      void audioPlayer.start();
    }

    await new Promise((resolve) => setTimeout(resolve, EXIT_MS));
    setIntroComplete(true);
    setPhase("hidden");
  };

  return (
    <AnimatePresence>
      <PrimaveraIntroOverlay
        key="primavera-intro"
        phase={phase}
        onEnter={handleEnter}
      />
    </AnimatePresence>
  );
}

function PrimaveraIntroOverlay({
  phase,
  onEnter,
}: {
  phase: IntroPhase;
  onEnter: () => void | Promise<void>;
}) {
  const { theme, config } = useExperience();
  const reduceMotion = useReducedMotion();
  const exit = getFlowExitTransition(theme.flow);
  const isExiting = phase === "exiting";

  const headline = theme.copy.intro?.headline ?? "Jessica";
  const surname = theme.copy.intro?.surname ?? "& Samuel";
  const subline =
    theme.copy.intro?.subline ?? config.metadata.subtitle ?? "";

  const curtainEase = [0.76, 0, 0.24, 1] as const;
  const curtainDuration = reduceMotion ? 0.4 : 1.85;

  return (
    <motion.div
      className="fixed inset-0 z-[100] overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: exit.duration, ease: exit.ease } }}
      aria-hidden={isExiting}
    >
      {/* Fundo profundo */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 90% 70% at 50% 42%, ${PRIMAVERA_SURFACES.terracottaDeep} 0%, ${PRIMAVERA_SURFACES.panelDark} 48%, ${PRIMAVERA_SURFACES.ink} 100%)`,
        }}
      />

      {/* Luz central — respira antes de abrir */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0.35 }}
        animate={{
          opacity: isExiting ? 1 : [0.28, 0.5, 0.32],
          scale: isExiting ? 1.15 : 1,
        }}
        transition={
          isExiting
            ? { duration: curtainDuration, ease: curtainEase }
            : { duration: 4.5, repeat: Infinity, ease: "easeInOut" }
        }
        style={{
          background: `radial-gradient(ellipse 28% 55% at 50% 50%, ${PRIMAVERA_SURFACES.goldLight}55 0%, ${PRIMAVERA_SURFACES.terracotta}22 38%, transparent 72%)`,
        }}
      />

      {/* Feixe dourado vertical */}
      <motion.div
        className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px pointer-events-none"
        initial={{ scaleY: 0.2, opacity: 0 }}
        animate={{
          scaleY: isExiting ? 1.2 : 1,
          opacity: isExiting ? 0.9 : [0.35, 0.75, 0.35],
        }}
        transition={
          isExiting
            ? { duration: curtainDuration * 0.6, ease: curtainEase }
            : { duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }
        }
        style={{
          background: `linear-gradient(to bottom, transparent, ${PRIMAVERA_SURFACES.gold}, transparent)`,
          boxShadow: `0 0 28px ${PRIMAVERA_SURFACES.gold}88`,
          transformOrigin: "center center",
        }}
      />

      {/* Pétalas flutuantes — sempre no DOM (evita hydration mismatch com useReducedMotion) */}
      <div className="absolute inset-0 pointer-events-none z-[15] overflow-hidden motion-reduce:hidden">
        <div
          className="absolute top-[10%] left-[6%] animate-primavera-petal-drift motion-reduce:animate-none opacity-70"
          style={{ animationDelay: "0s" }}
        >
          <SpringPetalCluster className="w-16 h-16" fill={PRIMAVERA_SURFACES.terracotta} />
        </div>
        <div
          className="absolute top-[22%] right-[8%] animate-primavera-petal-drift motion-reduce:animate-none opacity-60"
          style={{ animationDelay: "2.5s" }}
        >
          <SpringPetalCluster className="w-14 h-14" fill={PRIMAVERA_SURFACES.gold} />
        </div>
        <div
          className="absolute bottom-[18%] left-[12%] animate-primavera-petal-drift motion-reduce:animate-none opacity-50"
          style={{ animationDelay: "4s" }}
        >
          <SpringPetalCluster className="w-20 h-20" fill={PRIMAVERA_SURFACES.terracottaSoft} />
        </div>
        <div
          className="absolute bottom-[28%] right-[10%] animate-primavera-petal-drift motion-reduce:animate-none opacity-55"
          style={{ animationDelay: "1.2s" }}
        >
          <SpringPetalCluster className="w-12 h-12" fill={PRIMAVERA_SURFACES.goldMuted} />
        </div>
      </div>

      {/* Cortina esquerda */}
      <motion.div
        className="absolute left-0 top-0 h-full z-10 overflow-hidden"
        style={{
          width: "50.5%",
          background: `linear-gradient(118deg, ${PRIMAVERA_SURFACES.panelDark} 0%, ${PRIMAVERA_SURFACES.terracottaDeep} 55%, ${PRIMAVERA_SURFACES.terracotta}88 100%)`,
          boxShadow: "8px 0 32px rgba(0,0,0,0.35)",
        }}
        initial={{ x: 0 }}
        animate={
          isExiting
            ? { x: "-108%", opacity: 0.6 }
            : { x: [0, -6, 0] }
        }
        transition={
          isExiting
            ? { duration: curtainDuration, ease: curtainEase }
            : { duration: 7, repeat: Infinity, ease: "easeInOut" }
        }
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="absolute top-0 h-full w-[20%]"
            style={{
              left: `${i * 20}%`,
              background:
                "linear-gradient(to right, rgba(0,0,0,0.18) 0%, rgba(255,255,255,0.04) 35%, rgba(0,0,0,0.08) 100%)",
            }}
          />
        ))}
        <div
          className="absolute top-0 right-0 h-full w-[2px]"
          style={{
            background: `linear-gradient(to bottom, transparent, ${PRIMAVERA_SURFACES.gold}, transparent)`,
            boxShadow: `0 0 16px ${PRIMAVERA_SURFACES.gold}66`,
          }}
        />
      </motion.div>

      {/* Cortina direita */}
      <motion.div
        className="absolute right-0 top-0 h-full z-10 overflow-hidden"
        style={{
          width: "50.5%",
          background: `linear-gradient(242deg, ${PRIMAVERA_SURFACES.panelDark} 0%, ${PRIMAVERA_SURFACES.terracottaDeep} 55%, ${PRIMAVERA_SURFACES.terracotta}88 100%)`,
          boxShadow: "-8px 0 32px rgba(0,0,0,0.35)",
        }}
        initial={{ x: 0 }}
        animate={
          isExiting
            ? { x: "108%", opacity: 0.6 }
            : { x: [0, 6, 0] }
        }
        transition={
          isExiting
            ? { duration: curtainDuration, ease: curtainEase }
            : { duration: 7, repeat: Infinity, ease: "easeInOut" }
        }
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="absolute top-0 h-full w-[20%]"
            style={{
              left: `${i * 20}%`,
              background:
                "linear-gradient(to right, rgba(0,0,0,0.18) 0%, rgba(255,255,255,0.04) 35%, rgba(0,0,0,0.08) 100%)",
            }}
          />
        ))}
        <div
          className="absolute top-0 left-0 h-full w-[2px]"
          style={{
            background: `linear-gradient(to bottom, transparent, ${PRIMAVERA_SURFACES.gold}, transparent)`,
            boxShadow: `0 0 16px ${PRIMAVERA_SURFACES.gold}66`,
          }}
        />
      </motion.div>

      {/* Conteúdo central */}
      <motion.div
        className="absolute inset-0 z-20 flex items-center justify-center px-6 sm:px-8"
        initial={{ opacity: 0 }}
        animate={{
          opacity: isExiting ? 0 : 1,
          y: isExiting ? -36 : 0,
          scale: isExiting ? 0.96 : 1,
        }}
        transition={
          isExiting
            ? { duration: 0.75, ease: [0.32, 0, 0.67, 0] }
            : { duration: 1.1, ease: [0.16, 1, 0.3, 1] }
        }
      >
        <div className="flex flex-col items-center text-center max-w-md w-full">
          {/* Sussurro poético */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: isExiting ? 0 : 1, y: 0 }}
            transition={{ delay: reduceMotion ? 0 : 0.55, duration: 1.1 }}
            className={`${primaveraType.bodyPoetic} text-sm sm:text-base mb-8 max-w-xs`}
            style={{ color: PRIMAVERA_SURFACES.goldLight }}
          >
            {TRADITIONAL_COPY.introWhisper}
          </motion.p>

          <motion.p
            initial={{ opacity: 0, letterSpacing: "0.55em" }}
            animate={{ opacity: isExiting ? 0 : 1, letterSpacing: "0.38em" }}
            transition={{ delay: reduceMotion ? 0 : 0.85, duration: 1.2 }}
            className={primaveraType.eyebrow}
            style={{ color: PRIMAVERA_SURFACES.goldLight }}
          >
            {theme.copy.heroEyebrow}
          </motion.p>

          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: isExiting ? 0 : 1, opacity: isExiting ? 0 : 1 }}
            transition={{ delay: reduceMotion ? 0 : 1.05, duration: 0.9 }}
            className="origin-center my-7"
          >
            <WovenDivider className="w-40 h-3" color={PRIMAVERA_SURFACES.gold} />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: isExiting ? 0 : 1, y: 0 }}
            transition={{ delay: reduceMotion ? 0 : 1.2, duration: 1.15 }}
            className="mb-2"
          >
            <span
              className={`${primaveraType.heroNames} block`}
              style={{ color: PRIMAVERA_SURFACES.ivoryLight }}
            >
              {headline}
            </span>
            <span
              className={`${primaveraType.heroNames} block -mt-1`}
              style={{ color: PRIMAVERA_SURFACES.terracottaSoft }}
            >
              {surname}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: isExiting ? 0 : 1, y: 0 }}
            transition={{ delay: reduceMotion ? 0 : 1.45, duration: 1 }}
            className={`${primaveraType.eyebrow} mb-10 mt-3`}
            style={{ color: PRIMAVERA_SURFACES.goldMuted }}
          >
            {subline}
          </motion.p>

          <PrimaveraEnterCta
            label={theme.copy.enterCta}
            onEnter={onEnter}
            disabled={isExiting}
          />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: isExiting ? 0 : 0.5 }}
            transition={{ delay: reduceMotion ? 0 : 1.9, duration: 0.9 }}
            className="mt-14 text-[9px] tracking-[0.28em] uppercase"
            style={{ color: PRIMAVERA_SURFACES.ivoryLight }}
          >
            {HAXR_AUTH.brand}
          </motion.p>
        </div>
      </motion.div>

      {/* Flash de luz ao abrir */}
      <motion.div
        className="absolute inset-0 z-[25] pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: isExiting ? [0, 0.55, 0] : 0 }}
        transition={{ duration: curtainDuration * 0.7, ease: "easeOut" }}
        style={{
          background: `radial-gradient(circle at 50% 48%, ${PRIMAVERA_SURFACES.ivoryLight}cc 0%, transparent 58%)`,
        }}
      />
    </motion.div>
  );
}

function PrimaveraEnterCta({
  label,
  onEnter,
  disabled,
}: {
  label: string;
  onEnter: () => void | Promise<void>;
  disabled?: boolean;
}) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <motion.button
      type="button"
      onClick={onEnter}
      disabled={disabled}
      onPointerDown={() => !disabled && setIsPressed(true)}
      onPointerUp={() => setIsPressed(false)}
      onPointerLeave={() => setIsPressed(false)}
      initial={{ opacity: 0, y: 14 }}
      animate={{
        opacity: disabled ? 0.6 : 1,
        y: 0,
        boxShadow: isPressed || disabled
          ? `0 12px 36px ${PRIMAVERA_SURFACES.terracotta}44`
          : [
              `0 0 0 0 ${PRIMAVERA_SURFACES.gold}00`,
              `0 0 24px 4px ${PRIMAVERA_SURFACES.gold}33`,
              `0 0 0 0 ${PRIMAVERA_SURFACES.gold}00`,
            ],
      }}
      transition={{
        opacity: { delay: 1.65, duration: 0.9 },
        y: { delay: 1.65, duration: 0.9 },
        boxShadow: disabled
          ? { duration: 0.3 }
          : { duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 2 },
      }}
      whileHover={disabled ? undefined : { scale: 1.03 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      className={`${primaveraType.eyebrow} relative px-10 py-4 min-h-[48px] border rounded-sm overflow-hidden transition-colors duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-wait touch-manipulation select-none`}
      style={{
        borderColor: PRIMAVERA_SURFACES.gold,
        color: PRIMAVERA_SURFACES.ivoryLight,
        backgroundColor: `${PRIMAVERA_SURFACES.terracotta}55`,
      }}
    >
      {!disabled && (
        <motion.span
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          animate={{ x: ["-120%", "220%"] }}
          transition={{
            duration: 2.6,
            repeat: Infinity,
            ease: "easeInOut",
            repeatDelay: 1.4,
          }}
          style={{
            background: `linear-gradient(90deg, transparent, ${PRIMAVERA_SURFACES.goldLight}44, transparent)`,
          }}
        />
      )}
      <span className="relative z-10 flex items-center justify-center gap-2.5">
        {disabled ? (
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
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            >
              →
            </motion.span>
          </>
        )}
      </span>
    </motion.button>
  );
}
