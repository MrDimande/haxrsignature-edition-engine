import { NextResponse } from "next/server";
import { createPhotoUploadIntent } from "@lib/jessica-samuel-wedding/photo-wall/upload-intent";
import { validatePhotoUploadIntentPayload } from "@core/contracts/photos.contract";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const validation = validatePhotoUploadIntentPayload(body);
    if (!validation.ok) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: validation.status }
      );
    }

    const result = await createPhotoUploadIntent(validation.sanitized, request);

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

    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/wedding-photos/upload-intent error:", error);
    return NextResponse.json(
      { success: false, error: "Pedido inválido." },
      { status: 400 }
    );
  }
}
