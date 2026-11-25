"use client";

import React from "react";
import { BABY_AYLLA_EVENT } from "@lib/aylla/event-details";
import { CouturePavilionIcon, CoutureFiligreeDivider } from "./BabyAyllaCoutureIcons";

export function BabyAyllaLocation() {
  return (
    <section
      id="local"
      aria-label="Local da Celebração"
      className="relative w-full py-20 px-4 flex flex-col items-center justify-center text-center"
    >
      <div className="max-w-xl mx-auto w-full">
        {/* Eyebrow */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <span className="h-[1px] w-8 bg-[#C49B94]/50" />
          <span className="text-[11px] sm:text-xs tracking-[0.35em] font-semibold text-[#8C6D62] uppercase aylla-font-sans">
            LOCALIZAÇÃO
          </span>
          <span className="h-[1px] w-8 bg-[#C49B94]/50" />
        </div>

        <h2 className="text-3xl sm:text-4xl font-serif text-[#3E302E] font-medium mb-8 aylla-font-serif">
          Vila do Mar Eventos
        </h2>

        <div className="rounded-3xl p-8 sm:p-12 bg-gradient-to-b from-[#FCF9F6] via-[#FDFBF9] to-[#F7EBE8] border border-[#ECC880]/60 shadow-[0_16px_48px_rgba(62,48,46,0.07)] relative overflow-hidden">
          <div className="w-20 h-20 rounded-full bg-white border border-[#ECC880]/60 flex items-center justify-center mx-auto mb-6 shadow-sm">
            <CouturePavilionIcon size={40} />
          </div>

          <h3 className="text-2xl font-serif text-[#3E302E] font-medium mb-1 aylla-font-serif">
            Vila do Mar Eventos
          </h3>
          <p className="text-xs sm:text-sm text-[#8C6D62] mb-6 font-sans">
            Costa do Sol, Zona dos Pescadores · Maputo, Moçambique
          </p>

          <div className="p-6 rounded-2xl bg-white/80 border border-[#C49994]/25 text-[#523F3C] text-sm leading-relaxed mb-8 font-serif italic">
            <p>
              "Um refúgio à beira-mar, banhado pela brisa suave do Índico na Costa do Sol de Maputo, preparado para receber este dia radiante com elegância e conforto."
            </p>
          </div>

          <a
            href={BABY_AYLLA_EVENT.venue.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-[#3E302E] hover:bg-[#FF0164] text-white text-xs font-semibold tracking-widest uppercase transition-all shadow-md hover:shadow-lg cursor-pointer"
          >
            <span>Abrir no Google Maps</span>
            <span>↗</span>
          </a>
        </div>

        <CoutureFiligreeDivider />
      </div>
    </section>
  );
}
