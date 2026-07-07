import {
  FAREWELL_BRIDE_WHATSAPP,
  FAREWELL_WHATSAPP_DEFAULT_MESSAGE,
} from "@lib/farewell/event-details";
import { getRoseElegancePalette } from "../experience-tokens";
import type { TrueTheme } from "../true-types";

export const roseEleganceFarewellTheme: TrueTheme = {
  identity: "rose-elegance-farewell",
  renderProfile: "rose-elegance",
  structure: "editorial",
  flow: "reveal",
  visuals: {
    shapes: "soft-curves",
    spacing: "expansive",
    composition: "magazine-layout",
  },
  mood: {
    energy: "low",
    emotion: "soft-intimate",
  },
  audio: {
    type: "ambient",
    fadeIn: 5000,
    volume: 0.28,
    src: "/audio/if-i-aint-got-you-web.mp3",
    fadeOut: 1800,
    credit: {
      title: "If I Ain't Got You",
      artist: "Alicia Keys",
      rightsHolder: "Sony Music Entertainment · Alicia Keys",
      disclaimer:
        "Música de ambiente no convite. Todos os direitos da obra pertencem aos respectivos titulares. HAXR Signature não detém nem reivindica qualquer direito sobre este conteúdo musical.",
    },
  },
  colors: {
    primary: "#3D2430",
    secondary: "#FF2D8A",
    accent: "#C9A86C",
    background: "#FFE5F0",
  },
  palette: getRoseElegancePalette(),
  assets: {
    heroImage: "/images/kulaya-cocktail-hero.webp",
    logoImage: "/images/haxr-logo-vertical.png",
    faviconImage: "/images/haxr-favicon.png",
    monogram: "JM",
  },
  copy: {
    enterCta: "Entrar no meu chá",
    heroEyebrow: "Para mim, com amor",
    detailsTitle: "Quando & onde",
    detailsQuote:
      "Junta-te a mim numa tarde só nossa, mimos, risos e um pouco de malícia elegante antes do grande sim.",
    dressCode: {
      label: "Dress code",
      title: "Rosa, como promessa",
      description:
        "Uma peça em rosa — vestido, saia, top, blazer ou lingerie. O branco fica reservado à noiva.",
    },
    intro: {
      headline: "Jessica",
      surname: "Muege",
      subline: "Chá de lingerie · despedida de solteira",
    },
    location: {
      name: "Residência Govene",
      address: "Matola Gare, Moçambique",
      directions:
        "Residência Govene, Matola Gare. Pressione o botão abaixo para abrir a localização no Google Maps.",
      mapCoordinates: "Residência Govene, Matola Gare, Moçambique",
      externalMapUrl: "https://maps.app.goo.gl/SSvVg81vTzxnXXkJ7",
      mapFilter:
        "grayscale(1) sepia(0.15) hue-rotate(330deg) saturate(0.8) contrast(1.05) brightness(1.02)",
    },
    rsvpClosing:
      "Confirma que vens mimar-me, a tua presença é o presente mais bonito.",
    rsvp: {
      title: "Vens comigo?",
      subtitle: "Reserva o teu lugar nesta tarde só de mulheres",
      deadlineIso: "2026-07-20",
      deadlineLabel: "20 de Julho de 2026",
      whatsappNumber: FAREWELL_BRIDE_WHATSAPP,
      whatsappDefaultMessage: FAREWELL_WHATSAPP_DEFAULT_MESSAGE,
    },
  },
};
