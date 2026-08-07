"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Camera, Sparkles, X, Trophy } from "lucide-react";
import type { PublicMemoryItem } from "@lib/jessica-samuel-traditional/memories/gallery";
import { MEMORY_CHALLENGES } from "./memorias-challenges";

interface MemoriasToastProps {
  slug: string;
  refreshTrigger?: number;
}

export function MemoriasToast({ slug, refreshTrigger = 0 }: MemoriasToastProps) {
  const [activeToast, setActiveToast] = useState<{
    id: string;
    author: string;
    tableText: string;
    challengeTitle: string;
    challengeNumber: string;
    nextChallengeNumber: string;
    caption?: string;
  } | null>(null);

  useEffect(() => {
    // Buscar a memória mais recente
    async function checkForRecentMemory() {
      try {
        const res = await fetch(`/api/memories?slug=${encodeURIComponent(slug)}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.memories) && data.memories.length > 0) {
          const latest: PublicMemoryItem = data.memories[0];

          const challenge = MEMORY_CHALLENGES.find((c) => c.id === latest.challengeId);
          const currentNumber = challenge ? challenge.number : "01";

          // Escolher um desafio seguinte para a provocação amigável
          const currentNumInt = parseInt(currentNumber, 10);
          const nextNumInt = currentNumInt < 8 ? currentNumInt + 1 : 1;
          const nextNumber = nextNumInt < 10 ? `0${nextNumInt}` : `${nextNumInt}`;

          const author = latest.guestName ? latest.guestName : "Um convidado";
          const tableText = latest.tableId ? `Mesa ${latest.tableId}` : "";

          setActiveToast({
            id: latest.id,
            author,
            tableText,
            challengeTitle: challenge ? challenge.title : "Momento Especial",
            challengeNumber: currentNumber,
            nextChallengeNumber: nextNumber,
            caption: latest.caption || undefined,
          });

          // Ocultar automaticamente após 7 segundos
          const timer = setTimeout(() => {
            setActiveToast(null);
          }, 7000);

          return () => clearTimeout(timer);
        }
      } catch (err) {
        console.error("Toast error checking memories:", err);
      }
    }

    checkForRecentMemory();
  }, [slug, refreshTrigger]);

  if (!activeToast) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -40, scale: 0.95 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 bg-[#FBF6F0]/95 backdrop-blur-md border border-[#C9A227]/40 shadow-xl rounded-2xl p-4 text-[#2A1810]"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-[#C45C26] text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
            <Camera className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-display text-[9px] tracking-[0.25em] uppercase text-[#C45C26] font-medium">
                Mural Vivo · Acabou de ser cumprido!
              </span>
            </div>

            <p className="font-display text-sm font-medium text-[#2A1810] leading-snug">
              {activeToast.author}{" "}
              {activeToast.tableText && (
                <span className="text-[#C45C26] font-normal">({activeToast.tableText})</span>
              )}
            </p>

            <p className="font-body text-xs text-[#4A3020]/90 mt-0.5">
              Cumprido o <strong className="text-[#2A1810]">Desafio #{activeToast.challengeNumber}</strong>: "{activeToast.challengeTitle}"
            </p>

            {activeToast.caption && (
              <p className="font-body text-xs italic text-[#C45C26] mt-1 bg-[#F5EDE4] p-1.5 rounded border border-[#C9A227]/20">
                "{activeToast.caption}"
              </p>
            )}

            {/* Provocação social amigável */}
            <div className="mt-2.5 pt-2 border-t border-[#C9A227]/20 flex items-center gap-1.5 text-[11px] font-display text-[#C45C26]">
              <Trophy className="w-3.5 h-3.5 shrink-0 text-[#C9A227]" />
              <span>Acha que a sua mesa consegue fazer melhor no <strong>Desafio #{activeToast.nextChallengeNumber}</strong>? 😉</span>
            </div>
          </div>

          <button
            onClick={() => setActiveToast(null)}
            className="p-1 text-[#4A3020]/50 hover:text-[#2A1810] transition-colors rounded-full shrink-0"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
