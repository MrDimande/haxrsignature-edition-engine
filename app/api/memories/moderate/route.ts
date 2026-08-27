import { NextResponse } from "next/server";
import { getDatabaseBackend } from "@lib/database/backend";
import { resolveMemoriesConfig } from "@lib/memories/config";
import { getNeonSql, isNeonConfigured } from "@lib/neon/server";
import { createAdminClient, isSupabaseConfigured } from "@lib/supabase/server";

function isSelectedDatabaseConfigured(): boolean {
  return getDatabaseBackend() === "neon"
    ? isNeonConfigured()
    : isSupabaseConfigured();
}

async function updateModerationStatus(
  photoId: string,
  invitationSlug: string,
  moderationStatus: "approved" | "rejected"
): Promise<void> {
  if (getDatabaseBackend() === "neon") {
    const sql = getNeonSql();
    await sql`
      UPDATE public.wedding_photos
      SET moderation_status = ${moderationStatus}
      WHERE id = ${photoId}::uuid
        AND invitation_slug = ${invitationSlug}
    `;
    return;
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("wedding_photos")
    .update({ moderation_status: moderationStatus })
    .eq("id", photoId)
    .eq("invitation_slug", invitationSlug);

  if (error) {
    throw new Error(error.message);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      slug?: string;
      photoId?: string;
      action?: "approve" | "reject";
      secretKey?: string;
    };

    const { slug, photoId, action, secretKey } = body;

    if (!slug || !photoId || !action) {
      return NextResponse.json(
        { success: false, error: "Parâmetros em falta." },
        { status: 400 }
      );
    }

    const config = resolveMemoriesConfig(slug);
    if (!config) {
      return NextResponse.json(
        { success: false, error: "Convite não encontrado." },
        { status: 404 }
      );
    }

    // Contrato de autorização mantido nesta ronda; endurecimento fica para Auth/RLS.
    const expectedKey = process.env.ADMIN_MODERATION_SECRET || "haxr-secret-2026";
    if (secretKey && secretKey !== expectedKey) {
      return NextResponse.json(
        { success: false, error: "Não autorizado." },
        { status: 401 }
      );
    }

    if (!isSelectedDatabaseConfigured()) {
      return NextResponse.json(
        { success: false, error: "Serviço indisponível." },
        { status: 503 }
      );
    }

    const newStatus = action === "approve" ? "approved" : "rejected";
    await updateModerationStatus(photoId, config.invitationSlug, newStatus);

    return NextResponse.json({
      success: true,
      message: `Memória ${
        action === "approve" ? "aprovada" : "ocultada"
      } com sucesso.`,
    });
  } catch (err) {
    console.error("POST /api/memories/moderate error:", err);
    return NextResponse.json(
      { success: false, error: "Pedido inválido." },
      { status: 400 }
    );
  }
}
