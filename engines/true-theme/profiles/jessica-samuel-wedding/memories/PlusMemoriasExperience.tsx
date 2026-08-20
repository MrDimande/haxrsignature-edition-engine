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
import { Trophy, Edit3 } from "lucide-react";
import "./plus-memorias.css";

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

    // 3. Processar fila offline
    const handleRetry = async () => {
      const { processOfflineQueue } = await import("./plus-memorias-offline-queue");
      const { uploadPlusMemory } = await import("./plus-memorias-upload");
      const count = await processOfflineQueue(async (item) => {
        const file = new File([item.blob], item.fileName, { type: item.contentType });
        const res = await uploadPlusMemory({
          slug: item.slug,
          file,
          challengeId: item.challengeId,
          tableId: item.tableId,
          guestName: item.guestName,
          caption: item.caption,
          participantId: item.participantId,
        });
        return { success: res.success };
      });
      if (count > 0) {
        setGalleryRefreshTrigger((prev) => prev + 1);
      }
    };

    handleRetry();
    window.addEventListener("online", handleRetry);
    return () => window.removeEventListener("online", handleRetry);
  }, [config.slug, competitionEnabled]);

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

          {/* Grelha dos 12 Desafios revelada após a escolha */}
          <PlusMemoriasChallengeGrid
            completedIds={completedIds}
            onSelectChallenge={handleSelectChallenge}
          />

          <PlusMemoriasProgress
            completedCount={completedIds.length}
            totalCount={PLUS_MEMORY_CHALLENGES.length}
            onOpenFreeMoment={handleOpenFreeMoment}
          />

          {/* Galeria Viva / Álbum Colectivo */}
          <PlusMemoriasLiveGallery
            slug={config.slug}
            refreshTrigger={galleryRefreshTrigger}
          />
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

      <PlusMemoriasFooter />
    </div>
  );
}
