/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import type { RecapStageSection, RecapMediaItem } from "@lib/memories/recap-policy";
import { Play } from "lucide-react";

interface RecapStorySectionProps {
  stages: RecapStageSection[];
  onOpenMedia: (item: RecapMediaItem, allItems: RecapMediaItem[]) => void;
}

export function RecapStorySection({ stages, onOpenMedia }: RecapStorySectionProps) {
  if (!stages || stages.length === 0) return null;

  // Coleccionar todas as mídias da narrativa para navegação contínua no lightbox
  const allStoryItems = stages.flatMap((s) => s.items);

  return (
    <section className="py-16 sm:py-24 bg-[#0A0A0A] text-[#FAF8F5] border-b border-[#D4AF37]/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho da Secção */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <span className="text-[10px] sm:text-xs tracking-[0.3em] uppercase text-[#D4AF37] font-serif block mb-2">
            CRONOLOGIA EMOCIONAL
          </span>
          <h2 className="text-2xl sm:text-4xl font-serif font-normal text-[#FAF8F5] tracking-tight">
            O Nosso Dia
          </h2>
          <div className="w-12 h-[1px] bg-[#D4AF37]/40 mx-auto mt-4" />
        </div>

        {/* Linha do Tempo de Etapas */}
        <div className="space-y-20 sm:space-y-28">
          {stages.map((stage, sIdx) => (
            <div key={stage.stageId} className="relative">
              {/* Identificador da Etapa */}
              <div className="flex items-center gap-4 mb-8">
                <span className="text-xs font-serif text-[#D4AF37] font-semibold tracking-wider">
                  0{sIdx + 1}
                </span>
                <div className="h-[1px] w-6 bg-[#D4AF37]/30" />
                <h3 className="text-xl sm:text-2xl font-serif text-[#FAF8F5] font-normal">
                  {stage.stageLabel}
                </h3>
              </div>

              {/* Grelha de Fotografias/Vídeos da Etapa */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {stage.items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onOpenMedia(item, allStoryItems)}
                    className="group relative aspect-[4/5] overflow-hidden rounded-sm bg-[#181818] cursor-pointer border border-white/5 hover:border-[#D4AF37]/40 transition-all duration-300 shadow-md"
                  >
                    <img
                      src={item.thumbnailUrl}
                      alt={item.caption || "Momento da celebração"}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Indicador de Vídeo */}
                    {item.kind === "video" && (
                      <div className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-black/60 text-white/90 backdrop-blur-xs">
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </div>
                    )}

                    {/* Overlay com legenda ao passar o cursor */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-3 flex flex-col justify-end">
                      {item.editorialCaption && (
                        <p className="text-xs text-white/90 font-serif italic line-clamp-2 mb-1">
                          “{item.editorialCaption}”
                        </p>
                      )}
                      {item.guestName && (
                        <span className="text-[10px] text-[#D4AF37] font-sans">
                          {item.guestName}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
