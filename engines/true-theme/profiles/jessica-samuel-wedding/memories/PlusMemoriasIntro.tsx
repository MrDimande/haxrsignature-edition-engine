"use client";

import React from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { getTableLabel } from "./plus-memorias-challenges";

interface PlusMemoriasIntroProps {
  tableId?: string;
}

export function PlusMemoriasIntro({ tableId }: PlusMemoriasIntroProps) {
  const tableLabel = getTableLabel(tableId);

  return (
    <section className="text-center pt-8 pb-10 px-6 max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Monograma Real Oficial (Brasão de Louros, Coroa e Iniciais JS da Noiva/Noivo) com Fundo Removido */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 mx-auto mb-3">
          <Image
            src="/images/jessica-samuel-wedding/monogram.png"
            alt="Monograma Oficial Jessica & Samuel"
            fill
            sizes="112px"
            className="object-contain object-center drop-shadow-xs"
            priority
          />
        </div>

        {/* Eyebrow Editorial */}
        <p className="font-display text-[10px] sm:text-[11px] font-medium tracking-[0.42em] uppercase text-[#7A2332] mb-2">
          EDITION · PLUS MEMORIES
        </p>

        {/* Nomes Oficiais do Casal */}
        <h1 className="font-display text-2xl sm:text-4xl md:text-[2.75rem] font-light tracking-[0.03em] text-[#171312] leading-tight mb-2">
          Jessica Muege <span className="font-display italic text-[#C9939B] font-normal">&amp;</span> Samuel Govene
        </h1>

        <p className="font-body text-[10px] sm:text-[11px] font-light tracking-[0.28em] uppercase text-[#171312]/55 mb-5">
          CASAMENTO PRINCIPAL · MAPUTO, MOÇAMBIQUE
        </p>

        {/* Badge Personalizado do Convidado por Mesa (se presente no QR Code) */}
        {tableLabel && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFF9F2] border border-[#7A2332]/30 shadow-xs mb-6"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#7A2332] animate-pulse" />
            <span className="font-display text-xs tracking-wider uppercase font-medium text-[#7A2332]">
              Convidado de Honra · {tableLabel}
            </span>
          </motion.div>
        )}

        {/* Emolduramento Poético com Linhas em Tom Champagne Profundo (#D6BFA2) */}
        <div className="my-6 border-y border-[#D6BFA2] py-5 px-4 max-w-xl mx-auto">
          <p className="font-display italic text-base sm:text-lg font-light leading-relaxed text-[#171312]/85">
            &ldquo;Cada olhar, cada gargalhada, cada gesto de celebração. Ajude-nos a guardar este dia através dos seus olhos.&rdquo;
          </p>
        </div>

        {/* Banner de Cápsula do Tempo Pós-Festa (Exibido apenas pós-evento) */}
        {(() => {
          const isPostEvent = typeof window !== "undefined" && new Date() > new Date("2026-08-15T23:59:59");
          if (!isPostEvent) return null;

          return (
            <div className="mb-6 p-4 rounded-xl bg-[#FFF9F2] border border-[#C9939B]/30 text-center shadow-xs">
              <p className="font-display text-[10px] tracking-[0.25em] uppercase text-[#7A2332] font-semibold mb-1">
                Cápsula do Tempo Aberta
              </p>
              <p className="font-body text-xs text-[#171312]/75 italic font-light">
                &ldquo;Ainda tem fotografias na galeria do seu telemóvel? A nossa cápsula continua aberta para guardar cada momento.&rdquo;
              </p>
            </div>
          );
        })()}

        <p className="font-body text-xs sm:text-sm text-[#171312]/60 tracking-wide">
          Escolha um dos momentos abaixo para registar ou partilhe qualquer memória espontânea.
        </p>
      </motion.div>
    </section>
  );
}
