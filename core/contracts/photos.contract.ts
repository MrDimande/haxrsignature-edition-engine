import type { WeddingPhotoUploadIntentInput } from "@lib/jessica-samuel-wedding/photo-wall/types";

type ValidationError = {
  ok: false;
  error: string;
  status: number;
};

type ValidationSuccess = {
  ok: true;
  sanitized: WeddingPhotoUploadIntentInput;
};

export function validatePhotoUploadIntentPayload(
  body: unknown
): ValidationError | ValidationSuccess {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Pedido inválido.", status: 400 };
  }

  const record = body as Record<string, unknown>;
  const slug = typeof record.slug === "string" ? record.slug.trim() : "";
  const fileName =
    typeof record.fileName === "string" ? record.fileName.trim() : "";
  const contentType =
    typeof record.contentType === "string" ? record.contentType.trim() : "";
  const fileSizeRaw = record.fileSizeBytes;
  const fileSizeBytes =
    typeof fileSizeRaw === "number" ? fileSizeRaw : Number(fileSizeRaw);
  const guestName =
    typeof record.guestName === "string" ? record.guestName.trim() : undefined;
  const caption =
    typeof record.caption === "string" ? record.caption.trim() : undefined;

  if (!slug) {
    return { ok: false, error: "Convite inválido.", status: 400 };
  }

  if (!fileName) {
    return { ok: false, error: "Seleccione uma imagem.", status: 400 };
  }

  if (!contentType) {
    return { ok: false, error: "Tipo de ficheiro inválido.", status: 400 };
  }

  if (!Number.isInteger(fileSizeBytes) || fileSizeBytes <= 0) {
    return { ok: false, error: "Tamanho de ficheiro inválido.", status: 400 };
  }

  return {
    ok: true,
    sanitized: {
      slug,
      fileName,
      contentType,
      fileSizeBytes,
      guestName: guestName || undefined,
      caption: caption || undefined,
    },
  };
}
