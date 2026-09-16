"use client";

import React, { useState, useEffect } from "react";
import type { RecapNarrativePayload, RecapMediaItem } from "@lib/memories/recap-policy";
import { RecapHeroSection } from "./RecapHeroSection";
import { RecapStorySection } from "./RecapStorySection";
import { RecapMomentsSection } from "./RecapMomentsSection";
import { RecapMissionsSection } from "./RecapMissionsSection";
import { RecapExplorersSection } from "./RecapExplorersSection";
import { RecapFavoritesSection } from "./RecapFavoritesSection";
import { RecapSocialSection } from "./RecapSocialSection";
import { RecapClosingSection } from "./RecapClosingSection";
import { RecapMediaLightbox } from "./RecapMediaLightbox";
import { Lock, RefreshCw, Film } from "lucide-react";

interface RecapExperienceViewProps {
  slug: string;
  initialPayload?: RecapNarrativePayload | null;
}

export function RecapExperienceView({ slug, initialPayload }: RecapExperienceViewProps) {
  const [data, setData] = useState<RecapNarrativePayload | null>(initialPayload || null);
  const [loading, setLoading] = useState(!initialPayload);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  // Lightbox state
  const [lightboxItems, setLightboxItems] = useState<RecapMediaItem[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number>(-1);

  useEffect(() => {
    if (initialPayload) return;

    let isMounted = true;
    async function fetchRecap() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/memories/recap?slug=${encodeURIComponent(slug)}`);
        const json = await res.json();
        if (!isMounted) return;

        if (json.success && json.data) {
          setData(json.data);
        } else {
          setError(json.error || "Não foi possível carregar o Recap.");
          setErrorCode(json.code || "LOAD_FAILED");
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.error("[RecapExperienceView] Erro:", err);
        setError("Erro de rede ao ligar ao servidor de memórias.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchRecap();
    return () => {
      isMounted = false;
    };
  }, [slug, initialPayload]);

  const handleOpenMedia = (item: RecapMediaItem, list?: RecapMediaItem[]) => {
    const activeList = list && list.length > 0 ? list : [item];
    const idx = activeList.findIndex((m) => m.id === item.id);
    setLightboxItems(activeList);
    setLightboxIndex(idx >= 0 ? idx : 0);
  };

  const handleCloseLightbox = () => {
    setLightboxIndex(-1);
    setLightboxItems([]);
  };

  // 1. Estado de Carregamento
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-[#FAF8F5] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full border-2 border-[#D4AF37]/30 border-t-[#D4AF37] animate-spin mb-4" />
        <span className="text-xs font-serif text-[#D4AF37] tracking-widest uppercase">
          A carregar a narrativa da celebração...
        </span>
      </div>
    );
  }

  // 2. Estado de Erro ou Acesso Restrito
  if (error || !data) {
    const isRestricted = errorCode === "ACCESS_DENIED";

    return (
      <div className="min-h-screen bg-black text-[#FAF8F5] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full p-8 rounded-sm bg-[#111111] border border-[#D4AF37]/20 shadow-2xl">
          {isRestricted ? (
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
              <Lock className="w-6 h-6" />
            </div>
          ) : (
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#FAF8F5]/60">
              <Film className="w-6 h-6" />
            </div>
          )}

          <h2 className="text-xl sm:text-2xl font-serif text-[#FAF8F5] mb-3">
            {isRestricted ? "Acesso Restrito ao Recap" : "Memória em Preparação"}
          </h2>

          <p className="text-xs sm:text-sm text-[#FAF8F5]/70 font-serif italic mb-6 leading-relaxed">
            {error || "O Recap desta celebração ainda não se encontra publicado."}
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-serif hover:bg-[#D4AF37]/30 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Tentar Novamente</span>
          </button>
        </div>
      </div>
    );
  }

  // 3. Renderização Completa da Narrativa Editorial
  return (
    <main className="min-h-screen bg-black text-[#FAF8F5] font-sans antialiased selection:bg-[#D4AF37]/30 selection:text-white">
      {/* 1. Abertura & Hero */}
      <RecapHeroSection
        title={data.publication.title}
        welcomeMessage={data.publication.welcomeMessage}
        heroMedia={data.hero}
        onOpenMedia={(item) => handleOpenMedia(item, data.hero ? [data.hero] : [])}
      />

      {/* 2. O Nosso Dia (Cronologia por Stages) */}
      <RecapStorySection
        stages={data.story}
        onOpenMedia={handleOpenMedia}
      />

      {/* 3. Momentos Inesquecíveis */}
      <RecapMomentsSection
        items={data.moments}
        onOpenMedia={handleOpenMedia}
      />

      {/* 4. Eu Espio (Missões dos Convidados) */}
      <RecapMissionsSection
        missions={data.missions}
        onOpenMedia={handleOpenMedia}
      />

      {/* 5. Quadro de Honra dos Exploradores */}
      <RecapExplorersSection
        explorers={data.explorers}
      />

      {/* 6. Os Seus Favoritos Guardados (Exclusivo Privado) */}
      <RecapFavoritesSection
        favorites={data.favorites}
        onOpenMedia={handleOpenMedia}
      />

      {/* 7. Pulso Colectivo & Reacções */}
      <RecapSocialSection
        totalPhotos={data.social.totalPhotos}
        totalReactions={data.social.totalReactions}
        reactionAggregates={data.social.reactionAggregates}
        comments={data.social.recentComments}
      />

      {/* 8. Encerramento & Assinatura */}
      <RecapClosingSection
        closingMessage={data.closing.message}
        signOffDate={data.closing.signOffDate}
      />

      {/* Modal Lightbox */}
      {lightboxIndex >= 0 && (
        <RecapMediaLightbox
          items={lightboxItems}
          initialIndex={lightboxIndex}
          onClose={handleCloseLightbox}
        />
      )}
    </main>
  );
}
