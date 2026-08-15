import { NextResponse } from "next/server";
import { getMemoriesLeaderboard } from "@lib/memories/leaderboard";

export async function GET(request: Request) {
  try {
    // Directiva #4: Sem segredo configurado no ambiente -> indisponível. Sem fallback hardcoded.
    const adminSecret = process.env.ADMIN_MODERATION_SECRET;
    if (!adminSecret) {
      return NextResponse.json(
        { success: false, error: "Serviço de classificação indisponível." },
        {
          status: 503,
          headers: { "Cache-Control": "no-store" },
        }
      );
    }

    // Directiva #4: Authorization obrigatório
    const authHeader = request.headers.get("authorization") || "";
    const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.substring(7).trim() : null;
    const querySecret = new URL(request.url).searchParams.get("secretKey")?.trim() || null;
    const headerSecret = request.headers.get("x-admin-secret")?.trim() || null;

    const providedSecret = bearerToken || headerSecret || querySecret;

    if (!providedSecret || providedSecret !== adminSecret) {
      return NextResponse.json(
        { success: false, error: "Acesso não autorizado." },
        {
          status: 401,
          headers: { "Cache-Control": "no-store" },
        }
      );
    }

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
