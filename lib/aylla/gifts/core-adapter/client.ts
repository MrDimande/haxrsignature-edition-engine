import { randomUUID } from "node:crypto";
import {
  getCoreApiBaseUrl,
  getEditionProxySecret,
  getEditionSiteUrl,
  getProxyTimeoutMs,
} from "@lib/control-plane/config";

export interface CoreFetchOptions {
  readonly method: "GET" | "POST" | "DELETE";
  readonly path: string;
  readonly body?: unknown;
  readonly requestId?: string;
  readonly timeoutMs?: number;
}

export type CoreFetchResult<T = unknown> =
  | { readonly ok: true; readonly status: number; readonly data: T }
  | { readonly ok: false; readonly status: number; readonly error: string; readonly code?: string };

/**
 * Server-to-server proxy client from Edition to Core for Baby Aylla gift operations.
 * Fails closed if HAXR_EDITION_PROXY_SECRET is not configured.
 */
export async function callCoreGiftApi<T = unknown>(
  options: CoreFetchOptions
): Promise<CoreFetchResult<T>> {
  const secret = getEditionProxySecret();
  if (!secret) {
    return {
      ok: false,
      status: 503,
      error: "Serviço temporariamente indisponível (configuração de proxy ausente).",
      code: "PROXY_SECRET_MISSING",
    };
  }

  const baseUrl = getCoreApiBaseUrl();
  const url = `${baseUrl}${options.path.startsWith("/") ? "" : "/"}${options.path}`;
  const requestId = options.requestId || randomUUID();
  const timeoutMs = options.timeoutMs || getProxyTimeoutMs();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
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
    });

    let data: any;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: data?.error || `Erro de upstream (${response.status})`,
        code: data?.outcome || data?.code,
      };
    }

    return {
      ok: true,
      status: response.status,
      data: data as T,
    };
  } catch (err: any) {
    if (err?.name === "AbortError") {
      return {
        ok: false,
        status: 504,
        error: "Tempo limite excedido ao contactar o servidor principal.",
        code: "CORE_TIMEOUT",
      };
    }

    return {
      ok: false,
      status: 502,
      error: "Falha de comunicação com o servidor principal.",
      code: "CORE_NETWORK_ERROR",
    };
  } finally {
    clearTimeout(timer);
  }
}
