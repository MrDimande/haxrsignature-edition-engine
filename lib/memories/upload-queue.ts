/**
 * HAXR PLUS MEMORIES 2.0 — FASE 6: OFFLINE RESILIENCE & RELIABLE UPLOAD QUEUE
 *
 * Motor canónico de fila de uploads persistente no browser (IndexedDB).
 * - Idempotência garantida via clientUploadId (UUID v4).
 * - Exclusão mútua multi-tab via Web Locks API com fallback de lease em IndexedDB.
 * - Exponential backoff com jitter para erros recuperáveis.
 * - Retenção de blobs locais em caso de sessão expirada (authentication_required).
 * - Isolamento estrito de participantes (upload de A nunca é retomado como B).
 * - Detecção preventiva de QuotaExceededError.
 * - Zero credenciais ou signed URLs persistidas a longo prazo.
 * - Vocabulário estrito em Português de Moçambique.
 */

export type UploadQueueItemState =
  | "queued"
  | "preparing"
  | "uploading"
  | "uploaded"
  | "completing"
  | "completed"
  | "failed"
  | "authentication_required";

export interface UploadQueueItem {
  clientUploadId: string; // UUID v4 único
  slug: string;
  fileBlob?: Blob | null; // Removido após completed para privacidade/quota
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
  guestName?: string;
  caption?: string;
  challengeId?: string;
  tableId?: string;
  participantId?: string; // Para particionamento/ownership local
  stageId?: string;
  capturedAt?: string;
  state: UploadQueueItemState;
  attempts: number;
  lastAttemptAt?: string;
  nextRetryAt?: number;
  photoId?: string;
  error?: string;
  terminalError?: boolean;
  createdAt: string;
  completedAt?: string;
  leaseToken?: string;
  leaseExpiresAt?: number;
  leaseOwnerTabId?: string;
}

export interface QueueProgressSummary {
  total: number;
  pending: number;
  uploading: number;
  completed: number;
  failed: number;
  authRequired: number;
  statusLabel: string;
}

export const DB_NAME = "haxr_memories_upload_queue";
export const DB_VERSION = 1;
export const STORE_UPLOADS = "upload_queue";
export const STORE_LOCKS = "queue_locks";

export const MAX_AUTO_ATTEMPTS = 5;
export const MAX_BACKOFF_MS = 30000;
export const LEASE_DURATION_MS = 25000;

// Tab ID volátil em memória para exclusão mútua
export const TAB_ID = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
  ? crypto.randomUUID()
  : `tab_${Math.random().toString(36).slice(2, 11)}`;

// ──────────────────────────────────────────────
// Abertura e Gestão de IndexedDB
// ──────────────────────────────────────────────

let idbInstance: IDBDatabase | null = null;

function getIndexedDB(): IDBFactory | null {
  if (typeof window !== "undefined" && "indexedDB" in window && window.indexedDB) {
    return window.indexedDB;
  }
  if (typeof globalThis !== "undefined" && "indexedDB" in globalThis && (globalThis as any).indexedDB) {
    return (globalThis as any).indexedDB;
  }
  return null;
}

export async function openUploadQueueDB(): Promise<IDBDatabase> {
  const idb = getIndexedDB();
  if (!idb) {
    throw new Error("INDEXEDDB_UNAVAILABLE");
  }

  if (idbInstance) {
    try {
      // Testar se ainda está aberta
      if (idbInstance.objectStoreNames.contains(STORE_UPLOADS)) {
        return idbInstance;
      }
    } catch {
      idbInstance = null;
    }
  }

  return new Promise((resolve, reject) => {
    const request = idb.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_UPLOADS)) {
        const uploadStore = db.createObjectStore(STORE_UPLOADS, { keyPath: "clientUploadId" });
        uploadStore.createIndex("by_state", "state", { unique: false });
        uploadStore.createIndex("by_slug", "slug", { unique: false });
        uploadStore.createIndex("by_created_at", "createdAt", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_LOCKS)) {
        db.createObjectStore(STORE_LOCKS, { keyPath: "lockId" });
      }
    };

    request.onsuccess = () => {
      idbInstance = request.result;
      resolve(idbInstance);
    };

    request.onerror = () => {
      reject(request.error || new Error("Falha ao abrir base de dados local."));
    };
  });
}

