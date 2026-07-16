/**
 * Strict attending parser — browser/API contract accepts booleans only.
 */
export type ParseAttendingResult =
  | { ok: true; attending: boolean }
  | { ok: false; error: string };

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

  return {
    ok: false,
    error: "Valor inválido para presença.",
  };
}
