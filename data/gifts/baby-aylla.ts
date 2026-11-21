export type BabyAyllaGiftCategoryId =
  | "cantinho-dos-sonhos"
  | "guarda-roupa"
  | "bonecas-companhia"
  | "descobrir-aprender"
  | "brincar-explorar"
  | "pequenos-essenciais"
  | "tesouros-recordacoes";

export type BabyAyllaGiftCategory = {
  readonly id: BabyAyllaGiftCategoryId;
  readonly title: string;
  readonly lead: string;
  readonly featured?: boolean;
};

export type BabyAyllaFamilyApproval = "pending" | "approved" | "adjust" | "rejected";
export type BabyAyllaCandidateReviewFlag =
  | "age-safety" | "dimensions" | "size" | "colour" | "material" | "personalisation" | "overlap-review";

/** Internal family-review record. Never expose this type through a public route. */
export type BabyAyllaGiftCandidate = {
  readonly id: string;
  readonly name: string;
  readonly category: BabyAyllaGiftCategoryId;
  readonly description: string;
  readonly priority: "high" | "standard";
  readonly suggestedQuantity: null;
  readonly approvedQuantity: null;
  readonly size: null;
  readonly colorPreference: null;
  readonly specifications: null;
  readonly referenceImage: null;
  readonly familyApproval: "pending";
  readonly approvedByFamily: false;
  readonly enabled: false;
  readonly reviewFlags: readonly BabyAyllaCandidateReviewFlag[];
};

export const AYLLA_GIFT_CATEGORIES: readonly BabyAyllaGiftCategory[] = [
  { id: "cantinho-dos-sonhos", title: "O Cantinho dos Sonhos da Aylla", lead: "Peças para um quarto sereno, acolhedor e cheio de imaginação.", featured: true },
  { id: "guarda-roupa", title: "O Guarda-Roupa da Aylla", lead: "Pequenos detalhes para crescer com delicadeza." },
  { id: "bonecas-companhia", title: "Bonecas & Companhia", lead: "Companheiras para histórias, afecto e imaginação." },
  { id: "descobrir-aprender", title: "Descobrir & Aprender", lead: "Descobertas que acompanham os primeiros anos." },
  { id: "brincar-explorar", title: "Brincar & Explorar", lead: "Convites suaves ao movimento e à curiosidade." },
  { id: "pequenos-essenciais", title: "Pequenos Essenciais", lead: "Gestos úteis, escolhidos com carinho." },
  { id: "tesouros-recordacoes", title: "Tesouros & Recordações", lead: "Peças para guardar os momentos mais bonitos." },
] as const;

const pending = {
  suggestedQuantity: null, approvedQuantity: null, size: null, colorPreference: null,
  specifications: null, referenceImage: null, familyApproval: "pending",
  approvedByFamily: false, enabled: false,
} as const;

const candidate = (
  id: string, name: string, category: BabyAyllaGiftCategoryId, description: string,
  priority: "high" | "standard", reviewFlags: readonly BabyAyllaCandidateReviewFlag[] = []
): BabyAyllaGiftCandidate => ({ id, name, category, description, priority, reviewFlags, ...pending });

/**
 * Phase B family-review shortlist. It contains exactly the 52 candidates from
 * the approved brief, but no family approval, quantities, sizes, brands,
 * suppliers, images or public activation.
 */
