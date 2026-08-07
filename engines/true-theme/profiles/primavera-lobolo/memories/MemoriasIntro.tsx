"use client";

import React from "react";
import { motion } from "motion/react";

interface MemoriasIntroProps {
  tableId?: string;
}

export function MemoriasIntro({ tableId }: MemoriasIntroProps) {
  return (
    <section className="text-center pt-8 pb-10 px-6 max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <p className="font-display text-[10px] sm:text-[11px] font-medium tracking-[0.38em] uppercase text-[#C45C26] mb-3">
          {tableId ? `Mesa ${tableId} · N’we · Casamento Tradicional` : "Casamento Tradicional · Memórias do Nosso Dia"}
        </p>

        <h1 className="font-display text-2xl sm:text-4xl md:text-[2.75rem] font-light tracking-[0.03em] text-[#2A1810] leading-tight mb-4">
          Jessica Muege &amp; Samuel Govene
        </h1>

        <p className="font-display text-base sm:text-lg font-light leading-relaxed text-[#4A3020] italic max-w-lg mx-auto">
          "Cada olhar, cada gargalhada, cada gesto de celebração. Ajude-nos a guardar este dia através dos seus olhos."
        </p>

        <div className="w-16 h-px bg-[#C9A227]/40 mx-auto my-6" aria-hidden />

        <p className="font-body text-xs sm:text-sm text-[#4A3020]/80 tracking-wide">
          Escolha um dos momentos abaixo para registar ou partilhe qualquer memória espontânea.
        </p>
      </motion.div>
    </section>
  );
}
