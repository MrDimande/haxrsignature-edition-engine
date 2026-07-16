"use client";

import { JessicaSamuelCelebrationGuideSection } from "./JessicaSamuelCelebrationGuide";
import { JessicaSamuelCountdownSection } from "./JessicaSamuelCountdown";
import { JessicaSamuelGallerySection } from "./JessicaSamuelGallerySection";
import {
  JessicaSamuelDetailsSection,
  JessicaSamuelDressCodeSection,
  JessicaSamuelFamiliesSection,
  JessicaSamuelFooterSection,
  JessicaSamuelHeroSection,
  JessicaSamuelIntroSection,
  JessicaSamuelJourneySection,
  JessicaSamuelLocationSection,
} from "./JessicaSamuelSections";
import { JessicaSamuelRSVPSection } from "./JessicaSamuelRSVP";

/** Composição completa — Casamento Jessica & Samuel */
export function JessicaSamuelExperience() {
  return (
    <div
      className="w-full min-h-screen pb-20"
      data-render-profile="jessica-samuel-wedding"
      style={{ backgroundColor: "transparent" }}
      data-lenis-prevent
    >
      <JessicaSamuelHeroSection />
      <JessicaSamuelJourneySection />
      <JessicaSamuelIntroSection />
      <JessicaSamuelFamiliesSection />
      <JessicaSamuelGallerySection />
      <JessicaSamuelDetailsSection />
      <JessicaSamuelCelebrationGuideSection />
      <JessicaSamuelLocationSection />
      <JessicaSamuelDressCodeSection />
      <JessicaSamuelCountdownSection />
      <JessicaSamuelRSVPSection />
      <JessicaSamuelFooterSection />
    </div>
  );
}
