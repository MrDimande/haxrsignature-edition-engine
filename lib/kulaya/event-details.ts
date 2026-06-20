/** Detalhes partilhados — Cerimónia de Kulaya · Jessica Muege */
export const KULAYA_VENUE = {
  venueName: "Casa da Jessica Muege",
  neighborhood: "Condomínio Matola Village",
  short: "Condomínio Matola Village, Matola",
  city: "Matola, Moçambique",
  full: "Casa da Jessica Muege, Condomínio Matola Village, Matola, Moçambique",
  mapsQuery: "Condomínio Matola Village Matola Moçambique",
  /** Link GPS partilhado pela Jessica */
  navigateUrl: "https://share.google/Xa3uBdxZiQR1eVAyt",
} as const;

export const KULAYA_EVENT = {
  dateLabel: "Sábado, 01 de Agosto de 2026",
  dateIso: "2026-08-01",
  timeLabel: "10:00 Horas pontual",
  calendarTitle: "Cerimónia de Kulaya — Jessica Muege",
} as const;

export function buildKulayaMapEmbedUrl(): string {
  return `https://maps.google.com/maps?q=${encodeURIComponent(KULAYA_VENUE.mapsQuery)}&z=16&output=embed`;
}

export function buildKulayaCalendarUrl(): string {
  return (
    "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    "&text=" +
    encodeURIComponent(KULAYA_EVENT.calendarTitle) +
    "&dates=20260801T080000Z/20260801T120000Z" +
    "&details=" +
    encodeURIComponent(
      "Com profundo respeito às nossas raízes e à nossa cultura, convidamos a família e amigos para a cerimónia de Kulaya de Jessica Muege. Um momento de reconhecimento, transição e afirmação da identidade."
    ) +
    "&location=" +
    encodeURIComponent(KULAYA_VENUE.full)
  );
}
