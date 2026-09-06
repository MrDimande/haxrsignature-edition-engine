import fs from "fs";
import path from "path";
import { ROSE_ELEGANCE_GIFTS, type GiftItem } from "@data/gifts/rose-elegance";
import { getEditionDatabaseProvider } from "@lib/db";

const REGISTRY_KEY = "rose-elegance";

const RESERVATIONS_FILE = path.join(
  process.cwd(),
  "data",
  "gifts",
  "reservations.json"
);

type Reservation = {
  giftId: string;
  reservedBy: string;
  timestamp: string;
};

/** Public gift payload — never includes reservation PII */
export type PublicGiftItem = {
  id: string;
  name: string;
  category: GiftItem["category"];
  status: "available" | "reserved";
  popularityScore?: number;
  emotionalTag?: string;
};

export function toPublicGift(gift: GiftItem): PublicGiftItem {
  return {
    id: gift.id,
    name: gift.name,
    category: gift.category,
    status: gift.status === "reserved" ? "reserved" : "available",
    ...(gift.popularityScore !== undefined
      ? { popularityScore: gift.popularityScore }
      : {}),
    ...(gift.emotionalTag ? { emotionalTag: gift.emotionalTag } : {}),
  };
}

export function toPublicGifts(gifts: GiftItem[]): PublicGiftItem[] {
  return gifts.map(toPublicGift);
}

let reservationPromiseChain = Promise.resolve();

function mergeCatalogWithReservations(
  reservations: Reservation[]
): GiftItem[] {
  return ROSE_ELEGANCE_GIFTS.map((gift) => {
    const reservation = reservations.find((r) => r.giftId === gift.id);
    if (reservation) {
      return {
        ...gift,
        status: "reserved" as const,
        reservedBy: reservation.reservedBy,
        timestamp: reservation.timestamp,
        reservedAt: reservation.timestamp,
      };
    }
    return gift;
  });
}

async function getReservationsFromFile(): Promise<Reservation[]> {
  try {
    if (!fs.existsSync(RESERVATIONS_FILE)) {
      return [];
    }
    const content = await fs.promises.readFile(RESERVATIONS_FILE, "utf-8");
    return JSON.parse(content) as Reservation[];
  } catch (error) {
    console.error("Error reading gift reservations file:", error);
    return [];
  }
}

async function saveReservationsToFile(
  reservations: Reservation[]
): Promise<void> {
  try {
    const dir = path.dirname(RESERVATIONS_FILE);
    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, { recursive: true });
    }
    await fs.promises.writeFile(
      RESERVATIONS_FILE,
      JSON.stringify(reservations, null, 2),
      "utf-8"
    );
  } catch (error) {
    console.error("Error writing gift reservations file:", error);
  }
}

async function getReservationsFromDb(): Promise<Reservation[]> {
  const provider = getEditionDatabaseProvider();
  const rows = await provider.listGiftReservations(REGISTRY_KEY);
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
    } catch (error) {
      if (process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production") {
        console.error("[Gifts] Fail-closed: database read failed in production:", error);
        throw error;
      }
      return getReservationsFromFile();
    }
  }
  return getReservationsFromFile();
}

async function reserveGiftInDb(
  giftId: string,
  reservedBy: string,
  giftName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const provider = getEditionDatabaseProvider();
    const payload = await provider.reserveGift(
      REGISTRY_KEY,
      giftId,
      reservedBy.trim(),
      giftName
    );

    if (payload.ok) {
      return { success: true };
    }

    if (payload.error === "already_reserved") {
      return {
        success: false,
        error: "Este presente já foi reservado por outra convidada.",
      };
    }

    return {
      success: false,
      error: payload.error || "Ocorreu um erro interno ao processar a reserva.",
    };
  } catch (err: any) {
    console.error("[Gifts] reserveGiftInDb error:", err?.message || err);
    return {
      success: false,
      error: "Ocorreu um erro interno ao processar a reserva.",
    };
  }
}

async function reserveGiftInFile(
  giftId: string,
  reservedBy: string
): Promise<{ success: boolean; error?: string }> {
  const reservations = await getReservationsFromFile();
  const alreadyReserved = reservations.some((r) => r.giftId === giftId);
  if (alreadyReserved) {
    return {
      success: false,
      error: "Este presente já foi reservado por outra convidada.",
    };
  }

  const newReservation: Reservation = {
    giftId,
    reservedBy: reservedBy.trim(),
    timestamp: new Date().toISOString(),
  };

  await saveReservationsToFile([...reservations, newReservation]);
  return { success: true };
}

/** Internal merge — may include reservedBy for email notifications only */
export async function getMergedGifts(): Promise<GiftItem[]> {
  const reservations = await getReservations();
  return mergeCatalogWithReservations(reservations);
}

/** Public catalog — strips all reservation PII */
export async function getPublicGifts(): Promise<PublicGiftItem[]> {
  const merged = await getMergedGifts();
  return toPublicGifts(merged);
}

export async function reserveGift(
  giftId: string,
  reservedBy: string,
  _registryKey = REGISTRY_KEY
): Promise<{
  success: boolean;
  error?: string;
  gifts?: PublicGiftItem[];
  giftName?: string;
}> {
  return new Promise((resolve) => {
    reservationPromiseChain = reservationPromiseChain
      .then(async () => {
        const staticGift = ROSE_ELEGANCE_GIFTS.find((g) => g.id === giftId);
        if (!staticGift) {
          resolve({ success: false, error: "Presente não encontrado." });
          return;
        }

        if (staticGift.category === "noiva") {
          resolve({
            success: false,
            error: "Este item é apenas informativo e não pode ser selecionado.",
          });
          return;
        }

        const provider = getEditionDatabaseProvider();
        const result = provider.isConfigured()
          ? await reserveGiftInDb(giftId, reservedBy, staticGift.name)
          : await reserveGiftInFile(giftId, reservedBy);

        if (!result.success) {
          const merged = await getPublicGifts();
          resolve({ success: false, error: result.error, gifts: merged });
          return;
        }

        const updatedGifts = await getPublicGifts();
        resolve({ success: true, gifts: updatedGifts, giftName: staticGift.name });
      })
      .catch((err) => {
        console.error("Queue execution error in reserveGift:", err);
        resolve({
          success: false,
          error: "Ocorreu um erro interno ao processar a reserva.",
        });
      });
  });
}
