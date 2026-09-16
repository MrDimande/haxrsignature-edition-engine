/* eslint-disable @next/next/no-img-element */
"use client";

import React from "react";
import type { LiveWallMediaItem } from "@lib/memories/live-wall-store";

interface MosaicViewProps {
  items: LiveWallMediaItem[];
  showReactions: boolean;
}

export const MosaicView: React.FC<MosaicViewProps> = ({ items, showReactions }) => {
  // Exibe até 8 mídias em grelha editorial equilibrada
  const displayItems = items.slice(0, 8);

  return (
    <div className="w-full h-full p-6 md:p-12 overflow-hidden bg-[#0a0a0a] flex flex-col justify-center">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 auto-rows-fr h-[85vh]">
        {displayItems.map((item, idx) => {
          const isHighlight = idx === 0;
          return (
            <div
              key={item.id}
              className={`relative rounded-xl overflow-hidden shadow-2xl border border-[#d4af37]/20 group transition-all duration-500 hover:scale-[1.02] ${
                isHighlight ? "col-span-2 row-span-2" : "col-span-1 row-span-1"
              }`}
            >
              {item.kind === "video" ? (
                <video
                  src={item.mediumUrl}
                  poster={item.posterUrl || item.thumbnailUrl}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={isHighlight ? item.mediumUrl : item.thumbnailUrl || item.mediumUrl}
                  alt={item.caption || "Foto do evento"}
                  className="w-full h-full object-cover"
                />
              )}

              {/* Overlay com Informações Sutis */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 flex flex-col justify-end">
                {item.guestName && (
                  <span className="text-[#d4af37] text-xs font-semibold uppercase tracking-wider">
                    {item.guestName}
                  </span>
                )}
                {item.caption && (
                  <p className="text-white text-xs md:text-sm font-serif italic truncate">
                    {item.caption}
                  </p>
                )}
                {showReactions && item.totalReactions > 0 && (
                  <span className="text-[10px] text-stone-300 mt-1">
                    ❤️ {item.totalReactions} reacções
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
