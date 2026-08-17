export type VoiceUploadResult =
  | { success: true; message: string }
  | { success: false; error: string };

export async function uploadPlusMemoriesVoice(input: {
  slug: string;
  photoId: string;
  blob: Blob;
  durationSeconds: number;
  participantId?: string;
  guestName?: string;
}): Promise<VoiceUploadResult> {
  try {
    const intentResponse = await fetch("/api/memories/voice/upload-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: input.slug,
        photoId: input.photoId,
        contentType: input.blob.type,
        fileSizeBytes: input.blob.size,
        durationSeconds: input.durationSeconds,
        participantId: input.participantId,
        guestName: input.guestName,
      }),
    });
    const intent = await intentResponse.json();
    if (!intentResponse.ok || !intent.success) {
      return { success: false, error: intent.error || "Não foi possível preparar a mensagem." };
    }

    const storageResponse = await fetch(intent.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": input.blob.type },
      body: input.blob,
    });
    if (!storageResponse.ok) {
      return { success: false, error: "Não foi possível enviar o áudio." };
    }

    const completeResponse = await fetch("/api/memories/voice/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: input.slug,
        voiceMessageId: intent.voiceMessageId,
      }),
    });
    const complete = await completeResponse.json();
    if (!completeResponse.ok || !complete.success) {
      return { success: false, error: complete.error || "Não foi possível guardar a mensagem." };
    }

    return { success: true, message: complete.message };
  } catch {
    return { success: false, error: "Verifique a ligação e tente novamente." };
  }
}
