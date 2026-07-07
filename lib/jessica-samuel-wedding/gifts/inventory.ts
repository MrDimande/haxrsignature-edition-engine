export type WeddingGiftReserveInput = {
  itemId: string;
  guestName: string;
  guestPhone: string;
  quantity: number;
  message?: string;
  slug: string;
};

export type WeddingGiftReserveResult =
  | {
      success: true;
      items?: unknown[];
    }
  | {
      success: false;
      error: string;
      code?: string;
      items?: unknown[];
      available?: number;
    };

export function __isJessicaSamuelGiftFileStoreAllowedForTests(
  env: NodeJS.ProcessEnv
): boolean {
  if (env.GIFT_REGISTRY_FORCE_FILE === "1") return true;
  if (env.NODE_ENV === "production" || env.VERCEL_ENV === "production") {
    return false;
  }
  return !env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY;
}

export async function reserveJessicaSamuelGift(
  input: WeddingGiftReserveInput
): Promise<WeddingGiftReserveResult> {
  void input;
  return {
    success: false,
    code: "GIFT_REGISTRY_CLOSED",
    error: "A lista de presentes ainda não está disponível.",
  };
}
