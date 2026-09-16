import { NextResponse } from "next/server";
import { completePhotoUpload } from "@lib/jessica-samuel-wedding/photo-wall/gallery";
import { PHOTO_WALL_UPLOAD_SUCCESS } from "@lib/jessica-samuel-wedding/photo-wall/config";
import { authorizeMemoriesRequest } from "@lib/memories/gateway";
import { memoriesJson } from "@lib/memories/admin-auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      slug?: string;
      photoId?: string;
      guestName?: string;
      caption?: string;
    };

    const slug = body.slug ?? "";

    // Gateway central: valida que este alias antigo não permite contornar sessões
    const auth = await authorizeMemoriesRequest({
      request,
      slug,
      permission: "media:upload",
    });
    if (!auth.ok) {
      return auth.response;
    }

    const result = await completePhotoUpload(
      slug,
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
    return memoriesJson(400, { success: false, error: "Pedido inválido." });
  }
}
