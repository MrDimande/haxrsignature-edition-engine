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
import { JessicaSamuelExperience } from "./profiles/jessica-samuel-wedding/JessicaSamuelExperience";
import { StanRealMadridExperience } from "./profiles/stan-real-madrid/StanRealMadridExperience";
import { NianNightOfTheWebExperience } from "./profiles/nian-night-of-the-web/NianExperience";
import { QueenKailaneLuzDaGracaExperience } from "./profiles/queen-kailane-luz-da-graca/QueenKailaneExperience";
import { NeidyJoseExperience } from "./profiles/neidy-jose-o-vinculo-perfeito/NeidyJoseExperience";

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
    case "jessica-samuel-wedding":
      return <JessicaSamuelExperience />;
    case "stan-real-madrid":
      return <StanRealMadridExperience />;
    case "nian-night-of-the-web":
      return <NianNightOfTheWebExperience />;
    case "queen-kailane-luz-da-graca":
      return <QueenKailaneLuzDaGracaExperience />;
    case "neidy-jose-o-vinculo-perfeito":
      return <NeidyJoseExperience />;
    case "standard":
      return <StandardEditorialExperience />;
    default: {
      const _exhaustive: never = theme.renderProfile;
      return _exhaustive;
    }
  }
}

