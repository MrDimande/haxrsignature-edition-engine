import { randomUUID } from "node:crypto";
import {
  getAyllaGiftProxySecret,
  getCoreApiBaseUrl,
  getEditionSiteUrl,
  getProxyTimeoutMs,
} from "@lib/control-plane/config";
import { logEditionAyllaTrace } from "@lib/aylla/gifts/trace";

export interface CoreFetchOptions {
  readonly method: "GET" | "POST" | "DELETE";
  readonly path: string;
  readonly body?: unknown;
  readonly requestId?: string;
  readonly timeoutMs?: number;
  readonly signal?: AbortSignal;
}

export type CoreFetchResult<T = unknown> =
  | { readonly ok: true; readonly status: number; readonly data: T; readonly requestId: string }
  | { readonly ok: false; readonly status: number; readonly error: string; readonly code?: string; readonly requestId: string };

/**
 * Races an async operation against an explicit deadline so neither fetch()
 * nor response.json() can stall past timeoutMs on hung sockets.
 */
function raceWithDeadline<T>(
  promise: Promise<T>,
  remainingMs: number,
  onTimeout: () => void
): Promise<T> {
  if (remainingMs <= 0) {
    onTimeout();
    return Promise.reject(Object.assign(new Error("Core proxy deadline exceeded"), { name: "AbortError" }));
  }

  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      onTimeout();
      reject(Object.assign(new Error("Core proxy deadline exceeded"), { name: "AbortError" }));
    }, remainingMs);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

/**
 * Server-to-server proxy client from Edition to Core for Baby Aylla gift operations.
 * Fails closed if HAXR_AYLLA_GIFT_PROXY_SECRET is not configured.
 */
export async function callCoreGiftApi<T = unknown>(
  options: CoreFetchOptions
): Promise<CoreFetchResult<T>> {
  const requestId = options.requestId || randomUUID();
  const secret = getAyllaGiftProxySecret();
  if (!secret) {
    logEditionAyllaTrace(requestId, "edition_proxy_secret_missing", { path: options.path });
    return {
      ok: false,
      status: 503,
      error: "Serviço temporariamente indisponível (configuração de proxy ausente).",
      code: "PROXY_SECRET_MISSING",
      requestId,
    };
  }

  const baseUrl = getCoreApiBaseUrl();
  const url = `${baseUrl}${options.path.startsWith("/") ? "" : "/"}${options.path}`;
  const timeoutMs = options.timeoutMs || getProxyTimeoutMs();
  const startedAt = Date.now();

  const controller = new AbortController();
  const onExternalAbort = () => controller.abort();
  if (options.signal) {
    if (options.signal.aborted) {
      controller.abort();
    } else {
      options.signal.addEventListener("abort", onExternalAbort, { once: true });
    }
  }

  logEditionAyllaTrace(requestId, "edition_proxy_start", {
    method: options.method,
    path: options.path,
    timeoutMs,
  });

  try {
    const response = await raceWithDeadline(
      fetch(url, {
        method: options.method,
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${secret}`,
          "x-haxr-edition-proxy": secret,
          "x-haxr-proxy-origin": getEditionSiteUrl(),
          "x-request-id": requestId,
        },
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      }),
      timeoutMs,
      () => controller.abort()
    );

    logEditionAyllaTrace(requestId, "edition_proxy_headers", {
      path: options.path,
      status: response.status,
      durationMs: Date.now() - startedAt,
    });

    let data: any;
    try {
      const remainingMs = Math.max(100, timeoutMs - (Date.now() - startedAt));
      data = await raceWithDeadline(
        response.json(),
        remainingMs,
        () => controller.abort()
      );
    } catch (jsonErr: any) {
      if (jsonErr?.name === "AbortError" || controller.signal.aborted) {
        throw jsonErr;
      }
      data = null;
    }

    logEditionAyllaTrace(requestId, "edition_proxy_end", {
      path: options.path,
      status: response.status,
      ok: response.ok,
      outcome: typeof data?.outcome === "string" ? data.outcome : undefined,
      durationMs: Date.now() - startedAt,
    });

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: data?.error || `Erro de upstream (${response.status})`,
        code: data?.outcome || data?.code,
        requestId,
      };
    }

    return {
      ok: true,
      status: response.status,
      data: data as T,
      requestId,
    };
  } catch (err: any) {
    if (err?.name === "AbortError" || controller.signal.aborted) {
      logEditionAyllaTrace(requestId, "edition_proxy_timeout", {
        path: options.path,
        callerAborted: Boolean(options.signal?.aborted),
        durationMs: Date.now() - startedAt,
      });
      return {
        ok: false,
        status: 504,
        error: "Tempo limite excedido ao contactar o servidor principal.",
        code: "CORE_TIMEOUT",
        requestId,
      };
    }

    logEditionAyllaTrace(requestId, "edition_proxy_network_error", {
      path: options.path,
      errorName: err instanceof Error ? err.name : "UnknownError",
      durationMs: Date.now() - startedAt,
    });

    return {
      ok: false,
      status: 502,
      error: "Falha de comunicação com o servidor principal.",
      code: "CORE_NETWORK_ERROR",
      requestId,
    };
  } finally {
    if (options.signal) {
      options.signal.removeEventListener("abort", onExternalAbort);
    }
  }
}
