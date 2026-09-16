import { NextResponse } from "next/server";
import { isCronAuthorized } from "@lib/cron-auth";
import { processPendingDerivativesBatch } from "./derivatives";

/**
 * Keep each invocation small enough for a serverless request while relying on
 * the database lease as the sole concurrency control.
 */
export const DERIVATIVE_WORKER_BATCH_LIMIT = 5;
export const SCOPED_DERIVATIVE_WORKER_BATCH_LIMIT = 1;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type BatchResult = Awaited<ReturnType<typeof processPendingDerivativesBatch>>;

type DerivativeWorkerDependencies = {
  isAuthorized: (request: Request) => boolean;
  processBatch: (limit: number, options: { workerId: string; mediaId: string }) => Promise<BatchResult>;
};

const defaultDependencies: DerivativeWorkerDependencies = {
  isAuthorized: isCronAuthorized,
  processBatch: processPendingDerivativesBatch,
};

function noStoreJson(payload: Record<string, unknown>, status: number): NextResponse {
  return NextResponse.json(payload, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

/**
 * Factory is exported solely to make the authentication and bounded-batch
 * contract testable without a database or a configured secret.
 */
export function createMemoriesDerivativeWorkerHandler(
  dependencies: DerivativeWorkerDependencies = defaultDependencies
) {
  return async function memoriesDerivativeWorker(request: Request): Promise<NextResponse> {
    // Deliberately inspect only the Authorization header through the shared
    // verifier. Query-string values are never authentication inputs.
    if (!dependencies.isAuthorized(request)) {
      return noStoreJson({ success: false, code: "UNAUTHORIZED" }, 401);
    }

    // A manual invocation is fail-closed and always scoped. The selector
    // applies this value before processMediaDerivatives can claim a lease.
    const mediaId = request.headers.get("x-haxr-derivative-media-id")?.trim();
    if (!mediaId || !UUID_PATTERN.test(mediaId)) {
      return noStoreJson({ success: false, code: "INVALID_MEDIA_ID" }, 400);
    }

    try {
      const result = await dependencies.processBatch(SCOPED_DERIVATIVE_WORKER_BATCH_LIMIT, {
        workerId: "memories-derivatives-cron",
        mediaId,
      });

      return noStoreJson({ success: true, ...result }, 200);
    } catch {
      // Never include request headers, environment variables, or raw errors in
      // this response or in logs: the route authenticates with a secret.
      console.error("Memories derivatives worker failed");
      return noStoreJson({ success: false, code: "DERIVATIVE_WORKER_UNAVAILABLE" }, 503);
    }
  };
}

export const memoriesDerivativeWorkerHandler = createMemoriesDerivativeWorkerHandler();
