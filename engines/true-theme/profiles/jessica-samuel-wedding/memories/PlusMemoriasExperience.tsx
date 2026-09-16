"use client";

import React, { useState, useEffect } from "react";
import type { InvitationConfig } from "@data/invitations";
import type { TrueTheme } from "@theme/true-types";
import { PlusMemoriasIntro } from "./PlusMemoriasIntro";
import { PlusMemoriasChallengeGrid } from "./PlusMemoriasChallengeGrid";
import { PlusMemoriasProgress } from "./PlusMemoriasProgress";
import { PlusMemoriasLiveGallery } from "./PlusMemoriasLiveGallery";
import { PlusMemoriasCaptureModal } from "./PlusMemoriasCaptureModal";
import { PlusMemoriasCompetitionOptIn } from "./PlusMemoriasCompetitionOptIn";
import { PlusMemoriasCompletionModal } from "./PlusMemoriasCompletionModal";
import { PlusMemoriasExplorers } from "./PlusMemoriasExplorers";
import { PlusMemoriasUploadBadge } from "./PlusMemoriasUploadBadge";
import { HaxrMomentsSection } from "@components/memories/HaxrMomentsSection";
import {
  PLUS_MEMORY_CHALLENGES,
  getCompletedChallenges,
  markChallengeCompleted,
  replaceCompletedChallenges,
  type MemoryChallenge,
} from "./plus-memorias-challenges";
import {
  getOrCreateParticipantId,
  getCompetitionOptInStatus,
  getParticipantName,
  type OptInStatus,
} from "./plus-memorias-identity";
import { PlusMemoriasToast } from "./PlusMemoriasToast";
import { PlusMemoriasFooter } from "./PlusMemoriasFooter";
import { Trophy, Edit3, Film, Eye, Image as ImageIcon, Users } from "lucide-react";
import "./plus-memorias.css";

export type MemoriesNavTab = "moments" | "challenges" | "album" | "explorers";

interface PlusMemoriasExperienceProps {
  config: InvitationConfig;
  theme: TrueTheme;
  tableId?: string;
}

