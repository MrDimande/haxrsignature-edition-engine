"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useExperience } from "../../context";
import { PRIMAVERA_SURFACES } from "./primavera-surfaces";

const NAV_ITEMS = [
  { id: "familias", label: "Noivos" },
  { id: "detalhes", label: "Detalhes" },
  { id: "localizacao", label: "Local" },
  { id: "lista-presentes", label: "Presentes" },
  { id: "rsvp", label: "RSVP" },
] as const;

export function PrimaveraLoboloFloatingNav() {
  const { theme, introComplete } = useExperience();
  const [pastHero, setPastHero] = useState(false);

  useEffect(() => {
    if (!introComplete) return;

    const hero = document.getElementById("hero");
    if (!hero) return;

    const observer = new IntersectionObserver(
      ([entry]) => setPastHero(!entry.isIntersecting),
      { threshold: 0.12, rootMargin: "-8% 0px 0px 0px" }
    );

    observer.observe(hero);
    return () => observer.disconnect();
  }, [introComplete]);

  if (!introComplete) return null;

  return (
    <AnimatePresence>
      {pastHero ? (
        <motion.nav
          key="primavera-nav"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-0 inset-x-0 z-50 px-3 sm:px-4 pb-[max(0.65rem,env(safe-area-inset-bottom))] pt-2 pointer-events-none"
          aria-label="Navegação do convite"
        >
          <div
            className="mx-auto max-w-2xl lg:max-w-3xl flex items-center justify-center gap-0.5 sm:gap-1 px-2 py-2.5 rounded-sm backdrop-blur-md pointer-events-auto border shadow-lg"
            style={{
              backgroundColor: `${PRIMAVERA_SURFACES.panelDark}ee`,
              borderColor: `${theme.colors.accent}55`,
            }}
          >
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  document.getElementById(item.id)?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  })
                }
                className="flex-1 min-w-0 py-2 px-1 text-[7px] sm:text-[8px] lg:text-[9px] tracking-[0.12em] sm:tracking-[0.16em] uppercase truncate opacity-80 hover:opacity-100 transition-opacity"
                style={{ color: PRIMAVERA_SURFACES.ivoryLight }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </motion.nav>
      ) : null}
    </AnimatePresence>
  );
}
