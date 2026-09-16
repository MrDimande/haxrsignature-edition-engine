"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getAllQueueItems,
  enqueueMemoryUpload,
  processUploadQueue,
  updateQueueItem,
  removeQueueItem,
  computeQueueProgressSummary,
  subscribeToQueueUpdates,
  type UploadQueueItem,
  type QueueProgressSummary,
} from "./upload-queue";

export interface UseUploadQueueOptions {
  slug: string;
  participantId?: string;
  autoProcess?: boolean;
}

export function useUploadQueue({
  slug,
  participantId,
  autoProcess = true,
}: UseUploadQueueOptions) {
  const [items, setItems] = useState<UploadQueueItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const refreshItems = useCallback(async () => {
    try {
      const all = await getAllQueueItems(slug);
      setItems(all);
    } catch {
      // IndexedDB pode não estar pronto em SSR
    }
  }, [slug]);

  const triggerProcess = useCallback(async (forceItemId?: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await processUploadQueue({
        slug,
        currentParticipantId: participantId,
        forceItemUploadId: forceItemId,
      });
    } finally {
      setIsProcessing(false);
      await refreshItems();
    }
  }, [slug, participantId, isProcessing, refreshItems]);

  // Carregamento inicial e subscrição a mutações locais/outras abas
  useEffect(() => {
    refreshItems();
    const unsubscribe = subscribeToQueueUpdates(() => {
      refreshItems();
    });

    let bc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      try {
        bc = new BroadcastChannel("haxr_upload_queue_events");
        bc.onmessage = () => {
          refreshItems();
        };
      } catch {
        // Ignorar
      }
    }

    return () => {
      unsubscribe();
      if (bc) bc.close();
    };
  }, [refreshItems]);

  // Processamento automático na recuperação de rede ou retorno de foco
  useEffect(() => {
    if (!autoProcess) return;

    const handleOnline = () => {
      triggerProcess();
    };

    const handleFocus = () => {
      triggerProcess();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline);
      window.addEventListener("focus", handleFocus);
    }

    // Intervalo de verificação a cada 8 segundos se houver itens pendentes
    const interval = setInterval(() => {
      const hasPending = items.some(
        (it) => it.state !== "completed" && !it.terminalError
      );
      if (hasPending && typeof navigator !== "undefined" && navigator.onLine) {
        triggerProcess();
      }
    }, 8000);

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("focus", handleFocus);
      }
      clearInterval(interval);
    };
  }, [autoProcess, triggerProcess, items]);

  const enqueue = useCallback(
    async (file: File, metadata: {
      guestName?: string;
      caption?: string;
      challengeId?: string;
      tableId?: string;
      stageId?: string;
      capturedAt?: string;
    }) => {
      const item = await enqueueMemoryUpload({
        slug,
        fileBlob: file,
        fileName: file.name,
        contentType: file.type,
        fileSizeBytes: file.size,
        guestName: metadata.guestName,
        caption: metadata.caption,
        challengeId: metadata.challengeId,
        tableId: metadata.tableId,
        participantId,
        stageId: metadata.stageId,
        capturedAt: metadata.capturedAt,
      });

      await refreshItems();

      // Disparar envio imediato se houver ligação
      if (autoProcess && typeof navigator !== "undefined" && navigator.onLine) {
        // Envio assíncrono não bloqueante
        triggerProcess(item.clientUploadId);
      }

      return item;
    },
    [slug, participantId, autoProcess, refreshItems, triggerProcess]
  );

  const retryItem = useCallback(
    async (clientUploadId: string) => {
      await updateQueueItem(clientUploadId, {
        state: "queued",
        terminalError: false,
        nextRetryAt: 0,
        error: undefined,
      });
      await refreshItems();
      triggerProcess(clientUploadId);
    },
    [refreshItems, triggerProcess]
  );

  const dismissItem = useCallback(
    async (clientUploadId: string) => {
      await removeQueueItem(clientUploadId);
      await refreshItems();
    },
    [refreshItems]
  );

  const summary: QueueProgressSummary = computeQueueProgressSummary(items);

  return {
    items,
    summary,
    isProcessing,
    enqueue,
    retryItem,
    dismissItem,
    triggerProcess,
    refreshItems,
  };
}