// ──────────────────────────────────────────────
// Gestão de Quota Preventiva (Regra 12)
// ──────────────────────────────────────────────

export async function checkStorageQuotaBeforeEnqueue(blobSizeBytes: number): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.storage && typeof navigator.storage.estimate === "function") {
    try {
      const estimate = await navigator.storage.estimate();
      if (estimate.quota !== undefined && estimate.usage !== undefined) {
        const available = estimate.quota - estimate.usage;
        // Rejeitar se o espaço disponível for inferior ao blob + margem de segurança (5 MB)
        if (available < blobSizeBytes + 5 * 1024 * 1024) {
          const quotaErr = new Error("Espaço de armazenamento local insuficiente no dispositivo.");
          quotaErr.name = "QuotaExceededError";
          throw quotaErr;
        }
      }
    } catch (err: any) {
      if (err?.name === "QuotaExceededError") throw err;
      // Erro na API de estimate não impede a tentativa real
    }
  }
}

// ──────────────────────────────────────────────
// Operações de Fila (Enqueue, Get, Update, Remove)
// ──────────────────────────────────────────────

export async function enqueueMemoryUpload(item: {
  slug: string;
  fileBlob: Blob;
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
  guestName?: string;
  caption?: string;
  challengeId?: string;
  tableId?: string;
  participantId?: string;
  stageId?: string;
  capturedAt?: string;
  clientUploadId?: string;
}): Promise<UploadQueueItem> {
  // Regra 1: client_upload_id é estritamente UUID v4
  const clientUploadId = item.clientUploadId || (
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : "00000000-0000-4000-8000-000000000000".replace(/[018]/g, (c: any) =>
          (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
        )
  );

  // Regra 12: Quota preventiva antes de escrever o blob
  await checkStorageQuotaBeforeEnqueue(item.fileSizeBytes);

  const db = await openUploadQueueDB();

  const record: UploadQueueItem = {
    clientUploadId,
    slug: item.slug,
    fileBlob: item.fileBlob,
    fileName: item.fileName,
    contentType: item.contentType,
    fileSizeBytes: item.fileSizeBytes,
    guestName: item.guestName,
    caption: item.caption,
    challengeId: item.challengeId,
    tableId: item.tableId,
    participantId: item.participantId,
    stageId: item.stageId,
    capturedAt: item.capturedAt || new Date().toISOString(),
    state: "queued",
    attempts: 0,
    createdAt: new Date().toISOString(),
  };

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_UPLOADS, "readwrite");
      const store = tx.objectStore(STORE_UPLOADS);
      const req = store.put(record);

      req.onsuccess = () => {
        notifyQueueSubscribers();
        resolve(record);
      };

      req.onerror = () => {
        const error = req.error;
        if (error && (error.name === "QuotaExceededError" || error.message.includes("quota"))) {
          const qErr = new Error("O armazenamento local do navegador está cheio.");
          qErr.name = "QuotaExceededError";
          reject(qErr);
        } else {
          reject(error || new Error("Falha ao enfileirar o ficheiro."));
        }
      };
    } catch (err: any) {
      if (err?.name === "QuotaExceededError") {
        reject(err);
      } else {
        reject(new Error("Erro ao aceder à fila de uploads local."));
      }
    }
  });
}

