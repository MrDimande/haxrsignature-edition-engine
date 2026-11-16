"use client";

import React, { useState, useEffect, useRef } from "react";

interface NavItem {
  id: string;
  label: string;
  mobileLabel: string;
  renderIcon: (props: { className?: string; active?: boolean }) => React.ReactElement;
}

/* ==========================================================================
   Bespoke Authorial SVG Icons (TraÃ§o Fino 1.2px â€” Sem Ã­cones genÃ©ricos)
   ========================================================================== */

function HauteCoutureNavHeart({ className = "w-4 h-4", active = false }: { className?: string; active?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={active ? "rgba(212, 175, 55, 0.25)" : "none"}
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

function HauteCoutureNavCouple({ className = "w-4 h-4", active = false }: { className?: string; active?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="3.5" fill={active ? "rgba(212, 175, 55, 0.25)" : "none"} />
      <path d="M2 19c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="16" cy="8" r="3.5" fill={active ? "rgba(212, 175, 55, 0.25)" : "none"} />
      <path d="M14 13c1.2-.6 2.5-1 4-1 3.3 0 6 2.7 6 6" />
    </svg>
  );
}

function HauteCoutureNavCeremonies({ className = "w-4 h-4", active = false }: { className?: string; active?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="17" rx="2" fill={active ? "rgba(212, 175, 55, 0.18)" : "none"} />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <circle cx="12" cy="15" r="1.5" fill="currentColor" />
    </svg>
  );
}

function HauteCoutureNavLocation({ className = "w-4 h-4", active = false }: { className?: string; active?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M20 10c0 5-8 12-8 12s-8-7-8-12a8 8 0 0 1 16 0Z" fill={active ? "rgba(212, 175, 55, 0.22)" : "none"} />
      <circle cx="12" cy="10" r="2.5" fill={active ? "currentColor" : "none"} />
    </svg>
  );
}

function HauteCoutureNavRsvp({ className = "w-4 h-4", active = false }: { className?: string; active?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9.5" fill={active ? "rgba(212, 175, 55, 0.22)" : "none"} />
      <polyline points="8 12 11 15 16 9" />
    </svg>
  );
}

function HauteCoutureNavGifts({ className = "w-4 h-4", active = false }: { className?: string; active?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="4" y="8" width="16" height="12" rx="1.5" fill={active ? "rgba(212, 175, 55, 0.22)" : "none"} />
      <line x1="12" y1="8" x2="12" y2="20" />
      <line x1="4" y1="12.5" x2="20" y2="12.5" />
      <path d="M12 8C10.5 5.5 8 4 6.5 5.5S7 8 12 8Z" />
      <path d="M12 8C13.5 5.5 16 4 17.5 5.5S17 8 12 8Z" />
    </svg>
  );
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "intro",
    label: "InÃ­cio",
    mobileLabel: "InÃ­cio",
    renderIcon: (props) => <HauteCoutureNavHeart {...props} />,
  },
  {
    id: "noivos",
    label: "Os Noivos",
    mobileLabel: "Noivos",
    renderIcon: (props) => <HauteCoutureNavCouple {...props} />,
  },
  {
    id: "cerimonias",
    label: "CerimÃ³nias",
    mobileLabel: "Agenda",
    renderIcon: (props) => <HauteCoutureNavCeremonies {...props} />,
  },
  {
    id: "localizacao",
    label: "LocalizaÃ§Ã£o",
    mobileLabel: "Local",
    renderIcon: (props) => <HauteCoutureNavLocation {...props} />,
  },
  {
    id: "rsvp",
    label: "PresenÃ§a",
    mobileLabel: "RSVP",
    renderIcon: (props) => <HauteCoutureNavRsvp {...props} />,
  },
  {
    id: "presentes",
    label: "Presentes",
    mobileLabel: "Presentes",
    renderIcon: (props) => <HauteCoutureNavGifts {...props} />,
  },
];

export function AlexandrinaKennethFloatingNav() {
  const [mounted, setMounted] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const [activeSection, setActiveSection] = useState("intro");
  const isClickingRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show dock after scrolling past the hero
  useEffect(() => {
    if (!mounted) return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const intro = document.getElementById("intro");
      const introBottom = intro ? intro.offsetTop + intro.offsetHeight : window.innerHeight * 0.7;
      const crossed = scrollY + window.innerHeight * 0.25 >= introBottom || scrollY > 260;
      setPastHero(crossed);

      if (isClickingRef.current) return;

      const scrollPos = scrollY + window.innerHeight * 0.35;
      for (let i = NAV_ITEMS.length - 1; i >= 0; i--) {
        const item = NAV_ITEMS[i];
        const el = document.getElementById(item.id);
        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(item.id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    handleScroll();
    const timer = setTimeout(handleScroll, 300);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      clearTimeout(timer);
    };
  }, [mounted]);

  const scrollTo = (id: string) => {
    setActiveSection(id);
    isClickingRef.current = true;
    setTimeout(() => {
      isClickingRef.current = false;
    }, 1200);

    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (!mounted || !pastHero) return null;

  return (
    <aside
      className="ak-floating-dock-anchor fixed z-[85] pointer-events-none"
      aria-label="Menu de navegaÃ§Ã£o rÃ¡pida"
    >
      <nav
        className="ak-floating-dock-stage pointer-events-auto"
        role="navigation"
        aria-label="Atalhos das secÃ§Ãµes do convite"
      >
        <div className="ak-floating-dock-bar">
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollTo(item.id)}
                className={`ak-floating-dock-item ${isActive ? "is-active" : ""}`}
                aria-label={`Navegar para ${item.label}`}
                aria-current={isActive ? "true" : undefined}
                title={item.label}
              >
                <span className="ak-floating-dock-item__icon-wrap">
                  {item.renderIcon({
                    className: "ak-floating-dock-item__icon",
                    active: isActive,
                  })}
                  {isActive && <span className="ak-floating-dock-item__indicator" aria-hidden="true" />}
                </span>
                <span className="ak-floating-dock-item__label ak-floating-dock-item__label--desktop">
                  {item.label}
                </span>
                <span className="ak-floating-dock-item__label ak-floating-dock-item__label--mobile">
                  {item.mobileLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
