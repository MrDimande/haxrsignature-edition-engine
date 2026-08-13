"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Camera, X, Trophy } from "lucide-react";
import type { PublicMemoryItem } from "@lib/memories/gallery";
import { PLUS_MEMORY_CHALLENGES, getTableLabel } from "./plus-memorias-challenges";

interface PlusMemoriasToastProps {
  slug: string;
  refreshTrigger?: number;
}

export function PlusMemoriasToast({ slug, refreshTrigger = 0 }: PlusMemoriasToastProps) {
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
    async function checkForRecentMemory() {
      try {
        const res = await fetch(`/api/memories?slug=${encodeURIComponent(slug)}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.memories) && data.memories.length > 0) {
          const latest: PublicMemoryItem = data.memories[0];

          const challenge = PLUS_MEMORY_CHALLENGES.find((c) => c.id === latest.challengeId);
          const currentNumber = challenge ? challenge.number : "01";

          const currentNumInt = parseInt(currentNumber, 10);
          const nextNumInt = currentNumInt < 12 ? currentNumInt + 1 : 1;
          const nextNumber = nextNumInt < 10 ? `0${nextNumInt}` : `${nextNumInt}`;

          const author = latest.guestName ? latest.guestName : "Um convidado";
          const tableLabel = getTableLabel(latest.tableId);

          setActiveToast({
            id: latest.id,
            author,
            tableText: tableLabel || "",
            challengeTitle: challenge ? challenge.title : "Momento Especial",
            challengeNumber: currentNumber,
            nextChallengeNumber: nextNumber,
            caption: latest.caption || undefined,
          });

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
        className="fixed top-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 bg-[#FFF9F2]/95 backdrop-blur-md border border-[#C9939B]/35 shadow-xl rounded-2xl p-4 text-[#171312]"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-[#7A2332] text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
            <Camera className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-display text-[9px] tracking-[0.25em] uppercase text-[#7A2332] font-medium">
                Plus Memories · Acabou de ser cumprido!
              </span>
            </div>

            <p className="font-display text-sm font-medium text-[#171312] leading-snug">
              {activeToast.author}{" "}
              {activeToast.tableText && (
                <span className="text-[#7A2332] font-normal">({activeToast.tableText})</span>
              )}
            </p>

            <p className="font-body text-xs text-[#171312]/70 mt-0.5">
              Cumprido o <strong className="text-[#171312]">Desafio #{activeToast.challengeNumber}</strong>: &ldquo;{activeToast.challengeTitle}&rdquo;
            </p>

            {activeToast.caption && (
              <p className="font-body text-xs italic text-[#7A2332] mt-1 bg-[#F1E3CF] p-1.5 rounded border border-[#C9939B]/20">
                &ldquo;{activeToast.caption}&rdquo;
              </p>
            )}

            {/* Provocação social amigável */}
            <div className="mt-2.5 pt-2 border-t border-[#C9939B]/20 flex items-center gap-1.5 text-[11px] font-display text-[#7A2332]">
              <Trophy className="w-3.5 h-3.5 shrink-0 text-[#C9939B]" />
              <span>Acha que a sua mesa consegue fazer melhor no <strong>Desafio #{activeToast.nextChallengeNumber}</strong>? 😉</span>
            </div>
          </div>

          <button
            onClick={() => setActiveToast(null)}
            className="p-1 text-[#171312]/40 hover:text-[#171312] transition-colors rounded-full shrink-0"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
