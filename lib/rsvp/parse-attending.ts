/**
 * Strict attending parser — never use Boolean(attending).
 * Accepts only documented truthy/falsy contract values.
 */
export type ParseAttendingResult =
  | { ok: true; attending: boolean }
  | { ok: false; error: string };

const TRUE_VALUES = new Set([true, "true", "1"]);
const FALSE_VALUES = new Set([false, "false", "0"]);

export function parseAttending(value: unknown): ParseAttendingResult {
  if (value === undefined || value === null) {
    return {
      ok: false,
      error: "Por favor, indique se irá comparecer.",
    };
  }

  if (typeof value === "boolean") {
    return { ok: true, attending: value };
  }

  if (typeof value === "number") {
    if (value === 1) return { ok: true, attending: true };
    if (value === 0) return { ok: true, attending: false };
    return {
      ok: false,
      error: "Valor inválido para presença.",
    };
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (TRUE_VALUES.has(normalized)) {
      return { ok: true, attending: true };
    }
    if (FALSE_VALUES.has(normalized)) {
      return { ok: true, attending: false };
    }
    return {
      ok: false,
      error: "Valor inválido para presença.",
    };
  }

  return {
    ok: false,
    error: "Valor inválido para presença.",
  };
}
