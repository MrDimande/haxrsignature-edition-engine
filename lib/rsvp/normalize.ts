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
