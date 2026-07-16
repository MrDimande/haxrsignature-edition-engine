/**
 * Paleta canónica — Casamento Jessica & Samuel (HAXR Signature)
 *
 * Proporção visual alvo:
 * 55% champagne · 20% marfim · 15% preto suave · 7% rosa antigo · 3% vermelho vinho
 */

export const JS_SURFACES = {
  /** Fundo principal — champagne */
  champagne: "#F1E3CF",
  /** Fundo secundário / texto claro — branco marfim */
  ivory: "#FFF9F2",
  /** Textos e contraste — preto suave */
  ink: "#171312",
  /** Texto secundário legível sobre champagne */
  inkSoft: "rgba(23, 19, 18, 0.72)",
  /** Detalhes românticos — rosa antigo */
  rose: "#C9939B",
  roseSoft: "rgba(201, 147, 155, 0.2)",
  /** CTAs e destaques — vermelho vinho */
  wine: "#7A2332",
  wineSoft: "rgba(122, 35, 50, 0.14)",
  /** Linhas e bordas — champagne profundo */
  champagneDeep: "#D6BFA2",
  line: "rgba(214, 191, 162, 0.7)",
  /** Overlay hero: véu preto suave (combina com foto black-tie) */
  heroVeil: "rgba(23, 19, 18, 0.32)",
  heroWarm: "rgba(23, 19, 18, 0.18)",
} as const;

/** Aliases semânticos de secção (alternância champagne / marfim) */
export const JS_SECTION_BG = {
  primary: JS_SURFACES.champagne,
  secondary: JS_SURFACES.ivory,
  accent: JS_SURFACES.wine,
  footer: JS_SURFACES.ink,
} as const;

export const JS_LAYOUT = {
  section: "px-5 sm:px-8 lg:px-12 xl:px-16",
  container: "mx-auto w-full max-w-6xl",
  containerNarrow: "mx-auto w-full max-w-3xl",
} as const;
