import type { TrueTheme } from "../true-types";
import {
  NIAN_DRESS_CODE,
  NIAN_EVENT,
  NIAN_RSVP,
  NIAN_VENUE,
  resolveNianAudioSrc,
} from "@lib/nian/event-details";
import { getNianHeroPhotoSrc } from "@lib/nian/assets-manifest";

const heroImage = getNianHeroPhotoSrc() ?? undefined;

export const nianNightOfTheWebTheme: TrueTheme = {
  identity: "nian-night-of-the-web",
  renderProfile: "nian-night-of-the-web",
  structure: "immersive",
  flow: "reveal",
  visuals: {
    shapes: "soft-curves",
    spacing: "expansive",
    composition: "immersive-scroll",
  },
  mood: {
    energy: "high",
    emotion: "celebratory",
  },
  audio: {
    type: "ambient",
    fadeIn: 800,
    fadeOut: 1800,
    volume: 0.42,
    src: resolveNianAudioSrc(),
    loop: false,
    audioStartMode: "explicit-user-choice",
    credit: {
      title: "Sunflower",
      artist: "Post Malone, Swae Lee",
      rightsHolder: "Spider-Man: Into the Spider-Verse · respectivos titulares",
      disclaimer:
        "Trilha de ambiente no convite apenas com ficheiro autorizado pela organização do evento. HAXR Signature não detém nem reivindica direitos sobre esta obra musical.",
    },
  },
  colors: {
    primary: "#F4F6FB",
    secondary: "#8FA3D1",
    accent: "#4169E1",
    background: "#03050b",
  },
  palette: {
    bgBase: "#03050b",
    textPrimary: "text-[#F4F6FB]",
    textSecondary: "text-[#8FA3D1]",
    accent: "#4169E1",
    accentLight: "rgba(65, 105, 225, 0.14)",
    cardBg: "bg-[#0A0A0C]/80 backdrop-blur-md border border-[#4169E1]/25",
    blob1: "rgba(65, 105, 225, 0.18)",
    blob2: "rgba(225, 6, 0, 0.12)",
    blob3: "rgba(5, 6, 10, 0.9)",
    divider: "rgba(65, 105, 225, 0.28)",
  },
  assets: {
    heroImage,
    logoImage: "/images/haxr-logo-vertical.png",
    faviconImage: "/images/haxr-favicon.png",
    monogram: "N",
  },
  copy: {
    enterCta: "Entrar na cidade",
    heroEyebrow: NIAN_EVENT.conceptualTitle,
    detailsTitle: "Briefing",
    detailsQuote: NIAN_EVENT.subtitle,
    intro: {
      headline: "NIAN",
      surname: NIAN_EVENT.conceptualTitle,
      subline: NIAN_EVENT.subtitle,
    },
    location: {
      name: NIAN_VENUE.name,
      address: NIAN_VENUE.address,
      directions: NIAN_VENUE.directions,
      mapCoordinates: NIAN_VENUE.mapCoordinates ?? "",
      externalMapUrl: NIAN_VENUE.mapsUrl ?? "",
      mapFilter: "grayscale(0.15) contrast(1.08) saturate(0.85)",
    },
    dressCode: {
      label: NIAN_DRESS_CODE.title,
      title: NIAN_DRESS_CODE.label,
      description: NIAN_DRESS_CODE.lead,
    },
    rsvpClosing: NIAN_RSVP.closing,
    rsvp: {
      title: NIAN_RSVP.title,
      subtitle: NIAN_RSVP.subtitle,
      deadlineIso: NIAN_RSVP.deadlineIso ?? "",
      deadlineLabel: NIAN_RSVP.deadlineLabel ?? "",
    },
  },
};
