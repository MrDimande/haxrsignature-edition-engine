"use client";

import {
  PrimaveraDetailsSection,
  PrimaveraDressCodeSection,
  PrimaveraFamiliesSection,
  PrimaveraFooterSection,
  PrimaveraGiftSection,
  PrimaveraHeroSection,
  PrimaveraIntroSection,
  PrimaveraLocationSection,
} from "./PrimaveraLoboloSections";
import { PrimaveraCountdownSection } from "./PrimaveraLoboloCountdown";
import { PrimaveraLoboloRSVPSection } from "./PrimaveraLoboloRSVP";
import { PrimaveraLoboloFloatingNav } from "./PrimaveraLoboloFloatingNav";

/** Composição completa — Casamento Tradicional Lobolo · Tema Primavera */
export function PrimaveraLoboloExperience() {
  return (
    <div
      className="w-full min-h-screen pb-20"
      style={{ backgroundColor: "transparent" }}
      data-lenis-prevent
    >
      <PrimaveraHeroSection />
      <PrimaveraIntroSection />
      <PrimaveraFamiliesSection />
      <PrimaveraDetailsSection />
      <PrimaveraLocationSection />
      <PrimaveraDressCodeSection />
      <PrimaveraCountdownSection />
      <PrimaveraGiftSection />
      <PrimaveraLoboloRSVPSection />
      <PrimaveraFooterSection />
      <PrimaveraLoboloFloatingNav />
    </div>
  );
}
