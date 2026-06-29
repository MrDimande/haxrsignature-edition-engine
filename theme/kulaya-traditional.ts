import type { EventTheme } from "./types";

export const kulayaTraditionalTheme: EventTheme = {
  name: "kulaya-traditional",
  colors: {
    bgGradient: "bg-[#120A07]",
    bgBase: "#120A07",
    textPrimary: "text-[#FAF5F0]",
    textSecondary: "text-[#FAF5F0]/70",
    accent: "#D4AF37",
    accentLight: "rgba(212, 175, 55, 0.1)",
    gold: "#D4AF37",
    cardBg: "bg-[#1E100A]/35 backdrop-blur-md border border-[#FAF5F0]/5",
    cardBorder: "border-[#FAF5F0]/5",
    cardGlow: "shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)]",
    
    // Interactive button state
    btnBg: "bg-[#120A07]/40",
    btnText: "text-[#FAF5F0]",
    btnBorder: "border-[#D4AF37]/50",
    btnHoverBg: "bg-[#D4AF37]",
    btnHoverText: "text-[#120A07]",
    
    // Animated ambient background blobs
    blob1: "rgba(78, 42, 24, 0.25)",
    blob2: "rgba(45, 25, 16, 0.2)",
    blob3: "rgba(197, 160, 89, 0.15)",
    
    // Divider
    divider: "rgba(212, 175, 55, 0.4)",
  },
  fonts: {
    title: "var(--font-playfair-display), serif",
    body: "var(--font-inter), sans-serif",
  },
  visuals: {
    monogram: "KM",
    mapFilter: "grayscale(1) invert(0.9) sepia(0.55) hue-rotate(335deg) saturate(1.8) contrast(1.15) brightness(0.95)",
    mapCoordinates: "Condomínio Matola Village Matola Moçambique",
    hasWatermark: true,
    frameStyle: "african-shield",
    enterButtonClass: "ceremony-enter-btn",
  },
  audio: {
    src: "/audio/bg-music-web.mp3",
    targetVolume: 0.55,
    fadeInMs: 7500,
    fadeOutMs: 800,
  },
};
