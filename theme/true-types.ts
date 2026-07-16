/** Experience-level design system — NOT skins, NOT per-event UI forks */

export type { ExperienceType } from "@experience/types";

export type StructureLayer = "editorial" | "ceremonial" | "minimal" | "immersive";

export type FlowLayer = "ritual-entry" | "reveal" | "direct" | "story-driven";

export type VisualShape = "shield" | "glass" | "soft-curves" | "grid";
export type VisualSpacing = "tight-luxury" | "air-medium" | "expansive";
export type VisualComposition =
  | "center-focus"
  | "magazine-layout"
  | "immersive-scroll";

export type MoodEnergy = "low" | "medium" | "high";
export type MoodEmotion =
  | "romantic"
  | "ceremonial"
  | "luxury"
  | "soft-intimate"
  | "celebratory";

export type RenderProfile =
  | "standard"
  | "illustration-ceremony"
  | "rose-elegance"
  | "primavera-lobolo"
  | "jessica-samuel-wedding";

export type AudioExperienceType = "ambient" | "piano" | "ritual" | "silent";

/** Atribuição de faixa de ambiente — obrigatória quando `src` é obra de terceiros */
export interface AudioCredit {
  title: string;
  artist: string;
  /** Linha curta de titularidade (editora / detentor) */
  rightsHolder: string;
  /** Aviso legal visível no footer */
  disclaimer: string;
}

export interface TrueTheme {
  identity: string;

  /** Rendering strategy — selects section composition in ThemeEngine */
  renderProfile: RenderProfile;

  /** STRUCTURE LAYER — layout composition */
  structure: StructureLayer;

  /** FLOW LAYER — entry experience + animation sequence */
  flow: FlowLayer;

  /** VISUAL LANGUAGE — geometry, not just color */
  visuals: {
    shapes: VisualShape;
    spacing: VisualSpacing;
    composition: VisualComposition;
  };

  /** MOOD SYSTEM — emotional design */
  mood: {
    energy: MoodEnergy;
    emotion: MoodEmotion;
  };

  /** AUDIO EXPERIENCE — triggered on user interaction */
  audio: {
    type: AudioExperienceType;
    fadeIn: number;
    volume: number;
    /** Resolved asset path — experience-driven, never per-slug */
    src: string | null;
    fadeOut?: number;
    /** Créditos legais quando a faixa não é propriedade HAXR */
    credit?: AudioCredit;
  };

  /** COLOR SYSTEM — semantic palette */
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };

  /** Experience world assets — theme owns the emotional world */
  assets: {
    /** Photo editorial only — omitted for illustration experiences */
    heroImage?: string;
    logoImage: string;
    monogram: string;
    faviconImage?: string;
  };

  /** Experience copy — theme-owned narrative layer */
  copy: {
    enterCta: string;
    heroEyebrow: string;
    detailsTitle: string;
    detailsQuote: string;
    intro?: {
      headline: string;
      surname?: string;
      subline?: string;
    };
    story?: {
      title: string;
      subtitle: string;
    };
    dressCode?: {
      label: string;
      title: string;
      description: string;
    };
    location: {
      name: string;
      address: string;
      directions: string;
      mapCoordinates: string;
      externalMapUrl: string;
      mapFilter: string;
    };
    rsvpClosing: string;
    rsvp?: {
      title: string;
      subtitle: string;
      /** ISO date — last day to confirm */
      deadlineIso: string;
      deadlineLabel: string;
      whatsappNumber?: string;
      whatsappDefaultMessage?: string;
    };
  };

  /** Full runtime palette for Tailwind / inline styles */
  palette: ThemePalette;
}

export interface ThemePalette {
  bgBase: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  accentLight: string;
  cardBg: string;
  blob1: string;
  blob2: string;
  blob3: string;
  divider: string;
}

export interface ExperienceMotionTokens {
  duration: number;
  stagger: number;
  ease: readonly [number, number, number, number];
  introDuration: number;
  scrollLerp: number;
}

export interface ExperienceLayoutTokens {
  sectionPadding: string;
  maxWidth: string;
  heroGrid: string;
  cardRadius: string;
  frameStyle: "classic-rect" | "african-shield" | "glass-panel" | "grid-frame";
}

export interface ExperienceTokens {
  motion: ExperienceMotionTokens;
  layout: ExperienceLayoutTokens;
  typography: {
    display: string;
    body: string;
    /** Cursiva decorativa — assinaturas, nomes, destaques */
    script?: string;
  };
}

export interface ResolvedExperience {
  theme: TrueTheme;
  tokens: ExperienceTokens;
}
