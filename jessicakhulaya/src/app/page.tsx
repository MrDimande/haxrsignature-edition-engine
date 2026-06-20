"use client";

import React from "react";
import LenisProvider from "@/components/LenisProvider";
import AmbientBackground from "@/components/AmbientBackground";
import IntroOverlay from "@/components/IntroOverlay";
import AudioToggle from "@/components/AudioToggle";
import HeroSection from "@/components/HeroSection";
import DetailsSection from "@/components/DetailsSection";
import LoreSection from "@/components/LoreSection";
import RSVPSection from "@/components/RSVPSection";
import GratitudeSection from "@/components/GratitudeSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <LenisProvider>
      {/* ─── Static Ambient Background & Audio Toggle ─── */}
      <AmbientBackground />
      <AudioToggle />

      {/* ─── Immersive Curtain Reveal Intro ─── */}
      <IntroOverlay />

      {/* ─── Guided Ceremonial Narrative Scroll ─── */}
      <main className="relative w-full flex flex-col items-center">
        <HeroSection />
        <DetailsSection />
        <LoreSection />
        <RSVPSection />
        <GratitudeSection />
        <Footer />
      </main>
    </LenisProvider>
  );
}
