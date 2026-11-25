"use client";

import React from "react";
import { BABY_AYLLA_EVENT } from "@lib/aylla/event-details";
import { CoutureBowIcon } from "./BabyAyllaCoutureIcons";

export function BabyAyllaFamilyNote() {
  return (
    <section
      aria-label="Nota da Família"
      className="relative w-full py-20 px-4 flex flex-col items-center justify-center text-center"
    >
      <div className="max-w-xl mx-auto w-full">
        {/* Eyebrow */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <span className="h-[1px] w-8 bg-[#DFBA73]/50" />
          <span className="text-[11px] sm:text-xs tracking-[0.35em] font-semibold text-[#7A6662] uppercase aylla-font-sans">
            MENSAGEM DE CARINHO
          </span>
          <span className="h-[1px] w-8 bg-[#DFBA73]/50" />
        </div>

        <h2 className="text-3xl sm:text-4xl font-serif text-[#4A3B39] font-medium mb-8 aylla-font-serif">
          {BABY_AYLLA_EVENT.editorial.familyNoteTitle}
        </h2>

        <div className="rounded-3xl p-8 sm:p-14 bg-gradient-to-b from-[#FCF9F6] via-[#FDFBF9] to-[#F7EBE8] border border-[#ECC880]/60 shadow-[0_16px_48px_rgba(74,59,57,0.06)] relative">
          <div className="flex justify-center mb-6">
            <CoutureBowIcon size={32} />
          </div>

          <p className="text-lg sm:text-xl text-[#523F3C] leading-relaxed font-serif italic mb-10">
            &ldquo;{BABY_AYLLA_EVENT.editorial.familyNoteText}&rdquo;
          </p>

          <div className="pt-8 border-t border-[#DFBA73]/25 flex flex-col items-center">
            <span className="text-3xl sm:text-5xl font-normal text-[#C87A6E] aylla-font-calligraphy">
              Família {BABY_AYLLA_EVENT.familyName}
            </span>
            <span className="text-[11px] tracking-[0.3em] text-[#7A6662] uppercase font-sans mt-3 font-semibold">
              Com Amor e Gratidão
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