export const AYLLA_GIFT_CANDIDATES: readonly BabyAyllaGiftCandidate[] = [
  candidate("dream-cot-sheets", "Lençóis de berço", "cantinho-dos-sonhos", "Base têxtil para o cantinho de descanso.", "high", ["material", "dimensions", "age-safety"]),
  candidate("dream-blankets", "Cobertores e mantinhas", "cantinho-dos-sonhos", "Camadas de aconchego para momentos acompanhados.", "high", ["material", "age-safety"]),
  candidate("dream-washable-rug", "Tapete infantil macio e lavável", "cantinho-dos-sonhos", "Textura suave para a área de brincar do quarto.", "high", ["dimensions", "material", "age-safety"]),
  candidate("dream-childrens-lamp", "Candeeiro infantil", "cantinho-dos-sonhos", "Luz decorativa para o quarto da Aylla.", "high", ["dimensions", "age-safety"]),
  candidate("dream-night-light", "Luz de presença nocturna", "cantinho-dos-sonhos", "Ponto de luz suave para a rotina nocturna.", "high", ["age-safety"]),
  candidate("dream-decorative-frames", "Quadros decorativos infantis", "cantinho-dos-sonhos", "Peças visuais para compor a parede do quarto.", "high", ["dimensions"]),
  candidate("dream-personalised-name-decor", "Decoração personalizada com o nome Aylla", "cantinho-dos-sonhos", "Peça de assinatura para o quarto da Aylla.", "high", ["personalisation", "dimensions"]),
  candidate("dream-toy-baskets", "Cestos organizadores de brinquedos", "cantinho-dos-sonhos", "Organização discreta para os pequenos tesouros.", "high", ["dimensions", "material"]),
  candidate("dream-keepsake-box", "Caixa de recordações", "cantinho-dos-sonhos", "Arquivo delicado para memórias do quarto.", "high", ["material", "overlap-review"]),
  candidate("dream-growth-ruler", "Régua decorativa de crescimento", "cantinho-dos-sonhos", "Marco visual para acompanhar o crescimento.", "high", ["dimensions"]),
  candidate("dream-padded-changing-mat", "Trocador acolchoado", "cantinho-dos-sonhos", "Apoio prático para a rotina de cuidados.", "high", ["dimensions", "material", "age-safety"]),

  candidate("wardrobe-princess-dresses", "Vestidos de princesa", "guarda-roupa", "Peças especiais para dias de imaginação.", "standard", ["size", "colour", "material"]),
  candidate("wardrobe-occasion-dresses", "Vestidos para ocasiões especiais", "guarda-roupa", "Silhuetas para momentos de celebração.", "standard", ["size", "colour", "material"]),
  candidate("wardrobe-outing-sets", "Conjuntos de passeio", "guarda-roupa", "Coordenações leves para pequenos passeios.", "standard", ["size", "colour", "material"]),
  candidate("wardrobe-pyjamas", "Pijamas confortáveis", "guarda-roupa", "Conforto para a rotina de descanso.", "standard", ["size", "material"]),
  candidate("wardrobe-shoes", "Sapatos infantis", "guarda-roupa", "Calçado para os primeiros passos com elegância.", "standard", ["size", "colour"]),
  candidate("wardrobe-sandals", "Sandálias infantis", "guarda-roupa", "Calçado leve para dias luminosos.", "standard", ["size", "colour"]),
  candidate("wardrobe-casual-sets", "Conjuntos de roupa casual", "guarda-roupa", "Essenciais suaves para todos os dias.", "standard", ["size", "colour", "material"]),

  candidate("companions-12m-dolls", "Bonecas adequadas a partir de 12 meses", "bonecas-companhia", "Companhia imaginativa pensada para a idade da Aylla.", "standard", ["age-safety", "material"]),
  candidate("companions-teddy-bears", "Ursinhos de peluche", "bonecas-companhia", "Abraços suaves para momentos de afecto.", "standard", ["age-safety", "material"]),
  candidate("companions-cloth-dolls", "Bonecas de pano macias", "bonecas-companhia", "Companheiras de textura suave e acolhedora.", "standard", ["age-safety", "material"]),
  candidate("companions-animal-plush", "Peluches de animais", "bonecas-companhia", "Pequenos animais para histórias e brincadeira.", "standard", ["age-safety", "material"]),

  candidate("learn-activity-cube", "Cubo de actividades", "descobrir-aprender", "Exploração de gestos, formas e texturas.", "standard", ["age-safety"]),
  candidate("learn-shape-sorter", "Brinquedo de encaixar formas", "descobrir-aprender", "Descoberta de formas através do brincar.", "standard", ["age-safety"]),
  candidate("learn-ring-stack", "Torre de argolas para empilhar", "descobrir-aprender", "Coordenação e sequência em pequenos gestos.", "standard", ["age-safety"]),
  candidate("learn-stacking-cups", "Copos de empilhar", "descobrir-aprender", "Brincadeira de ritmo, altura e encaixe.", "standard", ["age-safety"]),
  candidate("learn-large-building-blocks", "Blocos de construção grandes", "descobrir-aprender", "Construções seguras para mãos curiosas.", "standard", ["age-safety", "material"]),
  candidate("learn-wooden-blocks", "Blocos de madeira", "descobrir-aprender", "Peças de descoberta com textura natural.", "standard", ["age-safety", "material"]),
  candidate("learn-board-books", "Livros de cartão resistentes", "descobrir-aprender", "Primeiras páginas para explorar em conjunto.", "standard", ["age-safety"]),
  candidate("learn-large-piece-puzzles", "Puzzles simples com peças grandes", "descobrir-aprender", "Pequenos desafios para descobrir e combinar.", "standard", ["age-safety"]),
  candidate("learn-childrens-instruments", "Instrumentos musicais infantis", "descobrir-aprender", "Som e ritmo para os primeiros momentos musicais.", "standard", ["age-safety"]),
  candidate("learn-activity-table", "Mesa de actividades", "descobrir-aprender", "Estação de exploração pensada para a idade.", "standard", ["dimensions", "age-safety"]),
  candidate("learn-soft-sensory-ball", "Bola sensorial macia", "descobrir-aprender", "Textura e movimento para a descoberta sensorial.", "standard", ["age-safety", "material"]),

  candidate("explore-activity-mat", "Tapete de actividades", "brincar-explorar", "Base confortável para explorar no chão.", "standard", ["dimensions", "material", "age-safety"]),
  candidate("explore-stable-push-toy", "Brinquedo de empurrar estável, adequado à idade", "brincar-explorar", "Apoio lúdico para movimento acompanhado.", "standard", ["age-safety"]),
  candidate("explore-small-slide", "Escorrega infantil pequeno", "brincar-explorar", "Pequena aventura para brincar com supervisão.", "standard", ["dimensions", "age-safety"]),
  candidate("explore-childrens-tent", "Tenda infantil", "brincar-explorar", "Refúgio de imaginação para brincar em casa.", "standard", ["dimensions", "age-safety"]),
  candidate("explore-water-play-table", "Mesa de brincar com água", "brincar-explorar", "Exploração de água sob supervisão.", "standard", ["dimensions", "age-safety"]),
  candidate("explore-large-soft-ball", "Bola grande e macia", "brincar-explorar", "Movimento suave para brincar acompanhado.", "standard", ["age-safety", "material"]),
  candidate("explore-small-inflatable-pool", "Piscina insuflável pequena", "brincar-explorar", "Brincadeira de água exclusivamente supervisionada.", "standard", ["dimensions", "age-safety"]),

  candidate("essentials-childrens-plates", "Pratos infantis", "pequenos-essenciais", "Peças práticas para as refeições da Aylla.", "standard", ["material"]),
  candidate("essentials-learning-cups", "Copos de aprendizagem", "pequenos-essenciais", "Apoio à rotina de beber com autonomia.", "standard", ["material", "age-safety"]),
  candidate("essentials-childrens-cutlery", "Talheres infantis", "pequenos-essenciais", "Pequenos talheres para as primeiras refeições.", "standard", ["material", "age-safety"]),
  candidate("essentials-feeding-chair", "Cadeira de alimentação", "pequenos-essenciais", "Lugar dedicado para refeições em família.", "standard", ["dimensions", "age-safety"]),
  candidate("essentials-childrens-backpack", "Mochila infantil", "pequenos-essenciais", "Pequena companhia para saídas e descobertas.", "standard", ["colour", "material"]),
  candidate("essentials-childrens-thermal-bottle", "Garrafa térmica infantil", "pequenos-essenciais", "Peça funcional para as rotinas fora de casa.", "standard", ["material", "age-safety"]),
  candidate("essentials-waterproof-bibs", "Babadores impermeáveis", "pequenos-essenciais", "Protecção prática para as refeições.", "standard", ["material"]),

  candidate("keepsakes-mana-dior-savings-bank", "Cofrinho para a poupança da Mana Dior", "tesouros-recordacoes", "Peça simbólica para começar a guardar sonhos.", "standard", ["personalisation"]),
  candidate("keepsakes-photo-album", "Álbum de fotografias", "tesouros-recordacoes", "Páginas para reunir os primeiros momentos.", "standard"),
  candidate("keepsakes-personalised-memory-box", "Caixa de recordações personalizada", "tesouros-recordacoes", "Arquivo personalizado para memórias preciosas.", "standard", ["personalisation", "overlap-review"]),
  candidate("keepsakes-first-year-memory-book", "Livro de memórias do primeiro ano", "tesouros-recordacoes", "Registo delicado do primeiro ano da Aylla.", "standard"),
  candidate("keepsakes-personalised-commemorative-gift", "Presente comemorativo personalizado", "tesouros-recordacoes", "Peça de celebração a definir com a família.", "standard", ["personalisation"]),
] as const;

/** Public inventory stays empty until separately authorised family approval and activation. */
export type BabyAyllaGiftDefinition = never;
export const AYLLA_GIFT_CATALOG: readonly BabyAyllaGiftDefinition[] = [] as const;

export type BabyAyllaPublicGift = {
  readonly id: string;
  readonly name: string;
  readonly category: BabyAyllaGiftCategoryId;
  readonly description: string;
  readonly imagePath?: string;
  readonly totalQuantity: number;
  readonly priority: "high" | "standard";
  readonly status: "available" | "reserved";
};

export function getBabyAyllaPublicGiftCatalog(): readonly BabyAyllaPublicGift[] {
  return [];
}
