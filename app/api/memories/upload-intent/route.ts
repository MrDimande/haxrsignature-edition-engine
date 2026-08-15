import { NextResponse } from "next/server";
import { createMemoryUploadIntent } from "@lib/memories/upload";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json({ success: false, error: "Pedido inválido." }, { status: 400 });
    }

    const record = body as Record<string, unknown>;
    const slug = typeof record.slug === "string" ? record.slug.trim() : "";
    const fileName = typeof record.fileName === "string" ? record.fileName.trim() : "";
    const contentType = typeof record.contentType === "string" ? record.contentType.trim() : "";
    const fileSizeRaw = record.fileSizeBytes;
    const fileSizeBytes = typeof fileSizeRaw === "number" ? fileSizeRaw : Number(fileSizeRaw);
    const guestName = typeof record.guestName === "string" ? record.guestName.trim() : undefined;
    const caption = typeof record.caption === "string" ? record.caption.trim() : undefined;
    const challengeId = typeof record.challengeId === "string" ? record.challengeId.trim() : undefined;
    const tableId = typeof record.tableId === "string" ? record.tableId.trim() : undefined;
    const participantId = typeof record.participantId === "string" ? record.participantId.trim() : undefined;

    if (!slug) {
      return NextResponse.json({ success: false, error: "Convite inválido." }, { status: 400 });
    }
    if (!fileName) {
      return NextResponse.json({ success: false, error: "Seleccione um ficheiro." }, { status: 400 });
    }
    if (!contentType) {
      return NextResponse.json({ success: false, error: "Tipo de ficheiro inválido." }, { status: 400 });
    }
    if (!Number.isInteger(fileSizeBytes) || fileSizeBytes <= 0) {
      return NextResponse.json({ success: false, error: "Tamanho de ficheiro inválido." }, { status: 400 });
    }

    const result = await createMemoryUploadIntent(
      {
        slug,
        fileName,
        contentType,
        fileSizeBytes,
        guestName: guestName || undefined,
        caption: caption || undefined,
        challengeId: challengeId || undefined,
        tableId: tableId || undefined,
        participantId: participantId || undefined,
      },
      request
    );

    if (!result.success) {
      const status =
        result.code === "RATE_LIMITED"
          ? 429
          : result.code === "NOT_FOUND"
            ? 404
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
    console.error("POST /api/memories/upload-intent error:", error);
    return NextResponse.json(
      { success: false, error: "Pedido inválido." },
      { status: 400 }
    );
  }
}

