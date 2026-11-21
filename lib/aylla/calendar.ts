import { BABY_AYLLA_EVENT } from "./event-details";

const maputoDate = new Intl.DateTimeFormat("en-GB", {
  timeZone: BABY_AYLLA_EVENT.timezone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function getDaysUntilAylla(now: Date): number {
  const parts = maputoDate.formatToParts(now);
  const read = (type: Intl.DateTimeFormatPartTypes) => {
    const value = parts.find(part => part.type === type)?.value;
    if (!value) throw new Error(`Missing calendar date part: ${type}`);
    return Number(value);
  };
  const today = Date.UTC(read("year"), read("month") - 1, read("day"));
  const celebration = Date.parse(`${BABY_AYLLA_EVENT.eventDateIso}T00:00:00Z`);
  return Math.round((celebration - today) / 86_400_000);
}
