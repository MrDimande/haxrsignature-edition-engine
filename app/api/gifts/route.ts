import { NextResponse } from "next/server";
import { getPublicGifts } from "@lib/gifts";
import { getAlexandrinaKennethPublicGifts } from "@lib/alexandrina-kenneth-wedding/gifts/inventory";
import { resolveInvitationContext } from "@lib/context-resolver";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawSlug = searchParams.get("slug") || searchParams.get("registry") || "";
    const context = rawSlug ? resolveInvitationContext(rawSlug) : null;

    if (
      context?.giftsRegistryKey === "alexandrina-kenneth" ||
      rawSlug === "alexandrinaekennethwedding" ||
      rawSlug === "alexandrina-kenneth"
    ) {
      try {
        const gifts = await getAlexandrinaKennethPublicGifts();
        return NextResponse.json(
          { success: true, gifts },
          {
            status: 200,
            headers: {
              "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            },
          }
        );
      } catch (akError) {
        console.error("[Alexandrina & Kenneth Gifts] Fail-closed: Catalog unavailable:", akError);
        return NextResponse.json(
          {
            success: false,
            code: "GIFT_REGISTRY_UNAVAILABLE",
            error: "A lista de presentes está temporariamente indisponível. Por favor, tente novamente mais tarde.",
          },
          {
            status: 503,
            headers: {
              "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            },
          }
        );
      }
    }

    const gifts = await getPublicGifts();
    return NextResponse.json(
      { success: true, gifts },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/gifts error:", error);
    return NextResponse.json(
      { success: false, error: "Ocorreu um erro ao obter a lista de presentes." },
      { status: 500 }
    );
  }
}
