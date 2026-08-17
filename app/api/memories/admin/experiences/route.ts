import { NextResponse } from "next/server";
import type { PlusMemoriesPackage } from "@data/invitations";
import type {
  MemoriesRuntimeFeatures,
  MemoriesSourceType,
} from "@lib/memories/config";
import { requireMemoriesAdmin } from "@lib/memories/admin-auth";
import { createMemoriesProject } from "@lib/memories/projects";

export async function POST(request: Request) {
  const auth = requireMemoriesAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const rawFeatures =
      body.features && typeof body.features === "object"
        ? (body.features as Record<string, unknown>)
        : {};

    const sourceType = body.sourceType as MemoriesSourceType;
    if (sourceType !== "haxr-invitation" && sourceType !== "standalone") {
      return NextResponse.json(
        { success: false, error: "Origem inválida." },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const result = await createMemoriesProject({
      displayName: typeof body.displayName === "string" ? body.displayName : "",
      eventType: typeof body.eventType === "string" ? body.eventType : "",
      sourceType,
      invitationSlug:
        typeof body.invitationSlug === "string" ? body.invitationSlug : undefined,
      eventSlug: typeof body.eventSlug === "string" ? body.eventSlug : undefined,
      package: body.package as PlusMemoriesPackage,
      estimatedGuestCount:
        typeof body.estimatedGuestCount === "number"
          ? body.estimatedGuestCount
          : undefined,
      features: {
        phases: rawFeatures.phases === true,
        challenges: rawFeatures.challenges !== false,
        competition: rawFeatures.competition === true,
        voiceMessages: rawFeatures.voiceMessages === true,
        gallery: rawFeatures.gallery !== false,
        offline: rawFeatures.offline !== false,
      } satisfies Partial<MemoriesRuntimeFeatures>,
    });

    if (!result.success) {
      const status =
        result.code === "EXPERIENCE_CONFLICT" || result.code === "EVENT_SLUG_CONFLICT"
          ? 409
          : result.code === "SERVICE_UNAVAILABLE"
            ? 503
            : 400;
      return NextResponse.json(result, {
        status,
        headers: { "Cache-Control": "no-store" },
      });
    }

    return NextResponse.json(result, {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Pedido inválido." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }
}
