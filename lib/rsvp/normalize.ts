const PLUS_SUFFIX_PATTERN = /\s*(\(\s*\+?\s*(\d+)\s*\)|\+\s*(\d+))\s*$/i;

const ACCENT_MAP: Record<string, string> = {
  à: "a",
  á: "a",
  â: "a",
  ã: "a",
  ä: "a",
  å: "a",
  è: "e",
  é: "e",
  ê: "e",
  ë: "e",
  ì: "i",
  í: "i",
  î: "i",
  ï: "i",
  ò: "o",
  ó: "o",
  ô: "o",
  õ: "o",
  ö: "o",
  ù: "u",
  ú: "u",
  û: "u",
  ü: "u",
  ç: "c",
  ñ: "n",
};

function stripAccents(value: string): string {
  return value
    .split("")
    .map((char) => {
      const lower = char.toLowerCase();
      return ACCENT_MAP[lower] ?? char;
    })
    .join("");
}

function stripPlusSuffix(value: string): string {
  return value.replace(PLUS_SUFFIX_PATTERN, "").trim();
}

/** Alinhado com o motor de eventos do site principal (deduplicação admin). */
export function normalizeGuestName(value: string): string {
  return stripAccents(stripPlusSuffix(value))
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/** Email canónico para matching idempotente (case-insensitive). */
export function normalizeRsvpEmail(value: string | undefined | null): string {
  if (!value) return "";
  return value.trim().toLowerCase().slice(0, 160);
}

/**
 * Telefone canónico: remove espaços/separadores; preserva +258 / dígitos.
 * Matching idempotente dentro do mesmo event_id (RPC + payload).
 */
export function normalizeRsvpPhone(value: string | undefined | null): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";

  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return "";

  const normalized = hasPlus || digits.startsWith("258") ? `+${digits.replace(/^\+/, "")}` : digits;
  return normalized.slice(0, 30);
}
