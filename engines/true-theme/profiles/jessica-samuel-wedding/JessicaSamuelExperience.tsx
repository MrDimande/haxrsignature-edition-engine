"use client";

import Image from "next/image";
import { JessicaSamuelCelebrationGuideSection } from "./JessicaSamuelCelebrationGuide";
import { JessicaSamuelCountdownSection } from "./JessicaSamuelCountdown";
import { JessicaSamuelDressCodeSection } from "./JessicaSamuelDressCodeSection";
import { JessicaSamuelFloatingNav } from "./JessicaSamuelFloatingNav";
import { JessicaSamuelPostEventSection } from "./JessicaSamuelPostEventSection";
import { JessicaSamuelRSVPSection } from "./JessicaSamuelRSVP";
import {
  JessicaSamuelDetailsSection,
  JessicaSamuelFamiliesSection,
  JessicaSamuelFooterSection,
  JessicaSamuelHeroSection,
  JessicaSamuelIntroSection,
  JessicaSamuelJourneySection,
} from "./JessicaSamuelSections";
import "./jessica-samuel-approved-additions.css";
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
      <div
        className="w-full flex justify-center py-10 sm:py-12 select-none pointer-events-none"
        aria-hidden="true"
      >
        <Image
          src="/images/jessica-samuel-wedding/floral/floral-divider.webp"
          alt=""
          width={900}
          height={220}
          loading="lazy"
          sizes="(max-width: 480px) 200px, 280px"
          className="w-[200px] md:w-[280px] h-auto object-contain opacity-85"
          style={{ height: "auto" }}
        />
      </div>
      <JessicaSamuelRSVPSection />
      <JessicaSamuelFooterSection />
      <JessicaSamuelFloatingNav />
    </div>
  );
}
