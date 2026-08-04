"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  BookOpen,
  CalendarDays,
  Gift,
  Star,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useLenis } from "lenis/react";
import type Lenis from "lenis";
import { useExperience } from "../../context";

const EASE = [0.22, 1, 0.36, 1] as const;

const NAV_ITEMS: ReadonlyArray<{
  id: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
}> = [
  {
    id: "stan-story",
    label: "História",
    shortLabel: "Actos",
    icon: BookOpen,
  },
  {
    id: "inspiracoes",
    label: "Ídolos",
    shortLabel: "Ídolos",
    icon: Star,
  },
  {
    id: "matchday",
    label: "Matchday",
    shortLabel: "Dia",
    icon: CalendarDays,
  },
  {
    id: "presentes",
    label: "Presentes",
    shortLabel: "Gifts",
    icon: Gift,
  },
  {
    id: "rsvp",
    label: "Convocatória",
    shortLabel: "RSVP",
    icon: UserCheck,
  },
];

type NavSectionId = (typeof NAV_ITEMS)[number]["id"];

function getScrollOffset(): number {
  return window.matchMedia("(min-width: 768px)").matches ? -28 : -12;
}

/**
 * Menu flutuante Matchday — só após o Hero.
 * Isolado a stan-real-madrid.
 */
export function StanFloatingNav() {
  const { introComplete } = useExperience();
  const lenis = useLenis();
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeId, setActiveId] = useState<NavSectionId>(NAV_ITEMS[0].id);

  useEffect(() => {
    const syncPanel = () => {
      setPanelOpen(document.body.hasAttribute("data-stan-panel"));
    };
    syncPanel();
    const observer = new MutationObserver(syncPanel);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["data-stan-panel"],
    });
    return () => observer.disconnect();
  }, []);

  const syncNavigation = useCallback(() => {
    const hero = document.getElementById("hero");
    const heroBottom =
      hero?.getBoundingClientRect().bottom ?? window.innerHeight;
    setVisible(heroBottom <= 24);

    const activationLine = Math.min(window.innerHeight * 0.38, 280);
    let current = NAV_ITEMS[0].id;

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
        duration: 1.05,
      });
      return;
    }

    section.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (!mounted || !introComplete) return null;

  return createPortal(
    <AnimatePresence>
      {visible && !panelOpen ? (
        <motion.nav
          aria-label="Navegação do convite Stan"
          initial={
            reduceMotion
              ? { opacity: 1 }
              : { opacity: 0, y: 28, scale: 0.96 }
          }
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={
            reduceMotion
              ? { opacity: 0 }
              : { opacity: 0, y: 18, scale: 0.97 }
          }
          transition={{ duration: 0.45, ease: EASE }}
          className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        >
          <div
            className="pointer-events-auto flex max-w-[min(100%,36rem)] items-center gap-1 rounded-full border border-[#C9A86A]/35 bg-[#0B132B]/92 px-2 py-1.5 shadow-[0_16px_48px_rgba(5,10,18,0.55),0_0_28px_rgba(201,168,106,0.12)] backdrop-blur-xl sm:gap-1.5 sm:px-2.5 sm:py-2"
            style={{
              backgroundImage:
                "linear-gradient(180deg, rgba(201,168,106,0.08) 0%, transparent 45%)",
            }}
          >
            {/* Monograma S·5 — lineup mark */}
            <div
              className="mr-0.5 flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-full border border-[#C9A86A]/40 bg-[#050A12]/60 sm:mr-1 sm:h-10 sm:w-10"
              aria-hidden
            >
              <span className="font-display text-[8px] font-semibold tracking-[0.2em] text-[#C9A86A]">
                S5
              </span>
            </div>

            {/* Linha de campo subtil */}
            <span
              className="mx-0.5 hidden h-6 w-px bg-[#C9A86A]/25 sm:block"
              aria-hidden
            />

            <div className="flex min-w-0 flex-1 items-stretch justify-between gap-0.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-1 [&::-webkit-scrollbar]:hidden">
              {NAV_ITEMS.map((item) => {
                const isActive = activeId === item.id;
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-label={item.label}
                    aria-current={isActive ? "location" : undefined}
                    onClick={() => scrollToSection(item.id)}
                    className={`relative flex min-w-[3.1rem] flex-col items-center gap-0.5 rounded-full px-2 py-1.5 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9A86A] sm:min-w-[3.6rem] sm:px-2.5 sm:py-2 ${
                      isActive
                        ? "text-[#050A12]"
                        : "text-[#E8DCC8]/75 hover:text-[#F7F4EF]"
                    }`}
                  >
                    {isActive ? (
                      <motion.span
                        layoutId="stan-nav-pitch"
                        className="absolute inset-0 rounded-full bg-[#C9A86A]"
                        transition={{ duration: 0.35, ease: EASE }}
                        aria-hidden
                      />
                    ) : null}
                    <Icon
                      size={14}
                      strokeWidth={isActive ? 2 : 1.5}
                      className="relative z-[1]"
                      aria-hidden
                    />
                    <span className="relative z-[1] font-body text-[7px] font-bold uppercase tracking-[0.14em] sm:text-[8px] sm:tracking-[0.16em]">
                      <span className="hidden sm:inline">{item.label}</span>
                      <span className="sm:hidden">{item.shortLabel}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.nav>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
