"use client";

import { useState, type FormEvent } from "react";
import { BABY_AYLLA_EVENT } from "@lib/aylla/event-details";
import { submitUniversalRsvp } from "@lib/rsvp/universal-client";
import { useExperience } from "../../context";
import { CoutureReveal } from "./BabyAyllaCouture";
import { BabyAyllaDigitalPass } from "./BabyAyllaDigitalPass";
import styles from "./BabyAyllaCelebration.module.css";

export function BabyAyllaRsvp() {
  const { config } = useExperience();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [attending, setAttending] = useState<"yes" | "no">("yes");
  const [guests, setGuests] = useState("1");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const [ticket, setTicket] = useState<{ checkinUrl: string; partySize: number } | null>(null);
  const rsvpIsOpen = BABY_AYLLA_EVENT.rsvp.isConfigured && config.status === "active";

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    setError("");
    setTicket(null);

    try {
      const result = await submitUniversalRsvp({
        slug: config.slug,
        name,
        email,
        phone,
        attending: attending === "yes",
        guests: attending === "yes" ? Number(guests) : 0,
      });
      if (result.outcome.kind === "error") throw new Error(result.outcome.message);

      setStatus("success");
      if (attending === "yes" && result.data.checkinUrl) {
        setTicket({ checkinUrl: result.data.checkinUrl, partySize: result.data.partySize ?? Number(guests) });
      }
    } catch (submissionError) {
      setStatus("error");
      setError(submissionError instanceof Error ? submissionError.message : "Não foi possível registar a confirmação.");
    }
  };

  return (
    <section id="rsvp" aria-labelledby="aylla-presence-title" className={`${styles.section} ${styles.rsvpSection}`}>
      <CoutureReveal className={styles.replyCard}>
        <span aria-hidden="true" className={`aylla-font-calligraphy ${styles.embossedA}`}>A</span>
        <p className={`aylla-font-calligraphy ${styles.scriptLead}`}>Um lugar para ti.</p>
        <h2 id="aylla-presence-title" className={`aylla-font-serif ${styles.sectionTitle}`}>A tua presença faz parte<br />deste dia.</h2>
        <p className={`aylla-font-serif ${styles.sectionLead}`}>Será ainda mais especial celebrar contigo.</p>
        {rsvpIsOpen ? (
          status === "success" ? (
            <div className={styles.rsvpSuccess} aria-live="polite">
              <p className={`aylla-font-serif ${styles.availabilityTitle}`}>
                {attending === "yes" ? "A tua presença foi confirmada." : "Agradecemos por nos avisar."}
              </p>
              {ticket ? (
                <BabyAyllaDigitalPass fullName={name.trim()} partySize={ticket.partySize} checkinUrl={ticket.checkinUrl} />
              ) : attending === "yes" ? (
                <p className={styles.quietNote}>A confirmação foi registada. O passe de entrada será disponibilizado pela família.</p>
              ) : null}
            </div>
          ) : (
            <form className={styles.rsvpForm} onSubmit={(event) => void submit(event)}>
              <input className={styles.rsvpInput} required value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome completo" autoComplete="name" />
              <div className={styles.rsvpGrid}>
                <input className={styles.rsvpInput} type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" autoComplete="email" />
                <input className={styles.rsvpInput} type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Telefone" autoComplete="tel" />
              </div>
              <div className={styles.rsvpGrid}>
                <select className={styles.rsvpSelect} value={attending} onChange={(event) => setAttending(event.target.value as "yes" | "no")} aria-label="Presença">
                  <option value="yes">Confirmar presença</option>
                  <option value="no">Não poderei estar presente</option>
                </select>
                {attending === "yes" ? (
                  <select className={styles.rsvpSelect} value={guests} onChange={(event) => setGuests(event.target.value)} aria-label="Número de pessoas">
                    <option value="1">1 pessoa</option>
                    <option value="2">2 pessoas</option>
                  </select>
                ) : <span aria-hidden="true" />}
              </div>
              {error ? <p className={styles.rsvpError} role="alert">{error}</p> : null}
              <button className={styles.rsvpSubmit} type="submit" disabled={status === "sending"}>{status === "sending" ? "A registar…" : "Confirmar presença"}</button>
            </form>
          )
        ) : (
          <div className={styles.availability}>
            <p className={`aylla-font-serif ${styles.availabilityTitle}`}>As confirmações de presença ainda não estão abertas.</p>
            <p className={styles.quietNote}>A família comunicará quando estiverem disponíveis.</p>
          </div>
        )}
      </CoutureReveal>
    </section>
  );
}
