import { NextResponse } from "next/server";
import { requireMemoriesAdmin } from "@lib/memories/admin-auth";
import { resolveMemoriesConfigAsync } from "@lib/memories/config";
import { createAdminClient, isSupabaseConfigured } from "@lib/supabase/server";

const MODERATION_STATUSES = new Set(["pending", "approved", "rejected"]);

export async function GET(request: Request) {
  const auth = requireMemoriesAdmin(request);
  if (!auth.ok) return auth.response;

  const searchParams = new URL(request.url).searchParams;
  const slug = searchParams.get("slug")?.trim() ?? "";
  const moderationStatus = searchParams.get("status")?.trim() || "pending";

  if (!slug || !MODERATION_STATUSES.has(moderationStatus)) {
    return NextResponse.json(
      { success: false, error: "Parâmetros inválidos." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { success: false, error: "Serviço indisponível." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  const config = await resolveMemoriesConfigAsync(slug);
  if (!config?.experienceId) {
    return NextResponse.json(
      { success: false, error: "Experiência não encontrada." },
      { status: 404, headers: { "Cache-Control": "no-store" } }
    );
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("memory_voice_messages")
    .select(
      "id, photo_id, participant_id, guest_name, storage_path, content_type, duration_seconds, file_size_bytes, moderation_status, created_at"
    )
    .eq("experience_id", config.experienceId)
    .eq("visibility", "hosts-only")
    .eq("moderation_status", moderationStatus)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json(
      { success: false, error: "Não foi possível carregar as mensagens." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }

  const messages = await Promise.all(
    (data ?? []).map(async (message) => {
      const { data: signed } = await supabase.storage
        .from(config.bucket)
        .createSignedUrl(message.storage_path, config.signedUrlTtlSeconds);

      return {
        id: message.id,
        photoId: message.photo_id,
        participantId: message.participant_id,
        guestName: message.guest_name,
        contentType: message.content_type,
        durationSeconds: message.duration_seconds,
        fileSizeBytes: Number(message.file_size_bytes),
        moderationStatus: message.moderation_status,
        createdAt: message.created_at,
        audioUrl: signed?.signedUrl ?? null,
      };
    })
  );

  return NextResponse.json(
    { success: true, visibility: "hosts-only", messages },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
