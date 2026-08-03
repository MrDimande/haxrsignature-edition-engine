/**
 * Catálogo de presentes — Stan 5º Aniversário
 * Sugestões por categoria. Sem preços. Presentear = reserva simbólica.
 */

export type StanGiftCategoryId =
  | "brincar"
  | "aprender"
  | "ar-livre"
  | "criar";

export type StanGiftItem = {
  id: string;
  name: string;
  category: StanGiftCategoryId;
  status: "available" | "reserved";
};

/** Payload público — sem PII de quem reservou */
export type StanPublicGift = {
  id: string;
  name: string;
  category: StanGiftCategoryId;
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

export const STAN_GIFTS_CATALOG: StanGiftItem[] = [
  // Brincar
  {
    id: "stan-blocos-montar",
    name: "Blocos de montar (Lego, Mega Bloks ou similares)",
    category: "brincar",
    status: "available",
  },
  {
    id: "stan-pista-carrinhos",
    name: "Pista de carrinhos",
    category: "brincar",
    status: "available",
  },
  {
    id: "stan-comboio-carris",
    name: "Comboio com carris",
    category: "brincar",
    status: "available",
  },
  {
    id: "stan-bonecos-accao",
    name: "Bonecos de acção (Spider-Man, Batman, Sonic, Catboy…)",
    category: "brincar",
    status: "available",
  },
  {
    id: "stan-tenda-infantil",
    name: "Tenda infantil",
    category: "brincar",
    status: "available",
  },
  // Aprender
  {
    id: "stan-quebra-cabecas",
    name: "Quebra-cabeças (24 a 36 peças)",
    category: "aprender",
    status: "available",
  },
  {
    id: "stan-jogos-memoria",
    name: "Jogos de memória",
    category: "aprender",
    status: "available",
  },
  {
    id: "stan-jogos-tabuleiro",
    name: "Jogos de tabuleiro infantis",
    category: "aprender",
    status: "available",
  },
  {
    id: "stan-jogos-logica",
    name: "Jogos de raciocínio e lógica",
    category: "aprender",
    status: "available",
  },
  {
    id: "stan-livros-infantis",
    name: "Livros infantis (10 a 20 páginas, Português ou Inglês)",
    category: "aprender",
    status: "available",
  },
  {
    id: "stan-kit-ciencias",
    name: "Kit de experiências científicas",
    category: "aprender",
    status: "available",
  },
  // Ar livre
  {
    id: "stan-bicicleta",
    name: "Bicicleta",
    category: "ar-livre",
    status: "available",
  },
  {
    id: "stan-patinete",
    name: "Patinete",
    category: "ar-livre",
    status: "available",
  },
  {
    id: "stan-kit-futebol",
    name: "Kit de futebol infantil",
    category: "ar-livre",
    status: "available",
  },
  {
    id: "stan-kit-basquete",
    name: "Kit de basquete infantil",
    category: "ar-livre",
    status: "available",
  },
  // Criar
  {
    id: "stan-mesa-actividades",
    name: "Mesa de actividades infantil",
    category: "criar",
    status: "available",
  },
  {
    id: "stan-kit-desenho",
    name: "Kit de desenho e pintura",
    category: "criar",
    status: "available",
  },
  {
    id: "stan-massa-modelar",
    name: "Massa de modelar com acessórios",
    category: "criar",
    status: "available",
  },
  {
    id: "stan-quadro-magnetico",
    name: "Quadro magnético para desenhar",
    category: "criar",
    status: "available",
  },
  {
    id: "stan-instrumento",
    name: "Instrumento musical infantil",
    category: "criar",
    status: "available",
  },
];

export function getStanGiftById(id: string): StanGiftItem | undefined {
  return STAN_GIFTS_CATALOG.find((g) => g.id === id);
}
