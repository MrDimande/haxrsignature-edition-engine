"use client";

import React from "react";
import { StanRitualGate } from "./StanRitualGate";
import { StanHeroSection } from "./StanHero";
import { StanHeroStoryBridge } from "./StanHeroStoryBridge";
import { StanStoryEditorial } from "./StanStoryEditorial";
import { StanMatchdaySection } from "./StanMatchday";
import { StanGiftsSection } from "./StanGiftsCountdown";
import { StanFloatingNav } from "./StanFloatingNav";
import { StanAudioControl } from "./StanAudioControl";
import {
  StanInspirationsSection,
  StanRSVPSection,
  StanFooterSection,
} from "./StanRealMadridSections";

/**
 * STAN — O Quinto Acto de um Pequeno Campeão
 */
export function StanRealMadridExperience() {
  return (
    <div
      className="w-full min-h-screen bg-[#F7F4EF] text-[#0A1628]"
      data-render-profile="stan-real-madrid"
    >
      <StanRitualGate />
      <StanHeroSection />
      <StanHeroStoryBridge />
      <StanFloatingNav />
      <StanAudioControl />
      <StanStoryEditorial />
      <StanInspirationsSection />
      <StanMatchdaySection />
      <StanGiftsSection />
      <StanRSVPSection />
      <StanFooterSection />
    </div>
  );
}
