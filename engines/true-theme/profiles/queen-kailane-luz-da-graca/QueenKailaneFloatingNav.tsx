"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useLenis } from "lenis/react";
import type Lenis from "lenis";
import { Volume2, VolumeX } from "lucide-react";
import { useExperience } from "../../context";
import { QUEEN_EASE } from "./queen-motion";
import "./queen-nav.css";

const NAV_ITEMS = [
  { id: "queen-celebracao", label: "Celebração", shortLabel: "Celebração" },
  { id: "queen-versiculo", label: "Versículo", shortLabel: "Versículo" },
  { id: "queen-almoco", label: "À Mesa", shortLabel: "À Mesa" },
  { id: "queen-rsvp", label: "Confirmar", shortLabel: "Confirmar" },
] as const;

type NavSectionId = (typeof NAV_ITEMS)[number]["id"];

function getScrollOffset(): number {
  return window.matchMedia("(min-width: 768px)").matches ? -72 : -16;
}

/**
 * Nav flutuante editorial — centralizada, discreta, surge após passar do hero.
 * Isolada a queen-kailane-luz-da-graca.
 */
export function QueenKailaneFloatingNav() {
  const { introComplete, audioPlayer, audioEnabled, setAudioEnabled, theme } =
    useExperience();
  const lenis = useLenis();
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [activeId, setActiveId] = useState<NavSectionId>(NAV_ITEMS[0].id);

  const toggleAudio = async () => {
    if (!audioPlayer) return;
    if (audioEnabled) {
      audioPlayer.pause();
      setAudioEnabled(false);
      return;
    }
    try {
      if (audioPlayer.hasLoadedTrack()) {
        await audioPlayer.resume();
      } else {
        await audioPlayer.start();
      }
      setAudioEnabled(true);
    } catch {
      setAudioEnabled(false);
    }
  };

  const syncNavigation = useCallback(() => {
    const hero = document.getElementById("queen-hero");
    if (hero) {
      const heroBottom = hero.getBoundingClientRect().bottom;
      // Surge estritamente após o utilizador passar do Hero (fundo do hero atinge o topo)
      setVisible(heroBottom <= 0);
    } else {
      setVisible(window.scrollY > 450);
    }

    const activationLine = Math.min(window.innerHeight * 0.38, 280);
    let current: NavSectionId = NAV_ITEMS[0].id;

    for (const item of NAV_ITEMS) {
      const section = document.getElementById(item.id);
      if (section && section.getBoundingClientRect().top <= activationLine) {
        current = item.id;
      }
    }

    setActiveId(current);
  }, []);

  useLenis(
    useCallback(
      (_instance: Lenis) => {
        syncNavigation();
      },
      [syncNavigation]
    ),
    [syncNavigation]
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!introComplete) return;

    let frame = 0;
    const scheduleSync = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(syncNavigation);
    };

    scheduleSync();
    window.addEventListener("scroll", scheduleSync, { passive: true });
    window.addEventListener("resize", scheduleSync);
    window.visualViewport?.addEventListener("resize", scheduleSync);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleSync);
      window.removeEventListener("resize", scheduleSync);
      window.visualViewport?.removeEventListener("resize", scheduleSync);
    };
  }, [introComplete, syncNavigation]);

  const scrollToSection = (id: NavSectionId) => {
    const section = document.getElementById(id);
    if (!section) return;

    if (lenis) {
      lenis.scrollTo(section, {
        offset: getScrollOffset(),
        duration: reduceMotion ? 0.2 : 1.2,
      });
      return;
    }

    section.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (!mounted || !introComplete) return null;

  return createPortal(
    <AnimatePresence>
      {visible ? (
        <motion.nav
          className="queen-nav"
          aria-label="Navegação do convite"
          initial={
            reduceMotion ? { opacity: 1 } : { opacity: 0, y: -12 }
          }
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
          transition={{ duration: 0.55, ease: QUEEN_EASE }}
        >
          <div className="queen-nav__inner">
            <span className="queen-nav__mono" aria-hidden="true">
              QKC
            </span>
            <div className="queen-nav__items" role="list">
              {NAV_ITEMS.map((item, index) => {
                const isActive = activeId === item.id;
                return (
                  <span key={item.id} className="queen-nav__item-wrap" role="listitem">
                    {index > 0 ? (
                      <span className="queen-nav__sep" aria-hidden="true">
                        ·
                      </span>
                    ) : null}
                    <button
                      type="button"
                      className={`queen-nav__item${isActive ? " is-active" : ""}`}
                      aria-current={isActive ? "location" : undefined}
                      onClick={() => scrollToSection(item.id)}
                    >
                      <span className="queen-nav__label">{item.label}</span>
                      <span className="queen-nav__short">{item.shortLabel}</span>
                    </button>
                  </span>
                );
              })}
            </div>

            {theme.audio.src ? (
              <button
                type="button"
                className={`queen-nav__sound${audioEnabled ? " is-playing" : ""}`}
                onClick={toggleAudio}
                aria-label={
                  audioEnabled
                    ? "Silenciar música de ambiente (Tatana Yamukela Mhamba)"
                    : "Tocar música de ambiente (Tatana Yamukela Mhamba)"
                }
                title={
                  audioEnabled
                    ? "Silenciar música de fundo"
                    : "Tocar música de fundo"
                }
              >
                {audioEnabled ? (
                  <Volume2 size={13} strokeWidth={1.5} aria-hidden />
                ) : (
                  <VolumeX size={13} strokeWidth={1.5} aria-hidden />
                )}
              </button>
            ) : null}
          </div>
        </motion.nav>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
