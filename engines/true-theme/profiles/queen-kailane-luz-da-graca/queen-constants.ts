/**
 * Queen Kailane Cande — Sacramento do Crisma · LUZ DA GRAÇA
 * Constantes Locais do Perfil (Linguagem Visual, Curva-Mãe e Master Glyph).
 */

/**
 * CURVA-MÃE ÚNICA (QUEEN_GRACE_ARC)
 *
 * Parábola matemática sacra utilizada em:
 * 1. Capa Fechada (moldura deboss do monograma QKC)
 * 2. Margem de Graça (cúpula superior dos fólios editoriais)
 * 3. Capítulo III — A Palavra (pano de fundo iluminado para Efésios 5:8)
 * 4. Epílogo / Colophon HAXR Signature
 */
export const QUEEN_GRACE_ARC = {
  viewBox: "0 0 100 40",
  pathTopArc: "M 0,35 Q 50,5 100,35",
  pathClosedFrame: "M 0,35 Q 50,5 100,35 L 100,100 L 0,100 Z",
  strokeWidth: 1.2,
  defaultGradient: ["#D8BE87", "#B9975B"],
} as const;

export const QUEEN_CHAPTERS = [
  { id: "prologo", label: "PRÓLOGO", title: "Luz da Graça", num: "" },
  { id: "caminhada", label: "CAPÍTULO I", title: "A Caminhada", num: "I" },
  { id: "sacramento", label: "CAPÍTULO II", title: "O Sacramento", num: "II" },
  { id: "palavra", label: "CAPÍTULO III", title: "A Palavra", num: "III", isApex: true },
  { id: "almoco", label: "CAPÍTULO IV", title: "À Mesa", num: "IV" },
  { id: "rsvp", label: "CAPÍTULO V", title: "Faz Parte Desta Página", num: "V" },
  { id: "epilogo", label: "EPÍLOGO", title: "Uma Página de Fé", num: "" },
] as const;

export type QueenChapterId = (typeof QUEEN_CHAPTERS)[number]["id"];
