import { randomUUID } from "crypto";
import {
  decideRsvpBackend,
  rsvpBackendNotConfiguredResponse,
} from "@lib/control-plane/rsvp-backend";
import { proxyRsvpToCore } from "@lib/control-plane/rsvp-proxy";
import { handleLocalRsvpPost } from "@lib/rsvp/handle-local";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_RSVP_BODY_BYTES = 16_384;

function isJsonContentType(request: Request): boolean {
  const contentType = request.headers.get("content-type") || "";
  return contentType.toLowerCase().includes("application/json");
}

export async function POST(request: Request) {
  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Método não permitido." }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!isJsonContentType(request)) {
    return new Response(
      JSON.stringify({ success: false, error: "Content-Type inválido." }),
      { status: 415, headers: { "Content-Type": "application/json" } }
    );
  }

  const contentLength = Number(request.headers.get("content-length") || "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_RSVP_BODY_BYTES) {
    return new Response(
      JSON.stringify({ success: false, error: "Pedido demasiado grande." }),
      { status: 413, headers: { "Content-Type": "application/json" } }
    );
  }

  // Fail closed BEFORE persist / email / webhook / analytics.
  const decision = decideRsvpBackend();
  if (decision.mode === "blocked") {
    return rsvpBackendNotConfiguredResponse(randomUUID());
  }

  if (decision.mode === "proxy") {
    return proxyRsvpToCore(request);
  }

  return handleLocalRsvpPost(request, { requestId: randomUUID() });
}
