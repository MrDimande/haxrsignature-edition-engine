export type MemoryUploadOptions = {
  slug: string;
  file: File;
  challengeId?: string;
  tableId?: string;
  guestName?: string;
  caption?: string;
  onProgress?: (progress: number) => void;
};

export type MemoryUploadResult =
  | { success: true; message: string }
  | { success: false; error: string };

export async function uploadMemory({
  slug,
  file,
  challengeId,
  tableId,
  guestName,
  caption,
}: MemoryUploadOptions): Promise<MemoryUploadResult> {
  try {
    // 1. Request Intent
    const intentRes = await fetch("/api/memories/upload-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        fileName: file.name,
        contentType: file.type,
        fileSizeBytes: file.size,
        guestName,
        caption,
        challengeId,
        tableId,
      }),
    });

    const intentData = await intentRes.json();
    if (!intentRes.ok || !intentData.success) {
      return {
        success: false,
        error: intentData.error || "Não foi possível iniciar o envio.",
      };
    }

    const { photoId, uploadUrl } = intentData;

    // 2. Upload direct to Storage (Signed URL)
    const storageRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
      },
      body: file,
    });

    if (!storageRes.ok) {
      return {
        success: false,
        error: "Falha na transferência da fotografia. Verifique a sua ligação.",
      };
    }

    // 3. Complete Upload
    const completeRes = await fetch("/api/memories/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        photoId,
        guestName,
        caption,
        challengeId,
        tableId,
      }),
    });

    const completeData = await completeRes.json();
    if (!completeRes.ok || !completeData.success) {
      return {
        success: false,
        error: completeData.error || "Não foi possível confirmar o registo.",
      };
    }

    return {
      success: true,
      message: completeData.message || "MOMENTO GUARDADO",
    };
  } catch (error) {
    console.error("uploadMemory client error:", error);
    return {
      success: false,
      error: "Não conseguimos guardar este momento. Verifique a sua ligação e tente novamente.",
    };
  }
}
