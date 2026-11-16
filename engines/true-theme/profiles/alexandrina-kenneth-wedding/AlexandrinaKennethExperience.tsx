"use client";

import React, { useState, useEffect } from "react";
import "./alexandrina-kenneth.css";

import { AlexandrinaKennethAmbient } from "./AlexandrinaKennethAmbient";
import { AlexandrinaKennethCoverGate } from "./AlexandrinaKennethCoverGate";
import { AlexandrinaKennethAudioToggle } from "./AlexandrinaKennethAudioToggle";
import { AlexandrinaKennethFloatingNav } from "./AlexandrinaKennethFloatingNav";
import { AlexandrinaKennethHero } from "./AlexandrinaKennethHero";
import { AlexandrinaKennethScripture } from "./AlexandrinaKennethScripture";
import { AlexandrinaKennethCouple } from "./AlexandrinaKennethCouple";
import { AlexandrinaKennethEvents } from "./AlexandrinaKennethEvents";
import { AlexandrinaKennethJourney } from "./AlexandrinaKennethJourney";
import { AlexandrinaKennethLocation } from "./AlexandrinaKennethLocation";
import { AlexandrinaKennethCountdown } from "./AlexandrinaKennethCountdown";
import { AlexandrinaKennethRsvp } from "./AlexandrinaKennethRsvp";
import { AlexandrinaKennethGifts } from "./AlexandrinaKennethGifts";
import { AlexandrinaKennethPhotoUpload } from "./AlexandrinaKennethPhotoUpload";
import { AlexandrinaKennethFooter } from "./AlexandrinaKennethFooter";

export function AlexandrinaKennethExperience() {
  const [isCoverOpen, setIsCoverOpen] = useState(true);
  const [audioTriggered, setAudioTriggered] = useState(false);

  const handleOpenInvite = () => {
    setIsCoverOpen(false);
    setAudioTriggered(true);
  };

  useEffect(() => {
    // If URL has #convite or other deep links, start with cover closed
    if (typeof window !== "undefined" && window.location.hash) {
      setIsCoverOpen(false);
      setAudioTriggered(true);
    }
  }, []);

  return (
    <div
      className="alexandrina-kenneth-experience-root relative w-full overflow-x-hidden min-h-screen text-[#2c2c2c] bg-[#fff8f0]"
      style={{
        fontFamily: "'Montserrat', sans-serif",
      }}
      data-render-profile="alexandrina-kenneth-wedding"
    >
      {/* Google Fonts: Great Vibes (tÃ­tulos e nomes) e Montserrat (corpo, horÃ¡rios, botÃµes) */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Montserrat:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap"
        rel="stylesheet"
      />

      {/* 1. Cover Gate */}
      <AlexandrinaKennethCoverGate
        isOpen={isCoverOpen}
        onOpen={handleOpenInvite}
      />

      {/* 2. Floating Audio Toggle */}
      <AlexandrinaKennethAudioToggle
        autoStart={audioTriggered}
        showToggle={!isCoverOpen}
      />

      {/* 2.1 Floating Navigation Menu (Dock & Shortcuts) */}
      {!isCoverOpen && <AlexandrinaKennethFloatingNav />}

      {/* 3. Ambient Visual Effects (Gold Particles, Confetti, Sparkles) */}
      <AlexandrinaKennethAmbient />

      {/* 4. Main Invitation Flow */}
      <div className="alexandrina-kenneth-flow w-full">
        {/* Segunda Capa / Hero Intro */}
        <AlexandrinaKennethHero
          onBackToCover={() => setIsCoverOpen(true)}
          showBackToCover={!isCoverOpen}
        />

        {/* VersÃ­culo BÃ­blico */}
        <AlexandrinaKennethScripture />

        {/* Os Noivos */}
        <AlexandrinaKennethCouple />

        {/* Detalhes dos Eventos */}
        <AlexandrinaKennethEvents />

        {/* Galeria / Nossa Jornada */}
        <AlexandrinaKennethJourney />

        {/* LocalizaÃ§Ã£o & Mapa Interativo dos TrÃªs Locais */}
        <AlexandrinaKennethLocation />

        {/* Contagem Regressiva */}
        <AlexandrinaKennethCountdown />

        {/* ConfirmaÃ§Ã£o (RSVP), Presentes, Bebidas & Fotos */}
        <section className="rsvp-gifts" id="rsvp" aria-labelledby="rsvp-heading">
          <div className="container">
            <div className="section-title">ConfirmaÃ§Ã£o</div>
            <h2 className="script-title" id="rsvp-heading">
              Contamos contigo?
            </h2>
            <p className="lead rsvp-lead">
              Confirma a tua presenÃ§a atÃ© <strong>20 de Dezembro de 2026</strong>, para podermos
              preparar este dia com carinho.
            </p>

            <div className="info-grid rsvp-info-grid">
              {/* Coluna Esquerda: FormulÃ¡rio de ConfirmaÃ§Ã£o RSVP */}
              <AlexandrinaKennethRsvp />

              {/* Coluna Direita: Presentes (com Modal da Lista Online) e Upload de Fotos */}
              <div className="right-column-stack right-column-stack--layout">
                <AlexandrinaKennethGifts />
                <AlexandrinaKennethPhotoUpload />
              </div>
            </div>
          </div>
        </section>

        {/* RodapÃ© Premium com bÃªnÃ§Ã£o, crÃ©ditos e assinatura */}
        <AlexandrinaKennethFooter />
      </div>
    </div>
  );
}

