import { NextResponse } from "next/server";
import { isCronAuthorized } from "@lib/cron-auth";
import { createAdminClient, isSupabaseConfigured } from "@lib/supabase/server";
import { JESSICA_SAMUEL_PHOTO_WALL } from "@lib/jessica-samuel-wedding/photo-wall/config";

type ModerateAction = "approve" | "reject";

/**
 * Moderação server-to-server (Bearer EDITION_CRON_SECRET).
 * Não montar UI admin no convite público.
 */
export async function POST(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: "Não autorizado." },
      { status: 401 }
    );
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { success: false, error: "Serviço indisponível." },
      { status: 503 }
    );
  }

  try {
    const body = (await request.json()) as {
      photoId?: string;
      action?: ModerateAction;
    };

    const photoId = body.photoId?.trim() ?? "";
    const action = body.action;

    if (!photoId || (action !== "approve" && action !== "reject")) {
      return NextResponse.json(
        { success: false, error: "Pedido inválido." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const now = new Date().toISOString();
    const patch =
      action === "approve"
        ? {
            moderation_status: "approved",
            approved_at: now,
            rejected_at: null,
          }
        : {
            moderation_status: "rejected",
            rejected_at: now,
            approved_at: null,
          };

    const { data, error } = await supabase
      .from("wedding_photos")
      .update(patch)
      .eq("id", photoId)
      .eq("invitation_slug", JESSICA_SAMUEL_PHOTO_WALL.invitationSlug)
      .select("id, moderation_status")
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: "Fotografia não encontrada." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      photoId: data.id,
      moderationStatus: data.moderation_status,
    });
  } catch {
    console.error("POST /api/wedding-photos/moderate error");
    return NextResponse.json(
      { success: false, error: "Pedido inválido." },
      { status: 400 }
    );
  }
}
