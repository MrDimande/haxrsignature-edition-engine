"use client";

import React from "react";
import { motion } from "motion/react";
import { Check, Camera } from "lucide-react";
import { MEMORY_CHALLENGES, type MemoryChallenge } from "./memorias-challenges";

interface MemoriasChallengeGridProps {
  completedIds: string[];
  onSelectChallenge: (challenge: MemoryChallenge) => void;
}

export function MemoriasChallengeGrid({
  completedIds,
  onSelectChallenge,
}: MemoriasChallengeGridProps) {
  return (
    <section className="px-4 sm:px-6 max-w-4xl mx-auto my-6">
      <div className="text-center mb-8">
        <h2 className="font-display text-xl sm:text-2xl font-light text-[#2A1810] tracking-wide mb-1">
          Desafios "Eu Espio..."
        </h2>
        <p className="font-body text-xs text-[#4A3020]/75">
          Toque num desafio para registar a fotografia ou vídeo correspondente.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {MEMORY_CHALLENGES.map((challenge, index) => {
          const isCompleted = completedIds.includes(challenge.id);

          return (
            <motion.div
              key={challenge.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.5 }}
              onClick={() => onSelectChallenge(challenge)}
              className={`p-5 rounded-lg border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[140px] group ${
                isCompleted
                  ? "bg-[#F3DFD0] border-[#C45C26]/40 shadow-xs"
                  : "bg-[#FBF6F0] border-[#C9A227]/30 hover:border-[#C45C26]/60 hover:shadow-md"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-display text-xs tracking-[0.2em] font-medium text-[#C45C26]">
                    DESAFIO {challenge.number}
                  </span>

                  {isCompleted ? (
                    <span className="inline-flex items-center gap-1 text-[9px] tracking-[0.18em] uppercase font-medium text-[#9E4218] bg-[#C45C26]/15 px-2.5 py-0.5 rounded-full border border-[#C45C26]/30">
                      <Check className="w-3 h-3" />
                      CONCLUÍDO
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[9px] tracking-[0.18em] uppercase font-medium text-[#4A3020]/60 bg-[#C9A227]/10 px-2.5 py-0.5 rounded-full border border-[#C9A227]/30 group-hover:bg-[#C45C26] group-hover:text-[#FBF6F0] transition-colors">
                      <Camera className="w-3 h-3" />
                      REGISTAR
                    </span>
                  )}
                </div>

                <h3 className="font-display text-base text-[#2A1810] font-normal leading-snug mb-1">
                  {challenge.title}
                </h3>

                <p className="font-body text-xs text-[#4A3020]/75 leading-relaxed">
                  {challenge.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#C9A227]/15 flex items-center justify-end">
                <span className="text-[10px] tracking-[0.2em] uppercase text-[#C45C26] group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 font-medium">
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
