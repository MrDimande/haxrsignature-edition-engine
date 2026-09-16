"use client";

import React from "react";

interface RecapClosingSectionProps {
  closingMessage: string | null;
  signOffDate: string | null;
}

export function RecapClosingSection({ closingMessage, signOffDate }: RecapClosingSectionProps) {
  const message =
    closingMessage ||
    "Agradecemos de coração a cada amigo e familiar que esteve connosco a celebrar este momento irrepetível. Cada sorriso, olhar e abraço eternizado nestas memórias guardamos para sempre na nossa história.";

  return (
    <footer className="py-20 sm:py-28 bg-[#0A0A0A] text-[#FAF8F5] text-center border-t border-[#D4AF37]/20 relative overflow-hidden">
      <div className="absolute inset-0 bg-radial from-[#D4AF37]/5 via-transparent to-transparent pointer-events-none" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 relative">
        <div className="w-10 h-[1px] bg-[#D4AF37]/50 mx-auto mb-8" />

        <h2 className="text-xl sm:text-3xl font-serif font-normal text-[#FAF8F5] tracking-tight mb-6">
          Com Gratidão Eterna
        </h2>

        <p className="text-base sm:text-lg font-serif italic text-[#FAF8F5]/85 leading-relaxed mb-8">
          “{message}”
        </p>

        {signOffDate && (
          <span className="text-xs text-[#D4AF37] font-serif uppercase tracking-widest block mb-12">
            Eternizado em {new Date(signOffDate).toLocaleDateString("pt-MZ", { month: "long", year: "numeric" })}
          </span>
        )}

        <div className="flex flex-col items-center justify-center gap-2 pt-8 border-t border-white/5">
          <span className="text-[10px] tracking-[0.3em] uppercase text-[#D4AF37]/60 font-serif">
            ALTA-COSTURA DIGITAL
          </span>
          <span className="text-xs text-[#FAF8F5]/40 font-serif">
            HAXR Signature • Private Planning Atelier
          </span>
        </div>
      </div>
    </footer>
  );
}
