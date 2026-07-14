"use client";

import { useEffect, useState } from "react";
import { ReactLenis } from "lenis/react";
import { Playfair_Display, Inter, Montserrat, Cormorant_Garamond, Great_Vibes, Jost } from "next/font/google";
import { resolveThemeTokens } from "../theme/resolver";
import type { InvitationEngineProps } from "./types";
import { ExperienceProvider } from "./true-theme/context";
import { ExperienceAudioPlayer } from "./true-theme/audio";
import { AmbientLayer } from "./true-theme/AmbientLayer";
import { ExperienceFlowRouter } from "./true-theme/ExperienceFlowRouter";
import { AudioToggle } from "./true-theme/ExperienceFlow";
import { ExperienceStructure } from "./true-theme/ExperienceStructure";
import { ExperienceComposition } from "./true-theme/ExperienceComposition";
import "@legacy/jessicakhulaya/globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair-display",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  display: "swap",
});

const greatVibes = Great_Vibes({
  subsets: ["latin"],
  variable: "--font-great-vibes",
  weight: ["400"],
  display: "swap",
});

const jost = Jost({
  subsets: ["latin"],
  variable: "--font-jost",
  weight: ["300", "400", "500"],
  display: "swap",
});

const fontClasses = `${playfair.variable} ${inter.variable} ${montserrat.variable} ${cormorant.variable} ${greatVibes.variable} ${jost.variable}`;

export default function TrueThemeEngine({
  config,
  theme,
  experience,
}: InvitationEngineProps) {
  const tokens = resolveThemeTokens(theme);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [introComplete, setIntroComplete] = useState(theme.flow === "direct");
  const [rsvpStatus, setRsvpStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");
  const [audioPlayer, setAudioPlayer] = useState<ExperienceAudioPlayer | null>(
    null,
  );

  useEffect(() => {
    const player = new ExperienceAudioPlayer(theme, setAudioEnabled);
    setAudioPlayer(player);
    return () => player.stop();
  }, [theme]);

  useEffect(() => {
    if (!introComplete || !audioPlayer || theme.audio.type === "silent") return;
    if (!audioPlayer.isPlaying()) {
      void audioPlayer.start();
    }
  }, [introComplete, audioPlayer, theme.audio.type]);

  return (
    <ExperienceProvider
      value={{
        theme,
        tokens,
        experience,
        config,
        audioPlayer,
        audioEnabled,
        setAudioEnabled,
        introComplete,
        setIntroComplete,
        rsvpStatus,
        setRsvpStatus,
      }}
    >
      <div
        className={`${fontClasses} min-h-full flex flex-col antialiased`}
        style={{
          backgroundColor: theme.colors.background,
          color: theme.colors.primary,
          fontFamily: tokens.typography.body,
          ["--experience-accent" as string]: theme.colors.accent,
          ["--experience-primary" as string]: theme.colors.primary,
          ["--experience-motion-duration" as string]: `${tokens.motion.duration}s`,
          ["--experience-section-padding" as string]: tokens.layout.sectionPadding,
        }}
        data-experience={experience.id}
        data-render-profile={theme.renderProfile}
      >
        <ReactLenis
          root
          options={{
            lerp: tokens.motion.scrollLerp,
            duration: tokens.motion.duration * 1.2,
            smoothWheel: true,
          }}
        >
          <AmbientLayer />
          <AudioToggle />
          <ExperienceFlowRouter />

          <ExperienceStructure>
            <ExperienceComposition />
          </ExperienceStructure>
        </ReactLenis>
      </div>
    </ExperienceProvider>
  );
}
