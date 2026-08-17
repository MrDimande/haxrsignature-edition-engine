import { NextResponse } from "next/server";
import { requireMemoriesAdmin } from "@lib/memories/admin-auth";
import {
  renderMemoriesQrPng,
  renderMemoriesQrSvg,
} from "@lib/memories/qr";
import { isValidMemoriesShortCode } from "@lib/memories/share-links";
import { createAdminClient, isSupabaseConfigured } from "@lib/supabase/server";

export const runtime = "nodejs";

interface QrRouteProps {
  params: Promise<{ shortCode: string }>;
}

export async function GET(request: Request, { params }: QrRouteProps) {
  const auth = requireMemoriesAdmin(request);
  if (!auth.ok) return auth.response;

  const { shortCode } = await params;
  if (!isValidMemoriesShortCode(shortCode)) {
    return NextResponse.json(
      { success: false, error: "ShareLink inválido." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { success: false, error: "Serviço temporariamente indisponível." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("memory_share_links")
    .select("short_code")
    .eq("short_code", shortCode)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      { success: false, error: "ShareLink não encontrado." },
      { status: 404, headers: { "Cache-Control": "no-store" } }
    );
  }

  const format = new URL(request.url).searchParams.get("format")?.toLowerCase();
  const filename = `plus-memories-${shortCode}`;

  if (format === "svg") {
    const svg = await renderMemoriesQrSvg(shortCode);
    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}.svg"`,
        "Cache-Control": "private, no-store",
      },
    });
  }

  if (format === "png") {
    const png = await renderMemoriesQrPng(shortCode);
    return new NextResponse(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${filename}.png"`,
        "Cache-Control": "private, no-store",
      },
    });
  }

  return NextResponse.json(
    { success: false, error: "Formato inválido. Use svg ou png." },
    { status: 400, headers: { "Cache-Control": "no-store" } }
  );
}
