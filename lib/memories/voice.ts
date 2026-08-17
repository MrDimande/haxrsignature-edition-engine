import { randomUUID } from "node:crypto";
import { createAdminClient, isSupabaseConfigured } from "@lib/supabase/server";
import { publicMutationRateLimit } from "@lib/security/mutation-rate-limit";
import { RATE_LIMITS } from "@lib/security/rate-limit";
import {
  resolveMemoriesConfigAsync,
  type MemoriesEventConfig,
} from "./config";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const AUDIO_EXTENSIONS: Readonly<Record<string, string>> = {
  "audio/webm": "webm",
  "audio/mp4": "m4a",
  "audio/ogg": "ogg",
  "audio/mpeg": "mp3",
};

export interface VoiceUploadIntentInput {
  slug: string;
  photoId: string;
  contentType: string;
  fileSizeBytes: number;
  durationSeconds: number;
  participantId?: string;
  guestName?: string;
}

export type VoiceUploadIntentResult =
  | {
      success: true;
      voiceMessageId: string;
      uploadUrl: string;
      expiresAt: string;
    }
  | { success: false; error: string; code: string; retryAfterSeconds?: number };

type VoiceIntentRow = {
  id: string;
  experience_id: string;
  event_slug: string;
  invitation_slug: string | null;
  photo_id: string;
  participant_id: string | null;
  guest_name: string | null;
  bucket_name: string;
  storage_path: string;
  content_type: string;
  declared_file_size_bytes: number | string;
  declared_duration_seconds: number;
};

export function normalizeVoiceContentType(contentType: string): string | null {
  const normalized = contentType.split(";", 1)[0]?.trim().toLowerCase() ?? "";
  return AUDIO_EXTENSIONS[normalized] ? normalized : null;
}

export function validateVoiceDuration(
  durationSeconds: number,
  maxDurationSeconds: number
): boolean {
  return (
    Number.isInteger(durationSeconds) &&
    durationSeconds >= 1 &&
    durationSeconds <= maxDurationSeconds
  );
}

export function validateVoiceFileSize(
  fileSizeBytes: number,
  maxFileSizeBytes: number
): boolean {
  return (
    Number.isInteger(fileSizeBytes) &&
    fileSizeBytes > 0 &&
    fileSizeBytes <= maxFileSizeBytes
  );
}

export function photoBelongsToMemoriesExperience(
  photo: { invitation_slug?: string | null; experience_id?: string | null },
  config: Pick<
    MemoriesEventConfig,
    "storageSlug" | "experienceId" | "sourceType"
  >
): boolean {
  if (photo.invitation_slug !== config.storageSlug) return false;
  if (config.sourceType === "standalone") {
    return Boolean(
      config.experienceId && photo.experience_id === config.experienceId
    );
  }
  return !photo.experience_id || photo.experience_id === config.experienceId;
}

function readAscii(buffer: Uint8Array, start: number, length: number): string {
  return String.fromCharCode(
    ...buffer.slice(start, Math.min(start + length, buffer.length))
  );
}

export function matchesVoiceMagicBytes(
  buffer: Uint8Array,
  contentType: string
): boolean {
  if (contentType === "audio/webm") {
    return (
      buffer.length >= 4 &&
      buffer[0] === 0x1a &&
      buffer[1] === 0x45 &&
      buffer[2] === 0xdf &&
      buffer[3] === 0xa3
    );
  }
  if (contentType === "audio/ogg") {
    return buffer.length >= 4 && readAscii(buffer, 0, 4) === "OggS";
  }
  if (contentType === "audio/mpeg") {
    return (
      (buffer.length >= 3 && readAscii(buffer, 0, 3) === "ID3") ||
      (buffer.length >= 2 && buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0)
    );
  }
  if (contentType === "audio/mp4") {
    return buffer.length >= 12 && readAscii(buffer, 4, 4) === "ftyp";
  }
  return false;
}

function validateIdentity(participantId?: string, guestName?: string): string | null {
  if (participantId && !UUID_PATTERN.test(participantId.trim())) {
    return "ID de participante inválido.";
  }
  if (guestName && guestName.trim().length > 80) {
    return "Nome demasiado longo.";
  }
  return null;
}

