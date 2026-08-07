"use client";

import React, { useState, useEffect } from "react";
import type { InvitationConfig } from "@data/invitations";
import type { TrueTheme } from "@theme/true-types";
import { MemoriasIntro } from "./MemoriasIntro";
import { MemoriasChallengeGrid } from "./MemoriasChallengeGrid";
import { MemoriasProgress } from "./MemoriasProgress";
import { MemoriasCaptureModal } from "./MemoriasCaptureModal";
import {
  MEMORY_CHALLENGES,
  getCompletedChallenges,
  markChallengeCompleted,
  type MemoryChallenge,
} from "./memorias-challenges";
import "./memorias.css";

interface MemoriasExperienceProps {
  config: InvitationConfig;
  theme: TrueTheme;
  tableId?: string;
}

export function MemoriasExperience({
  config,
  theme,
  tableId,
}: MemoriasExperienceProps) {
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<MemoryChallenge | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setCompletedIds(getCompletedChallenges());
  }, []);

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
      const updated = markChallengeCompleted(challengeId);
      setCompletedIds(updated);
    }
  };

  return (
    <div className="memorias-container min-h-screen pb-16">
      <MemoriasIntro tableId={tableId} />

      <MemoriasChallengeGrid
        completedIds={completedIds}
        onSelectChallenge={handleSelectChallenge}
      />

      <MemoriasProgress
        completedCount={completedIds.length}
        totalCount={MEMORY_CHALLENGES.length}
        onOpenFreeMoment={handleOpenFreeMoment}
      />

      <MemoriasCaptureModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        challenge={selectedChallenge}
        slug={config.slug}
        tableId={tableId}
        onSuccess={handleSuccess}
      />

      <footer className="text-center pt-8 pb-4 text-[10px] tracking-[0.2em] uppercase text-[#4A3020]/50 border-t border-[#C9A227]/20 max-w-xl mx-auto px-4">
        {config.metadata.title} · Memórias do Nosso Dia
      </footer>
    </div>
  );
}
