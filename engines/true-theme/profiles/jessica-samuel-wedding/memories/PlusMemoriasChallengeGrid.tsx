"use client";

import React from "react";
import { motion } from "motion/react";
import { Check, Camera } from "lucide-react";
import { PLUS_MEMORY_CHALLENGES, type MemoryChallenge } from "./plus-memorias-challenges";

interface PlusMemoriasChallengeGridProps {
  completedIds: string[];
  onSelectChallenge: (challenge: MemoryChallenge) => void;
}

export function PlusMemoriasChallengeGrid({
  completedIds,
  onSelectChallenge,
}: PlusMemoriasChallengeGridProps) {
  return (
    <section className="px-4 sm:px-6 max-w-4xl mx-auto my-6">
      <div className="text-center mb-8">
        <p className="font-display text-[10px] sm:text-[11px] tracking-[0.32em] uppercase text-[#7A2332] font-medium mb-1">
          Eu Espio&hellip;
        </p>
        <h2 className="font-display text-xl sm:text-2xl font-light text-[#171312] tracking-wide mb-1">
          12 Momentos Para Descobrir
        </h2>
        <p className="font-body text-xs text-[#171312]/55">
          Toque num desafio para registar a fotografia ou vídeo correspondente.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PLUS_MEMORY_CHALLENGES.map((challenge, index) => {
          const isCompleted = completedIds.includes(challenge.id);

          return (
            <motion.div
              key={challenge.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: index * 0.035,
                duration: 0.45,
                ease: [0.16, 1, 0.3, 1],
              }}
              whileHover={{ y: -3, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectChallenge(challenge)}
              className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[145px] group ${
                isCompleted
                  ? "bg-[#C9939B]/12 border-[#7A2332]/35 shadow-xs"
                  : "bg-[#FFF9F2] border-[#C9939B]/30 hover:border-[#7A2332]/60 hover:shadow-lg hover:shadow-[#7A2332]/5"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-display text-xs tracking-[0.2em] font-medium text-[#7A2332]">
                    DESAFIO {challenge.number}
                  </span>

                  {isCompleted ? (
                    <span className="inline-flex items-center gap-1 text-[9px] tracking-[0.18em] uppercase font-medium text-[#FFF9F2] bg-[#7A2332] px-2.5 py-0.5 rounded-full shadow-2xs">
                      <Check className="w-3 h-3" />
                      CONCLUÍDO
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[9px] tracking-[0.18em] uppercase font-medium text-[#171312]/60 bg-[#C9939B]/12 px-2.5 py-0.5 rounded-full border border-[#C9939B]/35 group-hover:bg-[#7A2332] group-hover:text-[#FFF9F2] group-hover:border-[#7A2332] transition-colors duration-300">
                      <Camera className="w-3 h-3" />
                      REGISTAR
                    </span>
                  )}
                </div>

                <h3 className="font-display text-base text-[#171312] font-normal leading-snug mb-1.5 group-hover:text-[#7A2332] transition-colors">
                  {challenge.title}
                </h3>

                <p className="font-body text-xs text-[#171312]/60 leading-relaxed font-light">
                  {challenge.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#C9939B]/20 flex items-center justify-end">
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
