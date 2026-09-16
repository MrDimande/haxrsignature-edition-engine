import { NextResponse } from "next/server";
import { generateMemoriesZip } from "@lib/memories/export";
import { MEMORIES_PRIVATE_HEADERS, memoriesJson, requireMemoriesAdmin } from "@lib/memories/admin-auth";

export async function GET(request: Request) {
  const auth = requireMemoriesAdmin(request);
  if (!auth.ok) return auth.response;
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug")?.trim();

    if (!slug) {
      return memoriesJson(400, { success: false, error: "Slug em falta." });
    }

    const zipBuffer = await generateMemoriesZip(slug);

    if (!zipBuffer) {
      return memoriesJson(404, { success: false, error: "Não existem memórias disponíveis para exportação." });
    }

    const filename = `${slug.replace(/[^a-zA-Z0-9_-]/g, "_")}-memories.zip`;

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        ...MEMORIES_PRIVATE_HEADERS,
      },
    });
  } catch {
    console.error("[memories] export_failed");
    return memoriesJson(503, { success: false, error: "Falha ao gerar o arquivo ZIP. Tente novamente." });
  }
}
