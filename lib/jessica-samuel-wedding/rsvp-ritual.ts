/**
 * Helpers do ritual RSVP Jessica & Samuel — só UI / packing.
 *
 * Detecção local de resposta anterior (localStorage):
 * NÃO é idempotência, NÃO é protecção de servidor, NÃO bloqueia
 * duplicados noutro browser/dispositivo ou via API directa.
 *
 * Extras de preferências/mensagem vão em `messageForBride` (máx. 280).
 * O packing NUNCA trunca em silêncio — devolve erro se exceder o limite.
 */

export const WEDDING_RSVP_LOCAL_RESPONSE_KEY_PREFIX = "haxr_rsvp_";
/** @deprecated alias — preferir WEDDING_RSVP_LOCAL_RESPONSE_KEY_PREFIX */
export const WEDDING_RSVP_STORAGE_PREFIX = WEDDING_RSVP_LOCAL_RESPONSE_KEY_PREFIX;

export const WEDDING_RSVP_MESSAGE_LIMIT = 280;
export const WEDDING_RSVP_MAX_COMPANIONS = 4;

export type WeddingRsvpStored = {
  name: string;
  attending: boolean;
};

export type WeddingRsvpPreferences = {
  dietary: string;
  accessibility: string;
  other: string;
};

export type WeddingRsvpPackResult =
  | {
      ok: true;
      value: string | undefined;
      length: number;
      remaining: number;
    }
  | {
      ok: false;
      value: string;
      length: number;
      remaining: number;
      error: string;
    };

/**
 * Lê detecção local de resposta anterior neste dispositivo/navegador.
 * Não constitui protecção de servidor.
 */
export function readLocalPreviousRsvpResponse(
  slug: string
): WeddingRsvpStored | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(
      `${WEDDING_RSVP_LOCAL_RESPONSE_KEY_PREFIX}${slug}`
    );
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WeddingRsvpStored;
    if (
      typeof parsed.name !== "string" ||
      typeof parsed.attending !== "boolean"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/** @deprecated use readLocalPreviousRsvpResponse */
export const readWeddingRsvpStorage = readLocalPreviousRsvpResponse;

export function writeLocalPreviousRsvpResponse(
  slug: string,
  data: WeddingRsvpStored
): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    `${WEDDING_RSVP_LOCAL_RESPONSE_KEY_PREFIX}${slug}`,
    JSON.stringify(data)
  );
}

/** @deprecated use writeLocalPreviousRsvpResponse */
export const writeWeddingRsvpStorage = writeLocalPreviousRsvpResponse;

export function clearLocalPreviousRsvpResponse(slug: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(`${WEDDING_RSVP_LOCAL_RESPONSE_KEY_PREFIX}${slug}`);
}

/** @deprecated use clearLocalPreviousRsvpResponse */
export const clearWeddingRsvpStorage = clearLocalPreviousRsvpResponse;

