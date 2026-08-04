import type { TrueTheme } from "../true-types";
import {
  STAN_EVENT,
  STAN_RSVP,
  STAN_VENUE,
  STAN_DRESS_CODE,
  getStanVenueDisplayName,
  resolveStanWhatsAppDigits,
} from "@lib/stan/event-details";

const stanWhatsApp = resolveStanWhatsAppDigits();

export const stanRealMadridTheme: TrueTheme = {
  identity: "stan-real-madrid",
  renderProfile: "stan-real-madrid",
  structure: "editorial",
  flow: "reveal",
  visuals: {
    shapes: "glass",
    spacing: "air-medium",
    composition: "magazine-layout",
  },
  mood: {
    energy: "medium",
    emotion: "luxury",
  },
  audio: {
    type: "ambient",
    fadeIn: 3000,
    fadeOut: 2000,
    volume: 0.38,
    src: "/audio/stan/hala-madrid.mp3",
    credit: {
      title: "Hala Madrid… y nada más",
      artist: "Real Madrid · feat. RedOne",
      rightsHolder: "Real Madrid C.F. · RedOne",
      disclaimer:
        "Hino de ambiente no convite. Todos os direitos da obra pertencem aos respectivos titulares. HAXR Signature não detém nem reivindica qualquer direito sobre este conteúdo musical.",
    },
  },
  colors: {
    primary: "#0A1628",
    secondary: "#5B6B7C",
    accent: "#C9A86A",
    background: "#F7F4EF",
  },
  palette: {
    bgBase: "#F7F4EF",
    textPrimary: "text-[#0A1628]",
    textSecondary: "text-[#5B6B7C]",
    accent: "#C9A86A",
    accentLight: "rgba(201, 168, 106, 0.12)",
    cardBg: "bg-[#FFFFFF]/80 backdrop-blur-md border border-[#E8DCC8] shadow-sm",
    blob1: "rgba(201, 168, 106, 0.08)",
    blob2: "rgba(247, 244, 239, 0.95)",
    blob3: "rgba(10, 22, 40, 0.05)",
    divider: "rgba(201, 168, 106, 0.28)",
  },
  assets: {
    logoImage: "/images/haxr-logo-vertical.png",
    faviconImage: "/images/haxr-favicon.png",
    monogram: "S · 5",
  },
  copy: {
    enterCta: "Entrar na Celebração do Stan",
    heroEyebrow: "O Quinto Acto de um Pequeno Campeão",
    detailsTitle: "Matchday Details",
    detailsQuote:
      "Uma celebração cheia de luz, alegria e momentos inesquecíveis. O Stan espera por si para comemorar esta data tão especial!",
    intro: {
      headline: "Stan",
      surname: "5º Aniversário",
      subline: "O Quinto Acto de um Pequeno Campeão",
    },
    location: {
      name: getStanVenueDisplayName(),
      address: STAN_VENUE.address ?? "",
      directions: STAN_VENUE.directions ?? "",
      mapCoordinates: STAN_VENUE.mapCoordinates ?? "",
      externalMapUrl: STAN_VENUE.mapsUrl ?? "",
      mapFilter: "grayscale(0.2) contrast(1.05)",
    },
    dressCode: {
      label: "Kit Matchday",
      title: STAN_DRESS_CODE.label ?? "Cores do plantel",
      description:
        [
          STAN_DRESS_CODE.lead,
          STAN_DRESS_CODE.note,
        ]
          .filter(Boolean)
          .join(" "),
    },
    rsvpClosing: STAN_RSVP.closing,
    rsvp: {
      title: STAN_RSVP.title,
      subtitle: STAN_RSVP.subtitle,
      /** Placeholder ISO só para tipagem — UI oculta se deadlineLabel for vazio */
      deadlineIso: STAN_RSVP.deadlineIso ?? "",
      deadlineLabel: STAN_RSVP.deadlineLabel ?? "",
      ...(stanWhatsApp
        ? {
            whatsappNumber: stanWhatsApp,
            whatsappDefaultMessage:
              "Olá! Acabei de confirmar presença no Aniversário do Stan.",
          }
        : {}),
    },
  },
};