export async function getQueueItem(clientUploadId: string): Promise<UploadQueueItem | null> {
  const db = await openUploadQueueDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_UPLOADS, "readonly");
    const store = tx.objectStore(STORE_UPLOADS);
    const req = store.get(clientUploadId);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function getAllQueueItems(slug?: string): Promise<UploadQueueItem[]> {
  try {
    const db = await openUploadQueueDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_UPLOADS, "readonly");
      const store = tx.objectStore(STORE_UPLOADS);
      const req = store.getAll();
      req.onsuccess = () => {
        const items = (req.result || []) as UploadQueueItem[];
        if (slug) {
          resolve(items.filter((it) => it.slug === slug));
        } else {
          resolve(items);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function updateQueueItem(
  clientUploadId: string,
  updates: Partial<UploadQueueItem>,
  options?: { expectedLeaseToken?: string }
): Promise<UploadQueueItem | null> {
  const db = await openUploadQueueDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_UPLOADS, "readwrite");
    const store = tx.objectStore(STORE_UPLOADS);
    const getReq = store.get(clientUploadId);

    getReq.onsuccess = () => {
      const current = getReq.result as UploadQueueItem | undefined;
      if (!current) {
        resolve(null);
        return;
      }

      // Protecção por leaseToken (Fase 6 Boundary):
      // Se um expectedLeaseToken foi fornecido, garantir que a lease ainda pertence a este chamador
      // e não foi reclamada por outra tab (ex: upload demorou > lease TTL de 30s ou tab foi suspensa).
      if (options?.expectedLeaseToken) {
        if (current.leaseToken && current.leaseToken !== options.expectedLeaseToken) {
          // Lease perdida para outra tab (reclaim activo). Abortar para não corromper o estado de B.
          resolve(null);
          return;
        }
      }

      // Regra de Integridade: Se o item já se encontra completado localmente, nunca regredir o estado
      if (current.state === "completed" && updates.state && updates.state !== "completed") {
        resolve(current);
        return;
      }

      const updated: UploadQueueItem = {
        ...current,
        ...updates,
      };

      // Política de privacidade e quota: se completed, expurgar o blob imediatamente
      if (updated.state === "completed" && updated.fileBlob) {
        updated.fileBlob = null;
      }

      const putReq = store.put(updated);
      putReq.onsuccess = () => {
        notifyQueueSubscribers();
        resolve(updated);
      };
      putReq.onerror = () => reject(putReq.error);
    };

    getReq.onerror = () => reject(getReq.error);
  });
}

/**
 * Reclama um item da fila para processamento exclusivo por uma aba.
 * Se o lease anterior expirou (ex: > 25-30s ou aba suspensa), permite reclaim seguro por outra aba.
 */
export async function claimUploadQueueItem(
  clientUploadId: string,
  options?: { ownerTabId?: string; leaseDurationMs?: number }
): Promise<{ success: boolean; leaseToken?: string; item?: UploadQueueItem; reason?: string }> {
  const db = await openUploadQueueDB();
  const ownerTabId = options?.ownerTabId || TAB_ID;
  const leaseDurationMs = options?.leaseDurationMs || LEASE_DURATION_MS;
  const now = Date.now();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_UPLOADS, "readwrite");
    const store = tx.objectStore(STORE_UPLOADS);
    const getReq = store.get(clientUploadId);

    getReq.onsuccess = () => {
      const current = getReq.result as UploadQueueItem | undefined;
      if (!current) {
        resolve({ success: false, reason: "NOT_FOUND" });
        return;
      }

      if (current.state === "completed") {
        resolve({ success: false, reason: "ALREADY_COMPLETED", item: current });
        return;
      }

      // Verificar se há lease activo detido por outra aba
      if (
        current.leaseToken &&
        current.leaseExpiresAt &&
        current.leaseExpiresAt > now &&
        current.leaseOwnerTabId &&
        current.leaseOwnerTabId !== ownerTabId
      ) {
        resolve({ success: false, reason: "LEASE_ACTIVE_ANOTHER_TAB", item: current });
        return;
      }

      // Conceder novo leaseToken exclusivo para esta execução
      const newLeaseToken = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `lt_${Math.random().toString(36).slice(2, 11)}_${Date.now()}`;

      const updated: UploadQueueItem = {
        ...current,
        leaseToken: newLeaseToken,
        leaseExpiresAt: now + leaseDurationMs,
        leaseOwnerTabId: ownerTabId,
      };

      const putReq = store.put(updated);
      putReq.onsuccess = () => {
        notifyQueueSubscribers();
        resolve({ success: true, leaseToken: newLeaseToken, item: updated });
      };
      putReq.onerror = () => reject(putReq.error);
    };

    getReq.onerror = () => reject(getReq.error);
  });
}

