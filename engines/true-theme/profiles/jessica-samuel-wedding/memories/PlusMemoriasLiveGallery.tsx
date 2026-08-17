"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, X, Camera, User, Download, Share2 } from "lucide-react";
import {
  filterMemoriesByPhase,
  type PublicMemoryItem,
} from "@lib/memories/gallery";
import type { MemoriesEventConfig } from "@lib/memories/config";
import { PLUS_MEMORY_CHALLENGES, getTableLabel } from "./plus-memorias-challenges";

interface PlusMemoriasLiveGalleryProps {
  config: MemoriesEventConfig;
  refreshTrigger?: number;
}

export function PlusMemoriasLiveGallery({ config, refreshTrigger = 0 }: PlusMemoriasLiveGalleryProps) {
  const [memories, setMemories] = useState<PublicMemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhaseFilter, setSelectedPhaseFilter] = useState<string | null>(null);
  const [activeLightboxItem, setActiveLightboxItem] = useState<PublicMemoryItem | null>(null);
  const [downloading, setDownloading] = useState(false);

  const fetchMemories = useCallback(async () => {
    try {
      const res = await fetch(`/api/memories?slug=${encodeURIComponent(config.eventSlug)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.memories)) {
        setMemories(data.memories);
      }
    } catch (e) {
      console.error("Error fetching live memories:", e);
    } finally {
      setLoading(false);
    }
  }, [config.eventSlug]);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories, refreshTrigger]);

  const handleDownload = async (item: PublicMemoryItem) => {
    try {
      setDownloading(true);
      const response = await fetch(item.signedUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const ext = item.kind === "video" ? "mp4" : "jpg";
      const tableStr = item.tableId ? `mesa-${item.tableId}` : "evento";
      const filename = `plus-memories-${config.eventSlug}-${tableStr}.${ext}`;

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download error:", error);
      window.open(item.signedUrl, "_blank");
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async (item: PublicMemoryItem) => {
    const title = `Plus Memories · ${config.displayName}`;
    const text = item.caption
      ? `"${item.caption}" — Plus Memories`
      : `Veja esta memória de ${config.displayName}`;
    const url = item.signedUrl;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // Utilizador cancelou a partilha nativa
      }
    }

    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${text}\n${url}`)}`;
    window.open(whatsappUrl, "_blank");
  };

  const filteredMemories = useMemo(
    () => filterMemoriesByPhase(memories, selectedPhaseFilter),
    [memories, selectedPhaseFilter]
  );

  return (
    <section className="px-4 sm:px-6 max-w-5xl mx-auto my-12">
      {/* Header da Galeria */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 pb-4 border-b border-[#C9939B]/25 text-center sm:text-left">
        <div>
          <span className="font-display text-[10px] tracking-[0.28em] uppercase text-[#7A2332] font-medium">
            Mural Vivo
          </span>
          <h2 className="font-display text-2xl sm:text-3xl text-[#171312] font-light">
            Álbum Colectivo
          </h2>
        </div>

        <div className="flex items-center gap-2 bg-[#FFF9F2] px-4 py-2 rounded-full border border-[#C9939B]/25 shadow-xs">
          <Camera className="w-4 h-4 text-[#7A2332]" />
          <span className="font-display text-xs font-medium text-[#171312]">
            {memories.length} {memories.length === 1 ? "memória captada" : "memórias captadas"}
          </span>
        </div>
      </div>

      {/* Filtros editoriais por capítulo da celebração */}
      {memories.length > 0 && config.phases.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedPhaseFilter(null)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-display tracking-wider uppercase shrink-0 transition-all ${
              selectedPhaseFilter === null
                ? "bg-[#7A2332] text-[#FFF9F2] shadow-xs"
                : "bg-[#FFF9F2] text-[#171312]/60 border border-[#C9939B]/25 hover:border-[#7A2332]"
            }`}
          >
            Todos ({memories.length})
          </button>

          {config.phases.map((phase) => {
            const count = memories.filter((memory) => memory.phaseId === phase.id).length;

            return (
              <button
                type="button"
                key={phase.id}
                onClick={() => setSelectedPhaseFilter(phase.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-display tracking-wider uppercase shrink-0 transition-all flex items-center gap-1.5 ${
                  selectedPhaseFilter === phase.id
                    ? "bg-[#7A2332] text-[#FFF9F2] shadow-xs"
                    : "bg-[#FFF9F2] text-[#171312]/60 border border-[#C9939B]/25 hover:border-[#7A2332]"
                }`}
              >
                <span>{phase.label}</span>
                <span className="opacity-60">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Conteúdo da Galeria — Composição Editorial com Variação Natural de Proporções */}
      {loading ? (
        <div className="columns-2 sm:columns-3 md:columns-4 gap-3.5 space-y-3.5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className={`w-full bg-[#C9939B]/10 rounded-xl animate-pulse border border-[#C9939B]/15 ${
                i % 3 === 0 ? "aspect-[3/4]" : i % 2 === 0 ? "aspect-[4/3]" : "aspect-square"
              }`}
            />
          ))}
        </div>
      ) : filteredMemories.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-14 px-6 text-center bg-[#FFF9F2] rounded-xl border border-[#C9939B]/20"
        >
          <div className="w-11 h-11 rounded-full bg-[#7A2332]/8 flex items-center justify-center mx-auto mb-3">
            <Camera className="w-5 h-5 text-[#7A2332] opacity-70" />
          </div>
          <p className="font-display text-base text-[#171312] font-medium mb-1 tracking-wide">
            O álbum ainda não tem memórias neste capítulo
          </p>
          <p className="font-body text-xs text-[#171312]/60 max-w-sm mx-auto">
            Seja o primeiro a registar um momento e a inaugurar esta secção!
          </p>
        </motion.div>
      ) : (
        <div className="columns-2 sm:columns-3 md:columns-4 gap-3.5 space-y-3.5">
          {filteredMemories.map((item, idx) => {
            const challenge = PLUS_MEMORY_CHALLENGES.find((c) => c.id === item.challengeId);
            const tableLbl = getTableLabel(item.tableId);
            const phase = config.phases.find((entry) => entry.id === item.phaseId);

            // Ritmo Editorial: Alternar proporção natural (Portrait 3:4, Landscape 4:3, Square 1:1)
            const aspectClass = idx % 5 === 0 || idx % 5 === 3
              ? "aspect-[3/4]"
              : idx % 5 === 1
                ? "aspect-[4/3]"
                : "aspect-square";

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.35,
                  delay: Math.min(idx * 0.025, 0.25),
                  ease: "easeOut",
                }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveLightboxItem(item)}
                className={`break-inside-avoid group relative w-full ${aspectClass} rounded-xl overflow-hidden cursor-pointer bg-[#171312]/5 border border-[#C9939B]/20 hover:border-[#7A2332]/40 transition-colors duration-200`}
              >
                {item.kind === "image" ? (
                  <img
                    src={item.signedUrl}
                    alt={item.caption || "Memória do Casamento"}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                    loading="lazy"
                  />
                ) : (
                  <div className="relative w-full h-full bg-black flex items-center justify-center">
                    <video
                      src={item.signedUrl}
                      className="w-full h-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-103"
                      muted
                      playsInline
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-white/90 text-[#7A2332] flex items-center justify-center shadow-md">
                        <Play className="w-4 h-4 ml-0.5 fill-current" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Legenda discreta — a fotografia é a protagonista */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-75 group-hover:opacity-90 transition-opacity duration-200 p-3 flex flex-col justify-between">
                  <div className="flex justify-end">
                    {tableLbl && (
                      <span className="text-[9px] font-display font-medium tracking-wider text-white bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-xs">
                        {tableLbl}
                      </span>
                    )}
                  </div>

                  <div className="space-y-0.5">
                    {phase && (
                      <p className="text-[9px] font-display uppercase tracking-widest text-white/80 font-medium truncate">
                        {phase.label}
                      </p>
                    )}
                    {challenge && (
                      <p className="text-[9px] font-display uppercase tracking-widest text-[#C9939B] font-medium truncate">
                        #{challenge.number} {challenge.title}
                      </p>
                    )}
                    {item.guestName && (
                      <p className="text-[10px] font-body text-white/90 truncate flex items-center gap-1 font-light">
                        <User className="w-2.5 h-2.5 shrink-0 opacity-80" />
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

      {/* Lightbox Minimalista & Editorial (Otimizado para Safari iOS) */}
      <AnimatePresence>
        {activeLightboxItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#0F0D0D]/95 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative max-w-4xl w-full max-h-[92vh] flex flex-col items-center justify-center"
            >
              {/* Botão Fechar Minimalista — sem animação decorativa de rotação */}
              <button
                type="button"
                onClick={() => setActiveLightboxItem(null)}
                className="absolute -top-11 right-0 p-2 text-white/80 hover:text-white bg-white/10 rounded-full transition-colors"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Display da Fotografia / Vídeo */}
              <div className="w-full rounded-2xl overflow-hidden bg-black flex items-center justify-center max-h-[72vh] border border-white/10">
                {activeLightboxItem.kind === "image" ? (
                  <img
                    src={activeLightboxItem.signedUrl}
                    alt={activeLightboxItem.caption || "Fotografia do Casamento"}
                    className="max-h-[72vh] w-auto max-w-full object-contain select-none"
                  />
                ) : (
                  <video
                    src={activeLightboxItem.signedUrl}
                    controls
                    autoPlay
                    playsInline
                    className="max-h-[72vh] w-full object-contain"
                  />
                )}
              </div>

              {/* Informação Editorial da Fotografia */}
              <div className="w-full mt-3 p-4 rounded-xl bg-white/10 text-white text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4 border border-white/10">
                <div className="space-y-1 max-w-lg">
                  {activeLightboxItem.challengeId && (
                    <p className="text-[10px] font-display uppercase tracking-[0.2em] text-[#C9939B] font-medium">
                      Desafio #{activeLightboxItem.challengeId}
                    </p>
                  )}
                  {activeLightboxItem.caption && (
                    <p className="font-display italic text-sm text-white/90 leading-snug">
                      &ldquo;{activeLightboxItem.caption}&rdquo;
                    </p>
                  )}
                  {activeLightboxItem.guestName && (
                    <p className="font-body text-xs text-white/75 flex items-center justify-center sm:justify-start gap-1 font-light">
                      <User className="w-3 h-3 text-[#C9939B]" />
                      Partilhado por: <span className="font-medium text-white">{activeLightboxItem.guestName}</span>
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2.5 shrink-0 pt-1 sm:pt-0">
                  {activeLightboxItem.tableId && (
                    <span className="text-xs font-display tracking-widest uppercase px-3 py-1.5 bg-[#7A2332] text-white rounded-full font-medium shadow-xs">
                      {getTableLabel(activeLightboxItem.tableId)}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDownload(activeLightboxItem)}
                    disabled={downloading}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-display tracking-wider uppercase transition-all disabled:opacity-50 border border-white/20"
                    title="Guardar"
                  >
                    <Download className="w-3.5 h-3.5 text-[#C9939B]" />
                    <span>{downloading ? "A guardar..." : "Guardar"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleShare(activeLightboxItem)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#7A2332] hover:bg-[#5A1825] text-white text-xs font-display tracking-wider uppercase transition-all shadow-xs"
                    title="Partilhar"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Partilhar</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}


