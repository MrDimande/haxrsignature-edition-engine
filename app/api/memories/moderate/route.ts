import { NextResponse } from "next/server";
import { createAdminClient, isSupabaseConfigured } from "@lib/supabase/server";
import { resolveMemoriesConfigAsync } from "@lib/memories/config";
import { requireMemoriesAdmin } from "@lib/memories/admin-auth";

export async function POST(request: Request) {
  const auth = requireMemoriesAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const body = (await request.json()) as {
      slug?: string;
      photoId?: string;
      action?: "approve" | "reject";
    };

    const { slug, photoId, action } = body;

    if (
      !slug ||
      !photoId ||
      (action !== "approve" && action !== "reject")
    ) {
      return NextResponse.json({ success: false, error: "Parâmetros em falta." }, { status: 400 });
    }

    const config = await resolveMemoriesConfigAsync(slug);
    if (!config) {
      return NextResponse.json({ success: false, error: "Convite não encontrado." }, { status: 404 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: false, error: "Serviço indisponível." }, { status: 503 });
    }

    const supabase = createAdminClient();
    const newStatus = action === "approve" ? "approved" : "rejected";

    let query = supabase
      .from("wedding_photos")
      .update({ moderation_status: newStatus })
      .eq("id", photoId)
      .eq("invitation_slug", config.storageSlug);

    if (config.sourceType === "standalone" && config.experienceId) {
      query = query.eq("experience_id", config.experienceId);
    }
    const { data, error } = await query
      .select("id")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ success: false, error: "Não foi possível moderar a memória." }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ success: false, error: "Memória não encontrada." }, { status: 404 });
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
