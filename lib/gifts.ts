import fs from "fs";
import path from "path";
import { ROSE_ELEGANCE_GIFTS, type GiftItem } from "@data/gifts/rose-elegance";
import { createAdminClient, isSupabaseConfigured } from "@lib/supabase/server";

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

let reservationPromiseChain = Promise.resolve();

function mergeCatalogWithReservations(
  reservations: Reservation[]
): GiftItem[] {
  return ROSE_ELEGANCE_GIFTS.map((gift) => {
    const reservation = reservations.find((r) => r.giftId === gift.id);
    if (reservation) {
      return {
        ...gift,
        status: "reserved",
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

async function getReservationsFromSupabase(): Promise<Reservation[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("edition_gift_reservations")
    .select("gift_id, reserved_by, created_at")
    .eq("registry_key", REGISTRY_KEY)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error reading gift reservations from Supabase:", error);
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
    return getReservationsFromSupabase();
  }
  return getReservationsFromFile();
}

async function reserveGiftInSupabase(
  giftId: string,
  reservedBy: string,
  giftName: string
): Promise<{ success: boolean; error?: string; conflictName?: string }> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("reserve_edition_gift", {
    p_registry_key: REGISTRY_KEY,
    p_gift_id: giftId,
    p_reserved_by: reservedBy.trim(),
    p_gift_name: giftName,
  });

  if (error) {
    console.error("Supabase reserve_edition_gift failed:", error.message);
    return { success: false, error: "Ocorreu um erro interno ao processar a reserva." };
  }

  const payload = data as {
    ok?: boolean;
    error?: string;
    reservedBy?: string;
  } | null;

  if (payload?.ok) {
    return { success: true };
  }

  if (payload?.error === "already_reserved") {
    return {
      success: false,
      error: `Este presente já foi oferecido por ${payload.reservedBy || "outra convidada"}.`,
      conflictName: payload.reservedBy,
    };
  }

  return {
    success: false,
    error: "Ocorreu um erro interno ao processar a reserva.",
  };
}

async function reserveGiftInFile(
  giftId: string,
  reservedBy: string
): Promise<{ success: boolean; error?: string }> {
  const reservations = await getReservationsFromFile();
  const alreadyReserved = reservations.some((r) => r.giftId === giftId);
  if (alreadyReserved) {
    const reservedItem = mergeCatalogWithReservations(reservations).find(
      (g) => g.id === giftId
    );
    return {
      success: false,
      error: `Este presente já foi oferecido por ${reservedItem?.reservedBy || "outra convidada"}.`,
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

export async function getMergedGifts(): Promise<GiftItem[]> {
  const reservations = await getReservations();
  return mergeCatalogWithReservations(reservations);
}

export async function reserveGift(
  giftId: string,
  reservedBy: string
): Promise<{
  success: boolean;
  error?: string;
  gifts?: GiftItem[];
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

        const result = isSupabaseConfigured()
          ? await reserveGiftInSupabase(giftId, reservedBy, staticGift.name)
          : await reserveGiftInFile(giftId, reservedBy);

        if (!result.success) {
          const merged = await getMergedGifts();
          resolve({ success: false, error: result.error, gifts: merged });
          return;
        }

        const updatedGifts = await getMergedGifts();
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
