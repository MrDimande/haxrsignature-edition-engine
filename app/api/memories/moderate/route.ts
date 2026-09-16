import { getEditionDatabaseProvider } from "@lib/db";
import { resolveMemoriesConfig } from "@lib/memories/config";
import { memoriesJson, requireMemoriesAdmin } from "@lib/memories/admin-auth";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const auth = requireMemoriesAdmin(request);
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return memoriesJson(400, { success: false, error: "Pedido inválido." });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return memoriesJson(400, { success: false, error: "Pedido inválido." });
  }
  const input = body as Record<string, unknown>;
  const slug = typeof input.slug === "string" ? input.slug.trim() : "";
  const photoId = typeof input.photoId === "string" ? input.photoId.trim() : "";
  const action = input.action;
  if (!slug || !UUID_PATTERN.test(photoId) || (action !== "approve" && action !== "reject")) {
    return memoriesJson(400, { success: false, error: "Parâmetros de moderação inválidos." });
  }

  const config = resolveMemoriesConfig(slug);
  if (!config) return memoriesJson(404, { success: false, error: "Convite não encontrado." });

  try {
    const db = getEditionDatabaseProvider();
    if (!db.isConfigured()) {
      return memoriesJson(503, { success: false, error: "Serviço indisponível." });
    }
    const updated = await db.updateModerationStatus(
      photoId, config.invitationSlug, action === "approve" ? "approved" : "rejected"
    );
    if (!updated) {
      return memoriesJson(404, { success: false, error: "Memória não encontrada neste evento." });
    }
    return memoriesJson(200, {
      success: true,
      message: `Memória ${action === "approve" ? "aprovada" : "ocultada"} com sucesso.`,
    });
  } catch {
    console.error("[memories] moderation_failed");
    return memoriesJson(503, { success: false, error: "Não foi possível actualizar a memória. Tente novamente." });
  }
}
