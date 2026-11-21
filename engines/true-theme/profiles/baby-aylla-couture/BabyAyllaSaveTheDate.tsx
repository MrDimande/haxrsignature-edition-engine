"use client";

import { BABY_AYLLA_EVENT } from "@lib/aylla/event-details";
import { BabyAyllaCountdown } from "./BabyAyllaCountdown";
import { CoutureBow, CoutureReveal, PearlTransition } from "./BabyAyllaCouture";
import styles from "./BabyAyllaCelebration.module.css";

export function BabyAyllaSaveTheDate() {
  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);
  const startDayOffset = 5; // Friday (Jan 1, 2027)


  const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    "Baby Aylla · Édition Rose | Celebração de Aniversário"
  )}&dates=20270123/20270124&details=${encodeURIComponent(
    "Celebração de Aniversário da Baby Aylla · Édition Rose. Horário oficial será comunicado oportunamente."
  )}&location=${encodeURIComponent("Vila do Mar Eventos, Costa do Sol, Maputo")}&ctz=Africa/Maputo`;

  const handleDownloadIcs = () => {
    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//HAXR Signature//Baby Aylla Edition Rose//PT",
      "BEGIN:VEVENT",
      "UID:baby-aylla-20270123@edition.haxrsignature.com",
      "DTSTAMP:20261118T200000Z",
      "DTSTART;VALUE=DATE:20270123",
      "DTEND;VALUE=DATE:20270124",
      "SUMMARY:Baby Aylla · Édition Rose | Celebração de Aniversário",
      "DESCRIPTION:Celebração de Aniversário da Baby Aylla · Édition Rose. Horário e detalhes logísticos serão anunciados oportunamente.",
      "LOCATION:Vila do Mar Eventos\\, Costa do Sol\\, Maputo",
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "baby-aylla-2027-01-23.ics");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <section id="data" aria-labelledby="aylla-date-title" className={`${styles.section} ${styles.dateSection}`}>
      <header className={styles.sectionHeader}>
        <p className={`aylla-font-calligraphy ${styles.scriptLead}`}>Save the Date</p>
        <h2 id="aylla-date-title" className={`aylla-font-serif ${styles.sectionTitle}`}>Guarda este dia.</h2>
        <p className={`aylla-font-serif ${styles.sectionLead}`}>Um dia para celebrar a alegria que a Aylla trouxe às nossas vidas.</p>
      </header>
      <CoutureReveal className={styles.calendarSheet}>
        <span aria-hidden="true" className={styles.bookmark} />
        <CoutureBow placement="calendar" />
        <div className={`aylla-font-serif ${styles.dateDisplay}`}>
          <span className={styles.dateDay}>{BABY_AYLLA_EVENT.editorial.saveTheDateDay}</span>
          <div>
            <time dateTime={BABY_AYLLA_EVENT.eventDateIso} className={styles.dateMonth}>{BABY_AYLLA_EVENT.editorial.saveTheDateMonth.toLocaleLowerCase("pt")}</time>
            <span className={styles.dateYear}>{BABY_AYLLA_EVENT.editorial.saveTheDateYear}</span>
          </div>
        </div>
        <p className={`aylla-font-serif ${styles.weekday}`}>{BABY_AYLLA_EVENT.eventDayOfWeek}</p>
        <table data-ceremonial-calendar className={styles.calendar} aria-label="Janeiro de 2027, celebração no dia 23">
          <thead><tr>{["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(day => <th key={day} scope="col">{day}</th>)}</tr></thead>
          <tbody>
            {Array.from({ length: Math.ceil((startDayOffset + daysInMonth.length) / 7) }, (_, week) => (
              <tr key={week}>{Array.from({ length: 7 }, (_, weekday) => {
                const day = week * 7 + weekday - startDayOffset + 1;
                if (day < 1 || day > daysInMonth.length) return <td key={weekday} />;
                const selected = day === Number(BABY_AYLLA_EVENT.editorial.saveTheDateDay);
                return <td key={weekday} data-day={day} aria-label={selected ? `${BABY_AYLLA_EVENT.eventDateFormatted}, data da celebração` : undefined}>
                  <span className={selected ? styles.selectedDay : undefined}>{day}</span>
                </td>;
              })}</tr>
            ))}
          </tbody>
        </table>
        <BabyAyllaCountdown />
        <div className={styles.calendarActions}>
          <a href={googleCalendarUrl} target="_blank" rel="noopener noreferrer" className={styles.textAction}>Google Calendar <span aria-hidden="true">↗</span></a>
          <button type="button" onClick={handleDownloadIcs} className={styles.textAction}>Apple / Outlook <span aria-hidden="true">↓</span></button>
        </div>
      </CoutureReveal>
      <PearlTransition />
    </section>
  );
}