export async function createVoiceUploadIntent(
  input: VoiceUploadIntentInput,
  request: Request
): Promise<VoiceUploadIntentResult> {
  const config = await resolveMemoriesConfigAsync(input.slug);
  if (!config || config.variant !== "plus-memories") {
    return { success: false, error: "Experiência não encontrada.", code: "NOT_FOUND" };
  }
  if (!config.voiceMessages.enabled || !config.experienceId) {
    return { success: false, error: "Mensagens de voz não activadas.", code: "FEATURE_OFF" };
  }

  const contentType = normalizeVoiceContentType(input.contentType);
  if (!contentType || !config.voiceMessages.acceptedMimeTypes.includes(contentType)) {
    return { success: false, error: "Formato de áudio não suportado.", code: "INVALID_FORMAT" };
  }
  if (!validateVoiceFileSize(input.fileSizeBytes, config.voiceMessages.maxFileSizeBytes)) {
    return { success: false, error: "Tamanho de áudio inválido.", code: "INVALID_SIZE" };
  }
  if (!validateVoiceDuration(input.durationSeconds, config.voiceMessages.maxDurationSeconds)) {
    return { success: false, error: "A mensagem excede 45 segundos.", code: "INVALID_DURATION" };
  }
  if (!UUID_PATTERN.test(input.photoId)) {
    return { success: false, error: "Memória inválida.", code: "INVALID_PHOTO" };
  }
  const identityError = validateIdentity(input.participantId, input.guestName);
  if (identityError) {
    return { success: false, error: identityError, code: "INVALID_IDENTITY" };
  }

  const limit = await publicMutationRateLimit(
    {
      scope: "memory-voice",
      slug: config.storageSlug,
      action: "upload-intent",
      request,
    },
    RATE_LIMITS.memoriesVoiceIntent
  );
  if (!limit.allowed) {
    return {
      success: false,
      error: "Demasiados pedidos. Aguarde alguns minutos e tente novamente.",
      code: "RATE_LIMITED",
      retryAfterSeconds: limit.retryAfterSeconds,
    };
  }
  if (!isSupabaseConfigured()) {
    return { success: false, error: "Serviço indisponível.", code: "SERVICE_UNAVAILABLE" };
  }

  const supabase = createAdminClient();
  const { data: photo, error: photoError } = await supabase
    .from("wedding_photos")
    .select("id, invitation_slug, experience_id")
    .eq("id", input.photoId)
    .maybeSingle();

  if (
    photoError ||
    !photo ||
    !photoBelongsToMemoriesExperience(photo, config)
  ) {
    return { success: false, error: "Memória não pertence a este evento.", code: "CROSS_EVENT_PHOTO" };
  }

  const voiceMessageId = randomUUID();
  const extension = AUDIO_EXTENSIONS[contentType];
  const storagePath = `${config.storageSlug}/voice/${voiceMessageId}.${extension}`;
  const expiresAt = new Date(Date.now() + config.uploadIntentTtlSeconds * 1000).toISOString();

  const { error: intentError } = await supabase
    .from("memory_voice_upload_intents")
    .insert({
      id: voiceMessageId,
      experience_id: config.experienceId,
      event_slug: config.eventSlug,
      invitation_slug: config.invitationSlug,
      photo_id: input.photoId,
      participant_id: input.participantId?.trim() || null,
      guest_name: input.guestName?.trim() || null,
      bucket_name: config.bucket,
      storage_path: storagePath,
      content_type: contentType,
      declared_file_size_bytes: input.fileSizeBytes,
      declared_duration_seconds: input.durationSeconds,
      status: "pending",
      expires_at: expiresAt,
    });

  if (intentError) {
    return { success: false, error: "Não foi possível preparar o envio.", code: "DATABASE_ERROR" };
  }

  const { data: signed, error: signedError } = await supabase.storage
    .from(config.bucket)
    .createSignedUploadUrl(storagePath);

  if (signedError || !signed?.signedUrl) {
    return { success: false, error: "Não foi possível preparar o envio.", code: "STORAGE_ERROR" };
  }

  return {
    success: true,
    voiceMessageId,
    uploadUrl: signed.signedUrl,
    expiresAt,
  };
}

