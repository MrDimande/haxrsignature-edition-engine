/**
 * Escape HTML for email templates — never interpolate raw user input.
 * Escapes &, <, >, ", ' once (safe to call on already-escaped text only if
 * callers pass raw strings; do not pre-escape before calling).
 */
export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Escape for plain-text subject / preheader lines (no HTML entities needed beyond control chars) */
export function sanitizeEmailText(value: unknown, maxLen = 200): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
}
