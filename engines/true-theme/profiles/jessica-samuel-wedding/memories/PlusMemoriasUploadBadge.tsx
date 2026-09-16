"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, WifiOff, RefreshCw, CheckCircle2, KeyRound, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useUploadQueue } from "@lib/memories/use-upload-queue";

interface PlusMemoriasUploadBadgeProps {
  slug: string;
  participantId?: string;
}

export function PlusMemoriasUploadBadge({ slug, participantId }: PlusMemoriasUploadBadgeProps) {
  const { items, summary, isProcessing, retryItem, dismissItem, triggerProcess } = useUploadQueue({
    slug,
    participantId,
  });

  const [isExpanded, setIsExpanded] = useState(false);

  // Não renderizar nada se não houver itens na fila
  if (items.length === 0) return null;

  // Se todos estão concluídos e já passaram alguns segundos, pode sumir
  const activeItems = items.filter((it) => it.state !== "completed");
  if (activeItems.length === 0 && summary.completed > 0) {
    // Manter pequeno badge de confirmação temporário se foi concluído recentemente
    const latest = items[0];
    const isRecent = latest?.completedAt && Date.now() - new Date(latest.completedAt).getTime() < 8000;
    if (!isRecent && !isExpanded) return null;
  }

  const getStatusIcon = () => {
    if (summary.uploading > 0 || isProcessing) {
      return <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C5A880]" />;
    }
    if (summary.authRequired > 0) {
      return <KeyRound className="w-3.5 h-3.5 text-amber-400" />;
    }
    if (summary.failed > 0) {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        return <WifiOff className="w-3.5 h-3.5 text-stone-400" />;
      }
      return <RefreshCw className="w-3.5 h-3.5 text-amber-400" />;
    }
    if (summary.completed === summary.total && summary.total > 0) {
      return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
    }
    return <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C5A880]" />;
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-40 max-w-sm ml-auto">
      <div className="bg-[#121212]/95 backdrop-blur-md border border-[#C5A880]/30 rounded-xl shadow-2xl p-3 text-stone-200">
        <div
          className="flex items-center justify-between gap-3 cursor-pointer select-none"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-black/40 border border-[#C5A880]/20">
              {getStatusIcon()}
            </div>
            <div>
              <div className="text-xs font-serif tracking-wider text-stone-200">
                {summary.statusLabel || "A sincronizar memórias"}
              </div>
              <div className="text-[10px] text-stone-400">
                {activeItems.length > 0
                  ? `${activeItems.length} momento${activeItems.length > 1 ? "s" : ""} pendente${activeItems.length > 1 ? "s" : ""}`
                  : "Todos os momentos guardados"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-stone-400">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-[#C5A880]" />
            ) : (
              <ChevronUp className="w-4 h-4 text-[#C5A880]" />
            )}
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-stone-800/80 mt-3 pt-2.5 space-y-2"
            >
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1 text-xs">
                {items.map((item) => (
                  <div
                    key={item.clientUploadId}
                    className="p-2 rounded-lg bg-black/30 border border-stone-800 flex items-center justify-between gap-2"
                  >
                    <div className="truncate flex-1">
                      <div className="font-medium text-stone-300 truncate">
                        {item.caption || item.fileName || "Fotografia"}
                      </div>
                      <div className="text-[10px] text-stone-400 flex items-center gap-1.5">
                        <span>
                          {item.state === "completed" && "Envio concluído"}
                          {item.state === "uploading" && "A transferir..."}
                          {item.state === "preparing" && "A preparar..."}
                          {item.state === "completing" && "A confirmar..."}
                          {item.state === "queued" && "À espera de ligação"}
                          {item.state === "authentication_required" && "Precisa de autenticação"}
                          {item.state === "failed" && (item.error || "A tentar novamente...")}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {item.state === "failed" && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            retryItem(item.clientUploadId);
                          }}
                          className="px-2 py-1 rounded bg-[#C5A880]/20 hover:bg-[#C5A880]/30 text-[#E0C9A6] text-[10px] transition-colors"
                        >
                          Tentar
                        </button>
                      )}
                      {(item.state === "completed" || item.terminalError) && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            dismissItem(item.clientUploadId);
                          }}
                          className="text-stone-500 hover:text-stone-300 p-1 text-[10px]"
                          title="Remover"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {activeItems.length > 0 && (
                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerProcess();
                    }}
                    disabled={isProcessing}
                    className="text-[11px] font-serif text-[#C5A880] hover:text-[#E0C9A6] disabled:opacity-50 transition-colors"
                  >
                    {isProcessing ? "A processar..." : "Sincronizar agora"}
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
