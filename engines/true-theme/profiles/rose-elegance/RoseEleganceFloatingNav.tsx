"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { useLenis } from "lenis/react";
import type Lenis from "lenis";
import {
  Calendar,
  Gift,
  MapPin,
  Shirt,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import { useExperience } from "../../context";

const NAV_ITEMS: {
  id: "details" | "location" | "dress-code" | "rsvp" | "presentes";
  label: string;
  shortLabel: string;
  icon: LucideIcon;
}[] = [
  { id: "details", label: "Detalhes", shortLabel: "Info", icon: Calendar },
  { id: "location", label: "Local", shortLabel: "Local", icon: MapPin },
  {
    id: "dress-code",
    label: "Dress code",
    shortLabel: "Dress",
    icon: Shirt,
  },
  { id: "rsvp", label: "RSVP", shortLabel: "RSVP", icon: UserCheck },
  { id: "presentes", label: "Presentes", shortLabel: "Presentes", icon: Gift },
];

type NavSectionId = (typeof NAV_ITEMS)[number]["id"];

function isMobileViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 767px)").matches;
}

function readScrollY(lenis: ReturnType<typeof useLenis>): number {
  if (lenis && typeof lenis.scroll === "number") {
    return lenis.scroll;
  }
  return window.scrollY;
}

function scrollToSection(
  id: NavSectionId,
  lenis: ReturnType<typeof useLenis>
) {
  const el = document.getElementById(id);
  if (!el) return;

  if (lenis) {
    lenis.scrollTo(el, { offset: -20, duration: 1.1 });
    return;
  }

  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function RoseEleganceFloatingNav() {
  const { theme, introComplete } = useExperience();
  const lenis = useLenis();
  const [activeId, setActiveId] = useState<NavSectionId>("details");
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const syncNavState = useCallback((scrollY: number) => {
    const vh = window.visualViewport?.height ?? window.innerHeight;
    const offset = vh * 0.35;
    let current: NavSectionId = NAV_ITEMS[0].id;

    for (const item of NAV_ITEMS) {
      const el = document.getElementById(item.id);
      if (!el) continue;
      const top = el.getBoundingClientRect().top;
      if (top <= offset) {
        current = item.id;
      }
    }

    setActiveId(current);

    const hero = document.getElementById("hero");
    const pastHero = hero
      ? hero.getBoundingClientRect().bottom <= vh * 0.9
      : scrollY > vh * 0.85;

    setIsMobile(isMobileViewport());
    setVisible(pastHero);
  }, []);

  useLenis(
    useCallback(
      (instance: Lenis) => {
        syncNavState(instance.scroll);
      },
      [syncNavState]
    ),
    [syncNavState]
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!introComplete) return;

    const handleUpdate = () => {
      syncNavState(readScrollY(lenis));
    };

    handleUpdate();

    window.addEventListener("scroll", handleUpdate, { passive: true });
    window.addEventListener("resize", handleUpdate);
    window.visualViewport?.addEventListener("resize", handleUpdate);
    window.visualViewport?.addEventListener("scroll", handleUpdate);

    return () => {
      window.removeEventListener("scroll", handleUpdate);
      window.removeEventListener("resize", handleUpdate);
      window.visualViewport?.removeEventListener("resize", handleUpdate);
      window.visualViewport?.removeEventListener("scroll", handleUpdate);
    };
  }, [introComplete, lenis, syncNavState]);

  if (!introComplete || !mounted) return null;

  const nav = (
    <AnimatePresence>
      {visible ? (
        <motion.nav
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          aria-label="Atalhos da experiência"
          className="fixed inset-x-0 bottom-0 z-[60] flex justify-center px-2 sm:px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pointer-events-none"
        >
          <div
            className="pointer-events-auto w-full max-w-xl sm:max-w-2xl overflow-x-auto overscroll-x-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            <div
              className="flex min-w-max sm:min-w-0 sm:w-full items-stretch rounded-full border shadow-[0_8px_32px_rgba(255,45,138,0.18)] backdrop-blur-xl supports-[backdrop-filter]:bg-[rgba(255,229,240,0.88)]"
              style={{
                borderColor: `${theme.colors.secondary}35`,
                backgroundColor: "rgba(255, 229, 240, 0.94)",
              }}
            >
              {NAV_ITEMS.map((item, index) => {
                const isActive = activeId === item.id;
                const Icon = item.icon;
                const label = isMobile ? item.shortLabel : item.label;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => scrollToSection(item.id, lenis)}
                    aria-label={item.label}
                    aria-current={isActive ? "true" : undefined}
                    className="relative flex min-h-[52px] min-w-[4.25rem] sm:min-w-0 sm:flex-1 flex-col items-center justify-center gap-1 px-1.5 py-2 transition-colors duration-300 touch-manipulation active:scale-95"
                    style={{
                      color: isActive
                        ? theme.colors.accent
                        : theme.colors.primary,
                    }}
                  >
                    {index > 0 ? (
                      <span
                        aria-hidden
                        className="absolute left-0 top-1/2 h-5 w-px -translate-y-1/2"
                        style={{ backgroundColor: `${theme.colors.accent}25` }}
                      />
                    ) : null}
                    <Icon
                      size={isMobile ? 17 : 16}
                      strokeWidth={1.25}
                      aria-hidden
                      className={`shrink-0 transition-opacity duration-300 ${
                        isActive ? "opacity-100" : "opacity-60"
                      }`}
                    />
                    <span
                      className={`font-display italic max-w-full truncate text-[9px] sm:text-[10px] tracking-[0.05em] sm:tracking-[0.08em] leading-tight text-center ${
                        isActive ? "opacity-100 font-medium" : "opacity-75"
                      }`}
                    >
                      {label}
                    </span>
                    {isActive ? (
                      <motion.span
                        layoutId="rose-nav-indicator"
                        className="absolute bottom-1 left-1/2 h-[2px] w-5 -translate-x-1/2 rounded-full"
                        style={{ backgroundColor: theme.colors.accent }}
                        transition={{
                          type: "spring",
                          stiffness: 380,
                          damping: 30,
                        }}
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </motion.nav>
      ) : null}
    </AnimatePresence>
  );

  return createPortal(nav, document.body);
}
