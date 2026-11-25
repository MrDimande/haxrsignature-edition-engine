import {
  AYLLA_GIFT_CANDIDATES,
  AYLLA_GIFT_CATEGORIES,
  type BabyAyllaGiftCategoryId,
  type BabyAyllaGiftCategory,
} from "@data/gifts/baby-aylla";

/**
 * Public-safe editorial gallery projection for Baby Aylla gifts.
 * Never exposes internal curation flags (`reviewFlags`, `familyApproval`),
 * speculative quantities, or unconfirmed prices.
 */
export type BabyAyllaEditorialGalleryItem = {
  readonly id: string;
  readonly name: string;
  readonly category: BabyAyllaGiftCategoryId;
  readonly description: string;
  readonly priority: "high" | "standard";
};

export const BABY_AYLLA_EDITORIAL_CATEGORIES: readonly BabyAyllaGiftCategory[] =
  AYLLA_GIFT_CATEGORIES;

export function getBabyAyllaEditorialGalleryItems(): readonly BabyAyllaEditorialGalleryItem[] {
  return AYLLA_GIFT_CANDIDATES.filter((item) => item.approvedByFamily).map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    description: item.description,
    priority: item.priority,
  }));
}
