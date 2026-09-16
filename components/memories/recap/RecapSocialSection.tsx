"use client";

import React from "react";
import type { SafeRecapCommentItem } from "@lib/memories/recap-policy";
import { Heart, MessageCircle } from "lucide-react";

interface RecapSocialSectionProps {
  totalPhotos: number;
  totalReactions: number;
  reactionAggregates: Record<string, number>;
  comments: SafeRecapCommentItem[];
}

export function RecapSocialSection({
  totalPhotos,
  totalReactions,
  reactionAggregates,
  comments,
}: RecapSocialSectionProps) {
  // Rótulos editoriais em Português de Moçambique
  const reactionLabels: Record<string, string> = {
    love: "Amor & Emoção",
    applause: "Aplausos",
    champagne: "Celebração",
    elegance: "Elegância",
    toast: "Brindes",
  };

  return (
    <section className="py-16 sm:py-24 bg-black text-[#FAF8F5] border-b border-[#D4AF37]/10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho */}
        <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-18">
          <span className="text-[10px] sm:text-xs tracking-[0.3em] uppercase text-[#D4AF37] font-serif block mb-2">
            PULSO COLECTIVO
          </span>
          <h2 className="text-2xl sm:text-4xl font-serif font-normal text-[#FAF8F5] tracking-tight">
            O Calor dos Convidados
          </h2>
          <div className="w-12 h-[1px] bg-[#D4AF37]/40 mx-auto mt-4" />
        </div>

        {/* Cartões de Métricas Agregadas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-14">
          <div className="p-6 rounded-sm bg-[#111111] border border-white/5 text-center shadow-lg">
            <span className="text-2xl sm:text-3xl font-serif font-normal text-[#D4AF37] block mb-1">
              {totalPhotos}
            </span>
            <span className="text-xs text-[#FAF8F5]/60 font-serif uppercase tracking-wider">
              Memórias Partilhadas
            </span>
          </div>

          <div className="p-6 rounded-sm bg-[#111111] border border-white/5 text-center shadow-lg">
            <span className="text-2xl sm:text-3xl font-serif font-normal text-[#D4AF37] block mb-1">
              {totalReactions}
            </span>
            <span className="text-xs text-[#FAF8F5]/60 font-serif uppercase tracking-wider">
              Reacções Sentidas
            </span>
          </div>

          <div className="p-6 rounded-sm bg-[#111111] border border-white/5 text-center shadow-lg">
            <span className="text-2xl sm:text-3xl font-serif font-normal text-[#D4AF37] block mb-1">
              {reactionAggregates["love"] || 0}
            </span>
            <span className="text-xs text-[#FAF8F5]/60 font-serif uppercase tracking-wider">
              Gestos de Amor
            </span>
          </div>

          <div className="p-6 rounded-sm bg-[#111111] border border-white/5 text-center shadow-lg">
            <span className="text-2xl sm:text-3xl font-serif font-normal text-[#D4AF37] block mb-1">
              {comments.length}
            </span>
            <span className="text-xs text-[#FAF8F5]/60 font-serif uppercase tracking-wider">
              Votos de Felicidade
            </span>
          </div>
        </div>

        {/* Comentários Aprovados */}
        {comments.length > 0 && (
          <div>
            <h3 className="text-lg sm:text-xl font-serif text-[#FAF8F5] font-normal text-center mb-8 flex items-center justify-center gap-2">
              <MessageCircle className="w-5 h-5 text-[#D4AF37]" />
              Palavras de Afeição
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {comments.map((c) => (
                <div
                  key={c.id}
                  className="p-5 sm:p-6 rounded-sm bg-[#111111] border border-[#D4AF37]/15 flex flex-col justify-between shadow-md"
                >
                  <p className="text-sm font-serif italic text-[#FAF8F5]/90 leading-relaxed mb-4">
                    “{c.body}”
                  </p>
                  <div className="flex items-center justify-between text-xs text-[#FAF8F5]/50 border-t border-white/5 pt-3 font-sans">
                    <span className="text-[#D4AF37] font-medium">{c.authorName}</span>
                    <span>{new Date(c.createdAt).toLocaleDateString("pt-MZ")}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
