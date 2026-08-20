"use client";

import React from "react";
import { motion } from "motion/react";
import { PlusCircle } from "lucide-react";

interface PlusMemoriasProgressProps {
  completedCount: number;
  totalCount: number;
  onOpenFreeMoment: () => void;
}

export function PlusMemoriasProgress({
  completedCount,
  totalCount,
  onOpenFreeMoment,
}: PlusMemoriasProgressProps) {
  const percentage = Math.round((completedCount / totalCount) * 100);

  return (
    <section className="px-4 sm:px-6 max-w-4xl mx-auto my-10 space-y-8">
      {/* Progresso Discreto */}
      <div className="p-6 rounded-lg bg-[#FFF9F2] border border-[#C9939B]/25 text-center">
        <div className="flex items-center justify-between mb-2 max-w-md mx-auto">
          <span className="font-display text-xs tracking-[0.2em] uppercase text-[#171312]/60">
            O Seu Progresso
          </span>
          <span className="font-display text-xs tracking-[0.1em] font-medium text-[#7A2332]">
            {completedCount} de {totalCount} momentos encontrados
          </span>
        </div>

        <div className="w-full max-w-md bg-[#C9939B]/15 h-2 rounded-full mx-auto overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="bg-[#7A2332] h-full rounded-full"
          />
        </div>
      </div>

      {/* Outro Momento Especial */}
      <div className="p-8 rounded-lg bg-[#C9939B]/10 border border-[#7A2332]/20 text-center relative overflow-hidden">
        <div className="w-9 h-9 mx-auto mb-3 rounded-full bg-[#7A2332]/10 flex items-center justify-center">
          <PlusCircle className="w-5 h-5 text-[#7A2332]" />
        </div>

        <h3 className="font-display text-xl sm:text-2xl text-[#171312] font-light mb-2">
          Outro momento especial?
        </h3>

        <p className="font-body text-xs sm:text-sm text-[#171312]/60 italic max-w-md mx-auto mb-6">
          &ldquo;Nem todas as memórias cabem numa lista. Se presenciou algo mágico que não está nos desafios, partilhe connosco.&rdquo;
        </p>

        <button
          onClick={onOpenFreeMoment}
          className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#7A2332] text-[#FFF9F2] font-display text-[10px] sm:text-[11px] tracking-[0.26em] uppercase rounded-sm shadow-md hover:bg-[#5A1825] transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          PARTILHAR OUTRO MOMENTO
        </button>
      </div>
    </section>
  );
}
