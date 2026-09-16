"use client";

import React from "react";
import type { SafeExplorerRankEntry } from "@lib/memories/recap-policy";
import { Award, Crown, Gem, UserCheck } from "lucide-react";

interface RecapExplorersSectionProps {
  explorers: SafeExplorerRankEntry[];
}

export function RecapExplorersSection({ explorers }: RecapExplorersSectionProps) {
  if (!explorers || explorers.length === 0) return null;

  const topThree = explorers.slice(0, 3);
  const remaining = explorers.slice(3);

  return (
    <section className="py-16 sm:py-24 bg-black text-[#FAF8F5] border-b border-[#D4AF37]/10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho */}
        <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-20">
          <span className="text-[10px] sm:text-xs tracking-[0.3em] uppercase text-[#D4AF37] font-serif block mb-2">
            MÉRITO & PARTICIPAÇÃO
          </span>
          <h2 className="text-2xl sm:text-4xl font-serif font-normal text-[#FAF8F5] tracking-tight">
            Quadro de Honra dos Exploradores
          </h2>
          <div className="w-12 h-[1px] bg-[#D4AF37]/40 mx-auto mt-4" />
        </div>

        {/* Pódio dos Três Primeiros Lugares */}
        {topThree.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-12 items-end">
            {/* 2º Lugar */}
            {topThree[1] && (
              <div
                className={`order-2 sm:order-1 p-6 rounded-sm border bg-[#111111] text-center shadow-lg transition-all ${
                  topThree[1].isCurrentParticipant
                    ? "border-[#D4AF37] ring-1 ring-[#D4AF37]/30"
                    : "border-white/10"
                }`}
              >
                <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-slate-300/10 border border-slate-300/30 flex items-center justify-center text-slate-300">
                  <Gem className="w-5 h-5" />
                </div>
                <span className="text-xs text-[#FAF8F5]/60 font-serif">2º Lugar</span>
                <h3 className="text-base sm:text-lg font-serif font-medium text-[#FAF8F5] mt-1 mb-2">
                  {topThree[1].displayName}
                  {topThree[1].isCurrentParticipant && (
                    <span className="block text-[10px] text-[#D4AF37] font-sans font-normal">(A sua posição)</span>
                  )}
                </h3>
                <div className="text-xs text-[#D4AF37] font-sans font-medium">
                  {topThree[1].points} pts • {topThree[1].missionsCompleted} missões
                </div>
              </div>
            )}

            {/* 1º Lugar (Destaque Central) */}
            {topThree[0] && (
              <div
                className={`order-1 sm:order-2 p-8 rounded-sm border bg-[#151515] text-center shadow-2xl relative sm:-translate-y-4 transition-all ${
                  topThree[0].isCurrentParticipant
                    ? "border-[#D4AF37] ring-2 ring-[#D4AF37]/40"
                    : "border-[#D4AF37]/50"
                }`}
              >
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37] shadow-inner">
                  <Crown className="w-6 h-6" />
                </div>
                <span className="text-xs text-[#D4AF37] font-serif font-semibold tracking-wider">
                  1º Lugar — Campeão
                </span>
                <h3 className="text-lg sm:text-xl font-serif font-semibold text-[#FAF8F5] mt-1 mb-2">
                  {topThree[0].displayName}
                  {topThree[0].isCurrentParticipant && (
                    <span className="block text-xs text-[#D4AF37] font-sans font-normal">(A sua posição)</span>
                  )}
                </h3>
                <div className="text-sm text-[#D4AF37] font-sans font-semibold">
                  {topThree[0].points} pontos • {topThree[0].missionsCompleted} missões
                </div>
              </div>
            )}

            {/* 3º Lugar */}
            {topThree[2] && (
              <div
                className={`order-3 sm:order-3 p-6 rounded-sm border bg-[#111111] text-center shadow-lg transition-all ${
                  topThree[2].isCurrentParticipant
                    ? "border-[#D4AF37] ring-1 ring-[#D4AF37]/30"
                    : "border-white/10"
                }`}
              >
                <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-amber-700/10 border border-amber-700/30 flex items-center justify-center text-amber-600">
                  <Award className="w-5 h-5" />
                </div>
                <span className="text-xs text-[#FAF8F5]/60 font-serif">3º Lugar</span>
                <h3 className="text-base sm:text-lg font-serif font-medium text-[#FAF8F5] mt-1 mb-2">
                  {topThree[2].displayName}
                  {topThree[2].isCurrentParticipant && (
                    <span className="block text-[10px] text-[#D4AF37] font-sans font-normal">(A sua posição)</span>
                  )}
                </h3>
                <div className="text-xs text-[#D4AF37] font-sans font-medium">
                  {topThree[2].points} pts • {topThree[2].missionsCompleted} missões
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tabela dos Restantes Participantes */}
        {remaining.length > 0 && (
          <div className="rounded-sm border border-white/5 bg-[#111111] overflow-hidden">
            <div className="divide-y divide-white/5">
              {remaining.map((exp) => (
                <div
                  key={exp.rank}
                  className={`flex items-center justify-between px-5 py-3.5 text-xs sm:text-sm ${
                    exp.isCurrentParticipant ? "bg-[#D4AF37]/10 text-[#D4AF37] font-medium" : "text-[#FAF8F5]/80"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center text-[#FAF8F5]/40 font-mono text-xs">
                      #{exp.rank}
                    </span>
                    <span>{exp.displayName}</span>
                    {exp.isCurrentParticipant && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-xs bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37]">
                        Você
                      </span>
                    )}
                  </div>
                  <div className="text-right text-xs">
                    <span className="text-[#D4AF37] font-medium">{exp.points} pts</span>
                    <span className="text-[#FAF8F5]/40 ml-2 hidden sm:inline">
                      ({exp.missionsCompleted} missões)
                    </span>
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
