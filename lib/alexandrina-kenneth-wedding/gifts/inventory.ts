import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import {
  ALEXANDRINA_KENNETH_CATALOG,
  type AlexandrinaKennethGiftDefinition,
  type AlexandrinaKennethPublicGiftItem,
} from "@data/gifts/alexandrina-kenneth";
import { getEditionDatabaseProvider } from "@lib/db";
import { getNeonPool } from "@lib/db/neon-client";

export const ALEXANDRINA_KENNETH_REGISTRY_KEY = "alexandrina-kenneth";

const RESERVATIONS_FILE = path.join(
  process.cwd(),
  "data",
  "gifts",
  "alexandrina-kenneth-reservations.json"
);

export type AlexandrinaKennethReservation = {
  id: string;
  itemId: string;
  guestName: string;
  guestPhone?: string;
  quantity: number;
  message?: string;
  timestamp: string;
};

export type ReserveAlexandrinaKennethGiftInput = {
  itemId: string;
  guestName: string;
  guestPhone?: string;
  quantity: number;
  message?: string;
  slug?: string;
};

export type ReserveAlexandrinaKennethGiftResult =
  | {
      success: true;
      message: string;
      alreadyReserved?: boolean;
      items: AlexandrinaKennethPublicGiftItem[];
    }
  | {
      success: false;
      error: string;
      code?: string;
      available?: number;
      items: AlexandrinaKennethPublicGiftItem[];
    };

let localFileMutexQueue: Promise<unknown> = Promise.resolve();

/**
 * Determines whether local file-backed storage is allowed.
 * - In production: strictly prohibited (fail-closed, Neon is the sole authority).
 * - In local test / dev without database: allowed as fallback.
 * - Can be explicitly forced via GIFT_REGISTRY_FORCE_FILE="1".
 */
export function isAlexandrinaKennethGiftFileStoreAllowed(): boolean {
  if (process.env.GIFT_REGISTRY_FORCE_FILE === "1") {
    return true;
  }
  const isProd =
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production";
  if (isProd) {
    return false;
  }
  const provider = getEditionDatabaseProvider();
  return !provider.isConfigured();
}

export async function getAlexandrinaKennethReservationsFromFile(): Promise<
  AlexandrinaKennethReservation[]
> {
  try {
    if (!fs.existsSync(RESERVATIONS_FILE)) {
      return [];
    }
    const content = await fs.promises.readFile(RESERVATIONS_FILE, "utf-8");
    return JSON.parse(content) as AlexandrinaKennethReservation[];
  } catch (error) {
    console.error("Error reading Alexandrina & Kenneth reservations file:", error);
    return [];
  }
}

export async function saveAlexandrinaKennethReservationsToFile(
  reservations: AlexandrinaKennethReservation[]
): Promise<void> {
  const dir = path.dirname(RESERVATIONS_FILE);
  if (!fs.existsSync(dir)) {
    await fs.promises.mkdir(dir, { recursive: true });
  }

  const tmpFile = `${RESERVATIONS_FILE}.${randomUUID()}.tmp`;
  await fs.promises.writeFile(tmpFile, JSON.stringify(reservations, null, 2), "utf-8");
  await fs.promises.rename(tmpFile, RESERVATIONS_FILE);
}

/**
 * Retrieves confirmed reservations directly from Neon PostgreSQL.
 * Discrete slot keys (e.g. 'conjuntos-tacas#2') are mapped back to their base item ID.
 */
export async function getAlexandrinaKennethReservationsFromDb(): Promise<
  AlexandrinaKennethReservation[]
> {
  const pool = getNeonPool();
  const res = await pool.query(
    `SELECT id, gift_id, reserved_by, created_at
     FROM edition_gift_reservations
     WHERE registry_key = $1
     ORDER BY created_at ASC`,
    [ALEXANDRINA_KENNETH_REGISTRY_KEY]
  );

  return res.rows.map((row: any) => {
    const rawGiftId = String(row.gift_id || "");
    const baseItemId = rawGiftId.split("#")[0];
    return {
      id: String(row.id || row.gift_id),
      itemId: baseItemId,
      guestName: row.reserved_by,
      quantity: 1,
      timestamp:
        typeof row.created_at === "object" && row.created_at
          ? row.created_at.toISOString()
          : String(row.created_at),
    };
  });
}

export async function getAlexandrinaKennethReservations(): Promise<
  AlexandrinaKennethReservation[]
> {
  if (isAlexandrinaKennethGiftFileStoreAllowed()) {
    return getAlexandrinaKennethReservationsFromFile();
  }

  const provider = getEditionDatabaseProvider();
  if (provider.isConfigured()) {
    try {
      return await getAlexandrinaKennethReservationsFromDb();
    } catch (err) {
      const isProd =
        process.env.NODE_ENV === "production" ||
        process.env.VERCEL_ENV === "production";
      if (isProd) {
        console.error(
          "[Alexandrina & Kenneth Gifts] Fail-closed: database read failed in production:",
          err
        );
        throw err;
      }
      return getAlexandrinaKennethReservationsFromFile();
    }
  }

  return getAlexandrinaKennethReservationsFromFile();
}

