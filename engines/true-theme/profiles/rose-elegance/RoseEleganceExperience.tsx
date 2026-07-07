"use client";

import {
  RoseHeroSection,
  RoseIntroStorySection,
  RoseDetailsSection,
  RoseCountdownSection,
  RoseLocationSection,
  RoseExperienceMomentsSection,
  RoseRSVPSection,
  RoseFooterSection,
} from "./RoseEleganceSections";
import { DressCodeExperienceLayer } from "./DressCodeExperience";
import { RoseEleganceFloatingNav } from "./RoseEleganceFloatingNav";
import { useExperience } from "../../context";

/**
 * Rose Elegance experience composition — editorial farewell ritual.
 * Driven by renderProfile "rose-elegance", never by slug.
 */
export function RoseEleganceExperience() {
  const { theme } = useExperience();

  return (
    <div
      className="w-full select-none pb-24"
      style={{ backgroundColor: theme.colors.background }}
      data-lenis-prevent
    >
      <RoseHeroSection />
      <RoseIntroStorySection />
      <RoseDetailsSection />
      <RoseCountdownSection />
      <RoseLocationSection />
      <DressCodeExperienceLayer />
      <RoseExperienceMomentsSection />
      <RoseRSVPSection />
      <RoseFooterSection />
      <RoseEleganceFloatingNav />
    </div>
  );
}
