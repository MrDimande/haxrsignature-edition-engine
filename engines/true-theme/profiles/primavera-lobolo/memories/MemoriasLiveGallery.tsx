"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, X, Filter, Camera, User } from "lucide-react";
import type { PublicMemoryItem } from "@lib/jessica-samuel-traditional/memories/gallery";
import { MEMORY_CHALLENGES } from "./memorias-challenges";

interface MemoriasLiveGalleryProps {
  slug: string;
  refreshTrigger?: number;
}

export function MemoriasLiveGallery({ slug, refreshTrigger = 0 }: MemoriasLiveGalleryProps) {
  const [memories, setMemories] = useState<PublicMemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChallengeFilter, setSelectedChallengeFilter] = useState<string | null>(null);
  const [activeLightboxItem, setActiveLightboxItem] = useState<PublicMemoryItem | null>(null);

  const fetchMemories = async () => {
    try {
      const res = await fetch(`/api/memories?slug=${encodeURIComponent(slug)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.memories)) {
        setMemories(data.memories);
      }
    } catch (e) {
      console.error("Error fetching live memories:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, [slug, refreshTrigger]);

  const filteredMemories = selectedChallengeFilter
    ? memories.filter((m) => m.challengeId === selectedChallengeFilter)
    : memories;

  return (
    <section className="px-4 sm:px-6 max-w-5xl mx-auto my-12">
      {/* Header da Galeria */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 pb-4 border-b border-[#C9A227]/25 text-center sm:text-left">
        <div>
          <span className="font-display text-[10px] tracking-[0.28em] uppercase text-[#C45C26] font-medium">
            Mural Vivo do Casamento
          </span>
          <h2 className="font-display text-2xl sm:text-3xl text-[#2A1810] font-light">
            Álbum Colectivo
          </h2>
        </div>

        <div className="flex items-center gap-2 bg-[#FBF6F0] px-4 py-2 rounded-full border border-[#C9A227]/30 shadow-xs">
          <Camera className="w-4 h-4 text-[#C45C26]" />
          <span className="font-display text-xs font-medium text-[#2A1810]">
            {memories.length} {memories.length === 1 ? "memória captada" : "memórias captadas"}
          </span>
        </div>
      </div>

      {/* Filtros por Desafio (Estilo iOS Segmented Control) */}
      {memories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
          <button
            onClick={() => setSelectedChallengeFilter(null)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-display tracking-wider uppercase shrink-0 transition-all ${
              selectedChallengeFilter === null
                ? "bg-[#C45C26] text-[#FBF6F0] shadow-xs"
                : "bg-[#FBF6F0] text-[#4A3020]/80 border border-[#C9A227]/30 hover:border-[#C45C26]"
            }`}
          >
            Todas ({memories.length})
          </button>

          {MEMORY_CHALLENGES.map((ch) => {
            const count = memories.filter((m) => m.challengeId === ch.id).length;
            if (count === 0) return null;

            return (
              <button
                key={ch.id}
                onClick={() => setSelectedChallengeFilter(ch.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-display tracking-wider uppercase shrink-0 transition-all flex items-center gap-1.5 ${
                  selectedChallengeFilter === ch.id
                    ? "bg-[#C45C26] text-[#FBF6F0] shadow-xs"
                    : "bg-[#FBF6F0] text-[#4A3020]/80 border border-[#C9A227]/30 hover:border-[#C45C26]"
                }`}
              >
                <span>#{ch.number}</span>
                <span className="opacity-60">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Conteúdo da Galeria */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 py-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-square bg-[#E8C4A8]/20 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredMemories.length === 0 ? (
        <div className="py-12 px-4 text-center bg-[#FBF6F0] rounded-xl border border-[#C9A227]/20">
          <Camera className="w-10 h-10 text-[#C9A227] mx-auto mb-3 opacity-60" />
          <p className="font-display text-base text-[#2A1810] font-normal mb-1">
            O álbum ainda não tem fotos neste desafio
          </p>
          <p className="font-body text-xs text-[#4A3020]/70">
            Seja o primeiro a registar um momento e a inaugurar esta secção!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {filteredMemories.map((item, idx) => {
            const challenge = MEMORY_CHALLENGES.find((c) => c.id === item.challengeId);

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.04, duration: 0.4 }}
                onClick={() => setActiveLightboxItem(item)}
                className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer bg-[#2A1810]/5 border border-[#C9A227]/20 shadow-xs hover:shadow-md transition-all"
              >
                {item.kind === "image" ? (
                  <img
                    src={item.signedUrl}
                    alt={item.caption || "Memória do Casamento"}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="relative w-full h-full bg-black flex items-center justify-center">
                    <video
                      src={item.signedUrl}
                      className="w-full h-full object-cover opacity-90"
                      muted
                      playsInline
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-white/80 text-[#2A1810] flex items-center justify-center shadow-md">
                        <Play className="w-5 h-5 ml-0.5" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Overlays / Badges estilo iOS */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity p-2.5 flex flex-col justify-between">
                  <div className="flex justify-end">
                    {item.tableId && (
                      <span className="text-[9px] font-display font-medium tracking-wider text-white/90 bg-black/50 px-2 py-0.5 rounded-full backdrop-blur-xs">
                        Mesa {item.tableId}
                      </span>
                    )}
                  </div>

                  <div>
                    {challenge && (
                      <p className="text-[9px] font-display uppercase tracking-widest text-[#C9A227] font-medium truncate">
                        #{challenge.number} {challenge.title}
                      </p>
                    )}
                    {item.guestName && (
                      <p className="text-[10px] font-body text-white/90 truncate flex items-center gap-1">
                        <User className="w-2.5 h-2.5 shrink-0" />
                        {item.guestName}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal (Estilo Galeria de Fotos iOS) */}
      <AnimatePresence>
        {activeLightboxItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.25 }}
              className="relative max-w-3xl w-full max-h-[90vh] flex flex-col items-center justify-center"
            >
              <button
                onClick={() => setActiveLightboxItem(null)}
                className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white bg-white/10 rounded-full transition-colors"
                aria-label="Fechar"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="w-full rounded-2xl overflow-hidden bg-black flex items-center justify-center max-h-[70vh]">
                {activeLightboxItem.kind === "image" ? (
                  <img
                    src={activeLightboxItem.signedUrl}
                    alt={activeLightboxItem.caption || "Fotografia do Casamento"}
                    className="max-h-[70vh] w-auto max-w-full object-contain"
                  />
                ) : (
                  <video
                    src={activeLightboxItem.signedUrl}
                    controls
                    autoPlay
                    playsInline
                    className="max-h-[70vh] w-full object-contain"
                  />
                )}
              </div>

              {/* Informação da Foto no Lightbox */}
              <div className="w-full mt-4 p-4 rounded-xl bg-white/10 backdrop-blur-md text-white text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  {activeLightboxItem.challengeId && (
                    <p className="text-[10px] font-display uppercase tracking-widest text-[#C9A227] font-medium">
                      Desafio #{activeLightboxItem.challengeId}
                    </p>
                  )}
                  {activeLightboxItem.caption && (
                    <p className="font-body text-sm italic text-white/90">
                      "{activeLightboxItem.caption}"
                    </p>
                  )}
                  {activeLightboxItem.guestName && (
                    <p className="font-body text-xs text-white/75 mt-1 flex items-center justify-center sm:justify-start gap-1">
                      <User className="w-3 h-3" />
                      Partilhado por: {activeLightboxItem.guestName}
                    </p>
                  )}
                </div>

                {activeLightboxItem.tableId && (
                  <span className="text-xs font-display tracking-widest uppercase px-3 py-1 bg-[#C45C26] text-white rounded-full font-medium shrink-0">
                    Mesa {activeLightboxItem.tableId}
                  </span>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
