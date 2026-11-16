"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const WEDDING_DATE = new Date("2027-01-09T08:00:00+02:00");

interface AlexandrinaKennethCoverGateProps {
  isOpen: boolean;
  onOpen: () => void;
}

export function AlexandrinaKennethCoverGate({ isOpen, onOpen }: AlexandrinaKennethCoverGateProps) {
  const [daysRemaining, setDaysRemaining] = useState("00");
  const [isPast, setIsPast] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const handleOpen = () => {
    setIsExiting(true);
    onOpen();
  };

  useEffect(() => {
    const calculateDays = () => {
      const now = Date.now();
      const diffMs = WEDDING_DATE.getTime() - now;
      if (diffMs <= 0) {
        setDaysRemaining("00");
        setIsPast(true);
      } else {
        const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        setDaysRemaining(String(days).padStart(2, "0"));
        setIsPast(false);
      }
    };

    calculateDays();
    const interval = setInterval(calculateDays, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const origOverflow = document.body.style.overflow;
      const origHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = origOverflow;
        document.documentElement.style.overflow = origHtmlOverflow;
      };
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="alexandrina-kenneth-cover-gate"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            y: -24,
            pointerEvents: "none",
            transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
          }}
          className={`fixed inset-0 z-50 overflow-hidden flex items-center justify-center select-none ${
            isExiting ? "pointer-events-none" : ""
          }`}
          style={{ backgroundColor: "#1a1a1a", height: "100vh", maxHeight: "100dvh", width: "100vw" }}
        >
          <header className="cover-hero" id="topo" aria-label="Capa do convite">
            <div className="cover-bg" aria-hidden="true">
              <picture>
                <source
                  media="(orientation: landscape) and (min-width: 560px)"
                  srcSet="/images/alexandrina-kenneth/capa.jpg"
                />
                <img
                  src="/images/alexandrina-kenneth/capa.jpg"
                  alt="Alexandrina Mitilane e Kenneth Novele"
                  className="cover-bg-img"
                  loading="eager"
                  fetchPriority="high"
                />
              </picture>
            </div>
            <div className="cover-vignette" aria-hidden="true" />
            <div className="cover-grain" aria-hidden="true" />
            <div className="cover-inner">
              <p className="cover-kicker">Família e amigos, o casamento de</p>

              <div className="cover-names-wrap">
                <div className="cover-names">
                  <span className="cover-name-line">Alexandrina Mitilane</span>
                  <span className="cover-name-amp">&amp;</span>
                  <span className="cover-name-line">Kenneth Novele</span>
                </div>
              </div>

              <div
                className="cover-countdown"
                aria-label="Contagem regressiva"
                data-target-date="2027-01-09T08:00:00+02:00"
              >
                <div
                  className="cover-countdown-box"
                  role="group"
                  aria-label={isPast ? "Evento celebrado" : "Dias restantes"}
                >
                  <div className="cover-days" id="heroDays" suppressHydrationWarning>
                    {daysRemaining}
                  </div>
                  <div className="cover-days-label" suppressHydrationWarning>{isPast ? "CELEBRADO" : "DIAS"}</div>
                </div>
              </div>

              <button
                type="button"
                className="cover-cta cursor-pointer"
                id="openInvite"
                onClick={handleOpen}
                aria-label="Entrar e ver convite"
              >
                <span className="cover-cta__shimmer" aria-hidden="true" />
                <span className="cover-cta__text">Ver convite</span>
              </button>

              <p className="cover-date" aria-label="Data do casamento">
                09 de Janeiro de 2027
              </p>
            </div>
          </header>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
