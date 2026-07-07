import { NextResponse } from "next/server";
import { completePhotoUpload } from "@lib/jessica-samuel-wedding/photo-wall/gallery";
import { PHOTO_WALL_UPLOAD_SUCCESS } from "@lib/jessica-samuel-wedding/photo-wall/config";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      slug?: string;
      photoId?: string;
      guestName?: string;
      caption?: string;
    };
    const result = await completePhotoUpload(
      body.slug ?? "",
      body.photoId ?? "",
      request,
      {
        guestName: typeof body.guestName === "string" ? body.guestName : undefined,
        caption: typeof body.caption === "string" ? body.caption : undefined,
      }
    );

    if (!result.success) {
      const status =
        result.code === "RATE_LIMITED"
          ? 429
          : result.code === "PHOTO_WALL_CLOSED"
            ? 403
            : 400;
      return NextResponse.json(result, {
        status,
        headers:
          result.code === "RATE_LIMITED" && result.retryAfterSeconds
            ? { "Retry-After": String(result.retryAfterSeconds) }
            : undefined,
      });
    }

    return NextResponse.json({
      success: true,
      message: PHOTO_WALL_UPLOAD_SUCCESS,
    });
  } catch (error) {
    console.error("POST /api/wedding-photos/complete error");
    return NextResponse.json(
      { success: false, error: "Pedido inválido." },
      { status: 400 }
    );
  }
}
