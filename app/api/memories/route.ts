import { NextResponse } from "next/server";
import { listMemories } from "@lib/memories/gallery";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug")?.trim();
    const phaseId = searchParams.get("phase")?.trim();

    if (!slug) {
      return NextResponse.json(
        { success: false, error: "Slug em falta." },
        { status: 400 }
      );
    }

    const memories = await listMemories(slug, phaseId);

    return NextResponse.json(
      {
        success: true,
        memories,
      },
      {
        headers: {
          "Cache-Control": "private, max-age=15",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/memories error:", error);
    return NextResponse.json(
      { success: false, error: "Não foi possível carregar o álbum de memórias." },
      { status: 500 }
    );
  }
}
