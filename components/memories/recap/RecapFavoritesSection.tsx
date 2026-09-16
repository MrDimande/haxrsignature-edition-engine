/* eslint-disable @next/next/no-img-element */
"use client";

import React from "react";
import type { RecapMediaItem } from "@lib/memories/recap-policy";
import { Heart, Play } from "lucide-react";

interface RecapFavoritesSectionProps {
  favorites: RecapMediaItem[];
  onOpenMedia: (item: RecapMediaItem, allItems: RecapMediaItem[]) => void;
}

export function RecapFavoritesSection({ favorites, onOpenMedia }: RecapFavoritesSectionProps) {
  if (!favorites || favorites.length === 0) return null;

  return (
    <section className="py-16 sm:py-24 bg-[#0A0A0A] text-[#FAF8F5] border-b border-[#D4AF37]/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho */}
        <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-18">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] text-xs font-serif mb-3">
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span>EXCLUSIVO PARA SI</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-serif font-normal text-[#FAF8F5] tracking-tight">
            Os Seus Favoritos Guardados
          </h2>
          <p className="text-xs sm:text-sm text-[#FAF8F5]/60 font-serif italic mt-2">
            As memórias que marcou pessoalmente durante a celebração. Visíveis apenas para si.
          </p>
          <div className="w-12 h-[1px] bg-[#D4AF37]/40 mx-auto mt-4" />
        </div>

        {/* Grelha de Favoritos */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {favorites.map((item) => (
            <div
              key={item.id}
              onClick={() => onOpenMedia(item, favorites)}
              className="group relative aspect-[3/4] overflow-hidden rounded-sm bg-[#111111] cursor-pointer border border-[#D4AF37]/20 hover:border-[#D4AF37]/60 transition-all duration-300 shadow-md"
            >
              <img
                src={item.thumbnailUrl}
                alt={item.caption || "Fotografia favorita"}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />

              <div className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-black/60 text-[#D4AF37]">
                <Heart className="w-3.5 h-3.5 fill-current" />
              </div>

              {item.kind === "video" && (
                <div className="absolute top-2.5 left-2.5 p-1.5 rounded-full bg-black/60 text-white/90">
                  <Play className="w-3 h-3 fill-current" />
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-3 flex flex-col justify-end">
                {item.caption && (
                  <p className="text-xs text-white/90 font-serif italic line-clamp-2">
                    {item.caption}
                  </p>
                )}
                {item.guestName && (
                  <span className="text-[10px] text-[#D4AF37] font-sans mt-1">
                    {item.guestName}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
