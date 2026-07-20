"use client";

import { HAXR_AUTH } from "@lib/brand/authorship";
import {
    WEDDING_ASSETS,
    WEDDING_COPY,
    WEDDING_COUPLE,
} from "@lib/jessica-samuel-wedding/event-details";
import { useLenis } from "lenis/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { getFlowExitTransition } from "../../../../theme/experience-tokens";
import { useExperience } from "../../context";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Capa editorial — abertura em «véu que se ergue».
 * Foto de revista (gallery-01) + tipografia ivory; ao entrar,
 * a capa sobe e dissolve como a primeira página de um editorial.
 */
export function JessicaSamuelIntroFlow() {
  const { theme, introComplete, setIntroComplete, audioPlayer } =
    useExperience();
  const lenis = useLenis();

  const resetToHero = useCallback(() => {
    lenis?.scrollTo(0, { immediate: true, force: true });
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [lenis]);

  useEffect(() => {
    if (introComplete) return;
    const prev = document.body.style.overflow;
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    resetToHero();
    document.body.style.overflow = "hidden";
    document.documentElement.classList.add("lenis-stopped");
    return () => {
      document.body.style.overflow = prev;
      window.history.scrollRestoration = previousScrollRestoration;
      document.documentElement.classList.remove("lenis-stopped");
    };
  }, [introComplete, resetToHero]);

  if (introComplete) return null;

  const handleEnter = async () => {
    resetToHero();
    if (audioPlayer && theme.audio.type !== "silent") {
      await audioPlayer.start();
    }
    setIntroComplete(true);

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const hero = document.getElementById("hero");
        if (hero && lenis) {
          lenis.scrollTo(hero, { immediate: true, force: true });
          return;
        }
        resetToHero();
      });
    });
  };

  return (
    <AnimatePresence>
      {!introComplete && (
        <JessicaSamuelIntroOverlay onEnter={handleEnter} />
      )}
    </AnimatePresence>
  );
}

function JessicaSamuelIntroOverlay({
  onEnter,
}: {
  onEnter: () => void | Promise<void>;
}) {
  const { theme, config } = useExperience();
  const reduceMotion = useReducedMotion();
  const exit = getFlowExitTransition(theme.flow);
  const [isOpening, setIsOpening] = useState(false);

  const subline =
    theme.copy.intro?.subline ?? config.metadata.subtitle ?? "";

  const handleEnterClick = async () => {
    if (isOpening) return;
    setIsOpening(true);
    if (!reduceMotion) {
      await new Promise((resolve) => setTimeout(resolve, 280));
    }
    await onEnter();
  };

  return (
    <motion.div
      className="js-wedding-cover fixed inset-0 z-[100] overflow-hidden"
      initial={{ opacity: 1 }}
      exit={
        reduceMotion
          ? { opacity: 0, transition: { duration: 0.35 } }
          : {
              opacity: 0,
              y: "-10%",
              scale: 1.04,
              filter: "blur(6px)",
              transition: {
                duration: exit.duration,
                ease: exit.ease,
              },
            }
      }
      aria-modal
      role="dialog"
      aria-label="Capa editorial do convite"
    >
      <motion.div
        className="js-wedding-cover__photo"
        initial={
          reduceMotion
            ? false
            : { scale: 1.08, opacity: 0.72 }
        }
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          duration: reduceMotion ? 0 : 1.6,
          ease: EASE,
        }}
      >
        <Image
          src={WEDDING_ASSETS.coverImage}
          alt={WEDDING_COPY.coverImageAlt}
          fill
          priority
          sizes="100vw"
          className="js-wedding-cover__img"
        />
      </motion.div>

      <div className="js-wedding-cover__veil" aria-hidden />
      <div className="js-wedding-cover__grain" aria-hidden />

      {/* Editorial floral corners — mobile-first, pinned to extremities */}
      <Image
        src="/images/jessica-samuel-wedding/floral/floral-corner-top-left.webp"
        alt=""
        width={920}
        height={653}
        priority
        sizes="(max-width: 479px) 50vw, (max-width: 767px) 36vw, (max-width: 1023px) 28vw, 24vw"
        className="js-wedding-floral-corner-tl"
        aria-hidden="true"
      />
      <Image
        src="/images/jessica-samuel-wedding/floral/floral-corner-bottom-right.webp"
        alt=""
        width={920}
        height={606}
        sizes="(max-width: 479px) 42vw, (max-width: 767px) 30vw, (max-width: 1023px) 24vw, 20vw"
        className="js-wedding-floral-corner-br"
        aria-hidden="true"
      />

      <div className="js-wedding-cover__stage">
        <motion.div
          className="js-wedding-cover__content"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: reduceMotion ? 0 : 0.12,
                delayChildren: reduceMotion ? 0 : 0.35,
              },
            },
          }}
        >
          <motion.p
            className="js-wedding-cover__monogram"
            variants={{
              hidden: { opacity: 0, y: 14 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.85, ease: EASE },
              },
            }}
          >
            {theme.assets.monogram}
          </motion.p>

          <motion.h1
            className="js-wedding-cover__title"
            variants={{
              hidden: { opacity: 0, y: 22 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 1, ease: EASE },
              },
            }}
          >
            <span className="js-wedding-cover__name">
              {WEDDING_COUPLE.bride}
            </span>
            <span className="js-wedding-cover__amp" aria-hidden>
              &amp;
            </span>
            <span className="js-wedding-cover__name">
              {WEDDING_COUPLE.groom}
            </span>
          </motion.h1>

          <motion.div
            className="js-wedding-cover__rule"
            aria-hidden
            variants={{
              hidden: { scaleX: 0, opacity: 0 },
              visible: {
                scaleX: 1,
                opacity: 1,
                transition: { duration: 0.9, ease: EASE },
              },
            }}
          />

          <motion.p
            className="js-wedding-cover__whisper"
            variants={{
              hidden: { opacity: 0, y: 16 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.9, ease: EASE },
              },
            }}
          >
            {WEDDING_COPY.introWhisper}
          </motion.p>

          <motion.p
            className="js-wedding-cover__meta"
            variants={{
              hidden: { opacity: 0, y: 12 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.85, ease: EASE },
              },
            }}
          >
            {subline}
          </motion.p>

          <motion.button
            type="button"
            onClick={handleEnterClick}
            disabled={isOpening}
            className="js-wedding-cover__cta"
            whileHover={reduceMotion || isOpening ? undefined : { y: -2 }}
            whileTap={reduceMotion || isOpening ? undefined : { scale: 0.98 }}
            variants={{
              hidden: { opacity: 0, y: 18 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.9, ease: EASE },
              },
            }}
          >
            <span className="js-wedding-cover__cta-label">
              {isOpening ? "A abrir…" : theme.copy.enterCta}
            </span>
          </motion.button>

          <motion.p
            className="js-wedding-cover__brand"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { duration: 0.8, ease: EASE, delay: 0.15 },
              },
            }}
          >
            {HAXR_AUTH.brand}
          </motion.p>
        </motion.div>
      </div>
    </motion.div>
  );
}
