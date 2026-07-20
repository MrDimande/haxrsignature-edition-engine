"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  CalendarDays,
  Camera,
  CheckCircle2,
  Heart,
  Plane,
  Shirt,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useLenis } from "lenis/react";
import type Lenis from "lenis";
import { useExperience } from "../../context";

const NAV_ITEMS: ReadonlyArray<{
  id: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
}> = [
  { id: "journey", label: "A Jornada", shortLabel: "Jornada", icon: Plane },
  { id: "familias", label: "Os Noivos", shortLabel: "Noivos", icon: Heart },
  {
    id: "guia-celebracao",
    label: "O Nosso Dia",
    shortLabel: "O Dia",
    icon: CalendarDays,
  },
  { id: "dress-code", label: "Dress Code", shortLabel: "Traje", icon: Shirt },
  { id: "memorias", label: "Memórias", shortLabel: "Fotos", icon: Camera },
  { id: "rsvp", label: "Confirmar", shortLabel: "RSVP", icon: CheckCircle2 },
];

type NavSectionId = (typeof NAV_ITEMS)[number]["id"];

function getScrollOffset(): number {
  return window.matchMedia("(min-width: 768px)").matches ? -96 : -18;
}

export function JessicaSamuelFloatingNav() {
  const { introComplete } = useExperience();
  const lenis = useLenis();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [activeId, setActiveId] = useState<NavSectionId>(NAV_ITEMS[0].id);

  const syncNavigation = useCallback(() => {
    const hero = document.getElementById("hero");
    const heroBottom = hero?.getBoundingClientRect().bottom ?? window.innerHeight;
    setVisible(heroBottom <= 16);

    const activationLine = Math.min(window.innerHeight * 0.36, 260);
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
        duration: 1.1,
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
          className="js-wedding-nav"
          aria-label="Navegação do convite"
          initial={{ opacity: 0, y: -14, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="js-wedding-nav__inner">
            <span className="js-wedding-nav__monogram" aria-hidden>
              J<span>&amp;</span>S
            </span>

            <div className="js-wedding-nav__items">
              {NAV_ITEMS.map((item) => {
                const isActive = activeId === item.id;
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`js-wedding-nav__item${
                      isActive ? " is-active" : ""
                    }`}
                    aria-label={item.label}
                    aria-current={isActive ? "location" : undefined}
                    onClick={() => scrollToSection(item.id)}
                  >
                    <Icon size={15} strokeWidth={1.25} aria-hidden />
                    <span className="js-wedding-nav__label">
                      {item.label}
                    </span>
                    <span className="js-wedding-nav__short-label">
                      {item.shortLabel}
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
