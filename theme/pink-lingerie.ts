import type { EventTheme } from "./types";

export const pinkLingerieTheme: EventTheme = {
  name: "pink-lingerie",
  colors: {
    bgGradient: "bg-gradient-to-tr from-[#FFF7F8] via-[#FFFFFF] to-[#FFF0F2]",
    bgBase: "#FFF9FA",
    textPrimary: "text-[#4A1825]",      // Elegant deep maroon/burgundy
    textSecondary: "text-[#7D4F5A]",    // Muted rose gray
    accent: "#E05A75",                 // Luxurious coral-pink highlight
    accentLight: "rgba(255, 240, 242, 0.75)",
    gold: "#D4AF37",                   // Metallic champagne gold accents
    cardBg: "bg-white/40 backdrop-blur-md border border-white/70",
    cardBorder: "border-[#FFF0F2]",
    cardGlow: "shadow-[0_15px_40px_rgba(224,90,117,0.06)]",
    
    // Interactive button state
    btnBg: "bg-[#4A1825]",
    btnText: "text-white",
    btnBorder: "border-[#4A1825]",
    btnHoverBg: "bg-[#E05A75]",
    btnHoverText: "text-white",
    
    // Ambient light gradients
    blob1: "rgba(255, 204, 213, 0.35)",  // Soft pastel pink
    blob2: "rgba(255, 240, 242, 0.3)",   // Blush white
    blob3: "rgba(251, 207, 232, 0.2)",   // Light lilac-rose
    
    // Divider
    divider: "rgba(224, 90, 117, 0.25)",
  },
  fonts: {
    title: "var(--font-playfair-display), serif",
    body: "var(--font-inter), sans-serif",
  },
  visuals: {
    monogram: "JM",
    // Creative Map Filter: shifts grayscale/sepia into a premium soft rose/pink tone
    mapFilter: "grayscale(1) invert(0.9) sepia(0.3) hue-rotate(300deg) saturate(1.8) contrast(1.12) brightness(0.98)",
    mapCoordinates: "-25.967886,32.483161",
    hasWatermark: false,
    frameStyle: "classic-rect",
    enterButtonClass: "ceremony-enter-btn-pink",
  },
  audio: {
    src: "/audio/lingerie-ambient.mp3",
    targetVolume: 0.45,
    fadeInMs: 4000, // 4-second fade in
    fadeOutMs: 1200,
  },
};
