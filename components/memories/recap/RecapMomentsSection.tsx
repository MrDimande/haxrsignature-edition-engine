/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import type { RecapMediaItem } from "@lib/memories/recap-policy";
import { Play, Heart, MessageCircle } from "lucide-react";

interface RecapMomentsSectionProps {
  items: RecapMediaItem[];
  onOpenMedia: (item: RecapMediaItem, allItems: RecapMediaItem[]) => void;
}

export function RecapMomentsSection({ items, onOpenMedia }: RecapMomentsSectionProps) {
  if (!items || items.length === 0) return null;

  return (
    <section className="py-16 sm:py-24 bg-black text-[#FAF8F5] border-b border-[#D4AF37]/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho */}
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-18">
          <span className="text-[10px] sm:text-xs tracking-[0.3em] uppercase text-[#D4AF37] font-serif block mb-2">
            DESTAQUES ESPECIAIS
          </span>
          <h2 className="text-2xl sm:text-4xl font-serif font-normal text-[#FAF8F5] tracking-tight">
            Momentos Inesquecíveis
          </h2>
          <div className="w-12 h-[1px] bg-[#D4AF37]/40 mx-auto mt-4" />
        </div>

        {/* Grelha Dinâmica Editorial */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {items.map((item, idx) => {
            // Estilo editorial: a primeira e quinta foto ganham destaque se couber
            const isFeatured = idx === 0 || idx === 7;

            return (
              <div
                key={item.id}
                onClick={() => onOpenMedia(item, items)}
                className={`group relative overflow-hidden rounded-sm bg-[#111111] cursor-pointer border border-white/5 hover:border-[#D4AF37]/40 transition-all duration-300 shadow-lg ${
                  isFeatured ? "col-span-2 row-span-2 aspect-[4/3] sm:aspect-square" : "aspect-[3/4]"
                }`}
              >
                <img
                  src={isFeatured ? item.mediumUrl : item.thumbnailUrl}
                  alt={item.caption || "Momento inesquecível"}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {item.kind === "video" && (
                  <div className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white/90 backdrop-blur-xs">
                    <Play className="w-4 h-4 fill-current" />
                  </div>
                )}

                {/* Overlay Editorial */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 flex flex-col justify-end">
                  {item.editorialCaption && (
                    <p className="text-xs sm:text-sm text-white/95 font-serif italic line-clamp-2 mb-1.5">
                      “{item.editorialCaption}”
                    </p>
                  )}
                  <div className="flex items-center justify-between text-[11px] text-[#FAF8F5]/70">
                    <span>{item.guestName || "Convidado"}</span>
                    <div className="flex items-center gap-2">
                      {item.totalReactions > 0 && (
                        <span className="flex items-center gap-1 text-[#D4AF37]">
                          <Heart className="w-3 h-3 fill-current" />
                          {item.totalReactions}
                        </span>
                      )}
                      {item.approvedCommentsCount > 0 && (
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" />
                          {item.approvedCommentsCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
