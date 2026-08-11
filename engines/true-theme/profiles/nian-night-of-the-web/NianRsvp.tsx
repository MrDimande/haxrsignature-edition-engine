"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CalendarPlus, Send, Share2 } from "lucide-react";
import { motion, useInView, useReducedMotion } from "motion/react";
import {
  resolveRsvpClientOutcome,
  resolveRsvpSubmitUiStateInFinally,
  type RsvpApiPayload,
} from "@lib/rsvp/client-outcome";
import { buildEditionRsvpStorageKey } from "@lib/rsvp/storage-keys";
import {
  NIAN_SLUG,
  NIAN_RSVP,
  downloadNianIcsFile,
  getNianWhatsAppUrl,
  readNianRsvpLocalRecord,
  shareNianInvite,
  type NianRsvpLocalRecord,
} from "@lib/nian/event-details";
import {
  NIAN_RSVP_NOT_PERSISTED_MESSAGE,
  shouldAcceptNianRsvpSuccess,
} from "@lib/nian/rsvp-persist";
import { useExperience } from "../../context";
import { NIAN_COLORS, NIAN_EASE } from "./nian-motion";
import { NianSignalPulse } from "./NianSignalPulse";

const ctaClass =
  "inline-flex min-h-11 items-center justify-center gap-2 border border-[#4169E1]/45 bg-[#070a14] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#F4F6FB] transition hover:border-[#4169E1] hover:bg-[#4169E1]/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4169E1]";

const whatsappCtaClass =
  "inline-flex min-h-11 items-center justify-center gap-2 bg-[#25D366] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]";

const RSVP_FETCH_TIMEOUT_MS = 30_000;

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
  contact: string;
  honeypot: string;
};

const initialForm: FormState = {
  name: "",
  attending: "",
  contact: "",
  honeypot: "",
};

const fieldClass =
  "w-full border border-[#4169E1]/30 bg-[#070a14] px-4 py-3.5 text-sm text-[#F4F6FB] outline-none transition placeholder:text-[#8FA3D1]/45 focus:border-[#4169E1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4169E1]";

function looksLikeEmail(value: string): boolean {
  return value.includes("@");
}

function persistLocal(
  slug: string,
  record: NianRsvpLocalRecord
): void {
  try {
    localStorage.setItem(
      buildEditionRsvpStorageKey(slug),
      JSON.stringify(record)
    );
  } catch {
    /* private mode */
  }
}

function loadLocal(slug: string): NianRsvpLocalRecord | null {
  try {
    return readNianRsvpLocalRecord(
      localStorage.getItem(buildEditionRsvpStorageKey(slug))
    );
  } catch {
    return null;
  }
}

/**
 * RSVP — Confirmação de missão.
 * Reutiliza POST /api/rsvp + validate-local sem alterar lib/rsvp.
 * Isolado a nian-night-of-the-web.
 */
