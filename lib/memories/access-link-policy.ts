import { isMemoriesUuid } from "./session-security";

export type MemoriesLinkScope =
  | { kind: "general" }
  | { kind: "guest"; guestId: string; guestEventId: string }
  | { kind: "table"; tableId: string; tableEventId: string };

/** Relações de scope lidas do Core, nunca recebidas como identidade do browser. */
export interface MemoriesAccessLinkSnapshot {
  id: string;
  eventId: string;
  revokedAt: string | null;
  expiresAt: string;
  uses: number;
  maxUses: number | null;
  scope: MemoriesLinkScope;
}

/** A contagem de usos e criação de sessão devem ocorrer sob o mesmo lock/transacção. */
export function mayExchangeMemoriesLink(eventId: string, link: MemoriesAccessLinkSnapshot, now: Date): boolean {
  if (!isMemoriesUuid(eventId) || !isMemoriesUuid(link.id) || link.eventId !== eventId ||
    link.revokedAt !== null || !Number.isFinite(now.getTime()) ||
    !(Date.parse(link.expiresAt) > now.getTime()) ||
    !Number.isSafeInteger(link.uses) || link.uses < 0 ||
    (link.maxUses !== null && (!Number.isSafeInteger(link.maxUses) || link.maxUses <= link.uses))) return false;
  switch (link.scope.kind) {
    case "general": return true;
    case "guest": return isMemoriesUuid(link.scope.guestId) && link.scope.guestEventId === eventId;
    case "table": return isMemoriesUuid(link.scope.tableId) && link.scope.tableEventId === eventId;
    default: return false;
  }
}
