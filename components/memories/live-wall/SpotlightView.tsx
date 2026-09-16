/* eslint-disable @next/next/no-img-element */
"use client";

import React from "react";
import type { LiveWallMediaItem } from "@lib/memories/live-wall-store";

interface SpotlightViewProps {
  item: LiveWallMediaItem;
  showReactions: boolean;
  showComments: boolean;
  onVideoEnded?: () => void;
}

export const SpotlightView: React.FC<SpotlightViewProps> = ({
  item,
  showReactions,
  showComments,
  onVideoEnded,
}) => {
  const isVideo = item.kind === "video";

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black select-none">
      {/* Imagem de Fundo Desfocada para Preenchimento Cinematográfico */}
      <div
        className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-25 scale-110 pointer-events-none transition-all duration-1000"
        style={{
          backgroundImage: `url(${item.posterUrl || item.mediumUrl || item.thumbnailUrl})`,
        }}
        aria-hidden="true"
      />

      {/* Elemento de Mídia Principal */}
      <div className="relative z-10 max-w-full max-h-full flex items-center justify-center p-4 md:p-8">
        {isVideo ? (
          <video
            key={item.id}
            src={item.mediumUrl}
            poster={item.posterUrl || item.thumbnailUrl}
            autoPlay
            muted
            playsInline
            onEnded={onVideoEnded}
            className="max-h-[82vh] max-w-[90vw] object-contain rounded-lg shadow-2xl border border-[#d4af37]/20"
          />
        ) : (
          <img
            key={item.id}
            src={item.mediumUrl || item.thumbnailUrl}
            alt={item.caption || "Memória do casamento"}
            className="max-h-[82vh] max-w-[90vw] object-contain rounded-lg shadow-2xl border border-[#d4af37]/20 transition-opacity duration-700 animate-fadeIn"
          />
        )}
      </div>

      {/* Cartão de Informação Editorial Flutuante (Alta-Costura) */}
      <div className="absolute bottom-6 left-6 right-6 md:left-12 md:right-12 z-20 flex flex-col md:flex-row items-start md:items-end justify-between gap-4 pointer-events-none">
        <div className="bg-black/75 backdrop-blur-md border border-[#d4af37]/30 rounded-xl p-4 md:p-6 max-w-xl shadow-2xl">
          {item.guestName && (
            <div className="text-[#d4af37] text-xs md:text-sm font-semibold tracking-wider uppercase mb-1">
              {item.guestName}
            </div>
          )}
          {item.caption && (
            <p className="text-white text-base md:text-xl font-serif italic line-clamp-2 mb-2">
              &ldquo;{item.caption}&rdquo;
            </p>
          )}

          {/* Comentários Aprovados */}
          {showComments && item.comments && item.comments.length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/10 space-y-1.5">
              {item.comments.slice(0, 2).map((comm) => (
                <div key={comm.id} className="text-xs text-stone-300 flex items-center gap-1.5">
                  <span className="font-semibold text-stone-200">{comm.authorName}:</span>
                  <span className="italic truncate">{comm.body}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reacções Sociais Agregadas */}
        {showReactions && item.totalReactions > 0 && (
          <div className="bg-black/75 backdrop-blur-md border border-[#d4af37]/30 rounded-xl px-5 py-3 flex items-center gap-4 shadow-2xl">
            {item.reactions.love > 0 && (
              <span className="flex items-center gap-1 text-xs md:text-sm text-rose-300 font-medium">
                ❤️ {item.reactions.love}
              </span>
            )}
            {item.reactions.applause > 0 && (
              <span className="flex items-center gap-1 text-xs md:text-sm text-amber-300 font-medium">
                👏 {item.reactions.applause}
              </span>
            )}
            {item.reactions.champagne > 0 && (
              <span className="flex items-center gap-1 text-xs md:text-sm text-yellow-300 font-medium">
                🥂 {item.reactions.champagne}
              </span>
            )}
            {item.reactions.toast > 0 && (
              <span className="flex items-center gap-1 text-xs md:text-sm text-orange-300 font-medium">
                ✨ {item.reactions.toast}
              </span>
            )}
            <span className="text-xs text-[#d4af37] font-semibold border-l border-white/10 pl-3">
              {item.totalReactions} reacções
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
