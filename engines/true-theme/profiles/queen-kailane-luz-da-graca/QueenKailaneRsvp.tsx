"use client";

import { useEffect, useId, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  QUEEN_KAILANE_COPY,
  QUEEN_KAILANE_RSVP,
  QUEEN_KAILANE_SLUG,
  downloadQueenKailaneIcsFile,
  readQueenKailaneRsvpLocalRecord,
  type QueenKailaneRsvpLocalRecord,
} from "@lib/queen-kailane/event-details";
import {
  QUEEN_KAILANE_RSVP_NOT_PERSISTED_MESSAGE,
  shouldAcceptQueenKailaneRsvpSuccess,
} from "@lib/queen-kailane/rsvp-persist";
import {
  resolveRsvpClientOutcome,
  type RsvpApiPayload,
} from "@lib/rsvp/client-outcome";
import { buildEditionRsvpStorageKey } from "@lib/rsvp/storage-keys";
import { QUEEN_COLORS, QUEEN_EASE } from "./queen-motion";

type AttendingChoice = "" | "yes" | "no";
type UiStatus =
  | "idle"
  | "validation"
  | "sending"
  | "success"
  | "declined"
  | "already"
  | "error";

type FormState = {
  name: string;
  attending: AttendingChoice;
  honeypot: string;
};

const initialForm: FormState = {
  name: "",
  attending: "",
  honeypot: "",
};

const RSVP_FETCH_TIMEOUT_MS = 15000;

function loadLocal(slug: string): QueenKailaneRsvpLocalRecord | null {
  if (typeof window === "undefined") return null;
  try {
    return readQueenKailaneRsvpLocalRecord(
      window.localStorage.getItem(buildEditionRsvpStorageKey(slug))
    );
  } catch {
    return null;
  }
}

function persistLocal(slug: string, record: QueenKailaneRsvpLocalRecord) {
  try {
    window.localStorage.setItem(
      buildEditionRsvpStorageKey(slug),
      JSON.stringify(record)
    );
  } catch {
    /* ignore quota */
  }
}

/**
 * RSVP — nome + presença.
 * Sem acompanhantes inventados. Persist remota exige EDITION_EVENT_QUEEN_KAILANE_ID.
 */
