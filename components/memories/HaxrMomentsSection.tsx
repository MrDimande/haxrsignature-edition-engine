"use client";

import React, { useState, useEffect } from "react";
import type { MomentsFeedResult, StageStoryGroup, MomentItem } from "@lib/memories/moments";
import { HaxrStoryViewer } from "./HaxrStoryViewer";
import { Play, Eye, Film, Image as ImageIcon, Camera } from "lucide-react";

interface HaxrMomentsSectionProps {
  slug: string;
  refreshTrigger?: number;
  onOpenCapture?: (stageId?: string) => void;
}

export function HaxrMomentsSection({
  slug,
  refreshTrigger = 0,
  onOpenCapture,
}: HaxrMomentsSectionProps) {
  const [feed, setFeed] = useState<MomentsFeedResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeStageSlug, setActiveStageSlug] = useState<string>("all");
  const [selectedStoryStage, setSelectedStoryStage] = useState<StageStoryGroup | null>(null);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;
    async function loadFeed() {
      try {
        setLoading(true);
        const res = await fetch(`/api/memories/moments?slug=${encodeURIComponent(slug)}`);
        if (!res.ok) {
          throw new Error("Não foi possível carregar os momentos.");
        }
        const json = await res.json();
        if (json.success && json.data && isMounted) {
          setFeed(json.data);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || "Erro de ligação.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadFeed();
    return () => {
      isMounted = false;
    };
  }, [slug, refreshTrigger]);

  const handleOpenStageStory = (stage: StageStoryGroup) => {
    if (stage.items.length === 0) {
      onOpenCapture?.(stage.id);
      return;
    }
    // Começar na primeira mídia não visualizada, ou na primeira
    const firstUnseenIdx = stage.items.findIndex((m) => !m.isSeen);
    setSelectedStoryIndex(firstUnseenIdx >= 0 ? firstUnseenIdx : 0);
    setSelectedStoryStage(stage);
  };

  const handleOpenMomentCard = (moment: MomentItem) => {
    // Encontrar o stage correspondente
    const targetStage = feed?.stages.find((s) => s.id === moment.stageId) || {
      id: "all",
      slug: "all",
      label: "Todos os Momentos",
      orderIndex: 0,
      isActive: true,
      totalCount: feed?.allMoments.length || 0,
      unseenCount: feed?.totalUnseen || 0,
      coverThumbnailUrl: moment.thumbnailUrl,
      items: feed?.allMoments || [],
    };

    const idx = targetStage.items.findIndex((m) => m.id === moment.id);
    setSelectedStoryIndex(idx >= 0 ? idx : 0);
    setSelectedStoryStage(targetStage);
  };

  const handleMediaSeen = (mediaId: string) => {
    setFeed((prev) => {
      if (!prev) return prev;
      const updatedMoments = prev.allMoments.map((m) =>
        m.id === mediaId ? { ...m, isSeen: true } : m
      );
      const updatedStages = prev.stages.map((s) => ({
        ...s,
        items: s.items.map((m) => (m.id === mediaId ? { ...m, isSeen: true } : m)),
        unseenCount: Math.max(0, s.unseenCount - 1),
      }));
      return {
        ...prev,
        allMoments: updatedMoments,
        stages: updatedStages,
        totalUnseen: Math.max(0, prev.totalUnseen - 1),
      };
    });
  };

  const filteredMoments = activeStageSlug === "all"
    ? feed?.allMoments || []
    : (feed?.allMoments || []).filter((m) => m.stageSlug === activeStageSlug);

  return (
    <div className="space-y-6">
      {/* 1. Barra Horizontal de Stories por Etapa (HAXR Moments Rings) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs uppercase tracking-widest font-serif text-[#7A2332]">
            Etapas do Evento
          </h3>
          {feed && feed.totalUnseen > 0 && (
            <span className="text-[10px] tracking-wider text-[#A37854] font-medium bg-[#FFF9F2] px-2 py-0.5 rounded-full border border-[#D4AF37]/30">
              {feed.totalUnseen} novas
            </span>
          )}
        </div>

        <div className="flex items-center gap-3.5 overflow-x-auto pb-2 pt-1 no-scrollbar -mx-4 px-4">
          {loading ? (
            <div className="flex gap-3">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="flex flex-col items-center gap-1.5 shrink-0">
                  <div className="w-16 h-16 rounded-full bg-neutral-200 animate-pulse" />
                  <div className="w-12 h-2.5 bg-neutral-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : feed?.stages.map((s) => {
            const hasUnseen = s.unseenCount > 0;
            const isEmpty = s.totalCount === 0;

            return (
              <button
                key={s.id}
                type="button"
                onClick={() => handleOpenStageStory(s)}
                className="group flex flex-col items-center gap-1.5 shrink-0 transition-transform active:scale-95 focus:outline-none"
              >
                {/* Anel de Alta Joalharia HAXR */}
                <div
                  className={`relative w-16 h-16 rounded-full p-[2.5px] transition-all duration-300 ${
                    hasUnseen
                      ? "bg-gradient-to-tr from-[#D4AF37] via-[#F5E6C8] to-[#996515] shadow-sm"
                      : isEmpty
                      ? "border border-dashed border-neutral-300 bg-neutral-50"
                      : "border border-[#8E8E93]/40 bg-neutral-100"
                  }`}
                >
                  <div className="w-full h-full rounded-full overflow-hidden bg-neutral-900 border-2 border-white flex items-center justify-center">
                    {s.coverThumbnailUrl ? (
                      <img
                        src={s.coverThumbnailUrl}
                        alt={s.label}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#FAF7F2] flex flex-col items-center justify-center text-[#7A2332]/60">
                        <Camera className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  {/* Badge de contagem de mídia */}
                  {s.totalCount > 0 && (
                    <span className="absolute -bottom-1 -right-0.5 bg-[#7A2332] text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full shadow-xs border border-white">
                      {s.totalCount}
                    </span>
                  )}
                </div>

                <span className="text-[11px] font-serif tracking-tight text-[#171312] max-w-[70px] truncate text-center leading-tight">
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Filtro por Etapa */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveStageSlug("all")}
          className={`px-3 py-1 rounded-full text-xs font-serif tracking-wide transition-all ${
            activeStageSlug === "all"
              ? "bg-[#7A2332] text-white shadow-xs"
              : "bg-[#FFF9F2] text-[#7A2332] border border-[#D4AF37]/30 hover:border-[#7A2332]/50"
          }`}
        >
          Todos ({feed?.totalMoments || 0})
        </button>

        {feed?.stages.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActiveStageSlug(s.slug)}
            className={`px-3 py-1 rounded-full text-xs font-serif tracking-wide whitespace-nowrap transition-all ${
              activeStageSlug === s.slug
                ? "bg-[#7A2332] text-white shadow-xs"
                : "bg-[#FFF9F2] text-[#7A2332] border border-[#D4AF37]/30 hover:border-[#7A2332]/50"
            }`}
          >
            {s.label} ({s.totalCount})
          </button>
        ))}
      </div>

      {/* 3. Grelha Editorial de Momentos */}
      {filteredMoments.length === 0 && !loading ? (
        <div className="text-center py-12 px-4 rounded-xl border border-dashed border-[#D4AF37]/40 bg-[#FFF9F2]/60 space-y-3">
          <p className="text-sm font-serif text-[#7A2332]">
            Ainda sem memórias registadas para esta etapa.
          </p>
          <p className="text-xs text-neutral-500 max-w-xs mx-auto">
            Seja o primeiro a partilhar uma fotografia ou vídeo da celebração!
          </p>
          {onOpenCapture && (
            <button
              type="button"
              onClick={() => onOpenCapture(feed?.stages.find((s) => s.slug === activeStageSlug)?.id)}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#7A2332] text-white text-xs font-serif tracking-wide hover:bg-[#5E1B27] transition-colors shadow-xs"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Registar Momento</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filteredMoments.map((moment) => (
            <div
              key={moment.id}
              onClick={() => handleOpenMomentCard(moment)}
              className="group relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer bg-neutral-900 border border-black/5 shadow-xs transition-transform active:scale-[0.98]"
            >
              <img
                src={moment.thumbnailUrl}
                alt={moment.caption || moment.stageLabel || "Momento HAXR"}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />

              {/* Gradiente de protecção */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 opacity-80 group-hover:opacity-90 transition-opacity" />

              {/* Indicador de Vídeo */}
              {moment.mediaType === "video" && (
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-xs text-white p-1 rounded-full text-[10px] flex items-center gap-1 px-1.5">
                  <Play className="w-2.5 h-2.5 fill-current" />
                  {moment.durationSeconds && (
                    <span>{Math.round(moment.durationSeconds)}s</span>
                  )}
                </div>
              )}

              {/* Indicador de Unseen */}
              {!moment.isSeen && (
                <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-[#D4AF37] ring-2 ring-black/40" />
              )}

              {/* Rodapé do Cartão */}
              <div className="absolute bottom-0 inset-x-0 p-2.5 space-y-0.5 text-white">
                <span className="text-[9px] uppercase tracking-wider text-[#D4AF37] font-serif block">
                  {moment.stageLabel}
                </span>
                {moment.caption && (
                  <p className="text-xs font-light text-white/95 line-clamp-1 leading-tight">
                    {moment.caption}
                  </p>
                )}
                <span className="text-[10px] text-white/60 block">
                  {moment.guestName || "Convidado"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. Fullscreen 9:16 Story Viewer Modal */}
      {selectedStoryStage && (
        <HaxrStoryViewer
          stage={selectedStoryStage}
          initialIndex={selectedStoryIndex}
          slug={slug}
          onClose={() => setSelectedStoryStage(null)}
          onMediaSeen={handleMediaSeen}
          onNextStage={() => {
            if (!feed) return;
            const currentStageIdx = feed.stages.findIndex((s) => s.id === selectedStoryStage.id);
            if (currentStageIdx >= 0 && currentStageIdx < feed.stages.length - 1) {
              const nextStage = feed.stages[currentStageIdx + 1];
              if (nextStage.items.length > 0) {
                setSelectedStoryStage(nextStage);
                setSelectedStoryIndex(0);
                return;
              }
            }
            setSelectedStoryStage(null);
          }}
          onPrevStage={() => {
            if (!feed) return;
            const currentStageIdx = feed.stages.findIndex((s) => s.id === selectedStoryStage.id);
            if (currentStageIdx > 0) {
              const prevStage = feed.stages[currentStageIdx - 1];
              if (prevStage.items.length > 0) {
                setSelectedStoryStage(prevStage);
                setSelectedStoryIndex(Math.max(0, prevStage.items.length - 1));
                return;
              }
            }
          }}
        />
      )}
    </div>
  );
}
