export type GiftCategory =
  | "electrodomesticos"
  | "cozinha"
  | "loica-mesa"
  | "sala"
  | "decoracao";

export interface AlexandrinaKennethGiftDefinition {
  id: string;
  name: string;
  category: GiftCategory;
  categoryLabel: string;
  totalQuantity: number;
}

export interface AlexandrinaKennethPublicGiftItem extends AlexandrinaKennethGiftDefinition {
  selectedQuantity: number;
  availableQuantity: number;
  status: "available" | "partial" | "reserved";
}

export const ALEXANDRINA_KENNETH_CATEGORIES: Array<{
  id: GiftCategory | "todas";
  label: string;
}> = [
  { id: "todas", label: "Todas as Categorias" },
  { id: "electrodomesticos", label: "Electrodomésticos" },
  { id: "cozinha", label: "Cozinha" },
  { id: "loica-mesa", label: "Loiça e mesa" },
  { id: "sala", label: "Sala de jantar e estar" },
  { id: "decoracao", label: "Decoração" },
];

export const ALEXANDRINA_KENNETH_CATALOG: AlexandrinaKennethGiftDefinition[] = [
  // 1. Electrodomésticos (1 unidade por artigo)
  {
    id: "batedeira",
    name: "Batedeira",
    category: "electrodomesticos",
    categoryLabel: "Electrodomésticos",
    totalQuantity: 1,
  },
  {
    id: "liquidificadora",
    name: "Liquidificadora",
    category: "electrodomesticos",
    categoryLabel: "Electrodomésticos",
    totalQuantity: 1,
  },
  {
    id: "micro-ondas",
    name: "Micro-ondas",
    category: "electrodomesticos",
    categoryLabel: "Electrodomésticos",
    totalQuantity: 1,
  },
  {
    id: "chaleira-electrica",
    name: "Chaleira eléctrica",
    category: "electrodomesticos",
    categoryLabel: "Electrodomésticos",
    totalQuantity: 1,
  },
  {
    id: "torradeira",
    name: "Torradeira",
    category: "electrodomesticos",
    categoryLabel: "Electrodomésticos",
    totalQuantity: 1,
  },
  {
    id: "sanduicheira",
    name: "Sanduicheira",
    category: "electrodomesticos",
    categoryLabel: "Electrodomésticos",
    totalQuantity: 1,
  },
  {
    id: "panela-electrica-arroz",
    name: "Panela eléctrica de arroz",
    category: "electrodomesticos",
    categoryLabel: "Electrodomésticos",
    totalQuantity: 1,
  },

  // 2. Cozinha (1 unidade por artigo)
  {
    id: "panela-pressao",
    name: "Panela de pressão",
    category: "cozinha",
    categoryLabel: "Cozinha",
    totalQuantity: 1,
  },
  {
    id: "conjunto-frigideiras",
    name: "Conjunto de frigideiras",
    category: "cozinha",
    categoryLabel: "Cozinha",
    totalQuantity: 1,
  },
  {
    id: "conjunto-facas",
    name: "Conjunto de facas",
    category: "cozinha",
    categoryLabel: "Cozinha",
    totalQuantity: 1,
  },
  {
    id: "conjunto-utensilios",
    name: "Conjunto de utensílios",
    category: "cozinha",
    categoryLabel: "Cozinha",
    totalQuantity: 1,
  },
  {
    id: "tabuas-corte",
    name: "Tábuas de corte",
    category: "cozinha",
    categoryLabel: "Cozinha",
    totalQuantity: 1,
  },
  {
    id: "escorredor-loica",
    name: "Escorredor de loiça",
    category: "cozinha",
    categoryLabel: "Cozinha",
    totalQuantity: 1,
  },
  {
    id: "forma-bolos",
    name: "Forma para bolos",
    category: "cozinha",
    categoryLabel: "Cozinha",
    totalQuantity: 1,
  },
  // Cozinha (2 unidades por artigo)
  {
    id: "conjunto-panelas",
    name: "Conjunto de panelas",
    category: "cozinha",
    categoryLabel: "Cozinha",
    totalQuantity: 2,
  },
  {
    id: "conjunto-recipientes-hermeticos",
    name: "Conjunto de recipientes herméticos",
    category: "cozinha",
    categoryLabel: "Cozinha",
    totalQuantity: 2,
  },
  {
    id: "travessa-forno",
    name: "Travessa para forno",
    category: "cozinha",
    categoryLabel: "Cozinha",
    totalQuantity: 2,
  },

  // 3. Loiça e mesa (1 unidade por artigo)
  {
    id: "jarro-agua",
    name: "Jarro de água",
    category: "loica-mesa",
    categoryLabel: "Loiça e mesa",
    totalQuantity: 1,
  },
  {
    id: "saladeira",
    name: "Saladeira",
    category: "loica-mesa",
    categoryLabel: "Loiça e mesa",
    totalQuantity: 1,
  },
  {
    id: "sopeira",
    name: "Sopeira",
    category: "loica-mesa",
    categoryLabel: "Loiça e mesa",
    totalQuantity: 1,
  },
  {
    id: "travessa-servir",
    name: "Travessa de servir",
    category: "loica-mesa",
    categoryLabel: "Loiça e mesa",
    totalQuantity: 1,
  },
  // Loiça e mesa (2 unidades por artigo)
  {
    id: "conjuntos-pratos-rasos",
    name: "Conjuntos de pratos rasos",
    category: "loica-mesa",
    categoryLabel: "Loiça e mesa",
    totalQuantity: 2,
  },
  {
    id: "conjuntos-pratos-fundos",
    name: "Conjuntos de pratos fundos",
    category: "loica-mesa",
    categoryLabel: "Loiça e mesa",
    totalQuantity: 2,
  },
  {
    id: "conjuntos-pratos-sobremesa",
    name: "Conjuntos de pratos de sobremesa",
    category: "loica-mesa",
    categoryLabel: "Loiça e mesa",
    totalQuantity: 2,
  },
  {
    id: "conjuntos-talheres",
    name: "Conjuntos de talheres",
    category: "loica-mesa",
    categoryLabel: "Loiça e mesa",
    totalQuantity: 2,
  },
  {
    id: "conjuntos-copos-agua",
    name: "Conjuntos de copos de água",
    category: "loica-mesa",
    categoryLabel: "Loiça e mesa",
    totalQuantity: 2,
  },
  {
    id: "conjuntos-tacas",
    name: "Conjuntos de taças",
    category: "loica-mesa",
    categoryLabel: "Loiça e mesa",
    totalQuantity: 2,
  },
  {
    id: "conjuntos-chavenas-pires",
    name: "Conjuntos de chávenas com pires",
    category: "loica-mesa",
    categoryLabel: "Loiça e mesa",
    totalQuantity: 2,
  },
  {
    id: "conjuntos-tigelas",
    name: "Conjuntos de tigelas",
    category: "loica-mesa",
    categoryLabel: "Loiça e mesa",
    totalQuantity: 2,
  },

  // 4. Sala de jantar e sala de estar (1 unidade por artigo)
  {
    id: "mesa-jantar-cadeiras",
    name: "Mesa de jantar com cadeiras",
    category: "sala",
    categoryLabel: "Sala de jantar e sala de estar",
    totalQuantity: 1,
  },
  {
    id: "aparador",
    name: "Aparador",
    category: "sala",
    categoryLabel: "Sala de jantar e sala de estar",
    totalQuantity: 1,
  },
  {
    id: "smart-tv",
    name: "Smart TV",
    category: "sala",
    categoryLabel: "Sala de jantar e sala de estar",
    totalQuantity: 1,
  },
  {
    id: "movel-tv",
    name: "Móvel para TV",
    category: "sala",
    categoryLabel: "Sala de jantar e sala de estar",
    totalQuantity: 1,
  },
  {
    id: "mesa-centro",
    name: "Mesa de centro",
    category: "sala",
    categoryLabel: "Sala de jantar e sala de estar",
    totalQuantity: 1,
  },
  {
    id: "tapete-sala",
    name: "Tapete de sala",
    category: "sala",
    categoryLabel: "Sala de jantar e sala de estar",
    totalQuantity: 1,
  },
  {
    id: "candeeiro-pe",
    name: "Candeeiro de pé",
    category: "sala",
    categoryLabel: "Sala de jantar e sala de estar",
    totalQuantity: 1,
  },
  // Sala de jantar e sala de estar (2 unidades por artigo)
  {
    id: "toalha-mesa",
    name: "Toalha de mesa",
    category: "sala",
    categoryLabel: "Sala de jantar e sala de estar",
    totalQuantity: 2,
  },
  {
    id: "conjunto-individuais-mesa",
    name: "Conjunto de individuais de mesa",
    category: "sala",
    categoryLabel: "Sala de jantar e sala de estar",
    totalQuantity: 2,
  },

  // 5. Decoração (1 unidade por artigo)
  {
    id: "espelho-decorativo",
    name: "Espelho decorativo",
    category: "decoracao",
    categoryLabel: "Decoração",
    totalQuantity: 1,
  },
  {
    id: "relogio-parede",
    name: "Relógio de parede",
    category: "decoracao",
    categoryLabel: "Decoração",
    totalQuantity: 1,
  },
  {
    id: "quadro-decorativo",
    name: "Quadro decorativo",
    category: "decoracao",
    categoryLabel: "Decoração",
    totalQuantity: 1,
  },
  // Decoração (2 unidades por artigo)
  {
    id: "vaso-decorativo",
    name: "Vaso decorativo",
    category: "decoracao",
    categoryLabel: "Decoração",
    totalQuantity: 2,
  },
  {
    id: "almofada-decorativa",
    name: "Almofada decorativa",
    category: "decoracao",
    categoryLabel: "Decoração",
    totalQuantity: 2,
  },
  {
    id: "moldura-fotografia",
    name: "Moldura para fotografia",
    category: "decoracao",
    categoryLabel: "Decoração",
    totalQuantity: 2,
  },
];
