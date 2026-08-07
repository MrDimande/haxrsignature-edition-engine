"use client";

import React from "react";
import { motion } from "motion/react";
import { PlusCircle, Sparkles } from "lucide-react";

interface MemoriasProgressProps {
  completedCount: number;
  totalCount: number;
  onOpenFreeMoment: () => void;
}

export function MemoriasProgress({
  completedCount,
  totalCount,
  onOpenFreeMoment,
}: MemoriasProgressProps) {
  const percentage = Math.round((completedCount / totalCount) * 100);

  return (
    <section className="px-4 sm:px-6 max-w-4xl mx-auto my-10 space-y-8">
      {/* Progresso Discreto */}
      <div className="p-6 rounded-lg bg-[#FBF6F0] border border-[#C9A227]/30 text-center">
        <div className="flex items-center justify-between mb-2 max-w-md mx-auto">
          <span className="font-display text-xs tracking-[0.2em] uppercase text-[#4A3020]/80">
            O Seu Progresso
          </span>
          <span className="font-display text-xs tracking-[0.1em] font-medium text-[#C45C26]">
            {completedCount} de {totalCount} momentos encontrados
          </span>
        </div>

        <div className="w-full max-w-md bg-[#E8C4A8]/40 h-2 rounded-full mx-auto overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="bg-[#C45C26] h-full rounded-full"
          />
        </div>
      </div>

      {/* Outro Momento Especial */}
      <div className="p-8 rounded-lg bg-[#F3DFD0] border border-[#C45C26]/30 text-center relative overflow-hidden">
        <Sparkles className="w-6 h-6 text-[#C9A227] mx-auto mb-3" />

        <h3 className="font-display text-xl sm:text-2xl text-[#2A1810] font-light mb-2">
          Outro momento especial?
        </h3>

        <p className="font-body text-xs sm:text-sm text-[#4A3020]/80 italic max-w-md mx-auto mb-6">
          "Nem todas as memórias cabem numa lista. Se presenciou algo mágico que não está nos desafios, partilhe connosco."
        </p>

        <button
          onClick={onOpenFreeMoment}
          className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#C45C26] text-[#FBF6F0] font-display text-[10px] sm:text-[11px] tracking-[0.26em] uppercase rounded-sm shadow-md hover:bg-[#9E4218] transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          PARTILHAR OUTRO MOMENTO
        </button>
      </div>
    </section>
  );
}
