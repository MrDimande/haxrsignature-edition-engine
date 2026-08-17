import { NextResponse } from "next/server";
import { requireMemoriesAdmin } from "@lib/memories/admin-auth";
import { resolveMemoriesConfigAsync } from "@lib/memories/config";
import { createAdminClient, isSupabaseConfigured } from "@lib/supabase/server";

export async function POST(request: Request) {
  const auth = requireMemoriesAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const slug = typeof body.slug === "string" ? body.slug.trim() : "";
    const voiceMessageId =
      typeof body.voiceMessageId === "string" ? body.voiceMessageId.trim() : "";
    const action = body.action;
    if (!slug || !voiceMessageId || (action !== "approve" && action !== "reject")) {
      return NextResponse.json(
        { success: false, error: "Parâmetros inválidos." },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const config = await resolveMemoriesConfigAsync(slug);
    if (!config?.experienceId) {
      return NextResponse.json(
        { success: false, error: "Experiência não encontrada." },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      );
    }
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { success: false, error: "Serviço indisponível." },
        { status: 503, headers: { "Cache-Control": "no-store" } }
      );
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("memory_voice_messages")
      .update({ moderation_status: action === "approve" ? "approved" : "rejected" })
      .eq("id", voiceMessageId)
      .eq("experience_id", config.experienceId)
      .select("id")
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { success: false, error: "Não foi possível moderar a mensagem." },
        { status: 500, headers: { "Cache-Control": "no-store" } }
      );
    }
    if (!data) {
      return NextResponse.json(
        { success: false, error: "Mensagem não encontrada." },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json(
      { success: true },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Pedido inválido." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }
}
