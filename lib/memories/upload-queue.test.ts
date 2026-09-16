import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calculateBackoffDelayMs,
  classifyUploadError,
  computeQueueProgressSummary,
  checkStorageQuotaBeforeEnqueue,
  type UploadQueueItem,
} from "./upload-queue";

describe("HAXR Plus Memories — Fase 6: Upload Queue Logic & Resilience", () => {
  describe("classifyUploadError", () => {
    it("deve classificar 401 e SESSION_EXPIRED como authRequired (preservar blob)", () => {
      const err1 = classifyUploadError(401, "Sessão expirada", "SESSION_EXPIRED");
      assert.equal(err1.authRequired, true);
      assert.equal(err1.retryable, false);
      assert.equal(err1.terminal, false);

      const err2 = classifyUploadError(401, "Token inválido", "UNAUTHORIZED");
      assert.equal(err2.authRequired, true);
      assert.equal(err2.retryable, false);
      assert.equal(err2.terminal, false);
    });

    it("deve classificar 403 e revogação como erro terminal (expurgar)", () => {
      const err = classifyUploadError(403, "Acesso revogado", "SESSION_REVOKED");
      assert.equal(err.terminal, true);
      assert.equal(err.retryable, false);
      assert.equal(err.authRequired, false);
    });

    it("deve classificar 400 e erros de validação como terminais sem loop infinito", () => {
      const errMime = classifyUploadError(400, "Tipo não suportado. Use foto ou vídeo", "INVALID_FORMAT");
      assert.equal(errMime.terminal, true);
      assert.equal(errMime.retryable, false);

      const errOwnership = classifyUploadError(400, "Participante não autorizado", "OWNERSHIP_MISMATCH");
      assert.equal(errOwnership.terminal, true);
      assert.equal(errOwnership.retryable, false);
    });

    it("deve classificar 429 como retryable", () => {
      const errRate = classifyUploadError(429, "Demasiados pedidos", "RATE_LIMITED");
      assert.equal(errRate.retryable, true);
      assert.equal(errRate.terminal, false);
      assert.equal(errRate.authRequired, false);
    });

    it("deve classificar 500, 503, timeouts e falhas de rede como retryable", () => {
      const err500 = classifyUploadError(500, "Internal Server Error");
      assert.equal(err500.retryable, true);
      assert.equal(err500.terminal, false);

      const err503 = classifyUploadError(503, "Service Unavailable", "STORAGE_ERROR");
      assert.equal(err503.retryable, true);
      assert.equal(err503.terminal, false);

      const errNetwork = classifyUploadError(0, "Failed to fetch");
      assert.equal(errNetwork.retryable, true);
      assert.equal(errNetwork.terminal, false);
    });
  });

  describe("calculateBackoffDelayMs", () => {
    it("deve respeitar Retry-After quando presente", () => {
      const delay = calculateBackoffDelayMs(1, 15);
      assert.equal(delay, 15000);
    });

    it("deve aumentar exponencialmente com as tentativas e aplicar jitter", () => {
      const delay1 = calculateBackoffDelayMs(1);
      assert.ok(delay1 >= 2000 && delay1 <= 2500, `Esperado ~2000ms+jitter, obtido ${delay1}`);

      const delay2 = calculateBackoffDelayMs(2);
      assert.ok(delay2 >= 4000 && delay2 <= 4500, `Esperado ~4000ms+jitter, obtido ${delay2}`);

      const delay3 = calculateBackoffDelayMs(3);
      assert.ok(delay3 >= 8000 && delay3 <= 8500, `Esperado ~8000ms+jitter, obtido ${delay3}`);
    });

    it("deve limitar o atraso máximo a 30 segundos", () => {
      const delayLarge = calculateBackoffDelayMs(10);
      assert.ok(delayLarge <= 30500, `Esperado no máximo 30.5s, obtido ${delayLarge}`);
    });
  });

  describe("computeQueueProgressSummary", () => {
    it("deve computar sumário vazio sem itens", () => {
      const summary = computeQueueProgressSummary([]);
      assert.equal(summary.total, 0);
      assert.equal(summary.pending, 0);
      assert.equal(summary.statusLabel, "");
    });

    it("deve indicar 'A enviar...' quando há uploads em curso", () => {
      const items: UploadQueueItem[] = [
        {
          clientUploadId: "00000000-0000-0000-0000-000000000001",
          slug: "teste",
          fileName: "foto.jpg",
          contentType: "image/jpeg",
          fileSizeBytes: 1000,
          state: "uploading",
          attempts: 1,
          createdAt: new Date().toISOString(),
        },
      ];
      const summary = computeQueueProgressSummary(items);
      assert.equal(summary.uploading, 1);
      assert.equal(summary.statusLabel, "A enviar...");
    });

    it("deve indicar 'Precisa de autenticação' quando sessão expira", () => {
      const items: UploadQueueItem[] = [
        {
          clientUploadId: "00000000-0000-0000-0000-000000000001",
          slug: "teste",
          fileName: "foto.jpg",
          contentType: "image/jpeg",
          fileSizeBytes: 1000,
          state: "authentication_required",
          attempts: 1,
          createdAt: new Date().toISOString(),
        },
      ];
      const summary = computeQueueProgressSummary(items);
      assert.equal(summary.authRequired, 1);
      assert.equal(summary.statusLabel, "Precisa de autenticação");
    });

    it("deve indicar 'Envio concluído' quando todos os itens finalizaram", () => {
      const items: UploadQueueItem[] = [
        {
          clientUploadId: "00000000-0000-0000-0000-000000000001",
          slug: "teste",
          fileName: "foto.jpg",
          contentType: "image/jpeg",
          fileSizeBytes: 1000,
          state: "completed",
          attempts: 1,
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        },
      ];
      const summary = computeQueueProgressSummary(items);
      assert.equal(summary.completed, 1);
      assert.equal(summary.pending, 0);
      assert.equal(summary.statusLabel, "Envio concluído");
    });
  });

  describe("checkStorageQuotaBeforeEnqueue", () => {
    it("deve permitir blobs quando há espaço suficiente", async () => {
      // Em Node/teste sem navigator.storage, passa sem erro
      await assert.doesNotReject(async () => {
        await checkStorageQuotaBeforeEnqueue(1024 * 1024);
      });
    });
  });

  describe("IndexedDB Lease & Concorrência Multi-Tab (Fase 6 Boundary)", () => {
    let cleanupMock: () => void;

    function setupMockIndexedDB() {
      const stores = new Map<string, Map<string, any>>();

      const mockIDB: any = {
        open(name: string, version: number) {
          const req: any = {};
          setTimeout(() => {
            const db: any = {
              objectStoreNames: {
                contains(storeName: string) {
                  return stores.has(storeName);
                },
              },
              createObjectStore(storeName: string) {
                stores.set(storeName, new Map());
                return {
                  createIndex() {},
                };
              },
              transaction(storeNames: string | string[]) {
                const storeName = Array.isArray(storeNames) ? storeNames[0] : storeNames;
                if (!stores.has(storeName)) {
                  stores.set(storeName, new Map());
                }
                const storeMap = stores.get(storeName)!;

                return {
                  objectStore() {
                    return {
                      get(key: string) {
                        const r: any = {};
                        setTimeout(() => {
                          r.result = storeMap.get(key);
                          if (r.onsuccess) r.onsuccess();
                        }, 0);
                        return r;
                      },
                      put(value: any) {
                        const r: any = {};
                        setTimeout(() => {
                          const key = value.clientUploadId || value.lockId;
                          storeMap.set(key, JSON.parse(JSON.stringify(value)));
                          if (r.onsuccess) r.onsuccess();
                        }, 0);
                        return r;
                      },
                      delete(key: string) {
                        const r: any = {};
                        setTimeout(() => {
                          storeMap.delete(key);
                          if (r.onsuccess) r.onsuccess();
                        }, 0);
                        return r;
                      },
                      getAll() {
                        const r: any = {};
                        setTimeout(() => {
                          r.result = Array.from(storeMap.values());
                          if (r.onsuccess) r.onsuccess();
                        }, 0);
                        return r;
                      },
                    };
                  },
                };
              },
            };

            if (req.onupgradeneeded) {
              req.onupgradeneeded({ target: { result: db } });
            }
            req.result = db;
            if (req.onsuccess) req.onsuccess();
          }, 0);
          return req;
        },
      };

      (globalThis as any).indexedDB = mockIDB;
      return () => {
        delete (globalThis as any).indexedDB;
      };
    }

    it("upload > lease TTL -> tab B faz reclaim e tab A não finaliza item pertencente a B", async () => {
      cleanupMock = setupMockIndexedDB();
      try {
        const {
          enqueueMemoryUpload,
          claimUploadQueueItem,
          updateQueueItem,
          getQueueItem,
        } = await import("./upload-queue");

        const clientUploadId = "68888888-0000-4000-8000-000000000001";
        const dummyBlob = { size: 1024, type: "image/jpeg" } as any;

        // 1. Enfileirar item
        await enqueueMemoryUpload({
          slug: "test-slug",
          fileBlob: dummyBlob,
          fileName: "teste.jpg",
          contentType: "image/jpeg",
          fileSizeBytes: 1024,
          clientUploadId,
        });

        // 2. Tab A reclama item com lease curto de 100ms (simulando timeout / suspensão)
        const claimA = await claimUploadQueueItem(clientUploadId, {
          ownerTabId: "tab_A",
          leaseDurationMs: 100,
        });
        assert.equal(claimA.success, true);
        assert.ok(claimA.leaseToken);
        const leaseTokenA = claimA.leaseToken;

        // 3. Tab B tenta reclamar enquanto Tab A está activa -> REJEITADO (lease activa)
        const claimBWhileActive = await claimUploadQueueItem(clientUploadId, {
          ownerTabId: "tab_B",
        });
        assert.equal(claimBWhileActive.success, false);
        assert.equal(claimBWhileActive.reason, "LEASE_ACTIVE_ANOTHER_TAB");

        // 4. Simular suspensão / upload longo da Tab A (> 100ms lease TTL)
        await new Promise((r) => setTimeout(r, 150));

        // 5. Tab B faz reclaim com sucesso após expiração do lease de A
        const claimBAfterExpiry = await claimUploadQueueItem(clientUploadId, {
          ownerTabId: "tab_B",
          leaseDurationMs: 5000,
        });
        assert.equal(claimBAfterExpiry.success, true);
        assert.notEqual(claimBAfterExpiry.leaseToken, leaseTokenA);
        const leaseTokenB = claimBAfterExpiry.leaseToken;

        // 6. Tab A regressa após suspensão e tenta marcar o item como 'uploaded' ou 'completed' com o seu token antigo
        const tabAUpdateRes = await updateQueueItem(
          clientUploadId,
          { state: "uploaded" },
          { expectedLeaseToken: leaseTokenA }
        );
        // Protecção: Tab A NÃO consegue sobrescrever o estado porque a lease pertence agora a B
        assert.equal(tabAUpdateRes, null);

        // 7. Tab B finaliza o item com sucesso
        const tabBFinalizeRes = await updateQueueItem(
          clientUploadId,
          { state: "completed", photoId: "photo_tab_b_123" },
          { expectedLeaseToken: leaseTokenB }
        );
        assert.ok(tabBFinalizeRes);
        assert.equal(tabBFinalizeRes.state, "completed");

        // 8. Tab A tenta marcar falha ou regredir estado -> Bloqueado
        const tabARegressRes = await updateQueueItem(
          clientUploadId,
          { state: "failed", error: "Tab A timeout" },
          { expectedLeaseToken: leaseTokenA }
        );
        assert.equal(tabARegressRes, null);

        // 9. Verificar estado final no IndexedDB: concluído pela Tab B, zero corrupção
        const finalItem = await getQueueItem(clientUploadId);
        assert.ok(finalItem);
        assert.equal(finalItem.state, "completed");
        assert.equal(finalItem.photoId, "photo_tab_b_123");
      } finally {
        cleanupMock();
      }
    });
  });
});
