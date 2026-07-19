import { NextResponse } from "next/server";
import { listApprovedPublicPhotos } from "@lib/jessica-samuel-wedding/photo-wall/gallery";
import { getPhotoWallPhase } from "@lib/jessica-samuel-wedding/photo-wall/validation";
import { JESSICA_SAMUEL_PHOTO_WALL } from "@lib/jessica-samuel-wedding/photo-wall/config";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug =
      searchParams.get("slug")?.trim() ||
      JESSICA_SAMUEL_PHOTO_WALL.invitationSlug;

    const [photos, phase] = await Promise.all([
      listApprovedPublicPhotos(slug),
      Promise.resolve(getPhotoWallPhase()),
    ]);

    return NextResponse.json(
      {
        success: true,
        phase,
        uploadOpen: phase === "open",
        photos,
      },
      {
        headers: {
          "Cache-Control": "private, max-age=20",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/wedding-photos error");
    return NextResponse.json(
      { success: false, error: "Não foi possível carregar a galeria." },
      { status: 500 }
    );
  }
}
