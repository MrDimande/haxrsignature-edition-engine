import { createHash, randomBytes } from "node:crypto";

export type MemoriesTokenPurpose = "access-link" | "participant-session" | "display-session";

const TOKEN_BYTES = 32;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isMemoriesUuid(value: string): boolean {
  return UUID.test(value);
}

export function createMemoriesToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

export function isMemoriesToken(value: unknown): value is string {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(value)) return false;
  const bytes = Buffer.from(value, "base64url");
  return bytes.length === TOKEN_BYTES && bytes.toString("base64url") === value;
}

/** Hashes de links, sessões de participantes e sessões de display não são intercambiáveis, mesmo com o mesmo input. */
export function hashMemoriesToken(token: string, purpose: MemoriesTokenPurpose): string {
  if (!isMemoriesToken(token)) throw new Error("Token de acesso inválido.");
  return createHash("sha256").update(`haxr:memories:${purpose}\0${token}`).digest("hex");
}

export function memoriesCookieName(eventId: string, secure: boolean): string {
  if (!isMemoriesUuid(eventId)) throw new Error("Evento inválido.");
  return `${secure ? "__Host-" : ""}haxr_memories_${eventId.toLowerCase()}`;
}

export function displayCookieName(eventId: string, secure: boolean): string {
  if (!isMemoriesUuid(eventId)) throw new Error("Evento inválido.");
  return `${secure ? "__Host-" : ""}haxr_display_${eventId.toLowerCase()}`;
}

export function readMemoriesCookie(request: Request, eventId: string, secure: boolean): string | null {
  const name = memoriesCookieName(eventId, secure);
  const values = (request.headers.get("cookie") ?? "").split(";")
    .map((part) => part.trim()).filter((part) => part.startsWith(`${name}=`))
    .map((part) => part.slice(name.length + 1));
  // Recusar cookies ambíguos evita seleccionar uma credencial injectada por outro path.
  return values.length === 1 && isMemoriesToken(values[0]) ? values[0] : null;
}

export function readDisplayCookie(request: Request, eventId: string, secure: boolean): string | null {
  const hostName = displayCookieName(eventId, true);
  const plainName = displayCookieName(eventId, false);
  const targetName = secure ? hostName : plainName;
  const cookieHeader = request.headers.get("cookie") ?? "";

  const values = cookieHeader.split(";")
    .map((part) => part.trim())
    .filter((part) => part.startsWith(`${targetName}=`))
    .map((part) => part.slice(targetName.length + 1));

  if (values.length === 1 && isMemoriesToken(values[0])) {
    return values[0];
  }

  // Em ambientes de teste locais ou mocks onde secure é false, aceitar o cookie canónico __Host- se fornecido
  if (!secure) {
    const hostValues = cookieHeader.split(";")
      .map((part) => part.trim())
      .filter((part) => part.startsWith(`${hostName}=`))
      .map((part) => part.slice(hostName.length + 1));
    if (hostValues.length === 1 && isMemoriesToken(hostValues[0])) {
      return hostValues[0];
    }
  }

  return null;
}

export function memoriesDisplayCookie(input: {
  eventId: string; token: string; expiresAt: Date; now: Date; secure: boolean;
}): string {
  if (!isMemoriesToken(input.token)) throw new Error("Token de display inválido.");
  const seconds = Math.floor((input.expiresAt.getTime() - input.now.getTime()) / 1000);
  if (!Number.isFinite(seconds) || seconds <= 0) throw new Error("Expiração de sessão inválida.");
  return `${displayCookieName(input.eventId, input.secure)}=${input.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${seconds}; Expires=${input.expiresAt.toUTCString()}${input.secure ? "; Secure" : ""}`;
}

export function memoriesSessionCookie(input: {
  eventId: string; token: string; expiresAt: Date; now: Date; secure: boolean;
}): string {
  if (!isMemoriesToken(input.token)) throw new Error("Token de sessão inválido.");
  const seconds = Math.floor((input.expiresAt.getTime() - input.now.getTime()) / 1000);
  if (!Number.isFinite(seconds) || seconds <= 0) throw new Error("Expiração de sessão inválida.");
  return `${memoriesCookieName(input.eventId, input.secure)}=${input.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${seconds}; Expires=${input.expiresAt.toUTCString()}${input.secure ? "; Secure" : ""}`;
}

export function recapShareCookieName(eventId: string, secure: boolean): string {
  if (!isMemoriesUuid(eventId)) throw new Error("Evento inválido.");
  return `${secure ? "__Host-" : ""}haxr_recap_${eventId.toLowerCase()}`;
}

export function readRecapShareCookie(request: Request, eventId: string, secure: boolean): string | null {
  const hostName = recapShareCookieName(eventId, true);
  const plainName = recapShareCookieName(eventId, false);
  const targetName = secure ? hostName : plainName;
  const cookieHeader = request.headers.get("cookie") ?? "";

  const values = cookieHeader.split(";")
    .map((part) => part.trim())
    .filter((part) => part.startsWith(`${targetName}=`))
    .map((part) => part.slice(targetName.length + 1));

  if (values.length === 1 && isMemoriesToken(values[0])) {
    return values[0];
  }

  if (!secure) {
    const hostValues = cookieHeader.split(";")
      .map((part) => part.trim())
      .filter((part) => part.startsWith(`${hostName}=`))
      .map((part) => part.slice(hostName.length + 1));
    if (hostValues.length === 1 && isMemoriesToken(hostValues[0])) {
      return hostValues[0];
    }
  }

  return null;
}

export function memoriesRecapCookie(input: {
  eventId: string;
  token: string;
  expiresAt: Date;
  now: Date;
  secure: boolean;
}): string {
  if (!isMemoriesToken(input.token)) throw new Error("Token de recap inválido.");
  const seconds = Math.floor((input.expiresAt.getTime() - input.now.getTime()) / 1000);
  if (!Number.isFinite(seconds) || seconds <= 0) throw new Error("Expiração de sessão inválida.");
  return `${recapShareCookieName(input.eventId, input.secure)}=${input.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${seconds}; Expires=${input.expiresAt.toUTCString()}${input.secure ? "; Secure" : ""}`;
}

/** trustedOrigin provém exclusivamente da configuração do servidor. */
export function isMemoriesSameOriginMutation(request: Request, trustedOrigin: string): boolean {
  try {
    const trusted = new URL(trustedOrigin);
    const local = trusted.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(trusted.hostname);
    if (trusted.protocol !== "https:" && !local) return false;
    if (trusted.username || trusted.password || trusted.pathname !== "/" || trusted.search || trusted.hash) return false;
    const origin = request.headers.get("origin");
    if (origin !== trusted.origin) return false;
    const site = request.headers.get("sec-fetch-site");
    if (site && site !== "same-origin") return false;
    return request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() === "application/json";
  } catch {
    return false;
  }
}
