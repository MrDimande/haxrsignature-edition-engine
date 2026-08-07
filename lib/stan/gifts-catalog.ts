/**
 * Catálogo de presentes — Stan 5º Aniversário
 * Sugestões por categoria. Sem preços. Presentear = reserva simbólica.
 */

export type StanGiftCategoryId =
  | "brincar"
  | "aprender"
  | "ar-livre"
  | "criar";

export type StanGiftGroup = {
  baseId: string;
  name: string;
  category: StanGiftCategoryId;
  slots: string[];
};

/** Payload público — sem PII de quem reservou */
export type StanPublicGift = {
  id: string; // baseId
  name: string;
  category: StanGiftCategoryId;
  totalQuantity: number;
  reservedCount: number;
  availableQuantity: number;
  isExhausted: boolean;
  status: "available" | "reserved";
};

export type StanGiftCategory = {
  id: StanGiftCategoryId;
  title: string;
  subtitle: string;
};

export const STAN_GIFT_CATEGORIES: StanGiftCategory[] = [
  {
    id: "brincar",
    title: "Para brincar e imaginar",
    subtitle: "Mundos, heróis e aventuras",
  },
  {
    id: "aprender",
    title: "Para aprender",
    subtitle: "Curiosidade e descoberta",
  },
  {
    id: "ar-livre",
    title: "Para brincar ao ar livre",
    subtitle: "Movimento e energia",
  },
  {
    id: "criar",
    title: "Para criar e explorar",
    subtitle: "Mãos, cores e ideias",
  },
];

export const STAN_GIFT_GROUPS: StanGiftGroup[] = [
  // Brincar
  {
    baseId: "stan-blocos-montar",
    name: "Blocos de montar — LEGO, Mega Bloks ou similares",
    category: "brincar",
    slots: ["stan-blocos-montar", "stan-blocos-montar-02", "stan-blocos-montar-03"],
  },
  {
    baseId: "stan-pista-carrinhos",
    name: "Pista de carrinhos",
    category: "brincar",
    slots: [
      "stan-pista-carrinhos",
      "stan-pista-carrinhos-02",
      "stan-pista-carrinhos-03",
      "stan-pista-carrinhos-04",
      "stan-pista-carrinhos-05",
    ],
  },
  {
    baseId: "stan-comboio-carris",
    name: "Comboio com carris",
    category: "brincar",
    slots: ["stan-comboio-carris"],
  },
  {
    baseId: "stan-carrinho-controlo-remoto",
    name: "Carrinho de controlo remoto",
    category: "brincar",
    slots: [
      "stan-carrinho-controlo-remoto",
      "stan-carrinho-controlo-remoto-02",
    ],
  },
  {
    baseId: "stan-boneco-spiderman",
    name: "Boneco de Acção — Spider-Man",
    category: "brincar",
    slots: ["stan-boneco-spiderman"],
  },
  {
    baseId: "stan-boneco-batman",
    name: "Boneco de Acção — Batman",
    category: "brincar",
    slots: ["stan-boneco-batman"],
  },
  {
    baseId: "stan-boneco-sonic",
    name: "Boneco de Acção — Sonic",
    category: "brincar",
    slots: ["stan-boneco-sonic"],
  },
  {
    baseId: "stan-boneco-catboy",
    name: "Boneco de Acção — Catboy",
    category: "brincar",
    slots: ["stan-boneco-catboy"],
  },
  {
    baseId: "stan-bonecos-accao",
    name: "Bonecos de acção (Spider-Man, Batman, Sonic, Catboy…)",
    category: "brincar",
    slots: ["stan-bonecos-accao"],
  },
  {
    baseId: "stan-tenda-infantil",
    name: "Tenda infantil",
    category: "brincar",
    slots: ["stan-tenda-infantil"],
  },

  // Aprender
  {
    baseId: "stan-livro-portugues",
    name: "Livro infantil em Português",
    category: "aprender",
    slots: ["stan-livro-portugues", "stan-livro-portugues-02"],
  },
  {
    baseId: "stan-livro-ingles",
    name: "Livro infantil em Inglês",
    category: "aprender",
    slots: [
      "stan-livro-ingles",
      "stan-livro-ingles-02",
      "stan-livro-ingles-03",
    ],
  },
  {
    baseId: "stan-livros-infantis",
    name: "Livros infantis (10 a 20 páginas, Português ou Inglês)",
    category: "aprender",
    slots: ["stan-livros-infantis"],
  },
  {
    baseId: "stan-quebra-cabecas",
    name: "Quebra-cabeças (24 a 36 peças)",
    category: "aprender",
    slots: ["stan-quebra-cabecas"],
  },
  {
    baseId: "stan-jogos-memoria",
    name: "Jogo de memória",
    category: "aprender",
    slots: ["stan-jogos-memoria", "stan-jogos-memoria-02", "stan-jogos-memoria-03"],
  },
  {
    baseId: "stan-jogos-tabuleiro",
    name: "Jogo de tabuleiro infantil",
    category: "aprender",
    slots: [
      "stan-jogos-tabuleiro",
      "stan-jogos-tabuleiro-02",
      "stan-jogos-tabuleiro-03",
    ],
  },
  {
    baseId: "stan-jogos-logica",
    name: "Jogo de raciocínio e lógica",
    category: "aprender",
    slots: ["stan-jogos-logica", "stan-jogos-logica-02", "stan-jogos-logica-03"],
  },
  {
    baseId: "stan-kit-ciencias",
    name: "Kit de experiências científicas",
    category: "aprender",
    slots: ["stan-kit-ciencias"],
  },

  // Ar livre
  {
    baseId: "stan-bicicleta",
    name: "Bicicleta",
    category: "ar-livre",
    slots: ["stan-bicicleta"],
  },
  {
    baseId: "stan-patinete",
    name: "Patinete",
    category: "ar-livre",
    slots: ["stan-patinete"],
  },
  {
    baseId: "stan-kit-futebol",
    name: "Kit de futebol infantil",
    category: "ar-livre",
    slots: ["stan-kit-futebol"],
  },
  {
    baseId: "stan-kit-basquete",
    name: "Kit de basquete infantil",
    category: "ar-livre",
    slots: ["stan-kit-basquete"],
  },

  // Criar
  {
    baseId: "stan-mesa-actividades",
    name: "Mesa de actividades infantil",
    category: "criar",
    slots: ["stan-mesa-actividades"],
  },
  {
    baseId: "stan-kit-desenho",
    name: "Kit de desenho e pintura",
    category: "criar",
    slots: ["stan-kit-desenho", "stan-kit-desenho-02", "stan-kit-desenho-03"],
  },
  {
    baseId: "stan-massa-modelar",
    name: "Massa de modelar com acessórios",
    category: "criar",
    slots: ["stan-massa-modelar", "stan-massa-modelar-02", "stan-massa-modelar-03"],
  },
  {
    baseId: "stan-quadro-magnetico",
    name: "Quadro magnético para desenhar",
    category: "criar",
    slots: ["stan-quadro-magnetico"],
  },
  {
    baseId: "stan-instrumento",
    name: "Instrumento musical infantil",
    category: "criar",
    slots: ["stan-instrumento", "stan-instrumento-02", "stan-instrumento-03"],
  },
];

export function getStanGiftGroupById(id: string): StanGiftGroup | undefined {
  return STAN_GIFT_GROUPS.find(
    (g) => g.baseId === id || g.slots.includes(id)
  );
}