export async function completeVoiceUpload(
  slug: string,
  voiceMessageId: string,
  request: Request
): Promise<{ success: boolean; error?: string; code?: string; retryAfterSeconds?: number }> {
  const config = await resolveMemoriesConfigAsync(slug);
  if (!config || !config.voiceMessages.enabled || !config.experienceId) {
    return { success: false, error: "Mensagens de voz não activadas.", code: "FEATURE_OFF" };
  }
  if (!UUID_PATTERN.test(voiceMessageId)) {
    return { success: false, error: "Pedido inválido.", code: "INVALID_INTENT" };
  }

  const limit = await publicMutationRateLimit(
    {
      scope: "memory-voice",
      slug: config.storageSlug,
      action: "complete",
      request,
    },
    RATE_LIMITS.memoriesVoiceComplete
  );
  if (!limit.allowed) {
    return {
      success: false,
      error: "Demasiados pedidos. Aguarde alguns minutos e tente novamente.",
      code: "RATE_LIMITED",
      retryAfterSeconds: limit.retryAfterSeconds,
    };
  }

  const supabase = createAdminClient();
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("memory_voice_upload_intents")
    .update({ status: "consumed", consumed_at: nowIso })
    .eq("id", voiceMessageId)
    .eq("experience_id", config.experienceId)
    .eq("status", "pending")
    .gt("expires_at", nowIso)
    .select(
      "id, experience_id, event_slug, invitation_slug, photo_id, participant_id, guest_name, bucket_name, storage_path, content_type, declared_file_size_bytes, declared_duration_seconds"
    )
    .maybeSingle();

  if (error || !data) {
    return { success: false, error: "Pedido de envio expirado.", code: "INTENT_EXPIRED" };
  }
  const intent = data as VoiceIntentRow;
  const { data: blob, error: downloadError } = await supabase.storage
    .from(intent.bucket_name)
    .download(intent.storage_path);

  if (downloadError || !blob) {
    return { success: false, error: "Áudio não encontrado.", code: "UPLOAD_MISSING" };
  }

  const buffer = new Uint8Array(await blob.arrayBuffer());
  const declaredSize = Number(intent.declared_file_size_bytes);
  if (
    buffer.byteLength > declaredSize ||
    buffer.byteLength > config.voiceMessages.maxFileSizeBytes
  ) {
    await supabase.storage.from(intent.bucket_name).remove([intent.storage_path]);
    return { success: false, error: "O áudio excede o limite permitido.", code: "INVALID_SIZE" };
  }
  if (!matchesVoiceMagicBytes(buffer, intent.content_type)) {
    await supabase.storage.from(intent.bucket_name).remove([intent.storage_path]);
    return { success: false, error: "Formato de áudio inválido.", code: "INVALID_SIGNATURE" };
  }

  const { data: photo } = await supabase
    .from("wedding_photos")
    .select("id, invitation_slug, experience_id")
    .eq("id", intent.photo_id)
    .maybeSingle();

  if (!photo || !photoBelongsToMemoriesExperience(photo, config)) {
    await supabase.storage.from(intent.bucket_name).remove([intent.storage_path]);
    return { success: false, error: "Memória não pertence a este evento.", code: "CROSS_EVENT_PHOTO" };
  }

  const { error: insertError } = await supabase
    .from("memory_voice_messages")
    .insert({
      id: intent.id,
      experience_id: intent.experience_id,
      event_slug: intent.event_slug,
      invitation_slug: intent.invitation_slug,
      photo_id: intent.photo_id,
      participant_id: intent.participant_id,
      guest_name: intent.guest_name,
      storage_path: intent.storage_path,
      content_type: intent.content_type,
      duration_seconds: intent.declared_duration_seconds,
      file_size_bytes: buffer.byteLength,
      visibility: "hosts-only",
      moderation_status: "pending",
    });

  if (insertError) {
    return { success: false, error: "Não foi possível guardar a mensagem.", code: "DATABASE_ERROR" };
  }

  return { success: true };
}