export function mergeCatalogWithReservations(
  reservations: AlexandrinaKennethReservation[]
): AlexandrinaKennethPublicGiftItem[] {
  return ALEXANDRINA_KENNETH_CATALOG.map((item) => {
    const itemReservations = reservations.filter((r) => r.itemId === item.id);
    const selectedQuantity = itemReservations.reduce(
      (sum, r) => sum + (r.quantity || 1),
      0
    );
    const availableQuantity = Math.max(0, item.totalQuantity - selectedQuantity);

    const status: AlexandrinaKennethPublicGiftItem["status"] =
      availableQuantity === 0
        ? "reserved"
        : selectedQuantity > 0
          ? "partial"
          : "available";

    return {
      ...item,
      selectedQuantity,
      availableQuantity,
      status,
    };
  });
}

export async function getAlexandrinaKennethPublicGifts(): Promise<
  AlexandrinaKennethPublicGiftItem[]
> {
  const reservations = await getAlexandrinaKennethReservations();
  return mergeCatalogWithReservations(reservations);
}

/**
 * Executes atomic reservation in Neon PostgreSQL within a SINGLE ACID transaction.
 * 1. Acquires a transaction-level advisory lock per (registry_key + itemId).
 * 2. Checks idempotency: if the guest already reserved this item, commits and returns alreadyReserved: true.
 * 3. Checks availability: if reserved count >= totalQuantity, rolls back and returns GIFT_SOLD_OUT.
 * 4. Inserts discrete slot record into edition_gift_reservations via reserve_edition_gift.
 * 5. Commits transaction and returns refreshed catalog.
 */
export async function reserveAlexandrinaKennethGiftInDb(
  input: ReserveAlexandrinaKennethGiftInput,
  item: AlexandrinaKennethGiftDefinition
): Promise<ReserveAlexandrinaKennethGiftResult> {
  const pool = getNeonPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Advisory lock guarantees zero race conditions across multiple parallel server instances
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtext($1))",
      [`${ALEXANDRINA_KENNETH_REGISTRY_KEY}:${input.itemId}`]
    );

    const rowsRes = await client.query(
      `SELECT gift_id, reserved_by, created_at
       FROM edition_gift_reservations
       WHERE registry_key = $1
         AND (gift_id = $2 OR gift_id LIKE $2 || '#%')
       ORDER BY created_at ASC`,
      [ALEXANDRINA_KENNETH_REGISTRY_KEY, input.itemId]
    );

    const existingRows = rowsRes.rows as Array<{
      gift_id: string;
      reserved_by: string;
      created_at: string | Date;
    }>;

    // Idempotency: same identifier/name counting as a single reservation
    const normalizedGuestName = input.guestName.trim().toLowerCase();
    const alreadyReserved = existingRows.some(
      (r) => (r.reserved_by || "").trim().toLowerCase() === normalizedGuestName
    );

    if (alreadyReserved) {
      await client.query("COMMIT");
      const currentReservations = await getAlexandrinaKennethReservationsFromDb();
      return {
        success: true,
        alreadyReserved: true,
        message: "Este presente já foi reservado anteriormente pelo mesmo convidado.",
        items: mergeCatalogWithReservations(currentReservations),
      };
    }

    // Availability validation in the same transaction
    const reservedCount = existingRows.length;
    const available = Math.max(0, item.totalQuantity - reservedCount);
    const requestedQuantity = Math.min(input.quantity || 1, item.totalQuantity);

    if (available < requestedQuantity) {
      await client.query("ROLLBACK");
      const currentReservations = await getAlexandrinaKennethReservationsFromDb();
      return {
        success: false,
        code: "GIFT_SOLD_OUT",
        error: "Este presente acabou de ser escolhido.",
        available,
        items: mergeCatalogWithReservations(currentReservations),
      };
    }

    // Assign discrete unit slots (e.g. 'conjuntos-tacas' or 'conjuntos-tacas#2')
    const takenSlots = new Set(existingRows.map((r) => r.gift_id));
    for (let q = 0; q < requestedQuantity; q++) {
      let assignedSlot = input.itemId;
      if (takenSlots.has(assignedSlot)) {
        let slotNum = 2;
        while (takenSlots.has(`${input.itemId}#${slotNum}`)) {
          slotNum++;
        }
        assignedSlot = `${input.itemId}#${slotNum}`;
      }
      takenSlots.add(assignedSlot);

      const rpcRes = await client.query(
        "SELECT reserve_edition_gift($1, $2, $3, $4) as result",
        [
          ALEXANDRINA_KENNETH_REGISTRY_KEY,
          assignedSlot,
          input.guestName.trim(),
          item.name,
        ]
      );

      const rpcResult = rpcRes.rows[0]?.result;
      if (!rpcResult || !rpcResult.ok) {
        await client.query("ROLLBACK");
        const currentReservations = await getAlexandrinaKennethReservationsFromDb();
        return {
          success: false,
          code: "GIFT_SOLD_OUT",
          error: "Este presente acabou de ser escolhido.",
          available: 0,
          items: mergeCatalogWithReservations(currentReservations),
        };
      }
    }

    await client.query("COMMIT");

    const updatedReservations = await getAlexandrinaKennethReservationsFromDb();
    return {
      success: true,
      message: "Presente selecionado com sucesso!",
      items: mergeCatalogWithReservations(updatedReservations),
    };
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {}
    console.error("[Alexandrina & Kenneth Gifts] Neon transaction error:", err);
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Local file-backed reservation implementation for offline unit tests.
 */