export function daysUntilWedding(
  dateIso: string,
  now: Date = new Date()
): number {
  const target = new Date(`${dateIso}T12:00:00+02:00`);
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTarget = new Date(target);
  startOfTarget.setHours(0, 0, 0, 0);
  const diffMs = startOfTarget.getTime() - startOfToday.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export function formatDaysUntilLabel(days: number): string {
  if (days <= 0) return "É hoje — celebramos juntos.";
  if (days === 1) return "Falta 1 dia para celebrarmos juntos.";
  return `Faltam ${days} dias para celebrarmos juntos.`;
}

/** Constrói a mensagem completa sem truncar. */
export function buildWeddingRsvpMessageDraft(input: {
  companionNote?: string;
  preferences?: WeddingRsvpPreferences;
  personalMessage?: string;
}): string {
  const parts: string[] = [];

  if (input.companionNote?.trim()) {
    parts.push(input.companionNote.trim());
  }

  const prefs = input.preferences;
  if (prefs) {
    const dietary = prefs.dietary.trim();
    const accessibility = prefs.accessibility.trim();
    const other = prefs.other.trim();
    if (dietary) parts.push(`Alimentação: ${dietary}`);
    if (accessibility) parts.push(`Acessibilidade: ${accessibility}`);
    if (other) parts.push(`Nota: ${other}`);
  }

  const personal = input.personalMessage?.trim();
  if (personal) {
    parts.push(`Mensagem: ${personal}`);
  }

  return parts.join(" · ");
}

/**
 * Empacota para `messageForBride`.
 * Nunca trunca: se length > limit, devolve ok:false.
 */
export function packWeddingRsvpMessage(input: {
  companionNote?: string;
  preferences?: WeddingRsvpPreferences;
  personalMessage?: string;
  limit?: number;
}): WeddingRsvpPackResult {
  const limit = input.limit ?? WEDDING_RSVP_MESSAGE_LIMIT;
  const packed = buildWeddingRsvpMessageDraft(input);
  const length = packed.length;
  const remaining = limit - length;

  if (length === 0) {
    return { ok: true, value: undefined, length: 0, remaining: limit };
  }

  if (length > limit) {
    return {
      ok: false,
      value: packed,
      length,
      remaining,
      error: `A mensagem combinada tem ${length} caracteres (máximo ${limit}). Reduza ${Math.abs(remaining)} caracteres.`,
    };
  }

  return { ok: true, value: packed, length, remaining };
}

export function buildCompanionNote(
  companions: number,
  names: string[]
): string | undefined {
  if (companions <= 0) return undefined;

  const filledNames = names
    .slice(0, companions)
    .map((n) => n.trim())
    .filter((n) => n.length > 0);

  if (filledNames.length === 0) {
    return `${companions} acompanhante(s) · nomes não indicados`;
  }

  return `${companions} acompanhante(s): ${filledNames.join(", ")}`;
}

/**
 * Normaliza telefone moçambicano.
 * Aceita 84XXXXXXX, 25884…, +25884… → +258XXXXXXXXX
 */
export function normalizeMozambiquePhone(input: string): {
  ok: true;
  e164: string;
  display: string;
} | {
  ok: false;
  error: string;
} {
  const raw = input.trim();
  if (!raw) {
    return { ok: false, error: "Indique o número de telefone." };
  }

  const digits = raw.replace(/[^\d+]/g, "");
  let national = digits.replace(/^\+/, "");

  if (national.startsWith("258")) {
    national = national.slice(3);
  }

  if (national.startsWith("0")) {
    national = national.slice(1);
  }

  if (!/^[8][2-7]\d{7}$/.test(national)) {
    return {
      ok: false,
      error:
        "Use um número moçambicano válido (9 dígitos, ex.: 84 123 4567) ou com indicativo +258.",
    };
  }

  const e164 = `+258${national}`;
  return {
    ok: true,
    e164,
    display: `+258 ${national.slice(0, 2)} ${national.slice(2, 5)} ${national.slice(5)}`,
  };
}

export function validateWeddingRsvpContact(input: {
  email: string;
  phone: string;
  requireContact: boolean;
}): { ok: true; email?: string; phone?: string } | { ok: false; error: string } {
  const email = input.email.trim().toLowerCase();
  const phoneRaw = input.phone.trim();

  if (!input.requireContact && !email && !phoneRaw) {
    return { ok: true };
  }

  if (!email && !phoneRaw) {
    return {
      ok: false,
      error: "Indique um email ou telefone (+258) para contacto.",
    };
  }

  if (email) {
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) {
      return { ok: false, error: "Indique um email válido." };
    }
  }

  let phone: string | undefined;
  if (phoneRaw) {
    const normalized = normalizeMozambiquePhone(phoneRaw);
    if (!normalized.ok) {
      return { ok: false, error: normalized.error };
    }
    phone = normalized.e164;
  }

  return {
    ok: true,
    email: email || undefined,
    phone,
  };
}

/**
 * Preview seguro do ritual RSVP.
 * Só activo fora de produção e com ?rsvpPreview=1.
 * Nunca deve chamar POST /api/rsvp.
 */
export function isWeddingRsvpSafePreviewEnabled(
  search: string = typeof window !== "undefined" ? window.location.search : "",
  nodeEnv: string | undefined = process.env.NODE_ENV
): boolean {
  if (nodeEnv === "production") return false;
  const params = new URLSearchParams(search);
  return params.get("rsvpPreview") === "1";
}

export type RitualPhase =
  | "welcome"
  | "presence"
  | "guests"
  | "details"
  | "review"
  | "absence-message"
  | "sending"
  | "success-attending"
  | "success-absent"
  | "already"
  | "error";

export function nextPhaseAfterPresence(
  attending: "yes" | "no"
): Extract<RitualPhase, "guests" | "absence-message"> {
  return attending === "yes" ? "guests" : "absence-message";
}

export function shouldSkipGuestsStep(companions: number): boolean {
  return companions === 0;
}

export function progressStepIndex(phase: RitualPhase): 1 | 2 | 3 | 4 | null {
  switch (phase) {
    case "presence":
      return 1;
    case "guests":
      return 2;
    case "details":
    case "review":
    case "absence-message":
      return 3;
    case "success-attending":
    case "success-absent":
    case "already":
      return 4;
    default:
      return null;
  }
}

export function mapRsvpHttpError(
  status: number,
  apiMessage?: string
): string {
  if (status === 429) {
    return "Demasiados pedidos. Aguarde um momento e tente novamente.";
  }
  if (status >= 500) {
    return "O serviço está temporariamente indisponível. Tente novamente.";
  }
  if (status === 400) {
    return apiMessage || "Os dados enviados não são válidos. Verifique e tente de novo.";
  }
  return apiMessage || "Não foi possível enviar. Tente novamente.";
}