export function NianRsvpSection() {
  const { theme } = useExperience();
  const reduceMotion = useReducedMotion();
  const slug = NIAN_SLUG;
  const formId = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.28 });
  const whatsappUrl = getNianWhatsAppUrl(theme.copy.rsvp?.whatsappNumber);

  const [form, setForm] = useState<FormState>(initialForm);
  const [status, setStatus] = useState<UiStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [shareHint, setShareHint] = useState("");
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
      setErrorMessage("Indica se vais juntar-te à aventura.");
      setStatus("validation");
      return;
    }

    if (!form.name.trim()) {
      setErrorMessage("Indica o teu nome.");
      setStatus("validation");
      return;
    }

    const isAttending = form.attending === "yes";
    const contact = form.contact.trim();

    if (isAttending && !contact) {
      setErrorMessage("Indica um email ou telefone para contacto.");
      setStatus("validation");
      return;
    }

    setStatus("sending");
    setErrorMessage("");

    const email = contact && looksLikeEmail(contact) ? contact : undefined;
    const phone = contact && !looksLikeEmail(contact) ? contact : undefined;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), RSVP_FETCH_TIMEOUT_MS);

    try {
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          name: form.name.trim(),
          email,
          phone,
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
      if (outcome.kind === "success") {
        if (!shouldAcceptNianRsvpSuccess(data)) {
          // Preview/Production sem confirmação de BD — manter formulário
          setErrorMessage(NIAN_RSVP_NOT_PERSISTED_MESSAGE);
          setStatus("error");
          return;
        }

        const record: NianRsvpLocalRecord = {
          attending: isAttending,
          name: form.name.trim(),
          submittedAt: new Date().toISOString(),
        };
        // Só memorizar localmente após aceitação (persistida ou dev local)
        if (data.persisted === true || process.env.NODE_ENV === "development") {
          persistLocal(slug, record);
        }
        setSubmittedAttending(isAttending);
        setStatus(isAttending ? "success" : "declined");
        return;
      }

      setErrorMessage(outcome.message);
      setStatus("error");
    } catch (err) {
      setErrorMessage(
        err instanceof Error && err.name === "AbortError"
          ? "O pedido demorou demasiado. Tenta novamente."
          : !navigator.onLine
            ? "Estás offline. Liga-te à internet e tenta novamente."
            : "Não foi possível enviar a confirmação. Tenta novamente."
      );
      setStatus("error");
    } finally {
      clearTimeout(timeout);
      setStatus((prev) => {
        if (prev === "declined" || prev === "already" || prev === "validation") {
          return prev;
        }
        if (
          prev === "idle" ||
          prev === "sending" ||
          prev === "success" ||
          prev === "error"
        ) {
          return resolveRsvpSubmitUiStateInFinally(prev);
        }
        return prev;
      });
    }
  };

  const showForm =
    status === "idle" ||
    status === "validation" ||
    status === "sending" ||
    status === "error";

  return (
    <section
      ref={sectionRef}
      id="rsvp"
      aria-labelledby="nian-rsvp-title"
      className="relative w-full scroll-mt-24 overflow-hidden"
      style={{ backgroundColor: NIAN_COLORS.bg }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 50% 40% at 50% 0%, rgba(65,105,225,0.14) 0%, transparent 55%),
            radial-gradient(ellipse 40% 35% at 90% 90%, rgba(225,6,0,0.08) 0%, transparent 55%),
            linear-gradient(180deg, #03050b 0%, #060914 50%, #03050b 100%)
          `,
        }}
      />

      <div className="relative z-10 mx-auto max-w-xl px-5 pb-[calc(env(safe-area-inset-bottom,0px)+7rem)] pt-20 sm:px-6 sm:pt-28">
        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.5, ease: NIAN_EASE }}
          className="text-[10px] font-semibold uppercase tracking-[0.42em] text-[#4169E1]"
        >
          {NIAN_RSVP.subtitle}
        </motion.p>

        <motion.h2
          id="nian-rsvp-title"
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={inView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.65, delay: 0.06, ease: NIAN_EASE }}
          className="mt-4 text-[clamp(1.85rem,5.5vw,2.85rem)] font-semibold uppercase leading-[1.05] tracking-[0.04em] text-[#F4F6FB]"
          style={{
            fontFamily: "var(--font-jost), var(--font-montserrat), sans-serif",
          }}
        >
          Vais juntar-te
          <br />
          à aventura?
        </motion.h2>
        <NianSignalPulse active={inView} />

        {showForm ? (
          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={inView ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.5, delay: 0.14, ease: NIAN_EASE }}
            className="mt-5 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8FA3D1]"
          >
            {NIAN_RSVP.deadlineDisplay}
          </motion.p>
        ) : null}

        {status === "already" || status === "success" || status === "declined" ? (
          <motion.div
            role="status"
            aria-live="polite"
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: NIAN_EASE }}
            className="mt-12 border-t border-[#4169E1]/25 pt-10"
          >
            {(submittedAttending ?? status === "success") ? (
              <>
                <p className="text-[10px] font-semibold uppercase tracking-[0.42em] text-[#4169E1]">
                  Signal // Ack
                </p>
                <p className="mt-4 text-[clamp(1.35rem,4vw,1.75rem)] font-semibold uppercase tracking-[0.08em] text-[#F4F6FB]">
                  Missão confirmada.
                </p>
                <p className="mt-4 text-[1.05rem] leading-relaxed text-[#B0BED8]">
                  A cidade espera por ti.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  {whatsappUrl ? (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={whatsappCtaClass}
                    >
                      <Send size={14} aria-hidden />
                      Contactar por WhatsApp
                    </a>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => downloadNianIcsFile()}
                    className={ctaClass}
                  >
                    <CalendarPlus size={14} aria-hidden />
                    Adicionar ao calendário
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void shareNianInvite().then((result) => {
                        if (result === "copied") {
                          setShareHint("Link copiado.");
                        } else if (result === "shared" || result === "whatsapp") {
                          setShareHint("");
                        }
                      });
                    }}
                    className={ctaClass}
                  >
                    <Share2 size={14} aria-hidden />
                    Partilhar convite
                  </button>
                </div>
                {shareHint ? (
                  <p className="mt-3 text-[0.8rem] text-[#8FA3D1]" role="status">
                    {shareHint}
                  </p>
                ) : null}
              </>
            ) : (
              <>
                <p className="text-[10px] font-semibold uppercase tracking-[0.42em] text-[#4169E1]">
                  Signal // Received
                </p>
                <p className="mt-4 text-[clamp(1.35rem,4vw,1.75rem)] font-semibold uppercase tracking-[0.08em] text-[#F4F6FB]">
                  Mensagem recebida.
                </p>
                <p className="mt-4 text-[1.05rem] leading-relaxed text-[#B0BED8]">
                  O Nian sentirá a tua falta.
                </p>
                <div className="mt-8">
                  <button
                    type="button"
                    onClick={() => {
                      void shareNianInvite().then((result) => {
                        if (result === "copied") {
                          setShareHint("Link copiado.");
                        } else {
                          setShareHint("");
                        }
                      });
                    }}
                    className={ctaClass}
                  >
                    <Share2 size={14} aria-hidden />
                    Partilhar convite
                  </button>
                </div>
                {shareHint ? (
                  <p className="mt-3 text-[0.8rem] text-[#8FA3D1]" role="status">
                    {shareHint}
                  </p>
                ) : null}
              </>
            )}
            {status === "already" ? (
              <p className="mt-6 text-[0.85rem] text-[#8FA3D1]">
                Já registámos a tua resposta neste dispositivo.
              </p>
            ) : null}
          </motion.div>
        ) : null}

        {showForm ? (
          <form
            onSubmit={(e) => void handleSubmit(e)}
            noValidate
            className="mt-12 space-y-8"
          >
            <fieldset className="space-y-3">
              <legend className="text-[9px] font-semibold uppercase tracking-[0.4em] text-[#4169E1]">
                A tua resposta
              </legend>
              <div className="flex flex-col gap-3 sm:flex-row">
                {(
                  [
                    ["yes", "Sim, estarei presente"],
                    ["no", "Não poderei participar"],
                  ] as const
                ).map(([value, label]) => {
                  const selected = form.attending === value;
                  return (
                    <label
                      key={value}
                      className={`flex min-h-12 cursor-pointer items-center justify-center border px-4 text-center text-[11px] font-semibold uppercase tracking-[0.18em] transition focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#4169E1] ${
                        selected
                          ? value === "yes"
                            ? "border-[#4169E1] bg-[#4169E1] text-[#F4F6FB]"
                            : "border-[#E10600]/70 bg-[#E10600]/15 text-[#F4F6FB]"
                          : "border-[#4169E1]/35 text-[#B0BED8] hover:border-[#4169E1]/60"
                      }`}
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
                      {label}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div>
              <label
                htmlFor={`${formId}-name`}
                className="text-[9px] font-semibold uppercase tracking-[0.4em] text-[#4169E1]"
              >
                Nome
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
                className={`mt-2 ${fieldClass}`}
                placeholder="O teu nome"
                maxLength={120}
                required
              />
            </div>

            {form.attending === "yes" ? (
              <div>
                <label
                  htmlFor={`${formId}-contact`}
                  className="text-[9px] font-semibold uppercase tracking-[0.4em] text-[#4169E1]"
                >
                  Email ou telefone
                </label>
                <input
                  id={`${formId}-contact`}
                  name="contact"
                  type="text"
                  autoComplete="email"
                  inputMode="email"
                  value={form.contact}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, contact: e.target.value }))
                  }
                  className={`mt-2 ${fieldClass}`}
                  placeholder="Para te contactarmos"
                  maxLength={160}
                  required
                />
              </div>
            ) : null}

            {/* Honeypot */}
            <div className="absolute -left-[9999px] opacity-0" aria-hidden>
              <label htmlFor={`${formId}-hp`}>Website</label>
              <input
                id={`${formId}-hp`}
                name="nian_rsvp_hp"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={form.honeypot}
                onChange={(e) =>
                  setForm((f) => ({ ...f, honeypot: e.target.value }))
                }
              />
            </div>

            {(status === "validation" || status === "error") &&
            errorMessage ? (
              <p
                role="alert"
                aria-live="assertive"
                className="text-sm text-[#E10600]"
              >
                {errorMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={status === "sending"}
              className="inline-flex min-h-12 w-full items-center justify-center border border-[#4169E1] bg-[#4169E1] px-8 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#F4F6FB] transition hover:bg-[#3558c7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F4F6FB] disabled:cursor-wait disabled:opacity-70 sm:w-auto"
            >
              {status === "sending" ? "A enviar…" : "Enviar confirmação"}
            </button>
          </form>
        ) : null}
      </div>
    </section>
  );
}
