/**
 * Blueprint pixel-perfect — referencia-capa.png (723 x 1024 px)
 * Todas as posicoes em percentagem do canvas. NAO alterar sem medir a referencia.
 */

export const CANVAS = {
  width: 723,
  height: 1024,
  aspectRatio: "723 / 1024",
} as const;

/** Painel esquerdo decorativo */
export const LEFT_PANEL = {
  width: "28%",
} as const;

/** Emblema circular — 18% largura, centro na linha dos 28% */
export const EMBLEM = {
  width: "18%",
  left: "19%", // 28% - (18%/2)
  top: "31.5%", // centro ~40.5% vertical
} as const;

/** Mandala ornamental grande no topo (painel direito) */
export const TOP_MANDALA = {
  left: "28%",
  top: "-2%",
  width: "72%",
  height: "21%",
} as const;

/** Cluster de objectos culturais */
export const TRADITION_ICONS = {
  left: "30.5%",
  top: "9.5%",
  width: "27%",
  height: "15%",
} as const;

/** Titulo DOT */
export const DOT_TITLE = {
  left: "50%",
  top: "10%",
  fontSize: "10.2%", // relativo a largura do canvas via container query / vw trick
} as const;

/** Paragrafo introdutorio */
export const INTRO_TEXT = {
  left: "30%",
  top: "25.5%",
  width: "64%",
} as const;

/** Nomes dos noivos — abaixo do intro */
export const COUPLE_NAMES = {
  left: "30%",
  top: "35.5%",
  width: "64%",
  fontSize: "11.5%",
} as const;

/** Linha de convite */
export const INVITATION_LINE = {
  left: "30%",
  top: "48.5%",
  width: "64%",
} as const;

/** Bloco data — largura total da area de conteudo */
export const DATE_BLOCK = {
  left: "29.5%",
  top: "52%",
  width: "64%",
  height: "3.4%",
} as const;

/** Bloco hora — alinhado a direita */
export const TIME_BLOCK = {
  right: "12.5%",
  top: "56.8%",
  width: "30%",
  height: "3.2%",
} as const;

/** Caixa localizacao */
export const LOCATION_BLOCK = {
  left: "29.5%",
  top: "60.5%",
  width: "64%",
  height: "4.2%",
} as const;

/** Mensagem de fecho */
export const CLOSING_TEXT = {
  left: "30%",
  top: "68%",
  width: "64%",
} as const;

/** Familias — rodape */
export const FAMILIES_SECTION = {
  left: "29.5%",
  bottom: "6.5%",
  width: "64%",
  height: "8%",
} as const;

/** Watermark mandala inferior */
export const BOTTOM_MANDALA = {
  left: "50%",
  bottom: "1.5%",
  width: "38%",
  height: "12%",
  opacity: 0.07,
} as const;

/** Overlay subtil painel direito */
export const RIGHT_OVERLAY = {
  opacity: 0.04,
} as const;

/** Cores extraidas da referencia */
export const REF_COLORS = {
  leftBrown: "#7A4A10",
  cream: "#F5F2EC",
  barBrown: "#8B6508",
  dotGold: "#A56A1E",
  nameGold: "#8B6508",
  textGrey: "#5C5348",
  textSoft: "#7A7068",
  borderGold: "#C9A227",
  white: "#FFFFFF",
} as const;
