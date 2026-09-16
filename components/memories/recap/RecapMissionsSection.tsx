/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import type { RecapMissionHighlight, RecapMediaItem } from "@lib/memories/recap-policy";
import { Award, Camera } from "lucide-react";

interface RecapMissionsSectionProps {
  missions: RecapMissionHighlight[];
  onOpenMedia: (item: RecapMediaItem, allItems: RecapMediaItem[]) => void;
}

export function RecapMissionsSection({ missions, onOpenMedia }: RecapMissionsSectionProps) {
  if (!missions || missions.length === 0) return null;

  const allMissionMedia = missions.flatMap((m) => m.featuredMedia);

  return (
    <section className="py-16 sm:py-24 bg-[#0A0A0A] text-[#FAF8F5] border-b border-[#D4AF37]/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho */}
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-20">
          <span className="text-[10px] sm:text-xs tracking-[0.3em] uppercase text-[#D4AF37] font-serif block mb-2">
            O JOGO DOS CONVIDADOS
          </span>
          <h2 className="text-2xl sm:text-4xl font-serif font-normal text-[#FAF8F5] tracking-tight">
            Eu Espio — Desafios Cumpridos
          </h2>
          <div className="w-12 h-[1px] bg-[#D4AF37]/40 mx-auto mt-4" />
        </div>

        {/* Lista de Missões */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10">
          {missions.map((mission) => (
            <div
              key={mission.missionId}
              className="rounded-sm border border-[#D4AF37]/20 bg-[#111111] p-6 sm:p-8 flex flex-col justify-between shadow-xl"
            >
              <div>
                <div className="flex items-center justify-between gap-4 mb-4">
                  <span className="text-[10px] tracking-widest uppercase px-2.5 py-1 rounded-xs bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">
                    {mission.missionCategory}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-[#D4AF37]">
                    <Award className="w-4 h-4" />
                    <span>{mission.points} pontos</span>
                  </div>
                </div>

                <h3 className="text-lg sm:text-xl font-serif text-[#FAF8F5] font-medium mb-2">
                  {mission.missionTitle}
                </h3>

                <p className="text-xs text-[#FAF8F5]/60 font-sans mb-6">
                  {mission.submissionsCount} {mission.submissionsCount === 1 ? "captura aceite" : "capturas aceites"} pelos convidados
                </p>
              </div>

              {/* Fotografias em destaque da missão */}
              {mission.featuredMedia.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 border-t border-white/5">
                  {mission.featuredMedia.map((media) => (
                    <div
                      key={media.id}
                      onClick={() => onOpenMedia(media, allMissionMedia)}
                      className="group relative aspect-square rounded-xs overflow-hidden bg-black/40 cursor-pointer border border-white/5 hover:border-[#D4AF37]/40 transition-colors"
                    >
                      <img
                        src={media.thumbnailUrl}
                        alt="Submissão da missão"
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-[#FAF8F5]/40 italic border-t border-white/5">
                  <Camera className="w-5 h-5 mx-auto mb-1 opacity-40" />
                  Missão concluída com honras
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
