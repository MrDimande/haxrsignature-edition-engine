/* eslint-disable @next/next/no-img-element */
"use client";

import React from "react";
import type { LiveWallMediaItem } from "@lib/memories/live-wall-store";

interface MomentsViewProps {
  items: LiveWallMediaItem[];
  showReactions: boolean;
}

export const MomentsView: React.FC<MomentsViewProps> = ({ items, showReactions }) => {
  // Ordena cronologicamente crescente para contar a história do evento
  const chronological = [...items].reverse().slice(-6);

  return (
    <div className="w-full h-full p-6 md:p-12 overflow-hidden bg-[#0a0a0a] flex flex-col justify-center">
      <div className="mb-6 text-center">
        <h2 className="text-[#d4af37] font-serif text-2xl md:text-3xl tracking-widest uppercase">
          Marcos & Momentos da Celebração
        </h2>
        <p className="text-stone-400 text-xs md:text-sm tracking-wider uppercase mt-1">
          A história do casamento em tempo real
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-h-[75vh]">
        {chronological.map((item) => (
          <div
            key={item.id}
            className="relative rounded-xl overflow-hidden border border-[#d4af37]/25 shadow-2xl bg-black/40 flex flex-col h-[65vh]"
          >
            <div className="relative flex-1 overflow-hidden">
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
                  src={item.mediumUrl || item.thumbnailUrl}
                  alt={item.caption || "Momento"}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            <div className="p-4 bg-black/80 backdrop-blur border-t border-[#d4af37]/20 flex flex-col justify-between">
              <div>
                {item.guestName && (
                  <span className="text-[#d4af37] text-xs font-semibold uppercase tracking-wider block mb-1">
                    {item.guestName}
                  </span>
                )}
                {item.caption && (
                  <p className="text-white text-xs md:text-sm font-serif italic line-clamp-2">
                    {item.caption}
                  </p>
                )}
              </div>
              {showReactions && item.totalReactions > 0 && (
                <div className="mt-2 text-right">
                  <span className="text-[11px] text-[#d4af37] font-medium">
                    ❤️ {item.totalReactions} reacções
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
