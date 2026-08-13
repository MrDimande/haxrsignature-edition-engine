import { NextResponse } from "next/server";
import { createAdminClient, isSupabaseConfigured } from "@lib/supabase/server";
import { resolveMemoriesConfig } from "@lib/memories/config";

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
      return NextResponse.json({ success: false, error: "Parâmetros em falta." }, { status: 400 });
    }

    const config = resolveMemoriesConfig(slug);
    if (!config) {
      return NextResponse.json({ success: false, error: "Convite não encontrado." }, { status: 404 });
    }

    // Validação básica de segredo se configurado no ambiente
    const expectedKey = process.env.ADMIN_MODERATION_SECRET || "haxr-secret-2026";
    if (secretKey && secretKey !== expectedKey) {
      return NextResponse.json({ success: false, error: "Não autorizado." }, { status: 401 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: false, error: "Serviço indisponível." }, { status: 503 });
    }

    const supabase = createAdminClient();
    const newStatus = action === "approve" ? "approved" : "rejected";

    const { error } = await supabase
      .from("wedding_photos")
      .update({ moderation_status: newStatus })
      .eq("id", photoId)
      .eq("invitation_slug", config.invitationSlug);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Memória ${action === "approve" ? "aprovada" : "ocultada"} com sucesso.`,
    });
  } catch (err) {
    console.error("POST /api/memories/moderate error:", err);
    return NextResponse.json({ success: false, error: "Pedido inválido." }, { status: 400 });
  }
}