export async function removeQueueItem(clientUploadId: string): Promise<void> {
  try {
    const db = await openUploadQueueDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_UPLOADS, "readwrite");
      const store = tx.objectStore(STORE_UPLOADS);
      const req = store.delete(clientUploadId);
      req.onsuccess = () => {
        notifyQueueSubscribers();
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("[UploadQueue] Erro ao remover item:", err);
  }
}

export async function clearRevokedQueueItems(slug: string, participantId?: string): Promise<number> {
  // Regra 10: Limpeza segura para acessos revogados
  const items = await getAllQueueItems(slug);
  let cleared = 0;
  for (const item of items) {
    if (!participantId || item.participantId === participantId) {
      await removeQueueItem(item.clientUploadId);
      cleared++;
    }
  }
  return cleared;
}

// ──────────────────────────────────────────────
// Concorrência Multi-Tab (Web Locks + Fallback IndexedDB Lease)
// ──────────────────────────────────────────────

async function acquireTabLock<T>(lockName: string, action: () => Promise<T>): Promise<T | null> {
  // 1. Primário: Web Locks API (Regra 8)
  if (typeof navigator !== "undefined" && navigator.locks && typeof navigator.locks.request === "function") {
    try {
      return await navigator.locks.request(lockName, { ifAvailable: true }, async (lock) => {
        if (!lock) {
          // Outra aba está actualmente com o lock activo
          return null;
        }
        return await action();
      });
    } catch (err) {
      console.warn("[UploadQueue] Web Locks error, a recorrer ao fallback IndexedDB:", err);
    }
  }

  // 2. Fallback Seguro: Lease persistente em IndexedDB com transacção readwrite (Regra 8)
  try {
    const db = await openUploadQueueDB();
    const now = Date.now();
    const leaseKey = `lease_${lockName}`;

    const acquired = await new Promise<boolean>((resolve, reject) => {
      const tx = db.transaction(STORE_LOCKS, "readwrite");
      const store = tx.objectStore(STORE_LOCKS);
      const getReq = store.get(leaseKey);

      getReq.onsuccess = () => {
        const record = getReq.result as { lockId: string; ownerTabId: string; expiresAt: number } | undefined;
        if (record && record.expiresAt > now && record.ownerTabId !== TAB_ID) {
          // Outra aba detém lease válido
          resolve(false);
          return;
        }

        const newRecord = {
          lockId: leaseKey,
          ownerTabId: TAB_ID,
          expiresAt: now + LEASE_DURATION_MS,
        };

        const putReq = store.put(newRecord);
        putReq.onsuccess = () => resolve(true);
        putReq.onerror = () => reject(putReq.error);
      };

      getReq.onerror = () => reject(getReq.error);
    });

    if (!acquired) {
      return null;
    }

    try {
      return await action();
    } finally {
      // Libertar lease
      try {
        const releaseTx = db.transaction(STORE_LOCKS, "readwrite");
        releaseTx.objectStore(STORE_LOCKS).delete(leaseKey);
      } catch {
        // Silencioso na libertação
      }
    }
  } catch (err) {
    console.warn("[UploadQueue] Falha no fallback de lease, executando sob idempotência server-side:", err);
    return await action();
  }
}

// ──────────────────────────────────────────────
// Backoff Exponencial & Classificação de Erros (Regra 14)
// ──────────────────────────────────────────────

export function calculateBackoffDelayMs(attempts: number, retryAfterSeconds?: number): number {
  if (retryAfterSeconds && retryAfterSeconds > 0) {
    return retryAfterSeconds * 1000;
  }
  const base = Math.min(1000 * Math.pow(2, attempts), MAX_BACKOFF_MS);
  const jitter = Math.floor(Math.random() * 500);
  return base + jitter;
}

