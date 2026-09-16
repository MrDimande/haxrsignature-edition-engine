/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import type { RecapMediaItem } from "@lib/memories/recap-policy";
import { X, ChevronLeft, ChevronRight, Play, Volume2, VolumeX, Heart, MessageCircle } from "lucide-react";

interface RecapMediaLightboxProps {
  items: RecapMediaItem[];
  initialIndex: number;
  onClose: () => void;
}

export function RecapMediaLightbox({ items, initialIndex, onClose }: RecapMediaLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isMuted, setIsMuted] = useState(true);

  const currentItem = items[currentIndex];

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
  }, [items.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
  }, [items.length]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev, onClose]);

  if (!currentItem) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Visualizador de Memória"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 sm:p-6"
    >
      {/* Botão Fechar */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar visualizador"
        className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-white/10 text-white/80 hover:text-white hover:bg-white/20 transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Navegação Anterior */}
      {items.length > 1 && (
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Item anterior"
          className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 text-white/80 hover:text-white hover:bg-white/20 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Área Central de Media */}
      <div className="relative max-w-5xl max-h-[85vh] w-full flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center w-full h-[65vh] sm:h-[70vh]">
          {currentItem.kind === "video" ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                key={currentItem.mediumUrl}
                src={currentItem.mediumUrl}
                poster={currentItem.posterUrl || currentItem.thumbnailUrl}
                autoPlay
                playsInline
                loop
                muted={isMuted}
                className="max-h-full max-w-full rounded-sm object-contain shadow-2xl border border-[#D4AF37]/20"
              />
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className="absolute bottom-4 right-4 p-2 rounded-full bg-black/60 text-white/90 hover:text-white hover:bg-black/80 transition-colors"
                aria-label={isMuted ? "Activar som" : "Desactivar som"}
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>
          ) : (
            <img
              src={currentItem.mediumUrl}
              alt={currentItem.caption || "Fotografia de celebração"}
              className="max-h-full max-w-full rounded-sm object-contain shadow-2xl border border-[#D4AF37]/20"
            />
          )}
        </div>

        {/* Metadados Editoriais Inferiores */}
        <div className="mt-4 w-full max-w-2xl text-center px-4">
          {currentItem.editorialCaption && (
            <p className="text-sm sm:text-base font-serif italic text-[#FAF8F5]/90 mb-1">
              “{currentItem.editorialCaption}”
            </p>
          )}

          {currentItem.caption && currentItem.caption !== currentItem.editorialCaption && (
            <p className="text-xs sm:text-sm text-[#FAF8F5]/70 mb-1 font-sans">
              {currentItem.caption}
            </p>
          )}

          <div className="flex items-center justify-center gap-4 text-xs text-[#FAF8F5]/50 mt-2">
            {currentItem.guestName && (
              <span>Partilhado por <span className="text-[#D4AF37] font-medium">{currentItem.guestName}</span></span>
            )}
            {currentItem.totalReactions > 0 && (
              <span className="flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-[#D4AF37]" />
                {currentItem.totalReactions}
              </span>
            )}
            {currentItem.approvedCommentsCount > 0 && (
              <span className="flex items-center gap-1">
                <MessageCircle className="w-3.5 h-3.5 text-[#FAF8F5]/60" />
                {currentItem.approvedCommentsCount}
              </span>
            )}
            <span>{currentIndex + 1} de {items.length}</span>
          </div>
        </div>
      </div>

      {/* Navegação Seguinte */}
      {items.length > 1 && (
        <button
          type="button"
          onClick={handleNext}
          aria-label="Item seguinte"
          className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 text-white/80 hover:text-white hover:bg-white/20 transition-colors"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
