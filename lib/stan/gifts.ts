import fs from "fs";
import path from "path";
import { getEditionDatabaseProvider } from "@lib/db";
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

type ReservationAttempt = {
  success: boolean;
  error?: string;
};

const RESERVATION_INTERNAL_ERROR =
  "Ocorreu um erro interno ao processar a reserva.";

/**
 * Interpreta exclusivamente o contrato público da RPC de reserva. Só um
 * conflito explícito pode activar a tentativa do próximo slot.
 */
export function parseStanGiftReservationRpcResponse(
  data: unknown
): ReservationAttempt {
  if (typeof data !== "object" || data === null) {
    return { success: false, error: RESERVATION_INTERNAL_ERROR };
  }

  const payload = data as { ok?: unknown; error?: unknown };
  if (payload.ok === true) {
    return { success: true };
  }

  if (payload.error === "already_reserved") {
    return { success: false, error: "already_reserved" };
  }

  if (typeof payload.error === "string" && payload.error.trim().length > 0) {
    return { success: false, error: payload.error };
  }

  return { success: false, error: RESERVATION_INTERNAL_ERROR };
}

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

async function getReservationsFromDb(): Promise<Reservation[]> {
  const provider = getEditionDatabaseProvider();
  const rows = await provider.listGiftReservations(STAN_GIFTS_REGISTRY_KEY);
  return rows.map((row) => ({
    giftId: row.gift_id,
    reservedBy: row.reserved_by,
    timestamp: row.created_at,
  }));
}

async function getReservations(): Promise<Reservation[]> {
  const provider = getEditionDatabaseProvider();
  if (provider.isConfigured()) {
    try {
      return await getReservationsFromDb();
    } catch (err) {
      if (process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production") {
        console.error("[Stan gifts] Fail-closed: database read failed in production:", err);
        throw err;
      }
      return getReservationsFromFile();
    }
  }
  return getReservationsFromFile();
}

let localFileMutexChain = Promise.resolve();

async function reserveSlotInFile(
  slotId: string,
  reservedBy: string
): Promise<ReservationAttempt> {
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
        resolve({ success: false, error: RESERVATION_INTERNAL_ERROR });
      });
  });
}

async function reserveSlotInDb(
  slotId: string,
  reservedBy: string,
  giftName: string
): Promise<ReservationAttempt> {
  const provider = getEditionDatabaseProvider();
  try {
    const result = await provider.reserveGift(
      STAN_GIFTS_REGISTRY_KEY,
      slotId,
      reservedBy.trim(),
      giftName
    );
    return parseStanGiftReservationRpcResponse(result);
  } catch (err: any) {
    console.error("[Stan gifts] reserve in DB failed:", err?.message || err);
    return {
      success: false,
      error: RESERVATION_INTERNAL_ERROR,
    };
  }
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
  const provider = getEditionDatabaseProvider();

  for (const slotCandidate of freeSlots) {
    const result = provider.isConfigured()
      ? await reserveSlotInDb(slotCandidate, name, group.name)
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
      error: result.error || RESERVATION_INTERNAL_ERROR,
      gifts: updatedGifts,
    };
  }

  const updatedGifts = await getStanPublicGifts();
  return {
    success: false,
    error: lastConflict ? "Este presente já se encontra esgotado." : RESERVATION_INTERNAL_ERROR,
    gifts: updatedGifts,
  };
}
