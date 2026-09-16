"use client";

import React, { useState, useEffect } from "react";
import { Trophy, Medal, Users, Award, ShieldCheck } from "lucide-react";

export interface ExplorerRankItem {
  rank: number;
  participantId: string;
  displayName: string;
  points: number;
  missionsCompleted: number;
  lastAwardedAt: string | null;
}

interface PlusMemoriasExplorersProps {
  slug: string;
  refreshTrigger?: number;
}

export function PlusMemoriasExplorers({ slug, refreshTrigger = 0 }: PlusMemoriasExplorersProps) {
  const [entries, setEntries] = useState<ExplorerRankItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadLeaderboard() {
      try {
        setLoading(true);
        const res = await fetch(`/api/memories/explorers?slug=${encodeURIComponent(slug)}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          if (isMounted) {
            setError(errData?.error || "A classificação encontra-se temporariamente indisponível.");
            setEntries([]);
          }
          return;
        }
        const data = await res.json();
        if (data.success && Array.isArray(data.leaderboard) && isMounted) {
          setEntries(data.leaderboard);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Não foi possível carregar a tabela dos exploradores.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadLeaderboard();
    return () => {
      isMounted = false;
    };
  }, [slug, refreshTrigger]);

  const topThree = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="space-y-6 max-w-lg mx-auto px-2">
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF9F2] border border-[#D4AF37]/30 text-[#7A2332] text-[11px] font-serif uppercase tracking-widest mb-1">
          <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Classificação Oficial</span>
        </div>
        <h3 className="text-base font-serif uppercase tracking-widest text-[#7A2332]">
          Exploradores da Celebração
        </h3>
        <p className="text-xs text-neutral-500 font-light">
          Pontuação em tempo real das missões concluídas pelos convidados.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3 py-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-14 bg-neutral-100/80 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-8 px-4 rounded-xl border border-neutral-200 bg-[#FAF7F2] text-xs text-neutral-600">
          <p>{error}</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-xl border border-dashed border-[#D4AF37]/30 bg-[#FFF9F2]/50 space-y-2">
          <Users className="w-6 h-6 mx-auto text-[#7A2332]/60" />
          <p className="text-sm font-serif text-[#7A2332]">Ainda sem exploradores na classificação.</p>
          <p className="text-xs text-neutral-500 max-w-xs mx-auto font-light">
            Participe nas missões da aba &laquo;Eu Espio&raquo; para registar os seus pontos e subir no ranking!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Top 3 Podium */}
          {topThree.length > 0 && (
            <div className="grid grid-cols-3 gap-2 pt-4 items-end">
              {/* 2º Lugar */}
              {topThree[1] ? (
                <div className="flex flex-col items-center bg-[#FAF7F2] border border-neutral-200 rounded-xl p-3 pb-4 space-y-1 shadow-xs order-1">
                  <div className="w-7 h-7 rounded-full bg-neutral-200 text-neutral-700 flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <span className="text-xs font-serif text-neutral-900 font-medium truncate max-w-full text-center">
                    {topThree[1].displayName}
                  </span>
                  <span className="text-[10px] text-[#7A2332] font-semibold">
                    {topThree[1].points} pts
                  </span>
                  <span className="text-[9px] text-neutral-400">
                    {topThree[1].missionsCompleted} {topThree[1].missionsCompleted === 1 ? "missão" : "missões"}
                  </span>
                </div>
              ) : (
                <div className="order-1" />
              )}

              {/* 1º Lugar */}
              {topThree[0] && (
                <div className="flex flex-col items-center bg-[#FFF9F2] border-2 border-[#D4AF37] rounded-xl p-4 pb-5 space-y-1.5 shadow-md order-2 scale-105">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#D4AF37] to-[#F5E6C8] text-[#7A2332] flex items-center justify-center font-bold text-sm shadow-xs">
                    <Trophy className="w-4 h-4 text-[#7A2332]" />
                  </div>
                  <span className="text-xs font-serif text-[#7A2332] font-bold truncate max-w-full text-center">
                    {topThree[0].displayName}
                  </span>
                  <span className="text-[11px] text-[#7A2332] font-bold bg-[#D4AF37]/20 px-2 py-0.5 rounded-full">
                    {topThree[0].points} pts
                  </span>
                  <span className="text-[9px] text-neutral-500 font-medium">
                    {topThree[0].missionsCompleted} {topThree[0].missionsCompleted === 1 ? "missão" : "missões"}
                  </span>
                </div>
              )}

              {/* 3º Lugar */}
              {topThree[2] ? (
                <div className="flex flex-col items-center bg-[#FAF7F2] border border-neutral-200 rounded-xl p-3 pb-4 space-y-1 shadow-xs order-3">
                  <div className="w-7 h-7 rounded-full bg-[#A37854]/20 text-[#A37854] flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <span className="text-xs font-serif text-neutral-900 font-medium truncate max-w-full text-center">
                    {topThree[2].displayName}
                  </span>
                  <span className="text-[10px] text-[#7A2332] font-semibold">
                    {topThree[2].points} pts
                  </span>
                  <span className="text-[9px] text-neutral-400">
                    {topThree[2].missionsCompleted} {topThree[2].missionsCompleted === 1 ? "missão" : "missões"}
                  </span>
                </div>
              ) : (
                <div className="order-3" />
              )}
            </div>
          )}

          {/* Lista restante */}
          {rest.length > 0 && (
            <div className="space-y-2 pt-2">
              {rest.map((entry) => (
                <div
                  key={`${entry.rank}-${entry.participantId}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-white border border-neutral-100 shadow-xs text-xs transition-all hover:border-[#D4AF37]/40"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <span className="w-5 text-center font-bold text-neutral-400 shrink-0">
                      {entry.rank}
                    </span>
                    <span className="font-serif text-neutral-800 truncate">
                      {entry.displayName}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] text-neutral-400 hidden sm:inline">
                      {entry.missionsCompleted} {entry.missionsCompleted === 1 ? "missão" : "missões"}
                    </span>
                    <div className="flex items-center gap-1.5 text-[#7A2332]">
                      <Medal className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span className="font-semibold">{entry.points} pts</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
