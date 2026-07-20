"use client";

import "./jessica-samuel-approved-additions.css";
import { JessicaSamuelCelebrationGuideSection } from "./JessicaSamuelCelebrationGuide";
import { JessicaSamuelCountdownSection } from "./JessicaSamuelCountdown";
import { JessicaSamuelDressCodeSection } from "./JessicaSamuelDressCodeSection";
import { JessicaSamuelFloatingNav } from "./JessicaSamuelFloatingNav";
import { JessicaSamuelPostEventSection } from "./JessicaSamuelPostEventSection";
import {
  JessicaSamuelDetailsSection,
  JessicaSamuelFamiliesSection,
  JessicaSamuelFooterSection,
  JessicaSamuelHeroSection,
  JessicaSamuelIntroSection,
  JessicaSamuelJourneySection,
} from "./JessicaSamuelSections";
import { JessicaSamuelRSVPSection } from "./JessicaSamuelRSVP";
import { MemoriesSection } from "./photos/MemoriesSection";

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
      <JessicaSamuelDetailsSection />
      <JessicaSamuelCelebrationGuideSection />
      <JessicaSamuelDressCodeSection />
      <JessicaSamuelCountdownSection />
      <JessicaSamuelPostEventSection />
      <MemoriesSection />
      <JessicaSamuelRSVPSection />
      <JessicaSamuelFooterSection />
      <JessicaSamuelFloatingNav />
    </div>
  );
}
