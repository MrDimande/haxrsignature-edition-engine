import { WEDDING_EVENT } from "./event-details";

export type WeddingChapterPhase = "before" | "today" | "after";

/** Dia civil em Africa/Maputo (YYYY-MM-DD). */
export function maputoCalendarDay(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Maputo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Fase do convite relativa à data do casamento (Maputo). */
export function getWeddingChapterPhase(
  dateIso: string = WEDDING_EVENT.dateIso,
  now: Date = new Date()
): WeddingChapterPhase {
  const today = maputoCalendarDay(now);
  if (today < dateIso) return "before";
  if (today === dateIso) return "today";
  return "after";
}

export function isWeddingDayOrAfter(
  dateIso: string = WEDDING_EVENT.dateIso,
  now: Date = new Date()
): boolean {
  return getWeddingChapterPhase(dateIso, now) !== "before";
}
