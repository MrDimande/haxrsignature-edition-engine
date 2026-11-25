"use client";

import { useEffect, useState } from "react";
import { getDaysUntilAylla } from "@lib/aylla/calendar";
import styles from "./BabyAyllaCelebration.module.css";

export function BabyAyllaCountdown() {
  const [days, setDays] = useState<number | null>(null);
  useEffect(() => {
    const update = () => setDays(getDaysUntilAylla(new Date()));
    update();
    const interval = window.setInterval(update, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const message = days === null ? "Uma data para guardar com carinho."
    : days > 1 ? `Faltam ${days} dias para este encontro.`
    : days === 1 ? "É já amanhã."
    : days === 0 ? "É hoje, o dia da Aylla."
    : "Uma data para guardar com carinho.";

  return <p data-day-count className={`aylla-font-serif ${styles.countdown}`}>{message}</p>;
}
