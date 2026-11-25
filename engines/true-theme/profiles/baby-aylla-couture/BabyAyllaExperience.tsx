"use client";

import React, { useState, useEffect, useRef } from "react";
import "./baby-aylla.css";
import { useExperience } from "../../context";
import { BabyAyllaAudioControl } from "./BabyAyllaAudioControl";

import { BabyAyllaCoverGate } from "./BabyAyllaCoverGate";
import { BabyAyllaAmbient } from "./BabyAyllaAmbient";
import { BabyAyllaHero } from "./BabyAyllaHero";
import { BabyAyllaLetter } from "./BabyAyllaLetter";
import { BabyAyllaStory } from "./BabyAyllaStory";
import { BabyAyllaSaveTheDate } from "./BabyAyllaSaveTheDate";
import { BabyAyllaDetails } from "./BabyAyllaDetails";
import { BabyAyllaDressCode } from "./BabyAyllaDressCode";
import { BabyAyllaGifts } from "./BabyAyllaGifts";
import { BabyAyllaRsvp } from "./BabyAyllaRsvp";
import { BabyAyllaFooter } from "./BabyAyllaFooter";

export function BabyAyllaExperience() {
  const [isCoverOpen, setIsCoverOpen] = useState(true);
  const [isHeroRevealed, setIsHeroRevealed] = useState(false);
  const { audioPlayer, audioEnabled, setIntroComplete } = useExperience();
  const [audioBusy, setAudioBusy] = useState(false);
  const [audioError, setAudioError] = useState("");
  const audioPending = useRef(false);
  const pauseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);
  const mainRef = useRef<HTMLElement>(null);
  const shouldFocusInvitation = useRef(false);

  useEffect(() => {
    if (!isCoverOpen && shouldFocusInvitation.current) {
      mainRef.current?.focus({ preventScroll: true });
      shouldFocusInvitation.current = false;
    }
  }, [isCoverOpen]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (pauseTimer.current) clearTimeout(pauseTimer.current);
    };
  }, []);

  const playMusic = async () => {
    if (audioPending.current) return;
    if (!audioPlayer) {
      setAudioError("A música ainda não está pronta. Toca em reproduzir para tentar novamente.");
      return;
    }
    audioPending.current = true;
    setAudioBusy(true);
    setAudioError("");
    try {
      if (audioError) audioPlayer.preload();
      const ok = audioPlayer.hasLoadedTrack() ? await audioPlayer.resume() : await audioPlayer.start();
      if (!ok && mounted.current) setAudioError("Não foi possível iniciar a música. Toca em reproduzir para tentar novamente.");
    } catch {
      if (mounted.current) setAudioError("A música está indisponível. Podes tentar reproduzir novamente.");
    } finally {
      audioPending.current = false;
      if (mounted.current) setAudioBusy(false);
    }
  };

  const toggleMusic = () => {
    if (!audioPlayer || audioPending.current) return;
    if (!audioEnabled) { void playMusic(); return; }
    // Wait for the existing player's fade-out before accepting a resume.
    audioPending.current = true;
    setAudioBusy(true);
    setAudioError("");
    audioPlayer.pause();
    pauseTimer.current = setTimeout(() => {
      audioPending.current = false;
      if (mounted.current) setAudioBusy(false);
    }, 650);
  };

  const startOpening = () => {
    // A saved section anchor must never skip the invitation's opening ritual.
    if (window.location.hash) {
      window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
    }
    window.scrollTo({ top: 0, behavior: "instant" });
    void playMusic();
  };

  const handleOpenInvite = () => {
    shouldFocusInvitation.current = true;
    setIntroComplete(true);
    setIsHeroRevealed(true);
    setIsCoverOpen(false);
  };



  return (
    <div
      className="baby-aylla-root relative w-full overflow-x-clip min-h-screen text-[#4A3B39] bg-[#FBF8F5]"
      data-render-profile="baby-aylla-couture"
    >
      {/* 1. Cover Gate */}
      <BabyAyllaCoverGate
        isOpen={isCoverOpen}
        onStartOpening={startOpening}
        onReveal={() => setIsHeroRevealed(true)}
        onOpen={handleOpenInvite}
      />

      {/* 3. Ambient Particle Sparkles */}
      <BabyAyllaAmbient />
      {!isCoverOpen && <BabyAyllaAudioControl playing={audioEnabled} busy={audioBusy} error={audioError} onToggle={toggleMusic} />}

      {/* 4. Main Invitation Flow */}
      <main ref={mainRef} inert={isCoverOpen} aria-hidden={isCoverOpen} tabIndex={-1} className="relative z-10 w-full flex flex-col items-center outline-none">
        {/* Section 01: Hero Intro */}
        <BabyAyllaHero isRevealed={isHeroRevealed} />

        <BabyAyllaLetter isRevealed={!isCoverOpen} />

        {/* Section 02: Narrative Story */}
        <BabyAyllaStory />

        {/* Section 03: Save the Date & Calendar */}
        <BabyAyllaSaveTheDate />

        {/* Section 04: Celebration Details */}
        <BabyAyllaDetails />

        {/* Section 06: Dress Code */}
        <BabyAyllaDressCode />

        {/* Section 07: Gift Registry — inspiration only until family activation */}
        <BabyAyllaGifts />

        {/* Section 08: RSVP */}
        <BabyAyllaRsvp />

        {/* Section 10: Footer */}
        <BabyAyllaFooter />
      </main>
    </div>
  );
}
