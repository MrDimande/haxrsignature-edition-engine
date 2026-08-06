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

/**
 * Nian · NIGHT OF THE WEB — Fase 2B:
 * Gate → Hero → Origin → Brief → Action → Uniforme → Team-Up → Squad Mode.
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
      {/* Encerramento temporário — Fase 2C (Local / Closing / RSVP) diferida */}
      <p
        id="continua"
        className="px-5 pb-16 pt-6 text-center text-[9px] uppercase tracking-[0.36em] text-[#8FA3D1]/55"
        aria-hidden
      >
        Continua em breve
      </p>
    </div>
  );
}