export function classifyUploadError(
  status: number,
  errorMessage: string,
  errorCode?: string
): { retryable: boolean; authRequired: boolean; terminal: boolean } {
  // 1. Sessão Expirada (Regra 10)
  if (status === 401 || errorCode === "SESSION_EXPIRED" || errorCode === "UNAUTHORIZED") {
    return { retryable: false, authRequired: true, terminal: false };
  }

  // 2. Sessão Revogada / Proibida (Regra 10)
  if (status === 403 || errorCode === "SESSION_REVOKED" || errorCode === "FORBIDDEN" || errorCode === "PHOTO_WALL_CLOSED") {
    return { retryable: false, authRequired: false, terminal: true };
  }

  // 3. Erro Terminal de Validação ou Dados (Regra 6, 14)
  if (
    status === 400 ||
    errorCode === "INVALID_INTENT" ||
    errorCode === "INVALID_SIGNATURE" ||
    errorCode === "OWNERSHIP_MISMATCH" ||
    errorMessage.includes("Tipo não suportado") ||
    errorMessage.includes("excede o limite") ||
    errorMessage.includes("inválido")
  ) {
    return { retryable: false, authRequired: false, terminal: true };
  }

  // 4. Rate Limited com Retry (Regra 14)
  if (status === 429 || errorCode === "RATE_LIMITED") {
    return { retryable: true, authRequired: false, terminal: false };
  }

  // 5. Erros de Rede, Timeout, 5xx e Falha Temporária (Regra 6, 14)
  if (status === 0 || status === 408 || status >= 500 || errorCode === "STORAGE_ERROR" || errorCode === "UPLOAD_MISSING") {
    return { retryable: true, authRequired: false, terminal: false };
  }

  return { retryable: true, authRequired: false, terminal: false };
}

// ──────────────────────────────────────────────
// Processamento da Fila (Sync Worker)
// ──────────────────────────────────────────────

export interface ProcessQueueOptions {
  slug: string;
  currentParticipantId?: string; // Para validação estrita de ownership (Regra 9)
  forceItemUploadId?: string;
}

export async function processUploadQueue(options: ProcessQueueOptions): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  return (
    (await acquireTabLock(`haxr_upload_queue_${options.slug}`, async () => {
      const items = await getAllQueueItems(options.slug);
      if (items.length === 0) {
        return { processed: 0, succeeded: 0, failed: 0 };
      }

      const now = Date.now();
      let processed = 0;
      let succeeded = 0;
      let failed = 0;

      for (const item of items) {
        // Filtrar itens se forceItemUploadId foi especificado
        if (options.forceItemUploadId && item.clientUploadId !== options.forceItemUploadId) {
          continue;
        }

        // Não processar concluídos
        if (item.state === "completed") {
          continue;
        }

        // Não reprocessar erros terminais sem acção manual explícita
        if (item.terminalError && !options.forceItemUploadId) {
          continue;
        }

        // Respeitar backoff agendado (se nextRetryAt estiver no futuro)
        if (!options.forceItemUploadId && item.nextRetryAt && item.nextRetryAt > now) {
          continue;
        }

        // Regra 9: Validação estrita de ownership do participante
        if (
          options.currentParticipantId &&
          item.participantId &&
          item.participantId !== options.currentParticipantId
        ) {
          await updateQueueItem(item.clientUploadId, {
            state: "authentication_required",
            error: "Item pertence a outro participante. Troque de sessão para concluir o envio.",
          });
          continue;
        }

        processed++;
        const itemResult = await processSingleQueueItem(item, options.currentParticipantId);
        if (itemResult.success) {
          succeeded++;
        } else {
          failed++;
        }
      }

      return { processed, succeeded, failed };
    })) || { processed: 0, succeeded: 0, failed: 0 }
  );
}

