"use client";

import { NianRitualGate } from "./NianRitualGate";
import { NianHeroSection } from "./NianHero";
import { NianAudioControl } from "./NianAudioControl";
import { NianOriginSection } from "./NianOrigin";
import { NianMissionBriefSection } from "./NianMissionBrief";
import { NianActionBeatSection } from "./NianActionBeat";

/**
 * Nian · NIGHT OF THE WEB — Fase 2A: Gate → Hero → Origin → Brief → Action.
 * Isolado a renderProfile "nian-night-of-the-web".
 */
export function NianNightOfTheWebExperience() {
  return (
    <div
      className="w-full min-h-screen bg-[#05060A] text-[#F4F6FB]"
      data-render-profile="nian-night-of-the-web"
      style={{
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
      {/* Encerramento temporário — Fase 2B+ diferida */}
      <p
        className="px-5 pb-16 pt-6 text-center text-[9px] uppercase tracking-[0.36em] text-[#8FA3D1]/55"
        aria-hidden
      >
        Continua em breve
      </p>
    </div>
  );
}
