import { NextResponse } from "next/server";
import { generateMemoriesZip } from "@lib/memories/export";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug")?.trim();
    const phaseId = searchParams.get("phase")?.trim();

    if (!slug) {
      return NextResponse.json({ success: false, error: "Slug em falta." }, { status: 400 });
    }

    const zipBuffer = await generateMemoriesZip(slug, phaseId);

    if (!zipBuffer) {
      return NextResponse.json(
        { success: false, error: "Não existem memórias disponíveis para exportação." },
        { status: 404 }
      );
    }

    const filename = `${slug}-memories.zip`;

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (error) {
    console.error("GET /api/memories/export-zip error:", error);
    return NextResponse.json(
      { success: false, error: "Falha ao gerar o arquivo ZIP." },
      { status: 500 }
    );
  }
}
