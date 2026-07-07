import type { TrueTheme } from "../true-types";
import { getBrideIllustrationPalette } from "../experience-tokens";

export const brideToBeIllustrationTheme: TrueTheme = {
  identity: "bride-to-be-illustration",
  renderProfile: "illustration-ceremony",
  structure: "immersive",
  flow: "story-driven",
  visuals: {
    shapes: "soft-curves",
    spacing: "expansive",
    composition: "immersive-scroll",
  },
  mood: {
    energy: "medium",
    emotion: "celebratory",
  },
  audio: {
    type: "ambient",
    fadeIn: 5000,
    volume: 0.4,
    src: "/audio/lingerie-ambient.mp3",
    fadeOut: 1500,
  },
  colors: {
    primary: "#1C1612",
    secondary: "#D0487B",
    accent: "#B89B5E",
    background: "#FFF0F3",
  },
  palette: {
    bgBase: "#FFF0F3",
    textPrimary: "text-[#1C1612]",
    textSecondary: "text-[#D0487B]",
    accent: "#B89B5E",
    accentLight: "rgba(208, 72, 123, 0.12)",
    cardBg: "bg-[#FFF0F3]/65 backdrop-blur-xl border border-[#B89B5E]/30",
    blob1: "rgba(208, 72, 123, 0.2)",
    blob2: "rgba(255, 240, 243, 0.5)",
    blob3: "rgba(184, 155, 94, 0.12)",
    divider: "rgba(208, 72, 123, 0.25)",
  },
  assets: {
    heroImage: "/images/bridal_editorial_art.png",
    logoImage: "/images/haxr-logo-vertical.png",
    monogram: "BTB",
  },
  copy: {
    enterCta: "Entrar na Celebração",
    heroEyebrow: "Chá de Panela · Bride-to-Be",
    intro: {
      headline: "Jessica",
      subline: "Uma despedida desenhada com amor, elegância e alegria partilhada.",
    },
    story: {
      title: "Despedida de Solteira",
      subtitle: "Jessica disse sim!",
    },
    detailsTitle: "Your Illustrated Invitation",
    detailsQuote:
      "Cada traço, cada detalhe foi desenhado para celebrar o amor, a cumplicidade e a transição mais bonita de Jessica.",
    dressCode: {
      label: "Aesthetic Mood",
      title: "One piece in Pink",
      description:
        "Não é uma regra — é uma paleta emocional. Uma peça rosa, um gesto de elegância partilhada, um tom de celebração feminina.",
    },
    location: {
      name: "Local a confirmar",
      address: "Maputo, Moçambique",
      directions:
        "A rota será revelada mais perto da data. Por agora, deixe-se envolver pela antecipação.",
      mapCoordinates: "-25.9653,32.5892",
      externalMapUrl: "https://maps.google.com",
      mapFilter: "none",
    },
    rsvpClosing: "Que a sua energia abençoe esta transição.",
  },
};
