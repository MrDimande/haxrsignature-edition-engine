/**
 * Plus Memories — Fila de Upload Offline (IndexedDB)
 *
 * Garante zero perda de fotografias em zonas do salão com fraca cobertura 4G/5G.
 */

export interface QueuedMemoryItem {
  id: string;
  slug: string;
  blob: Blob;
  fileName: string;
  contentType: string;
  guestName?: string;
  caption?: string;
  challengeId?: string;
  tableId?: string;
  participantId?: string;
  phaseId?: string;
  timestamp: number;
}

const DB_NAME = "haxr_plus_memories_offline_db";
const STORE_NAME = "offline_uploads";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      return reject(new Error("IndexedDB not supported"));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function queueOfflineMemory(item: Omit<QueuedMemoryItem, "id" | "timestamp">): Promise<string> {
  try {
    const db = await openDB();
    const id = `offline_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const queued: QueuedMemoryItem = {
      ...item,
      id,
      timestamp: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.add(queued);
      req.onsuccess = () => resolve(id);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error("Failed to queue offline memory:", err);
    throw err;
  }
}

export async function getQueuedMemories(): Promise<QueuedMemoryItem[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function removeQueuedMemory(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error("Failed to remove queued memory:", err);
  }
}

/**
 * Processa a fila de uploads pendentes.
 */
export async function processOfflineQueue(
  uploadFn: (item: QueuedMemoryItem) => Promise<{ success: boolean }>
): Promise<number> {
  if (typeof window === "undefined" || !navigator.onLine) return 0;

  const items = await getQueuedMemories();
  if (!items.length) return 0;

  let successCount = 0;
  for (const item of items) {
    try {
      const res = await uploadFn(item);
      if (res.success) {
        await removeQueuedMemory(item.id);
        successCount++;
      }
    } catch (err) {
      console.warn(`Retry failed for queued item ${item.id}:`, err);
    }
  }

  return successCount;
}
