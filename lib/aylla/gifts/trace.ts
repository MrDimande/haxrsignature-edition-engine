import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

export function getOrCreateAyllaRequestId(request: Request): string {
  return request.headers.get("x-request-id")?.trim() || randomUUID();
}

/**
 * Emits sanitized correlation logs on Edition Aylla proxy routes.
 * Never logs session tokens, cookies, passwords, OTPs, or contacts.
 */
export function logEditionAyllaTrace(
  requestId: string,
  stage: string,
  meta: Record<string, string | number | boolean | undefined> = {}
): void {
  const cleanMeta: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(meta)) {
    if (value !== undefined) {
      cleanMeta[key] = value;
    }
  }

  console.info(
    JSON.stringify({
      scope: "edition/aylla/trace",
      at: new Date().toISOString(),
      requestId,
      stage,
      ...cleanMeta,
    })
  );
}

export function withAyllaRequestId<T extends Response>(
  response: T,
  requestId: string
): T {
  response.headers.set("x-request-id", requestId);
  return response;
}

export function jsonWithAyllaRequestId(
  body: unknown,
  init: ResponseInit,
  requestId: string
): NextResponse {
  const res = NextResponse.json(body, init);
  res.headers.set("x-request-id", requestId);
  return res;
}
