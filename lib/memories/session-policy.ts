import { isMemoriesUuid } from "./session-security";

export type MemoriesVisibility = "community" | "moderated" | "private_to_couple";
export type MemoriesParticipantPermission = "gallery:read" | "media:sign" | "media:upload" | "challenge:submit" | "progress:read";

/** Contrato de domínio; persistência e gateway aguardam confirmação do catálogo Neon. */
export interface MemoriesSessionSnapshot {
  event: { id: string; slug: string; active: boolean; visibility: MemoriesVisibility; uploadsEnabled: boolean; competitionEnabled: boolean };
  participant: { id: string; eventId: string; guestId: string | null; revokedAt: string | null };
  session: { id: string; eventId: string; participantId: string; accessLinkId: string; expiresAt: string; revokedAt: string | null };
  accessLink: { id: string; eventId: string; expiresAt: string | null; revokedAt: string | null };
}

export type MemoriesSessionDecision =
  | { ok: true; context: MemoriesSessionSnapshot }
  | { ok: false; reason: "invalid_session" | "cross_event" | "revoked" | "expired" | "forbidden" };

function unexpired(value: string, now: number): boolean {
  const expiration = Date.parse(value);
  return Number.isFinite(expiration) && expiration > now;
}

/** Revalidação em profundidade após leitura da BD; nunca autoriza a partir do payload do browser. */
export function authorizeMemoriesSession(
  expectedEventId: string,
  snapshot: MemoriesSessionSnapshot | null,
  permission: MemoriesParticipantPermission,
  now: Date,
): MemoriesSessionDecision {
  if (!snapshot || !isMemoriesUuid(expectedEventId) || !Number.isFinite(now.getTime())) {
    return { ok: false, reason: "invalid_session" };
  }
  const { event, participant, session, accessLink } = snapshot;
  if (![event.id, participant.id, session.id, accessLink.id].every(isMemoriesUuid) ||
      session.participantId !== participant.id || session.accessLinkId !== accessLink.id) {
    return { ok: false, reason: "invalid_session" };
  }
  if ([event.id, participant.eventId, session.eventId, accessLink.eventId].some((id) => id !== expectedEventId)) {
    return { ok: false, reason: "cross_event" };
  }
  if (!event.active || participant.revokedAt !== null || session.revokedAt !== null || accessLink.revokedAt !== null) {
    return { ok: false, reason: "revoked" };
  }
  if (!unexpired(session.expiresAt, now.getTime()) ||
      (accessLink.expiresAt !== null && !unexpired(accessLink.expiresAt, now.getTime()))) {
    return { ok: false, reason: "expired" };
  }
  const readable = event.visibility === "community" || event.visibility === "moderated";
  const permissions: Record<MemoriesParticipantPermission, boolean> = {
    "gallery:read": readable,
    "media:sign": readable,
    "media:upload": event.uploadsEnabled === true,
    "challenge:submit": event.uploadsEnabled === true && event.competitionEnabled === true,
    "progress:read": event.competitionEnabled === true,
  };
  if (permissions[permission] !== true) return { ok: false, reason: "forbidden" };
  return { ok: true, context: snapshot };
}

export function maySignMemoriesMedia(
  expectedEventId: string,
  snapshot: MemoriesSessionSnapshot | null,
  media: { eventId: string; moderationStatus: string; visibility: MemoriesVisibility },
  now: Date,
): boolean {
  return authorizeMemoriesSession(expectedEventId, snapshot, "media:sign", now).ok &&
    media.eventId === expectedEventId && media.moderationStatus === "approved" &&
    (media.visibility === "community" || media.visibility === "moderated");
}
