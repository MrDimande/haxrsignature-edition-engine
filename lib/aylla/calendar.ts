import { BABY_AYLLA_EVENT } from "./event-details";

const maputoDate = new Intl.DateTimeFormat("en-GB", {
  timeZone: BABY_AYLLA_EVENT.timezone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const AYLLA_CALENDAR_START_UTC = "20270123T090000Z";

export function buildAyllaGoogleCalendarUrl(): string {
  const { time, venue } = BABY_AYLLA_EVENT;
  const details = `Celebração de Aniversário da Baby Aylla · Édition Rose. Início: ${time.display} (${BABY_AYLLA_EVENT.timezone}).`;
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent("Baby Aylla · Édition Rose | Celebração de Aniversário")}&dates=${AYLLA_CALENDAR_START_UTC}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(venue.address)}&ctz=${encodeURIComponent(BABY_AYLLA_EVENT.timezone)}`;
}

export function buildAyllaIcs(): string {
  const { eventDateIso, time, venue } = BABY_AYLLA_EVENT;
  if (!time.startIso) throw new Error("Baby Aylla event start time is required for calendar export.");
  const start = time.startIso.slice(0, 19).replace(/[-:]/g, "");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//HAXR Signature//Baby Aylla Edition Rose//PT",
    "BEGIN:VEVENT",
    `UID:baby-aylla-${eventDateIso}@edition.haxrsignature.com`,
    "DTSTAMP:20261118T200000Z",
    `DTSTART;TZID=${BABY_AYLLA_EVENT.timezone}:${start}`,
    "SUMMARY:Baby Aylla · Édition Rose | Celebração de Aniversário",
    `DESCRIPTION:Celebração de Aniversário da Baby Aylla · Édition Rose. Início: ${time.display}.`,
    `LOCATION:${venue.address.replace(/,/g, "\\,")}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

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
