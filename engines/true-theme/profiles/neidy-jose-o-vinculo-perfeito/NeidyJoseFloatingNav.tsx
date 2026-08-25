"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import {
  Heart,
  MapPin,
  CalendarDays,
  CheckCircle2,
  BookOpen,
  Link2,
  Users,
  Feather,
  ChevronUp,
} from "lucide-react";
import { NEIDY_JOSE_CONSTANTS } from "@lib/neidy-jose/constants";

interface NeidyJoseFloatingNavProps {
  prefersReducedMotion?: boolean;
}

const IDLE_MS = 2800;

export function NeidyJoseFloatingNav({
  prefersReducedMotion = false,
}: NeidyJoseFloatingNavProps) {
  const [activeSection, setActiveSection] = useState("hero");
  const [isOpen, setIsOpen] = useState(true);
  const [pastHero, setPastHero] = useState(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleClose = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setIsOpen(false), IDLE_MS);
  }, []);

  const openEnvelope = useCallback(() => {
    setIsOpen(true);
    scheduleClose();
  }, [scheduleClose]);

  // Only appear after leaving the Hero
  useEffect(() => {
    const updatePastHero = () => {
      const hero = document.getElementById("hero");
      if (!hero) {
        setPastHero(window.scrollY > window.innerHeight * 0.65);
        return;
      }
      const heroBottom = hero.offsetTop + hero.offsetHeight;
      const crossed = window.scrollY + window.innerHeight * 0.2 >= heroBottom;
      setPastHero(crossed);
      if (crossed) openEnvelope();
    };

    updatePastHero();
    window.addEventListener("scroll", updatePastHero, { passive: true });
    window.addEventListener("resize", updatePastHero);
    return () => {
      window.removeEventListener("scroll", updatePastHero);
      window.removeEventListener("resize", updatePastHero);
    };
  }, [openEnvelope]);

  // Rise on scroll while visible; sink when idle
  useEffect(() => {
    if (!pastHero) return;

    const onScroll = () => openEnvelope();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [pastHero, openEnvelope]);

  // Active section
  useEffect(() => {
    const sections = [
      "hero",
      "our-thread",
      "parents",
      "scripture",
      "the-wedding-day",
      "celebration",
      "rsvp",
      "blessings",
    ];

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 250;
      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const top = element.offsetTop;
          const height = element.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    openEnvelope();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const navItems = [
    { id: "hero", label: "Início", icon: Heart },
    { id: "our-thread", label: "O Fio", icon: Link2 },
    { id: "parents", label: "Bênção", icon: Users },
    { id: "scripture", label: "A Palavra", icon: BookOpen },
    { id: "the-wedding-day", label: "O Dia", icon: CalendarDays },
    { id: "celebration", label: "Celebração", icon: MapPin },
    { id: "rsvp", label: "RSVP", icon: CheckCircle2 },
    { id: "blessings", label: "Desejos", icon: Feather },
  ];

  const activeLabel =
    navItems.find((item) => item.id === activeSection)?.label ?? "Convite";

  return (
    <AnimatePresence>
      {pastHero && (
        <motion.div
          key="nj-envelope-anchor"
          className="nj-envelope-dock-anchor"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0.01 : 0.35 }}
        >
          <motion.div
            className="nj-envelope-dock-stage"
            initial={{ y: 36 }}
            animate={{
              y: isOpen ? 0 : prefersReducedMotion ? 22 : 44,
            }}
            transition={{
              duration: prefersReducedMotion ? 0.01 : 0.5,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <aside
              onMouseEnter={() => {
                setIsOpen(true);
                if (idleTimer.current) clearTimeout(idleTimer.current);
              }}
              onMouseLeave={scheduleClose}
              onFocusCapture={openEnvelope}
              aria-label="Envelope de navegação"
              className={`nj-envelope-dock ${isOpen ? "is-open" : "is-closed"}`}
            >
              <button
                type="button"
                className="nj-envelope-flap"
                onClick={() => (isOpen ? scheduleClose() : openEnvelope())}
                aria-expanded={isOpen}
                aria-label={isOpen ? "Fechar envelope" : "Abrir envelope de navegação"}
              >
                <span className="nj-envelope-flap__face">
                  {!isOpen && (
                    <span className="nj-envelope-peek">
                      <ChevronUp className="h-3.5 w-3.5" />
                      <span>{activeLabel}</span>
                    </span>
                  )}
                </span>
                <span className="nj-envelope-seal" aria-hidden>
                  <Image
                    src={NEIDY_JOSE_CONSTANTS.hero.monogram}
                    alt=""
                    fill
                    unoptimized
                    quality={100}
                    className="object-contain scale-[1.06] p-0.5"
                    sizes="52px"
                  />
                </span>
              </button>

              <div className="nj-envelope-body">
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="envelope-contents"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: prefersReducedMotion ? 0.01 : 0.35 }}
                      className="nj-envelope-contents"
                    >
                      <nav className="nj-envelope-nav" aria-label="Secções do convite">
                        {navItems.map((item) => {
                          const Icon = item.icon;
                          const isActive = activeSection === item.id;

                          return (
                            <button
                              key={item.id}
                              onClick={() => scrollTo(item.id)}
                              type="button"
                              className={`nj-envelope-nav__item ${isActive ? "is-active" : ""}`}
                              title={item.label}
                              aria-label={`Ir para secção ${item.label}`}
                              aria-current={isActive ? "true" : undefined}
                            >
                              <Icon className="nj-envelope-nav__icon" strokeWidth={1.6} />
                              <span className="nj-envelope-nav__label">{item.label}</span>
                            </button>
                          );
                        })}
                      </nav>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </aside>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
