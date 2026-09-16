import { isMemoriesUuid } from "./session-security";

/** Snapshot a obter sob lock, na mesma transacção que insere media e conclui o intent. */
export interface BoundUploadIntent {
  id: string;
  eventId: string;
  participantId: string;
  sessionId: string;
  storagePath: string;
  expiresAt: string;
  status: "pending" | "completed" | "cancelled";
  mediaId: string | null;
}

export type UploadCompletionDecision =
  | { action: "reject"; reason: "invalid" | "ownership" | "expired" | "cancelled" }
  | { action: "replay"; mediaId: string }
  | { action: "verify-and-insert" };

/** Contrato puro, não substitui locks, constraints ou revalidação de sessão na BD. */
export function decideUploadCompletion(
  intent: BoundUploadIntent,
  context: { eventId: string; participantId: string; sessionId: string },
  now: Date,
): UploadCompletionDecision {
  if (![intent.id, intent.eventId, intent.participantId, intent.sessionId,
    context.eventId, context.participantId, context.sessionId].every(isMemoriesUuid) ||
    !Number.isFinite(now.getTime()) || !intent.storagePath) {
    return { action: "reject", reason: "invalid" };
  }
  if (intent.eventId !== context.eventId || intent.participantId !== context.participantId ||
    intent.sessionId !== context.sessionId) return { action: "reject", reason: "ownership" };
  if (intent.status === "completed") {
    return intent.mediaId && isMemoriesUuid(intent.mediaId)
      ? { action: "replay", mediaId: intent.mediaId }
      : { action: "reject", reason: "invalid" };
  }
  if (intent.status === "cancelled") return { action: "reject", reason: "cancelled" };
  if (intent.status !== "pending" || intent.mediaId !== null) return { action: "reject", reason: "invalid" };
  const expires = Date.parse(intent.expiresAt);
  if (!Number.isFinite(expires) || expires <= now.getTime()) return { action: "reject", reason: "expired" };
  return { action: "verify-and-insert" };
}
