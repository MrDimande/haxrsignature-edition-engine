"use client";

import { NianRitualGate } from "./NianRitualGate";
import { NianHeroSection } from "./NianHero";
import { NianAudioControl } from "./NianAudioControl";
import { NianOriginSection } from "./NianOrigin";
import { NianMissionBriefSection } from "./NianMissionBrief";
import { NianActionBeatSection } from "./NianActionBeat";
import { NianUniformeSection } from "./NianUniforme";
import { NianTeamUpSection } from "./NianTeamUp";
import { NianSquadModeSection } from "./NianSquadMode";
import { NianLocationSection } from "./NianLocation";
import { NianClosingSection } from "./NianClosing";
import { NianRsvpSection } from "./NianRsvp";

/**
 * Nian · NIGHT OF THE WEB — Fase 2C:
 * … → Squad Mode → Localização → Closing → RSVP.
 * Isolado a renderProfile "nian-night-of-the-web".
 */
export function NianNightOfTheWebExperience() {
  return (
    <div
      className="w-full min-h-screen text-[#F4F6FB]"
      data-render-profile="nian-night-of-the-web"
      style={{
        backgroundColor: "#03050b",
        fontFamily:
          "var(--font-montserrat), var(--font-jost), system-ui, sans-serif",
      }}
    >
      <NianRitualGate />
      <NianHeroSection />
      <NianAudioControl />
      <NianOriginSection />
      <NianMissionBriefSection />
      <NianActionBeatSection />
      <NianUniformeSection />
      <NianTeamUpSection />
      <NianSquadModeSection />
      <NianLocationSection />
      <NianClosingSection />
      <NianRsvpSection />
    </div>
  );
}