async function processSingleQueueItem(
  item: UploadQueueItem,
  currentParticipantId?: string
): Promise<{ success: boolean; error?: string }> {
  // Reclamar lease exclusiva e obter leaseToken para esta execução
  const claim = await claimUploadQueueItem(item.clientUploadId);
  if (!claim.success) {
    return { success: claim.reason === "ALREADY_COMPLETED", error: claim.reason };
  }
  const leaseToken = claim.leaseToken!;

  const safeUpdate = async (updates: Partial<UploadQueueItem>) => {
    const res = await updateQueueItem(item.clientUploadId, updates, { expectedLeaseToken: leaseToken });
    if (!res) {
      throw new Error("LEASE_SUPERSEDED");
    }
    return res;
  };

  // Verificar existência de blob
  if (!item.fileBlob) {
    await safeUpdate({
      state: "failed",
      terminalError: true,
      error: "O ficheiro local já não está disponível no dispositivo.",
    }).catch(() => {});
    return { success: false, error: "BLOB_MISSING" };
  }

  const attempts = item.attempts + 1;

  try {
    // ──────── Passo 1: Obter ou Renovar Intent de Upload ────────
    await safeUpdate({
      state: "preparing",
      attempts,
      lastAttemptAt: new Date().toISOString(),
      error: undefined,
    });

    const intentRes = await fetch("/api/memories/upload-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: item.slug,
        fileName: item.fileName,
        contentType: item.contentType,
        fileSizeBytes: item.fileSizeBytes,
        clientUploadId: item.clientUploadId, // UUID v4 canónico
        guestName: item.guestName,
        caption: item.caption,
        challengeId: item.challengeId,
        tableId: item.tableId,
        participantId: currentParticipantId || item.participantId,
        stageId: item.stageId,
        capturedAt: item.capturedAt,
      }),
    });

    const intentData = await intentRes.json().catch(() => ({}));

    if (!intentRes.ok || !intentData.success) {
      const classification = classifyUploadError(
        intentRes.status,
        intentData.error || "Erro no intent",
        intentData.code
      );

      if (classification.authRequired) {
        await safeUpdate({
          state: "authentication_required",
          error: "Sessão expirada. Inicie sessão para concluir este envio.",
        });
        return { success: false, error: "AUTH_REQUIRED" };
      }

      if (classification.terminal) {
        await safeUpdate({
          state: "failed",
          terminalError: true,
          error: intentData.error || "Envio rejeitado pelo servidor.",
        });
        return { success: false, error: "TERMINAL_ERROR" };
      }

      const retryAfter = intentRes.headers.get("Retry-After")
        ? parseInt(intentRes.headers.get("Retry-After")!, 10)
        : intentData.retryAfterSeconds;

      const delayMs = calculateBackoffDelayMs(attempts, retryAfter);
      await safeUpdate({
        state: "failed",
        error: intentData.error || "À espera de ligação para tentar novamente...",
        nextRetryAt: Date.now() + delayMs,
      });
      return { success: false, error: "RETRYABLE_ERROR" };
    }

    const { photoId, uploadUrl, alreadyCompleted } = intentData;

    // Se o intent já estava concluído previamente no servidor (idempotência total)
    if (alreadyCompleted) {
      await safeUpdate({
        state: "completed",
        photoId,
        fileBlob: null, // Limpeza de privacidade
        completedAt: new Date().toISOString(),
        error: undefined,
      });
      return { success: true };
    }

    // ──────── Passo 2: Upload Directo para Object Storage (Cloudflare R2 via Signed URL) ────────
    await safeUpdate({
      state: "uploading",
      photoId,
    });

    const storageRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": item.contentType,
      },
      body: item.fileBlob,
    });

    if (!storageRes.ok) {
      const delayMs = calculateBackoffDelayMs(attempts);
      await safeUpdate({
        state: "failed",
        error: "Falha na transferência. A tentar novamente...",
        nextRetryAt: Date.now() + delayMs,
      });
      return { success: false, error: "STORAGE_PUT_FAILED" };
    }

    // ──────── Passo 3: Confirmação e Registo Transaccional (Complete Upload) ────────
    await safeUpdate({
      state: "completing",
    });

    const completeRes = await fetch("/api/memories/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: item.slug,
        photoId,
        guestName: item.guestName,
        caption: item.caption,
        challengeId: item.challengeId,
        tableId: item.tableId,
        participantId: currentParticipantId || item.participantId,
        stageId: item.stageId,
        capturedAt: item.capturedAt,
      }),
    });

    const completeData = await completeRes.json().catch(() => ({}));

    if (!completeRes.ok || !completeData.success) {
      const classification = classifyUploadError(
        completeRes.status,
        completeData.error || "Erro ao concluir",
        completeData.code
      );

      if (classification.authRequired) {
        await safeUpdate({
          state: "authentication_required",
          error: "Sessão expirada. Inicie sessão para concluir este registo.",
        });
        return { success: false, error: "AUTH_REQUIRED" };
      }

      if (classification.terminal) {
        await safeUpdate({
          state: "failed",
          terminalError: true,
          error: completeData.error || "Não foi possível registar o envio.",
        });
        return { success: false, error: "TERMINAL_ERROR" };
      }

      const delayMs = calculateBackoffDelayMs(attempts);
      await safeUpdate({
        state: "failed",
        error: "Falha na confirmação. A tentar novamente...",
        nextRetryAt: Date.now() + delayMs,
      });
      return { success: false, error: "COMPLETE_RETRYABLE" };
    }

    // ──────── Sucesso Absoluto: Conclusão e Purga de Blob Local (Regra 15) ────────
    await safeUpdate({
      state: "completed",
      photoId,
      fileBlob: null, // Expurgar blob imediatamente
      completedAt: new Date().toISOString(),
      error: undefined,
    });

    return { success: true };
  } catch (err: any) {
    if (err?.message === "LEASE_SUPERSEDED") {
      // Lease foi perdida para outra tab (ex: upload demorou > lease TTL de 30s ou tab suspensa e outra fez reclaim).
      // Não sobrescrever o estado local pertencente à tab reclamante.
      return { success: false, error: "LEASE_SUPERSEDED" };
    }
    console.warn(`[UploadQueue] Excepção de rede durante upload do item ${item.clientUploadId}:`, err);
    const delayMs = calculateBackoffDelayMs(attempts);
    await updateQueueItem(item.clientUploadId, {
      state: "failed",
      error: "À espera de ligação estável...",
      nextRetryAt: Date.now() + delayMs,
    }, { expectedLeaseToken: leaseToken }).catch(() => {});
    return { success: false, error: "NETWORK_EXCEPTION" };
  }
}

