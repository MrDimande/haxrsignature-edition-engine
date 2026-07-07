import { NextResponse } from "next/server";
import { getMergedGifts } from "@lib/gifts";

export async function GET() {
  try {
    const gifts = await getMergedGifts();
    return NextResponse.json({ success: true, gifts }, { status: 200 });
  } catch (error) {
    console.error("GET /api/gifts error:", error);
    return NextResponse.json(
      { success: false, error: "Ocorreu um erro ao obter a lista de presentes." },
      { status: 500 }
    );
  }
}
