import { randomUUID } from "crypto";
import { isProxyRsvpBackend } from "@lib/control-plane/config";
import { proxyRsvpToCore } from "@lib/control-plane/rsvp-proxy";
import { handleLocalRsvpPost } from "@lib/rsvp/handle-local";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (isProxyRsvpBackend()) {
    return proxyRsvpToCore(request);
  }

  return handleLocalRsvpPost(request, { requestId: randomUUID() });
}