// ──────────────────────────────────────────────
// Sumário de Estado e Subscrições React
// ──────────────────────────────────────────────

type QueueSubscriber = () => void;
const subscribers = new Set<QueueSubscriber>();

export function subscribeToQueueUpdates(callback: QueueSubscriber): () => void {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

function notifyQueueSubscribers() {
  for (const sub of subscribers) {
    try {
      sub();
    } catch {
      // Ignorar erros em subscribers
    }
  }

  // Notificar outras tabs via BroadcastChannel quando disponível
  if (typeof BroadcastChannel !== "undefined") {
    try {
      const bc = new BroadcastChannel("haxr_upload_queue_events");
      bc.postMessage({ type: "QUEUE_MUTATED", timestamp: Date.now() });
      bc.close();
    } catch {
      // Silencioso se não suportado
    }
  }
}

export function computeQueueProgressSummary(items: UploadQueueItem[]): QueueProgressSummary {
  const activeItems = items.filter((it) => it.state !== "completed");
  const total = items.length;
  const completed = items.filter((it) => it.state === "completed").length;
  const uploading = items.filter((it) => it.state === "uploading" || it.state === "completing" || it.state === "preparing").length;
  const authRequired = items.filter((it) => it.state === "authentication_required").length;
  const failed = items.filter((it) => it.state === "failed").length;
  const pending = activeItems.length;

  let statusLabel = "";
  if (uploading > 0) {
    statusLabel = "A enviar...";
  } else if (authRequired > 0) {
    statusLabel = "Precisa de autenticação";
  } else if (failed > 0) {
    // Se estiver offline ou aguardando reconnect
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      statusLabel = "À espera de ligação...";
    } else {
      statusLabel = "A tentar novamente...";
    }
  } else if (pending > 0) {
    statusLabel = "À espera de ligação...";
  } else if (total > 0 && completed === total) {
    statusLabel = "Envio concluído";
  }

  return {
    total,
    pending,
    uploading,
    completed,
    failed,
    authRequired,
    statusLabel,
  };
}