export async function reserveAlexandrinaKennethGiftInFile(
  input: ReserveAlexandrinaKennethGiftInput,
  item: AlexandrinaKennethGiftDefinition
): Promise<ReserveAlexandrinaKennethGiftResult> {
  return new Promise((resolve) => {
    localFileMutexQueue = localFileMutexQueue
      .then(async () => {
        const reservations = await getAlexandrinaKennethReservationsFromFile();

        // 1. Idempotency Check
        const normalizedGuestName = input.guestName.trim().toLowerCase();
        const existingReservation = reservations.find(
          (r) =>
            r.itemId === input.itemId &&
            r.guestName.trim().toLowerCase() === normalizedGuestName
        );

        if (existingReservation) {
          const currentItems = mergeCatalogWithReservations(reservations);
          resolve({
            success: true,
            alreadyReserved: true,
            message: "Este presente já foi reservado anteriormente pelo mesmo convidado.",
            items: currentItems,
          });
          return;
        }

        // 2. Concurrency & Availability Check
        const itemReservations = reservations.filter((r) => r.itemId === input.itemId);
        const selectedSoFar = itemReservations.reduce(
          (sum, r) => sum + (r.quantity || 1),
          0
        );
        const available = Math.max(0, item.totalQuantity - selectedSoFar);
        const requestedQuantity = Math.min(input.quantity || 1, item.totalQuantity);

        if (available < requestedQuantity) {
          const refreshedItems = mergeCatalogWithReservations(reservations);
          resolve({
            success: false,
            code: "GIFT_SOLD_OUT",
            error: "Este presente acabou de ser escolhido.",
            available,
            items: refreshedItems,
          });
          return;
        }

        // 3. Commit Reservation to File
        const newReservation: AlexandrinaKennethReservation = {
          id: randomUUID(),
          itemId: input.itemId,
          guestName: input.guestName.trim(),
          guestPhone: input.guestPhone?.trim(),
          quantity: requestedQuantity,
          message: input.message?.trim(),
          timestamp: new Date().toISOString(),
        };

        const updatedReservations = [...reservations, newReservation];
        await saveAlexandrinaKennethReservationsToFile(updatedReservations);

        const finalItems = mergeCatalogWithReservations(updatedReservations);
        resolve({
          success: true,
          message: "Presente selecionado com sucesso!",
          items: finalItems,
        });
      })
      .catch((err) => {
        console.error("Queue execution error in reserveAlexandrinaKennethGiftInFile:", err);
        resolve({
          success: false,
          error: "Ocorreu um erro interno ao processar a reserva.",
          items: mergeCatalogWithReservations([]),
        });
      });
  });
}

export async function reserveAlexandrinaKennethGift(
  input: ReserveAlexandrinaKennethGiftInput
): Promise<ReserveAlexandrinaKennethGiftResult> {
  const item = ALEXANDRINA_KENNETH_CATALOG.find((i) => i.id === input.itemId);
  if (!item) {
    const currentItems = await getAlexandrinaKennethPublicGifts();
    return {
      success: false,
      error: "Presente não encontrado.",
      code: "GIFT_NOT_FOUND",
      items: currentItems,
    };
  }

  const guestName = (input.guestName || "").trim();
  if (guestName.length < 2) {
    const currentItems = await getAlexandrinaKennethPublicGifts();
    return {
      success: false,
      error: "Indique o seu nome para reservar o presente.",
      code: "INVALID_GUEST_NAME",
      items: currentItems,
    };
  }

  if (isAlexandrinaKennethGiftFileStoreAllowed()) {
    return reserveAlexandrinaKennethGiftInFile(input, item);
  }

  const provider = getEditionDatabaseProvider();
  if (!provider.isConfigured()) {
    const isProd =
      process.env.NODE_ENV === "production" ||
      process.env.VERCEL_ENV === "production";
    if (isProd) {
      throw new Error(
        "[Alexandrina & Kenneth Gifts] Fail-closed: DATABASE_URL ausente em produção."
      );
    }
    return reserveAlexandrinaKennethGiftInFile(input, item);
  }

  return reserveAlexandrinaKennethGiftInDb(input, item);
}

export async function __clearAlexandrinaKennethReservationsForTests(): Promise<void> {
  if (fs.existsSync(RESERVATIONS_FILE)) {
    try {
      await fs.promises.unlink(RESERVATIONS_FILE);
    } catch {}
  }
}
