import { NextResponse } from "next/server";
import { getStanPublicGifts } from "@lib/stan/gifts";

export async function GET() {
  try {
    const gifts = await getStanPublicGifts();
    return NextResponse.json({ success: true, gifts }, { status: 200 });
  } catch (error) {
    console.error("GET /api/stan/gifts error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Ocorreu um erro ao obter a lista de presentes.",
      },
      { status: 500 }
    );
  }
}
