/* eslint-disable @next/next/no-img-element */
"use client";

import React from "react";
import type { RecapMediaItem } from "@lib/memories/recap-policy";
import { Play } from "lucide-react";

interface RecapHeroSectionProps {
  title: string | null;
  welcomeMessage: string | null;
  heroMedia: RecapMediaItem | null;
  onOpenMedia: (item: RecapMediaItem) => void;
}

export function RecapHeroSection({
  title,
  welcomeMessage,
  heroMedia,
  onOpenMedia,
}: RecapHeroSectionProps) {
  const displayTitle = title || "Memórias da Celebração";

  return (
    <header className="relative w-full overflow-hidden bg-black text-[#FAF8F5] pt-12 pb-16 sm:pt-16 sm:pb-24 border-b border-[#D4AF37]/20">
      {/* Luz ambiente dourada sutil */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 max-w-4xl h-72 bg-[#D4AF37]/10 blur-3xl pointer-events-none rounded-full" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Monograma / Emblema de Alta-Costura */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="h-[1px] w-8 bg-[#D4AF37]/40" />
          <span className="text-[10px] sm:text-xs tracking-[0.35em] uppercase text-[#D4AF37] font-serif font-medium">
            HAXR SIGNATURE — MEMÓRIA DO EVENTO
          </span>
          <div className="h-[1px] w-8 bg-[#D4AF37]/40" />
        </div>

        {/* Título Principal */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif tracking-tight text-[#FAF8F5] font-normal leading-tight mb-6">
          {displayTitle}
        </h1>

        {/* Mensagem de Boas-Vindas */}
        {welcomeMessage && (
          <p className="max-w-2xl mx-auto text-sm sm:text-base md:text-lg text-[#FAF8F5]/80 font-serif italic leading-relaxed mb-10 sm:mb-12">
            “{welcomeMessage}”
          </p>
        )}

        {/* Hero Visual Curado com Fallback Elegante */}
        {heroMedia && (
          <div className="relative mx-auto max-w-4xl rounded-sm overflow-hidden border border-[#D4AF37]/30 shadow-2xl group bg-[#111111]">
            <div
              onClick={() => onOpenMedia(heroMedia)}
              className="relative w-full aspect-[16/10] sm:aspect-[16/9] cursor-pointer overflow-hidden"
            >
              {heroMedia.kind === "video" ? (
                <div className="relative w-full h-full">
                  <img
                    src={heroMedia.posterUrl || heroMedia.mediumUrl}
                    alt={heroMedia.caption || "Momento em destaque"}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                    <div className="p-4 rounded-full bg-[#D4AF37]/90 text-black shadow-lg transform group-hover:scale-110 transition-transform">
                      <Play className="w-6 h-6 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>
              ) : (
                <img
                  src={heroMedia.mediumUrl}
                  alt={heroMedia.caption || "Fotografia em destaque"}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              )}

              {/* Legenda sutil sobreposta */}
              {heroMedia.editorialCaption && (
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 sm:p-6 text-left">
                  <p className="text-sm sm:text-base font-serif italic text-white/95 drop-shadow-md">
                    {heroMedia.editorialCaption}
                  </p>
                  {heroMedia.guestName && (
                    <span className="text-xs text-[#D4AF37] font-sans mt-1 inline-block">
                      Capturado por {heroMedia.guestName}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
