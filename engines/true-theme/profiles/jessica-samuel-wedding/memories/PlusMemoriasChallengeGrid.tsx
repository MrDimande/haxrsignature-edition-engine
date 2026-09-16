"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Check, Camera, Award, Clock } from "lucide-react";
import { PLUS_MEMORY_CHALLENGES, type MemoryChallenge } from "./plus-memorias-challenges";

export interface MissionDisplayItem {
  id: string;
  number: string;
  title: string;
  description: string;
  category?: string;
  difficulty?: string;
  points: number;
  isCompleted: boolean;
  submissionsCount: number;
}

interface PlusMemoriasChallengeGridProps {
  slug?: string;
  tableId?: string;
  completedIds: string[];
  onSelectChallenge: (challenge: MemoryChallenge) => void;
}

export function PlusMemoriasChallengeGrid({
  slug,
  tableId,
  completedIds,
  onSelectChallenge,
}: PlusMemoriasChallengeGridProps) {
  const [missions, setMissions] = useState<MissionDisplayItem[]>(() =>
    PLUS_MEMORY_CHALLENGES.map((ch) => ({
      id: ch.id,
      number: ch.number,
      title: ch.title,
      description: ch.description,
      category: "celebração",
      difficulty: "média",
      points: 100,
      isCompleted: completedIds.includes(ch.id),
      submissionsCount: completedIds.includes(ch.id) ? 1 : 0,
    }))
  );

  useEffect(() => {
    if (!slug) return;
    let isMounted = true;

    async function loadMissions() {
      try {
        const query = new URLSearchParams({ slug: slug! });
        if (tableId) query.set("tableId", tableId);

        const res = await fetch(`/api/memories/missions?${query.toString()}`);
        if (!res.ok) return;

        const data = await res.json();
        if (data.success && Array.isArray(data.missions) && data.missions.length > 0 && isMounted) {
          const mapped: MissionDisplayItem[] = data.missions.map((m: any, idx: number) => {
            const num = m.slug && m.slug.length <= 3 ? m.slug : String(idx + 1).padStart(2, "0");
            const isDone = m.isCompleted || completedIds.includes(m.slug) || completedIds.includes(m.id);
            return {
              id: m.slug || m.id,
              number: num,
              title: m.title,
              description: m.description,
              category: m.category || "geral",
              difficulty: m.difficulty || "média",
              points: m.points || 100,
              isCompleted: isDone,
              submissionsCount: m.submissionsCount || (isDone ? 1 : 0),
            };
          });
          setMissions(mapped);
        }
      } catch (err) {
        console.warn("[PlusMemoriasChallengeGrid] Falha ao carregar missões do servidor, usando fallback:", err);
      }
    }

    loadMissions();
    return () => {
      isMounted = false;
    };
  }, [slug, tableId, completedIds]);

  return (
    <section className="px-4 sm:px-6 max-w-4xl mx-auto my-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF9F2] border border-[#D4AF37]/30 text-[#7A2332] text-[10px] font-serif uppercase tracking-widest mb-1.5">
          <Award className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Missões Fotográficas</span>
        </div>
        <p className="font-display text-[10px] sm:text-[11px] tracking-[0.32em] uppercase text-[#7A2332] font-medium mb-1">
          Eu Espio&hellip;
        </p>
        <h2 className="font-display text-xl sm:text-2xl font-light text-[#171312] tracking-wide mb-1">
          {missions.length} Momentos Para Descobrir
        </h2>
        <p className="font-body text-xs text-[#171312]/55">
          Toque numa missão para registar a fotografia ou vídeo correspondente e somar pontos.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {missions.map((mission, index) => {
          const isCompleted = mission.isCompleted || completedIds.includes(mission.id);

          return (
            <motion.div
              key={mission.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: index * 0.025,
                duration: 0.45,
                ease: [0.16, 1, 0.3, 1],
              }}
              whileHover={{ y: -3, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() =>
                onSelectChallenge({
                  id: mission.id,
                  number: mission.number,
                  title: mission.title,
                  description: mission.description,
                })
              }
              className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[155px] group ${
                isCompleted
                  ? "bg-[#C9939B]/12 border-[#7A2332]/35 shadow-xs"
                  : "bg-[#FFF9F2] border-[#C9939B]/30 hover:border-[#7A2332]/60 hover:shadow-lg hover:shadow-[#7A2332]/5"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-xs tracking-[0.2em] font-medium text-[#7A2332]">
                      MISSÃO {mission.number}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FFF9F2] border border-[#D4AF37]/30 text-[#7A2332] font-semibold">
                      {mission.points} pts
                    </span>
                  </div>

                  {isCompleted ? (
                    <span className="inline-flex items-center gap-1 text-[9px] tracking-[0.18em] uppercase font-medium text-[#FFF9F2] bg-[#7A2332] px-2.5 py-0.5 rounded-full shadow-2xs">
                      <Check className="w-3 h-3" />
                      CONCLUÍDA
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[9px] tracking-[0.18em] uppercase font-medium text-[#171312]/60 bg-[#C9939B]/12 px-2.5 py-0.5 rounded-full border border-[#C9939B]/35 group-hover:bg-[#7A2332] group-hover:text-[#FFF9F2] group-hover:border-[#7A2332] transition-colors duration-300">
                      <Camera className="w-3 h-3" />
                      REGISTAR
                    </span>
                  )}
                </div>

                <h3 className="font-display text-base text-[#171312] font-normal leading-snug mb-1.5 group-hover:text-[#7A2332] transition-colors">
                  {mission.title}
                </h3>

                <p className="font-body text-xs text-[#171312]/60 leading-relaxed font-light">
                  {mission.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#C9939B]/20 flex items-center justify-between">
                <span className="text-[10px] text-neutral-400 font-light flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#D4AF37]" />
                  {isCompleted
                    ? `${mission.submissionsCount} ${mission.submissionsCount === 1 ? "registo" : "registos"}`
                    : "Pendente"}
                </span>
                <span className="text-[10px] tracking-[0.2em] uppercase text-[#7A2332] group-hover:translate-x-1.5 transition-transform duration-300 inline-flex items-center gap-1 font-semibold">
                  {isCompleted ? "Adicionar outro registo →" : "Fotografar agora →"}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
