import { resolveMemoriesEvent } from "@lib/memories/session-store";
import { memoriesJson } from "@lib/memories/admin-auth";
import { authorizeDisplayRequest, verifyDisplaySessionActive } from "@lib/memories/display-security";
import { getLiveEventsSince } from "@lib/memories/live-wall-store";

export const dynamic = "force-dynamic";

/**
 * GET /api/memories/live-wall/stream?slug=...&cursor=...
 * Transporte Server-Sent Events (SSE) em tempo real para o Live Wall.
 *
 * Directivas de Arquitectura:
 * 1. Monotonicidade Estrita: Eventos entregues com `id: <sequence_no>`.
 * 2. Suporte Nativo a Last-Event-ID / cursor de reconexão.
 * 3. Detecção de Poda de Log: Emite `resync_required` se o cursor expirou.
 * 4. Heartbeats regulares (14-15s) para conservação de proxies e detecção de quedas.
 * 5. Revalidação Periódica de Sessão: Detecta revogação ou expiração de display durante stream aberto (janela <= 5s) e encerra conexão sem vazar nova media.
 * 6. Cancelamento limpo via AbortSignal sem fugas de memória.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug")?.trim() || "";

  // 1. Obter cursor inicial do cabeçalho Last-Event-ID ou query param
  const lastEventIdHeader = request.headers.get("last-event-id");
  const cursorParam = searchParams.get("cursor");
  const rawCursor = lastEventIdHeader || cursorParam || "0";
  let currentCursor = Math.max(parseInt(rawCursor, 10) || 0, 0);

  if (!slug) {
    return memoriesJson(400, { success: false, error: "Slug do evento é obrigatório." });
  }

  const eventInfo = await resolveMemoriesEvent(slug);
  if (!eventInfo) {
    return memoriesJson(404, { success: false, error: "Evento não encontrado." });
  }

  const eventId = eventInfo.id;
  const experienceId = eventInfo.experienceId;

  // 2. Validação da Sessão de Display
  const auth = await authorizeDisplayRequest(request, eventId);
  if (!auth.ok) {
    return memoriesJson(auth.status, { success: false, error: auth.error, code: auth.code });
  }

  const sessionId = auth.context.id;
  const expiresAtMs = new Date(auth.context.expiresAt).getTime();

  // Intervalos de polling e revalidação de sessão
  const recheckQuery = searchParams.get("_recheck_ms");
  const sessionRecheckIntervalMs = recheckQuery ? Math.max(parseInt(recheckQuery, 10) || 5000, 500) : 5000;
  const pollQuery = searchParams.get("_poll_ms");
  const pollIntervalMs = pollQuery ? Math.max(parseInt(pollQuery, 10) || 2000, 200) : 2000;

  const encoder = new TextEncoder();
  let intervalId: NodeJS.Timeout | null = null;
  let heartbeatCount = 0;
  let lastSessionCheckMs = Date.now();
  let isClosed = false;

  const stream = new ReadableStream({
    start(controller) {
      function cleanup() {
        if (isClosed) return;
        isClosed = true;
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      }

      function safeEnqueue(data: Uint8Array): boolean {
        if (isClosed || request.signal.aborted) return false;
        try {
          controller.enqueue(data);
          return true;
        } catch {
          cleanup();
          return false;
        }
      }

      // Evento inicial de sincronização
      safeEnqueue(
        encoder.encode(`event: init\ndata: ${JSON.stringify({ cursor: currentCursor })}\n\n`)
      );

      async function pollEvents() {
        if (request.signal.aborted || isClosed) {
          cleanup();
          return;
        }

        try {
          const nowMs = Date.now();

          // 1. Verificação local de expiração de TTL (custo zero de base de dados)
          if (nowMs >= expiresAtMs) {
            safeEnqueue(
              encoder.encode(`event: session_invalidated\ndata: ${JSON.stringify({ code: "DISPLAY_SESSION_EXPIRED", message: "A sessão de display expirou." })}\n\n`)
            );
            cleanup();
            try { controller.close(); } catch {}
            return;
          }

          // 2. Revalidação periódica de revogação na base de dados (intervalo seguro <= 5s)
          if (nowMs - lastSessionCheckMs >= sessionRecheckIntervalMs) {
            lastSessionCheckMs = nowMs;
            const sessionStatus = await verifyDisplaySessionActive(sessionId, eventId);
            if (!sessionStatus.active) {
              safeEnqueue(
                encoder.encode(`event: session_invalidated\ndata: ${JSON.stringify({ code: sessionStatus.code, message: "A sessão de display foi revogada ou desactivada." })}\n\n`)
              );
              cleanup();
              try { controller.close(); } catch {}
              return;
            }
          }

          if (isClosed || request.signal.aborted) return;

          heartbeatCount++;
          // Heartbeat regular a cada ~14 segundos
          const heartbeatTicks = Math.max(Math.floor(14000 / pollIntervalMs), 1);
          if (heartbeatCount >= heartbeatTicks) {
            heartbeatCount = 0;
            safeEnqueue(
              encoder.encode(`event: heartbeat\ndata: ${JSON.stringify({ time: new Date().toISOString() })}\n\n`)
            );
          }

          // 3. Obtenção de novos eventos (apenas se a sessão continuar comprovadamente activa)
          const result = await getLiveEventsSince({
            eventId,
            experienceId,
            cursor: currentCursor,
            limit: 50,
          });

          if (!result.ok || isClosed || request.signal.aborted) return;

          if (result.resyncRequired) {
            safeEnqueue(
              encoder.encode(`event: resync_required\ndata: ${JSON.stringify({ message: "Cursor expirado." })}\n\n`)
            );
            return;
          }

          if (result.events && result.events.length > 0) {
            for (const ev of result.events) {
              if (isClosed || request.signal.aborted) break;
              const sseChunk = `id: ${ev.sequenceNo}\nevent: ${ev.eventType}\ndata: ${JSON.stringify(ev)}\n\n`;
              const enqueued = safeEnqueue(encoder.encode(sseChunk));
              if (!enqueued) break;
              currentCursor = Math.max(currentCursor, ev.sequenceNo);
            }
          }
        } catch (pollErr) {
          if (!isClosed && !request.signal.aborted) {
            console.error("[live-wall/stream] Erro durante poll de eventos:", pollErr);
          }
        }
      }

      intervalId = setInterval(pollEvents, pollIntervalMs);

      // Tratamento de aborto pelo cliente
      request.signal.addEventListener("abort", () => {
        cleanup();
        try {
          controller.close();
        } catch {}
      });
    },
    cancel() {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform, must-revalidate",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
