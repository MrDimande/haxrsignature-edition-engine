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

export type BabyAyllaGiftDefinition = {
  readonly id: string;
  readonly name: string;
  readonly category: BabyAyllaGiftCategoryId;
  readonly description: string;
  readonly imagePath?: string;
  readonly totalQuantity: number;
  readonly priority: "high" | "standard";
  readonly approvedByFamily: boolean;
  readonly enabled: boolean;
};

export const AYLLA_GIFT_CATEGORIES: readonly BabyAyllaGiftCategory[] = [
  {
    id: "cantinho-dos-sonhos",
    title: "O Cantinho dos Sonhos da Aylla",
    lead: "Peças para um quarto sereno, acolhedor e cheio de imaginação.",
    featured: true,
  },
  { id: "guarda-roupa", title: "O Guarda-Roupa da Aylla", lead: "Pequenos detalhes para crescer com delicadeza." },
  { id: "bonecas-companhia", title: "Bonecas & Companhia", lead: "Companheiras para histórias, afecto e imaginação." },
  { id: "descobrir-aprender", title: "Descobrir & Aprender", lead: "Descobertas que acompanham os primeiros anos." },
  { id: "brincar-explorar", title: "Brincar & Explorar", lead: "Convites suaves ao movimento e à curiosidade." },
  { id: "pequenos-essenciais", title: "Pequenos Essenciais", lead: "Gestos úteis, escolhidos com carinho." },
  { id: "tesouros-recordacoes", title: "Tesouros & Recordações", lead: "Peças para guardar os momentos mais bonitos." },
] as const;

/**
 * Family approval has not been supplied. Do not add candidate products here:
 * an empty immutable catalog prevents invented names, quantities or images.
 */
export const AYLLA_GIFT_CATALOG: readonly BabyAyllaGiftDefinition[] = [] as const;

export type BabyAyllaPublicGift = Pick<
  BabyAyllaGiftDefinition,
  "id" | "name" | "category" | "description" | "imagePath" | "totalQuantity" | "priority"
> & { readonly status: "available" | "reserved" };

export function getBabyAyllaPublicGiftCatalog(): readonly BabyAyllaPublicGift[] {
  return AYLLA_GIFT_CATALOG.filter((gift) => gift.enabled && gift.approvedByFamily).map((gift) => ({
    id: gift.id,
    name: gift.name,
    category: gift.category,
    description: gift.description,
    imagePath: gift.imagePath,
    totalQuantity: gift.totalQuantity,
    priority: gift.priority,
    status: "available",
  }));
}