export function QueenKailaneRsvp() {
  const reduceMotion = useReducedMotion();
  const slug = QUEEN_KAILANE_SLUG;
  const formId = useId();
  const [form, setForm] = useState<FormState>(initialForm);
  const [status, setStatus] = useState<UiStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [submittedAttending, setSubmittedAttending] = useState<boolean | null>(
    null
  );

  useEffect(() => {
    const existing = loadLocal(slug);
    if (!existing) return;
    setSubmittedAttending(existing.attending);
    setStatus("already");
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "sending") return;

    if (!form.attending) {
      setErrorMessage("Indica se estará presente.");
      setStatus("validation");
      return;
    }

    if (!form.name.trim()) {
      setErrorMessage("Indica o seu nome.");
      setStatus("validation");
      return;
    }

    const isAttending = form.attending === "yes";
    setStatus("sending");
    setErrorMessage("");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), RSVP_FETCH_TIMEOUT_MS);

    try {
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          name: form.name.trim(),
          attending: isAttending,
          guests: isAttending ? 1 : 0,
          honeypot: form.honeypot,
          slug,
        }),
      });

      let data: RsvpApiPayload = {};
      try {
        data = (await response.json()) as RsvpApiPayload;
      } catch {
        throw new Error("Resposta inválida do servidor.");
      }

      const outcome = resolveRsvpClientOutcome(response.ok, data);
      if (outcome.kind === "success" || outcome.kind === "persisted_partial") {
        if (!shouldAcceptQueenKailaneRsvpSuccess(data)) {
          setErrorMessage(QUEEN_KAILANE_RSVP_NOT_PERSISTED_MESSAGE);
          setStatus("error");
          return;
        }

        const record: QueenKailaneRsvpLocalRecord = {
          attending: isAttending,
          name: form.name.trim(),
          submittedAt: new Date().toISOString(),
        };
        if (data.persisted === true || process.env.NODE_ENV === "development") {
          persistLocal(slug, record);
        }
        setSubmittedAttending(isAttending);
        setStatus(isAttending ? "success" : "declined");
        return;
      }

      // Dev without remote event: API may return success:false / not persisted.
      // resolveRsvpClientOutcome treats non-persisted as error — soften in development.
      if (
        process.env.NODE_ENV === "development" &&
        data.success === true
      ) {
        const record: QueenKailaneRsvpLocalRecord = {
          attending: isAttending,
          name: form.name.trim(),
          submittedAt: new Date().toISOString(),
        };
        persistLocal(slug, record);
        setSubmittedAttending(isAttending);
        setStatus(isAttending ? "success" : "declined");
        return;
      }

      setErrorMessage(outcome.message);
      setStatus("error");
    } catch (err) {
      setErrorMessage(
        err instanceof Error && err.name === "AbortError"
          ? "O pedido demorou demasiado. Tente novamente."
          : !navigator.onLine
            ? "Está offline. Ligue-se à internet e tente novamente."
            : "Não foi possível enviar a confirmação. Tente novamente."
      );
      setStatus("error");
    } finally {
      clearTimeout(timeout);
      setStatus((current) => (current === "sending" ? "idle" : current));
    }
  };

  const confirmed =
    status === "success" || status === "declined" || status === "already";

  return (
    <section
      id="queen-rsvp"
      className="relative px-6 py-28 md:py-36"
      style={{ backgroundColor: QUEEN_COLORS.pearl }}
      aria-labelledby="queen-rsvp-title"
    >
      <div className="mx-auto max-w-lg">
        <motion.p
          className="text-center text-[0.65rem] tracking-[0.4em]"
          style={{
            fontFamily:
              "var(--font-jost), var(--font-montserrat), system-ui, sans-serif",
            color: QUEEN_COLORS.goldMatte,
          }}
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: QUEEN_EASE }}
        >
          CAPÍTULO V · FAZ PARTE DESTA PÁGINA
        </motion.p>

        <motion.h2
          id="queen-rsvp-title"
          className="mt-6 text-center text-[clamp(1.25rem,4vw,1.75rem)] font-light leading-snug tracking-[0.06em]"
          style={{
            fontFamily:
              'var(--font-cormorant), "Cormorant Garamond", Georgia, serif',
            color: QUEEN_COLORS.ink,
          }}
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, ease: QUEEN_EASE }}
        >
          {QUEEN_KAILANE_COPY.rsvpTitle}
        </motion.h2>

        {QUEEN_KAILANE_RSVP.deadlineLabel ? (
          <motion.p
            className="mt-4 text-center text-[0.72rem] tracking-[0.24em]"
            style={{
              fontFamily:
                "var(--font-jost), var(--font-montserrat), system-ui, sans-serif",
              color: QUEEN_COLORS.taupe,
            }}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.1, ease: QUEEN_EASE }}
          >
            CONFIRMAÇÃO ATÉ {QUEEN_KAILANE_RSVP.deadlineLabel.toUpperCase()}
          </motion.p>
        ) : null}

        {confirmed ? (
          <motion.div
            className="mt-14 text-center"
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: QUEEN_EASE }}
            role="status"
          >
            <p
              className="text-[0.95rem] leading-relaxed"
              style={{
                fontFamily:
                  "var(--font-jost), var(--font-montserrat), system-ui, sans-serif",
                color: QUEEN_COLORS.inkSoft,
                fontWeight: 300,
              }}
            >
              {submittedAttending
                ? QUEEN_KAILANE_COPY.rsvpClosing
                : QUEEN_KAILANE_COPY.rsvpDeclined}
            </p>
            {submittedAttending ? (
              <button
                type="button"
                onClick={() => downloadQueenKailaneIcsFile()}
                className="mt-8 inline-flex min-h-11 items-center justify-center border px-6 py-3 text-[0.65rem] tracking-[0.24em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
                style={{
                  fontFamily:
                    "var(--font-jost), var(--font-montserrat), system-ui, sans-serif",
                  color: QUEEN_COLORS.ink,
                  borderColor: QUEEN_COLORS.goldMatte,
                  background:
                    "linear-gradient(180deg, rgba(255,253,252,0.95), rgba(246,241,232,0.7))",
                  outlineColor: QUEEN_COLORS.goldMatte,
                }}
              >
                ADICIONAR AO CALENDÁRIO
              </button>
            ) : null}
          </motion.div>
        ) : (
          <motion.form
            className="mt-14 space-y-8"
            onSubmit={handleSubmit}
            noValidate
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.1, ease: QUEEN_EASE }}
          >
            <div>
              <label
                htmlFor={`${formId}-name`}
                className="mb-2 block text-[0.65rem] tracking-[0.28em]"
                style={{
                  fontFamily:
                    "var(--font-jost), var(--font-montserrat), system-ui, sans-serif",
                  color: QUEEN_COLORS.taupe,
                }}
              >
                NOME
              </label>
              <input
                id={`${formId}-name`}
                name="name"
                type="text"
                autoComplete="name"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                className="w-full border-b bg-transparent py-3 text-[0.95rem] outline-none transition-colors focus-visible:border-[#B9975B]"
                style={{
                  fontFamily:
                    "var(--font-jost), var(--font-montserrat), system-ui, sans-serif",
                  color: QUEEN_COLORS.ink,
                  borderColor: QUEEN_COLORS.champagne,
                }}
                maxLength={120}
                required
              />
            </div>

            <fieldset className="space-y-3">
              <legend
                className="mb-3 text-[0.65rem] tracking-[0.28em]"
                style={{
                  fontFamily:
                    "var(--font-jost), var(--font-montserrat), system-ui, sans-serif",
                  color: QUEEN_COLORS.taupe,
                }}
              >
                PRESENÇA
              </legend>
              {(
                [
                  ["yes", QUEEN_KAILANE_COPY.rsvpYes],
                  ["no", QUEEN_KAILANE_COPY.rsvpNo],
                ] as const
              ).map(([value, label]) => {
                const selected = form.attending === value;
                return (
                  <label
                    key={value}
                    className="flex cursor-pointer items-center gap-3 border px-4 py-3 transition-colors"
                    style={{
                      borderColor: selected
                        ? QUEEN_COLORS.goldMatte
                        : QUEEN_COLORS.champagne,
                      backgroundColor: selected
                        ? "rgba(231,215,193,0.28)"
                        : "transparent",
                    }}
                  >
                    <input
                      type="radio"
                      name={`${formId}-attending`}
                      value={value}
                      checked={selected}
                      onChange={() =>
                        setForm((f) => ({ ...f, attending: value }))
                      }
                      className="sr-only"
                    />
                    <span
                      className="text-[0.72rem] tracking-[0.14em]"
                      style={{
                        fontFamily:
                          "var(--font-jost), var(--font-montserrat), system-ui, sans-serif",
                        color: QUEEN_COLORS.ink,
                      }}
                    >
                      {label}
                    </span>
                  </label>
                );
              })}
            </fieldset>

            {/* Honeypot */}
            <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
              <label htmlFor={`${formId}-company`}>Empresa</label>
              <input
                id={`${formId}-company`}
                name="company"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={form.honeypot}
                onChange={(e) =>
                  setForm((f) => ({ ...f, honeypot: e.target.value }))
                }
              />
            </div>

            {(status === "validation" || status === "error") && errorMessage ? (
              <p
                role="alert"
                className="text-center text-[0.8rem]"
                style={{ color: "#8B4A3A" }}
              >
                {errorMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full min-h-11 border py-3 text-[0.7rem] tracking-[0.28em] transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 disabled:opacity-50"
              style={{
                fontFamily:
                  "var(--font-jost), var(--font-montserrat), system-ui, sans-serif",
                color: QUEEN_COLORS.ink,
                borderColor: QUEEN_COLORS.goldMatte,
                background:
                  "linear-gradient(180deg, rgba(255,253,252,0.95), rgba(246,241,232,0.7))",
                outlineColor: QUEEN_COLORS.goldMatte,
              }}
            >
              {status === "sending" ? "A ENVIAR…" : "CONFIRMAR"}
            </button>
          </motion.form>
        )}
      </div>
    </section>
  );
}
