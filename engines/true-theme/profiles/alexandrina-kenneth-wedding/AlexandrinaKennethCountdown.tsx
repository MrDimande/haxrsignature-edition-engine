"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

const COUNTDOWN_TARGET = new Date("2027-01-09T08:00:00+02:00");

export function AlexandrinaKennethCountdown() {
  const [isPast, setIsPast] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    days: "00",
    hours: "00",
    minutes: "00",
    seconds: "00",
  });

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const diffMs = COUNTDOWN_TARGET.getTime() - now;

      if (diffMs <= 0) {
        setIsPast(true);
        setTimeLeft({
          days: "00",
          hours: "00",
          minutes: "00",
          seconds: "00",
        });
        return;
      }

      setIsPast(false);
      const totalSec = Math.floor(diffMs / 1000);
      const d = Math.floor(totalSec / 86400);
      const h = Math.floor((totalSec % 86400) / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;

      setTimeLeft({
        days: String(d).padStart(2, "0"),
        hours: String(h).padStart(2, "0"),
        minutes: String(m).padStart(2, "0"),
        seconds: String(s).padStart(2, "0"),
      });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="count-section" aria-labelledby="count-heading">
      <div className="container">
        <div className="count-grid">
          <div className="count-image">
            <Image
              src="/images/alexandrina-kenneth/contagem.jpg"
              alt="Alexandrina e Kenneth — Contagem Regressiva"
              width={1132}
              height={1600}
              loading="lazy"
              className="w-full h-auto object-cover"
            />
          </div>

          <div className="count-panel">
            <div className="section-title">Contagem regressiva</div>
            <h2 className="script-title" id="count-heading">
              {isPast ? "Momento Celebrado" : "Para o grande dia"}
            </h2>
            <p className="mini-lead">
              {isPast
                ? "Este momento único foi celebrado com amor e bênçãos em 09 de Janeiro de 2027. Agradecemos a todos que partilharam este dia connosco!"
                : "Faltam poucos dias para celebrarmos este momento único. Queremos muito ter-te connosco."}
            </p>

            <div
              className="count-grid-boxes"
              data-target-date="2027-01-09T08:00:00+02:00"
              aria-label="Contagem regressiva até 2027-01-09T08:00:00+02:00"
            >
              <div className="mini-box">
                <strong id="days" suppressHydrationWarning>{timeLeft.days}</strong>
                <span>Dias</span>
              </div>
              <div className="mini-box">
                <strong id="hours" suppressHydrationWarning>{timeLeft.hours}</strong>
                <span>Horas</span>
              </div>
              <div className="mini-box">
                <strong id="minutes" suppressHydrationWarning>{timeLeft.minutes}</strong>
                <span>Minutos</span>
              </div>
              <div className="mini-box">
                <strong id="seconds" suppressHydrationWarning>{timeLeft.seconds}</strong>
                <span>Segundos</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
