import { listMemories } from "@lib/memories/gallery";
import { memoriesJson } from "@lib/memories/admin-auth";
import { authorizeMemoriesRequest } from "@lib/memories/gateway";

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("slug")?.trim();
  if (!slug) return memoriesJson(400, { success: false, error: "Slug em falta." });

  const auth = await authorizeMemoriesRequest({ request, slug, permission: "gallery:read" });
  if (!auth.ok) {
    return auth.response;
  }

  try {
    return memoriesJson(200, { success: true, memories: await listMemories(slug) });
  } catch {
    console.error("[memories] gallery_unavailable");
    return memoriesJson(503, { success: false, error: "Não foi possível carregar o álbum de memórias. Tente novamente." });
  }
}
