import { NextResponse } from "next/server";
import { getMemoriesLeaderboard } from "@lib/memories/leaderboard";
import { requireMemoriesAdmin } from "@lib/memories/admin-auth";

export async function GET(request: Request) {
  const auth = requireMemoriesAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug")?.trim() || "";
    const rawMode = searchParams.get("mode")?.trim();
    const mode = rawMode === "final" ? "final" : "provisional";

    if (!slug) {
      return NextResponse.json(
        { success: false, error: "Convite inválido." },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const result = await getMemoriesLeaderboard(slug, mode);
    if (!result.success) {
      return NextResponse.json(result, {
        status: 400,
        headers: { "Cache-Control": "no-store" },
      });
    }

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("GET /api/memories/leaderboard error:", error);
    return NextResponse.json(
      { success: false, error: "Pedido inválido." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }
}
