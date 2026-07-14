"use client";

import { useExperience } from "./context";
import {
  HeroSection,
  DetailsSection,
  LocationSection,
  RSVPSection,
  FooterSection,
} from "./ExperienceSections";
import { IllustrationCeremonyExperience } from "./profiles/illustration-ceremony/IllustrationCeremonySections";
import { RoseEleganceExperience } from "./profiles/rose-elegance/RoseEleganceExperience";
import { PrimaveraLoboloExperience } from "./profiles/primavera-lobolo/PrimaveraLoboloExperience";

function StandardEditorialExperience() {
  return (
    <>
      <HeroSection />
      <DetailsSection />
      <LocationSection />
      <RSVPSection />
      <FooterSection />
    </>
  );
}

/**
 * Profile-based section composition — driven by theme.renderProfile, never by slug.
 */
export function ExperienceComposition() {
  const { theme } = useExperience();

  switch (theme.renderProfile) {
    case "illustration-ceremony":
      return <IllustrationCeremonyExperience />;
    case "rose-elegance":
      return <RoseEleganceExperience />;
    case "primavera-lobolo":
      return <PrimaveraLoboloExperience />;
    case "standard":
      return <StandardEditorialExperience />;
    default: {
      const _exhaustive: never = theme.renderProfile;
      return _exhaustive;
    }
  }
}

