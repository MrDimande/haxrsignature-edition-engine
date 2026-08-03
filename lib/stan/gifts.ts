/**
 * Reservas de presentes — Stan
 * File local + Supabase (registry_key = stan-real-madrid) quando configurado.
 */

import fs from "fs";
import path from "path";
import { createAdminClient, isSupabaseConfigured } from "@lib/supabase/server";
import {
  STAN_GIFTS_CATALOG,
  getStanGiftById,
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
  return STAN_GIFTS_CATALOG.map((gift) => {
    const reserved = reservations.some((r) => r.giftId === gift.id);
    return {
      id: gift.id,
      name: gift.name,
      category: gift.category,
      status: reserved ? ("reserved" as const) : ("available" as const),
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

async function reserveInFile(
  giftId: string,
  reservedBy: string
): Promise<{ success: boolean; error?: string }> {
  const reservations = await getReservationsFromFile();
  if (reservations.some((r) => r.giftId === giftId)) {
    return { success: false, error: "Este presente já foi reservado." };
  }
  reservations.push({
    giftId,
    reservedBy: reservedBy.trim(),
    timestamp: new Date().toISOString(),
  });
  await writeReservationsToFile(reservations);
  return { success: true };
}

async function reserveInSupabase(
  giftId: string,
  reservedBy: string,
  giftName: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("reserve_edition_gift", {
    p_registry_key: STAN_GIFTS_REGISTRY_KEY,
    p_gift_id: giftId,
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
      error: payload?.error || "Este presente já foi reservado.",
    };
  }
  return { success: true };
}

export async function getStanPublicGifts(): Promise<StanPublicGift[]> {
  const reservations = await getReservations();
  return mergeCatalog(reservations);
}

let reserveChain = Promise.resolve();

export async function reserveStanGift(
  giftId: string,
  reservedBy: string
): Promise<{
  success: boolean;
  error?: string;
  gifts?: StanPublicGift[];
  giftName?: string;
}> {
  return new Promise((resolve) => {
    reserveChain = reserveChain
      .then(async () => {
        const gift = getStanGiftById(giftId);
        if (!gift) {
          resolve({ success: false, error: "Presente não encontrado." });
          return;
        }

        const name = reservedBy.trim();
        if (name.length < 2) {
          resolve({
            success: false,
            error: "Indique o seu nome para reservar o presente.",
          });
          return;
        }

        const result = isSupabaseConfigured()
          ? await reserveInSupabase(giftId, name, gift.name)
          : await reserveInFile(giftId, name);

        if (!result.success) {
          const gifts = await getStanPublicGifts();
          resolve({ success: false, error: result.error, gifts });
          return;
        }

        const gifts = await getStanPublicGifts();
        resolve({ success: true, gifts, giftName: gift.name });
      })
      .catch((err) => {
        console.error("[Stan gifts] reserve queue error:", err);
        resolve({
          success: false,
          error: "Ocorreu um erro interno ao processar a reserva.",
        });
      });
  });
}
