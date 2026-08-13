"use client";

import React, { useState, useEffect } from "react";
import type { InvitationConfig } from "@data/invitations";
import type { TrueTheme } from "@theme/true-types";
import { PlusMemoriasIntro } from "./PlusMemoriasIntro";
import { PlusMemoriasChallengeGrid } from "./PlusMemoriasChallengeGrid";
import { PlusMemoriasProgress } from "./PlusMemoriasProgress";
import { PlusMemoriasLiveGallery } from "./PlusMemoriasLiveGallery";
import { PlusMemoriasCaptureModal } from "./PlusMemoriasCaptureModal";
import {
  PLUS_MEMORY_CHALLENGES,
  getCompletedChallenges,
  markChallengeCompleted,
  type MemoryChallenge,
} from "./plus-memorias-challenges";
import { PlusMemoriasToast } from "./PlusMemoriasToast";
import { PlusMemoriasFooter } from "./PlusMemoriasFooter";
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
  const [galleryRefreshTrigger, setGalleryRefreshTrigger] = useState(0);

  useEffect(() => {
    setCompletedIds(getCompletedChallenges(config.slug));

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
  }, [config.slug]);

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
    }
    setGalleryRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="plus-memorias-container min-h-screen pb-16">
      {/* Notificação Flutuante estilo iOS com Provocação Social */}
      <PlusMemoriasToast slug={config.slug} refreshTrigger={galleryRefreshTrigger} />

      <PlusMemoriasIntro tableId={tableId} />

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

      <PlusMemoriasCaptureModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        challenge={selectedChallenge}
        slug={config.slug}
        tableId={tableId}
        onSuccess={handleSuccess}
      />

      <PlusMemoriasFooter />
    </div>
  );
}
