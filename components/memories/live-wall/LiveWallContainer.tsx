"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import type {
  LiveWallConfig,
  LiveWallMediaItem,
  LiveWallExplorerItem,
} from "@lib/memories/live-wall-store";
import { SpotlightView } from "./SpotlightView";
import { MosaicView } from "./MosaicView";
import { MomentsView } from "./MomentsView";

const MAX_RING_BUFFER_SIZE = 100;
const URL_REFRESH_INTERVAL_MS = 45 * 60 * 1000; // 45 minutos

interface LiveWallContainerProps {
  slug: string;
}

export const LiveWallContainer: React.FC<LiveWallContainerProps> = ({ slug }) => {
  const [config, setConfig] = useState<LiveWallConfig | null>(null);
  const [mediaList, setMediaList] = useState<LiveWallMediaItem[]>([]);
  const [explorers, setExplorers] = useState<LiveWallExplorerItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "reconnecting" | "offline">("connected");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentMode, setCurrentMode] = useState<"spotlight" | "mosaic" | "moments">("spotlight");

  const cursorRef = useRef<number>(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const advanceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const backoffDelayRef = useRef<number>(2000);

  // 1. Carregar Snapshot Inicial
  const loadSnapshot = useCallback(async () => {
    try {
      const res = await fetch(`/api/memories/live-wall/snapshot?slug=${encodeURIComponent(slug)}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.code === "LIVE_WALL_DISABLED") {
          setErrorMsg("O Live Wall encontra-se actualmente desactivado para este evento.");
        } else {
          setErrorMsg(data.error || "Erro ao ligar ao Live Wall.");
        }
        return false;
      }

      setConfig(data.config);
      setCurrentMode(data.config.mode || "spotlight");
      cursorRef.current = Number(data.cursor ?? 0);
      setMediaList(data.media || []);
      setExplorers(data.explorers || []);
      setErrorMsg(null);
      return true;
    } catch (err: any) {
      console.error("[LiveWallContainer] Erro ao carregar snapshot:", err);
      setErrorMsg("Falha na ligação ao servidor.");
      return false;
    }
  }, [slug]);

  // 2. Conexão SSE em Tempo Real
  const connectSSE = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    const sseUrl = `/api/memories/live-wall/stream?slug=${encodeURIComponent(slug)}&cursor=${cursorRef.current}`;
    const es = new EventSource(sseUrl);
    eventSourceRef.current = es;

    es.onopen = () => {
      setConnectionStatus("connected");
      backoffDelayRef.current = 2000; // Reset backoff
    };

    es.addEventListener("init", (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.cursor) cursorRef.current = Math.max(cursorRef.current, Number(payload.cursor));
      } catch {}
    });

    es.addEventListener("heartbeat", () => {
      setConnectionStatus("connected");
    });

    es.addEventListener("resync_required", async () => {
      await loadSnapshot();
    });

    es.addEventListener("media_approved", (event: MessageEvent) => {
      try {
        const ev = JSON.parse(event.data);
        cursorRef.current = Math.max(cursorRef.current, Number(ev.sequenceNo));
        // Recarregar snapshot para obter URLs assinados WebP autorizados da nova foto
        loadSnapshot();
      } catch {}
    });

    es.addEventListener("derivatives_ready", (event: MessageEvent) => {
      try {
        const ev = JSON.parse(event.data);
        cursorRef.current = Math.max(cursorRef.current, Number(ev.sequenceNo));
        loadSnapshot();
      } catch {}
    });

    es.addEventListener("media_hidden", (event: MessageEvent) => {
      try {
        const ev = JSON.parse(event.data);
        cursorRef.current = Math.max(cursorRef.current, Number(ev.sequenceNo));
        const mediaId = ev.subjectMediaId;
        setMediaList((prev) => prev.filter((m) => m.id !== mediaId));
      } catch {}
    });

    es.addEventListener("media_deleted", (event: MessageEvent) => {
      try {
        const ev = JSON.parse(event.data);
        cursorRef.current = Math.max(cursorRef.current, Number(ev.sequenceNo));
        const mediaId = ev.subjectMediaId;
        setMediaList((prev) => prev.filter((m) => m.id !== mediaId));
      } catch {}
    });

    es.addEventListener("social_changed", (event: MessageEvent) => {
      try {
        const ev = JSON.parse(event.data);
        cursorRef.current = Math.max(cursorRef.current, Number(ev.sequenceNo));
        loadSnapshot();
      } catch {}
    });

    es.addEventListener("session_invalidated", (event: MessageEvent) => {
      try {
        const ev = JSON.parse(event.data);
        setConnectionStatus("offline");
        setErrorMsg(ev.message || "A sessão de display foi revogada ou expirou.");
        es.close();
        eventSourceRef.current = null;
      } catch {}
    });

    es.onerror = () => {
      setConnectionStatus("reconnecting");
      es.close();
      eventSourceRef.current = null;

      // Reconnect com Exponential Backoff + Jitter
      const jitter = Math.random() * 1000;
      const delay = Math.min(backoffDelayRef.current + jitter, 30000);
      backoffDelayRef.current = Math.min(backoffDelayRef.current * 1.5, 30000);

      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = setTimeout(() => {
        connectSSE();
      }, delay);
    };
  }, [slug, loadSnapshot]);

  // Inicialização
  useEffect(() => {
    let mounted = true;
    loadSnapshot().then((ok) => {
      if (ok && mounted) {
        connectSSE();
      }
    });

    return () => {
      mounted = false;
      if (eventSourceRef.current) eventSourceRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
  }, [loadSnapshot, connectSSE]);

  // 3. Rotação Automática de Mídia (Spotlight)
  const advanceNext = useCallback(() => {
    if (mediaList.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % mediaList.length);
  }, [mediaList.length]);

  const advancePrev = useCallback(() => {
    if (mediaList.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + mediaList.length) % mediaList.length);
  }, [mediaList.length]);

  useEffect(() => {
    if (isPaused || currentMode !== "spotlight" || mediaList.length <= 1) return;

    const intervalSeconds = config?.autoAdvanceSeconds ?? 10;
    const currentItem = mediaList[currentIndex];

    // Se for vídeo, damos mais tempo ou aguardamos onVideoEnded
    const delayMs = currentItem?.kind === "video" ? Math.max(intervalSeconds, 20) * 1000 : intervalSeconds * 1000;

    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    advanceTimerRef.current = setTimeout(() => {
      advanceNext();
    }, delayMs);

    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
  }, [currentIndex, isPaused, currentMode, mediaList, config?.autoAdvanceSeconds, advanceNext]);

  // 4. Renovação Periódica de URLs Assinadas da Cloudflare R2 (45 min)
  useEffect(() => {
    const refreshInterval = setInterval(async () => {
      if (mediaList.length === 0) return;
      try {
        const mediaIds = mediaList.map((m) => m.id);
        const res = await fetch("/api/memories/live-wall/refresh-urls", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug, mediaIds }),
        });
        const data = await res.json();
        if (data.success && data.urls) {
          setMediaList((prev) =>
            prev.map((item) => {
              const updated = data.urls[item.id];
              if (!updated) return item;
              return {
                ...item,
                mediumUrl: updated.mediumUrl,
                thumbnailUrl: updated.thumbnailUrl,
                posterUrl: updated.posterUrl,
              };
            })
          );
        }
      } catch (refreshErr) {
        console.error("[LiveWallContainer] Erro na renovação de URLs:", refreshErr);
      }
    }, URL_REFRESH_INTERVAL_MS);

    return () => clearInterval(refreshInterval);
  }, [slug, mediaList]);

  // 5. Controlos de Teclado (Atalhos do Operador)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        setIsPaused((p) => !p);
      } else if (e.key === "ArrowRight") {
        advanceNext();
      } else if (e.key === "ArrowLeft") {
        advancePrev();
      } else if (e.key === "f" || e.key === "F") {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      } else if (e.key === "m" || e.key === "M") {
        setCurrentMode((prev) =>
          prev === "spotlight" ? "mosaic" : prev === "mosaic" ? "moments" : "spotlight"
        );
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [advanceNext, advancePrev]);

  // Ecrã de Erro ou Desactivado
  if (errorMsg) {
    return (
      <div className="w-screen h-screen bg-[#050505] flex flex-col items-center justify-center p-8 text-center select-none">
        <h1 className="text-[#d4af37] font-serif text-3xl md:text-5xl tracking-widest uppercase mb-4">
          HAXR Signature Live Wall
        </h1>
        <p className="text-stone-400 text-lg md:text-xl font-serif italic max-w-md">
          {errorMsg}
        </p>
      </div>
    );
  }

  // Ecrã de Espera / Sem Mídias
  if (mediaList.length === 0) {
    return (
      <div className="w-screen h-screen bg-[#050505] flex flex-col items-center justify-center p-8 text-center select-none">
        <h1 className="text-[#d4af37] font-serif text-4xl md:text-6xl tracking-widest uppercase mb-4 animate-pulse">
          HAXR Live Wall
        </h1>
        <p className="text-stone-400 text-lg md:text-xl font-serif italic max-w-lg mb-8">
          A aguardar as primeiras memórias capturadas pelos convidados...
        </p>
        <div className="text-xs text-stone-600 uppercase tracking-widest">
          Transmissão em Tempo Real Activa
        </div>
      </div>
    );
  }

  const activeItem = mediaList[currentIndex] || mediaList[0];

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden font-sans select-none">
      {/* Visualização Conforme o Modo Activo */}
      {currentMode === "spotlight" && (
        <SpotlightView
          item={activeItem}
          showReactions={config?.showReactions ?? true}
          showComments={config?.showComments ?? true}
          onVideoEnded={advanceNext}
        />
      )}

      {currentMode === "mosaic" && (
        <MosaicView
          items={mediaList}
          showReactions={config?.showReactions ?? true}
        />
      )}

      {currentMode === "moments" && (
        <MomentsView
          items={mediaList}
          showReactions={config?.showReactions ?? true}
        />
      )}

      {/* Painel Superior Discreto de Marca e Status */}
      <div className="absolute top-4 left-6 right-6 z-30 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3">
          <span className="text-[#d4af37] font-serif text-sm tracking-widest uppercase font-semibold">
            HAXR Signature
          </span>
          {isPaused && (
            <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded border border-amber-500/40 uppercase tracking-wider">
              Pausa
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {connectionStatus === "reconnecting" && (
            <span className="bg-rose-500/20 text-rose-300 text-[10px] px-2.5 py-1 rounded-full border border-rose-500/40 flex items-center gap-1.5 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              A reconectar...
            </span>
          )}
          <span className="text-stone-500 text-xs font-mono">
            {currentIndex + 1} / {mediaList.length}
          </span>
        </div>
      </div>

      {/* Top Explorers Overlay Discreto (se activado) */}
      {config?.showExplorers && explorers.length > 0 && currentMode === "spotlight" && (
        <div className="absolute top-16 right-6 z-20 hidden lg:flex flex-col gap-1.5 bg-black/60 backdrop-blur-md border border-[#d4af37]/20 rounded-xl p-3 max-w-[220px] shadow-2xl pointer-events-none">
          <div className="text-[10px] text-[#d4af37] uppercase tracking-wider font-semibold border-b border-white/10 pb-1 mb-1">
            Top Exploradores
          </div>
          {explorers.map((exp) => (
            <div key={exp.participantId} className="flex items-center justify-between text-xs text-stone-300">
              <span className="truncate pr-2">
                <span className="text-amber-400 font-bold mr-1">#{exp.rank}</span>
                {exp.displayName}
              </span>
              <span className="text-stone-400 font-mono text-[11px] font-semibold">{exp.totalPoints} pts</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
