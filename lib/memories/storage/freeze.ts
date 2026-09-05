/**
 * Mecanismo de Write-Freeze para Memórias (HAXR Signature Edition)
 *
 * Semântica estrita:
 * Apenas a string exacta "true" activa o congelamento de escritas.
 * Valores ausentes, vazios, "false", "TRUE" ou outros não activam o freeze.
 */

export const HAXR_STORAGE_WRITE_FREEZE_ENV = "HAXR_STORAGE_WRITE_FREEZE";
export const STORAGE_WRITE_FROZEN_CODE = "STORAGE_WRITE_FROZEN";
export const STORAGE_WRITE_FROZEN_MESSAGE =
  "O envio de memórias está temporariamente em manutenção para actualização de sistema.";

export function isMemoriesWriteFrozen(): boolean {
  return process.env[HAXR_STORAGE_WRITE_FREEZE_ENV] === "true";
}
