/**
 * Plus Memories — Identidade Anónima do Participante & Gestão de Opt-In
 *
 * Directivas:
 * 1. Identidade técnica anónima persistente (UUID) guardada localmente por slug.
 * 2. Sem email, telefone, IP ou fingerprinting.
 * 3. Chave isolada por evento: haxr_memories_participant_${slug}
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function participantStorageKey(slug: string): string {
  return `haxr_memories_participant_${slug}`;
}

function participantNameKey(slug: string): string {
  return `haxr_memories_participant_${slug}_name`;
}

function optInKey(slug: string): string {
  return `haxr_memories_competition_${slug}_optin`;
}

export function getOrCreateParticipantId(slug: string): string {
  if (typeof window === "undefined") return "";

  try {
    const existing = localStorage.getItem(participantStorageKey(slug));
    if (existing && UUID_REGEX.test(existing.trim())) {
      return existing.trim();
    }

    const newId = crypto.randomUUID();
    localStorage.setItem(participantStorageKey(slug), newId);
    return newId;
  } catch (err) {
    console.warn("Failed to access localStorage for participantId:", err);
    return "";
  }
}

export function getParticipantName(slug: string): string | null {
  if (typeof window === "undefined") return null;

  try {
    const name = localStorage.getItem(participantNameKey(slug));
    return name && name.trim().length > 0 ? name.trim() : null;
  } catch {
    return null;
  }
}

export function setParticipantName(slug: string, name: string): void {
  if (typeof window === "undefined") return;

  try {
    const trimmed = name.trim();
    if (trimmed) {
      localStorage.setItem(participantNameKey(slug), trimmed);
    } else {
      localStorage.removeItem(participantNameKey(slug));
    }
  } catch (err) {
    console.warn("Failed to save participant name:", err);
  }
}

export type OptInStatus = "undecided" | "opted_in" | "opted_out";

export function getCompetitionOptInStatus(slug: string): OptInStatus {
  if (typeof window === "undefined") return "undecided";

  try {
    const status = localStorage.getItem(optInKey(slug));
    if (status === "opted_in" || status === "opted_out") {
      return status;
    }
    return "undecided";
  } catch {
    return "undecided";
  }
}

export function setCompetitionOptInStatus(slug: string, status: "opted_in" | "opted_out"): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(optInKey(slug), status);
  } catch (err) {
    console.warn("Failed to save competition opt-in status:", err);
  }
}
