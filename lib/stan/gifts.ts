import fs from "fs";
import path from "path";
import { createAdminClient, isSupabaseConfigured } from "@lib/supabase/server";
import {
  STAN_GIFT_GROUPS,
  getStanGiftGroupById,
  type StanPublicGift,
} from "./gifts-catalog";

export type { StanPublicGift };

export const STAN_GIFTS_REGISTRY_KEY = "stan-real-madrid" as const;

const RESERVATIONS_FILE = path.join(
  process.cwd(),
  "data",
  "gifts",
  "stan-reservations.json"
);

type Reservation = {
  giftId: string;
  reservedBy: string;
  timestamp: string;
};

function mergeCatalog(reservations: Reservation[]): StanPublicGift[] {
  const reservedSet = new Set(reservations.map((r) => r.giftId));

  return STAN_GIFT_GROUPS.map((group) => {
    const reservedCount = group.slots.filter((slotId) =>
      reservedSet.has(slotId)
    ).length;
    const totalQuantity = group.slots.length;
    const availableQuantity = Math.max(0, totalQuantity - reservedCount);
    const isExhausted = availableQuantity === 0;

    return {
      id: group.baseId,
      name: group.name,
      category: group.category,
      totalQuantity,
      reservedCount,
      availableQuantity,
      isExhausted,
      status: isExhausted ? ("reserved" as const) : ("available" as const),
    };
  });
}

async function getReservationsFromFile(): Promise<Reservation[]> {
  try {
    if (!fs.existsSync(RESERVATIONS_FILE)) return [];
    const content = await fs.promises.readFile(RESERVATIONS_FILE, "utf-8");
    return JSON.parse(content) as Reservation[];
  } catch {
    return [];
  }
}

async function writeReservationsToFile(reservations: Reservation[]) {
  const dir = path.dirname(RESERVATIONS_FILE);
  if (!fs.existsSync(dir)) {
    await fs.promises.mkdir(dir, { recursive: true });
  }
  await fs.promises.writeFile(
    RESERVATIONS_FILE,
    JSON.stringify(reservations, null, 2),
    "utf-8"
  );
}

async function getReservationsFromSupabase(): Promise<Reservation[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("edition_gift_reservations")
    .select("gift_id, reserved_by, created_at")
    .eq("registry_key", STAN_GIFTS_REGISTRY_KEY)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[Stan gifts] Supabase read failed:", error.message);
    throw error;
  }

  return (data ?? []).map((row) => ({
    giftId: row.gift_id,
    reservedBy: row.reserved_by,
    timestamp: row.created_at,
  }));
}

async function getReservations(): Promise<Reservation[]> {
  if (isSupabaseConfigured()) {
    try {
      return await getReservationsFromSupabase();
    } catch {
      return getReservationsFromFile();
    }
  }
  return getReservationsFromFile();
}

let localFileMutexChain = Promise.resolve();

async function reserveSlotInFile(
  slotId: string,
  reservedBy: string
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    localFileMutexChain = localFileMutexChain
      .then(async () => {
        const reservations = await getReservationsFromFile();
        if (reservations.some((r) => r.giftId === slotId)) {
          resolve({ success: false, error: "already_reserved" });
          return;
        }
        reservations.push({
          giftId: slotId,
          reservedBy: reservedBy.trim(),
          timestamp: new Date().toISOString(),
        });
        await writeReservationsToFile(reservations);
        resolve({ success: true });
      })
      .catch(() => {
        resolve({ success: false, error: "already_reserved" });
      });
  });
}

async function reserveSlotInSupabase(
  slotId: string,
  reservedBy: string,
  giftName: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("reserve_edition_gift", {
    p_registry_key: STAN_GIFTS_REGISTRY_KEY,
    p_gift_id: slotId,
    p_reserved_by: reservedBy.trim(),
    p_gift_name: giftName,
  });

  if (error) {
    console.error("[Stan gifts] reserve RPC failed:", error.message);
    return {
      success: false,
      error: "Ocorreu um erro interno ao processar a reserva.",
    };
  }

  const payload = data as { ok?: boolean; error?: string } | null;
  if (!payload?.ok) {
    return {
      success: false,
      error: payload?.error || "already_reserved",
    };
  }
  return { success: true };
}

export async function getStanPublicGifts(): Promise<StanPublicGift[]> {
  const reservations = await getReservations();
  return mergeCatalog(reservations);
}

export async function reserveStanGift(
  giftIdOrBaseId: string,
  reservedBy: string
): Promise<{
  success: boolean;
  error?: string;
  gifts?: StanPublicGift[];
  giftName?: string;
}> {
  const group = getStanGiftGroupById(giftIdOrBaseId);
  if (!group) {
    return { success: false, error: "Presente não encontrado." };
  }

  const name = reservedBy.trim();
  if (name.length < 2) {
    return {
      success: false,
      error: "Indique o seu nome para reservar o presente.",
    };
  }

  const reservations = await getReservations();
  const reservedSet = new Set(reservations.map((r) => r.giftId));

  const freeSlots = group.slots.filter((slotId) => !reservedSet.has(slotId));
  if (freeSlots.length === 0) {
    const gifts = mergeCatalog(reservations);
    return {
      success: false,
      error: "Este presente já se encontra esgotado.",
      gifts,
    };
  }

  let lastConflict = false;
  for (const slotCandidate of freeSlots) {
    const result = isSupabaseConfigured()
      ? await reserveSlotInSupabase(slotCandidate, name, group.name)
      : await reserveSlotInFile(slotCandidate, name);

    if (result.success) {
      const updatedGifts = await getStanPublicGifts();
      return {
        success: true,
        gifts: updatedGifts,
        giftName: group.name,
      };
    }

    // Se o erro for conflito de reserva (concorrência), tenta o próximo slot do grupo
    if (result.error === "already_reserved") {
      lastConflict = true;
      continue;
    }

    // Para qualquer outro erro (DB/auth/network), aborta imediatamente e devolve o erro real
    const updatedGifts = await getStanPublicGifts();
    return {
      success: false,
      error: result.error || "Ocorreu um erro interno ao processar a reserva.",
      gifts: updatedGifts,
    };
  }

  const updatedGifts = await getStanPublicGifts();
  return {
    success: false,
    error: lastConflict ? "Este presente já se encontra esgotado." : "Ocorreu um erro interno ao processar a reserva.",
    gifts: updatedGifts,
  };
}