export function PlusMemoriasExperience({
  config,
  theme,
  tableId,
}: PlusMemoriasExperienceProps) {
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<MemoryChallenge | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [galleryRefreshTrigger, setGalleryRefreshTrigger] = useState(0);

  const competitionEnabled = Boolean(config.features?.memories?.competition?.enabled);

  const [participantId, setParticipantId] = useState<string>("");
  const [optInStatus, setOptInStatus] = useState<OptInStatus>("undecided");
  const [participantName, setParticipantNameState] = useState<string>("");
  const [isEditingOptIn, setIsEditingOptIn] = useState(false);
  const [activeTab, setActiveTab] = useState<MemoriesNavTab>("moments");

  useEffect(() => {
    // 1. Inicializar IDs concluídos do localStorage
    const localCompleted = getCompletedChallenges(config.slug);
    setCompletedIds(localCompleted);

    // 2. Inicializar participante & opt-in status se competição activa
    if (competitionEnabled) {
      const pId = getOrCreateParticipantId(config.slug);
      setParticipantId(pId);
      const status = getCompetitionOptInStatus(config.slug);
      setOptInStatus(status);
      setParticipantNameState(getParticipantName(config.slug) || "");

      // Directiva #6: Reconciliar progresso do servidor com o localStorage no arranque
      if (pId) {
        fetch(`/api/memories/progress?slug=${encodeURIComponent(config.slug)}&participantId=${encodeURIComponent(pId)}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.success && Array.isArray(data.completedChallengeIds)) {
              const serverCompleted = replaceCompletedChallenges(
                config.slug,
                data.completedChallengeIds
              );
              setCompletedIds(serverCompleted);
            }
          })
          .catch((err) => {
            console.warn("Failed to reconcile progress with server:", err);
          });
      }
    }

    // 3. Processar fila offline persistente (Fase 6)
    const handleRetry = async () => {
      const { processUploadQueue } = await import("@lib/memories/upload-queue");
      const currentPartId = optInStatus === "opted_in" ? participantId : undefined;
      const res = await processUploadQueue({
        slug: config.slug,
        currentParticipantId: currentPartId,
      });
      if (res.succeeded > 0) {
        setGalleryRefreshTrigger((prev) => prev + 1);
      }
    };

    handleRetry();
    window.addEventListener("online", handleRetry);
    return () => window.removeEventListener("online", handleRetry);
  }, [config.slug, competitionEnabled, optInStatus, participantId]);

  const handleSelectChallenge = (challenge: MemoryChallenge) => {
    setSelectedChallenge(challenge);
    setIsModalOpen(true);
  };

  const handleOpenFreeMoment = () => {
    setSelectedChallenge(null);
    setIsModalOpen(true);
  };

  const handleSuccess = (challengeId?: string) => {
    if (challengeId) {
      const updated = markChallengeCompleted(config.slug, challengeId);
      setCompletedIds(updated);

      // Directiva 21 & 34: Ao completar todos os 12 desafios, apresentar modal emocional
      if (updated.length >= PLUS_MEMORY_CHALLENGES.length) {
        setTimeout(() => {
          setIsCompletionModalOpen(true);
        }, 600);
      }
    }
    setGalleryRefreshTrigger((prev) => prev + 1);
  };

  // Se a competição está activa e o utilizador ainda não tomou uma decisão (ou está a editar):
  const showOptInScreen = competitionEnabled && (optInStatus === "undecided" || isEditingOptIn);

  return (
    <div className="plus-memorias-container min-h-screen pb-16">
      {/* Notificação Flutuante estilo iOS com Provocação Social */}
      <PlusMemoriasToast slug={config.slug} refreshTrigger={galleryRefreshTrigger} />

      <PlusMemoriasIntro tableId={tableId} />

      {/* UX Gate: O convidado vê a tela de decisão IMEDIATAMENTE após o scan do QR Code */}
      {showOptInScreen ? (
        <PlusMemoriasCompetitionOptIn
          slug={config.slug}
          onOptInSuccess={(name) => {
            setOptInStatus("opted_in");
            setParticipantNameState(name);
            setIsEditingOptIn(false);
          }}
          onOptOut={() => {
            setOptInStatus("opted_out");
            setIsEditingOptIn(false);
          }}
        />
      ) : (
        <>
          {/* Badge discreto informando o estado da participação quando opt-in escolhido */}
          {competitionEnabled && optInStatus === "opted_in" && participantName && (
            <div className="max-w-md mx-auto my-3 px-4">
              <div className="bg-[#FFF9F2] border border-[#C9939B]/30 rounded-lg px-4 py-2 flex items-center justify-between shadow-xs text-xs">
                <div className="flex items-center gap-2 text-[#171312]">
                  <Trophy className="w-4 h-4 text-[#7A2332]" />
                  <span>
                    A competir como: <strong className="font-semibold text-[#7A2332]">{participantName}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingOptIn(true)}
                  className="text-[10px] text-[#7A2332] hover:underline flex items-center gap-1 font-display tracking-wider uppercase"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Editar</span>
                </button>
              </div>
            </div>
          )}

          {/* Navegação Principal de 4 Abas: Momentos | Eu Espio | Álbum | Exploradores */}
          <div className="max-w-md mx-auto px-4 mb-6 sticky top-2 z-30">
            <div className="bg-[#FFF9F2]/95 backdrop-blur-md border border-[#D4AF37]/30 rounded-2xl p-1 flex items-center justify-between shadow-sm">
              <button
                type="button"
                onClick={() => setActiveTab("moments")}
                className={`flex-1 py-2 px-1 rounded-xl text-xs font-serif tracking-wide transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
                  activeTab === "moments"
                    ? "bg-[#7A2332] text-white shadow-xs font-medium"
                    : "text-neutral-600 hover:text-[#7A2332]"
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>Momentos</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("challenges")}
                className={`flex-1 py-2 px-1 rounded-xl text-xs font-serif tracking-wide transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
                  activeTab === "challenges"
                    ? "bg-[#7A2332] text-white shadow-xs font-medium"
                    : "text-neutral-600 hover:text-[#7A2332]"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Eu Espio</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("album")}
                className={`flex-1 py-2 px-1 rounded-xl text-xs font-serif tracking-wide transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
                  activeTab === "album"
                    ? "bg-[#7A2332] text-white shadow-xs font-medium"
                    : "text-neutral-600 hover:text-[#7A2332]"
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Álbum</span>
              </button>

              {competitionEnabled && (
                <button
                  type="button"
                  onClick={() => setActiveTab("explorers")}
                  className={`flex-1 py-2 px-1 rounded-xl text-xs font-serif tracking-wide transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
                    activeTab === "explorers"
                      ? "bg-[#7A2332] text-white shadow-xs font-medium"
                      : "text-neutral-600 hover:text-[#7A2332]"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Exploradores</span>
                </button>
              )}
            </div>
          </div>

          {/* Conteúdo da Aba Activa */}
          {activeTab === "moments" && (
            <div className="max-w-md mx-auto px-4">
              <HaxrMomentsSection
                slug={config.slug}
                refreshTrigger={galleryRefreshTrigger}
                onOpenCapture={() => handleOpenFreeMoment()}
              />
            </div>
          )}

          {activeTab === "challenges" && (
            <>
              {/* Grelha dos 12 Desafios / Missões revelada após a escolha */}
              <PlusMemoriasChallengeGrid
                slug={config.slug}
                tableId={tableId}
                completedIds={completedIds}
                onSelectChallenge={handleSelectChallenge}
              />

              <PlusMemoriasProgress
                completedCount={completedIds.length}
                totalCount={PLUS_MEMORY_CHALLENGES.length}
                onOpenFreeMoment={handleOpenFreeMoment}
              />
            </>
          )}

          {activeTab === "album" && (
            /* Galeria Viva / Álbum Colectivo */
            <PlusMemoriasLiveGallery
              slug={config.slug}
              refreshTrigger={galleryRefreshTrigger}
            />
          )}

          {activeTab === "explorers" && competitionEnabled && (
            /* Classificação de Exploradores */
            <PlusMemoriasExplorers
              slug={config.slug}
              refreshTrigger={galleryRefreshTrigger}
            />
          )}
        </>
      )}

      <PlusMemoriasCaptureModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        challenge={selectedChallenge}
        slug={config.slug}
        tableId={tableId}
        participantId={optInStatus === "opted_in" ? participantId : undefined}
        onSuccess={handleSuccess}
      />

      {/* Modal de Conclusão dos 12 Desafios */}
      <PlusMemoriasCompletionModal
        isOpen={isCompletionModalOpen}
        onClose={() => setIsCompletionModalOpen(false)}
      />

      {/* Badge de Resiliência Offline e Estado de Uploads (Fase 6) */}
      <PlusMemoriasUploadBadge
        slug={config.slug}
        participantId={optInStatus === "opted_in" ? participantId : undefined}
      />

      <PlusMemoriasFooter />
    </div>
  );
}
