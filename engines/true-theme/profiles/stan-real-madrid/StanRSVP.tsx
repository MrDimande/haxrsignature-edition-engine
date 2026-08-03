"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { CheckCircle2, Send } from "lucide-react";
import {
  resolveRsvpClientOutcome,
  resolveRsvpSubmitUiStateInFinally,
  type RsvpApiPayload,
} from "@lib/rsvp/client-outcome";
import {
  STAN_EVENT,
  STAN_RSVP,
  buildCompanionNote,
  formatStanDisplayDate,
  getStanWhatsAppUrl,
} from "@lib/stan/event-details";
import { useExperience } from "../../context";

const RSVP_FETCH_TIMEOUT_MS = 30_000;
const EASE = [0.22, 1, 0.36, 1] as const;

type FormState = {
  name: string;
  phone: string;
  email: string;
  attending: "" | "yes" | "no";
  companions: number;
  companionNames: string[];
  message: string;
  honeypot: string;
};

const initialForm: FormState = {
  name: "",
  phone: "",
  email: "",
  attending: "",
  companions: 0,
  companionNames: [],
  message: "",
  honeypot: "",
};

const fieldClass =
  "w-full border border-[#C9A86A]/25 bg-[#07101C] px-4 py-3.5 font-body text-sm text-[#F7F4EF] outline-none transition placeholder:text-[#F7F4EF]/30 focus:border-[#C9A86A]";

/**
 * RSVP — Convocatória S5 · Estreia do Big 5
 * Estética de lista de convocados / matchday call-up.
 * Isolado ao perfil stan-real-madrid.
 */
export function StanRSVPSection() {
  const { config, theme } = useExperience();
  const reduceMotion = useReducedMotion();
  const [form, setForm] = useState<FormState>(initialForm);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState("");

  const maxCompanions = STAN_RSVP.maxCompanions;
  const whatsappUrl = getStanWhatsAppUrl(theme.copy.rsvp?.whatsappNumber);
  const deadlineLabel =
    theme.copy.rsvp?.deadlineLabel || STAN_RSVP.deadlineLabel;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "sending") return;

    if (!form.attending) {
      setErrorMessage("Indique se aceita a convocatória.");
      setStatus("error");
      return;
    }

    if (!form.name.trim()) {
      setErrorMessage("Indique o nome do convocado.");
      setStatus("error");
      return;
    }

    if (!form.phone.trim() && !form.email.trim()) {
      setErrorMessage("Indique um telefone ou email de contacto.");
      setStatus("error");
      return;
    }

    if (
      STAN_RSVP.requireCompanionNames &&
      form.attending === "yes" &&
      form.companions > 0
    ) {
      const filled = form.companionNames
        .slice(0, form.companions)
        .filter((n) => n.trim().length > 0);
      if (filled.length < form.companions) {
        setErrorMessage("Indique o nome de cada acompanhante.");
        setStatus("error");
        return;
      }
    }

    setStatus("sending");
    setErrorMessage("");

    const isAttending = form.attending === "yes";
    const companions = isAttending ? form.companions : 0;
    const guests = isAttending ? 1 + companions : 0;
    const companionNote = isAttending
      ? buildCompanionNote(companions, form.companionNames)
      : undefined;
    const messageParts = [companionNote, form.message.trim()].filter(Boolean);
    const messageForBride =
      messageParts.length > 0 ? messageParts.join(" · ") : undefined;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), RSVP_FETCH_TIMEOUT_MS);

    try {
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          attending: isAttending,
          guests,
          messageForBride,
          honeypot: form.honeypot,
          slug: config.slug,
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
        setStatus("success");
        return;
      }

      setErrorMessage(outcome.message);
      setStatus("error");
    } catch (err) {
      setErrorMessage(
        err instanceof Error && err.name === "AbortError"
          ? "O pedido demorou demasiado. Tente novamente."
          : "Não foi possível enviar a confirmação. Tente novamente."
      );
      setStatus("error");
    } finally {
      clearTimeout(timeout);
      setStatus((prev) => resolveRsvpSubmitUiStateInFinally(prev));
    }
  };

  return (
    <section
      id="rsvp"
      className="relative w-full scroll-mt-24 overflow-hidden text-[#F7F4EF] sm:scroll-mt-28"
      style={{ backgroundColor: "#07101C" }}
      aria-labelledby="stan-rsvp-title"
    >
      {/* Atmosfera estádio */}
      <div className="absolute inset-0">
        <Image
          src="/images/stan/hero/stadium-bg-desktop.png"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center opacity-[0.28]"
          aria-hidden
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse 60% 40% at 50% 0%, rgba(201,168,106,0.12), transparent 55%),
              linear-gradient(180deg, rgba(7,16,28,0.85) 0%, rgba(7,16,28,0.72) 45%, rgba(7,16,28,0.96) 100%)
            `,
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-xl px-5 py-20 sm:px-6 sm:py-28">
        {/* Cabeçalho convocatória */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: EASE }}
          className="text-center"
        >
          <div className="mx-auto flex h-16 w-16 flex-col items-center justify-center rounded-full border border-[#C9A86A]/50 bg-[#0A1628]/60 backdrop-blur-sm">
            <span className="font-body text-[8px] font-bold tracking-[0.3em] text-[#C9A86A]">
              S · 5
            </span>
            <span className="font-display text-xl font-bold leading-none text-[#F7F4EF]">
              5
            </span>
          </div>

          <p className="mt-6 font-body text-[10px] font-semibold uppercase tracking-[0.42em] text-[#C9A86A]">
            Convocatória oficial
          </p>

          <h2
            id="stan-rsvp-title"
            className="mt-3 font-display text-[clamp(2.25rem,8vw,3.75rem)] font-extrabold uppercase leading-[0.9] tracking-tight text-[#F7F4EF]"
          >
            Estreia do Big 5
          </h2>

          <p className="mt-2 font-display text-lg font-light italic text-[#E8DCC8] sm:text-xl">
            Você está na lista de convocados do S5
          </p>

          <p className="mx-auto mt-5 max-w-md font-body text-sm font-light leading-relaxed text-[#F7F4EF]/65">
            Confirme a sua presença na estreia do pequeno campeão. O plantel
            está a ser formado — e esta celebração não será a mesma sem si.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 font-body text-[10px] font-semibold uppercase tracking-[0.28em] text-[#C9A86A]">
            <time dateTime={STAN_EVENT.dateIso}>
              {formatStanDisplayDate()}
            </time>
            <span className="text-white/25" aria-hidden>
              ·
            </span>
            <span>Kick-off {STAN_EVENT.timeLabel}</span>
          </div>

          {deadlineLabel ? (
            <p className="mt-3 font-body text-[10px] uppercase tracking-[0.28em] text-[#E8DCC8]/60">
              Resposta até {deadlineLabel}
            </p>
          ) : null}
        </motion.div>

        {/* Ficha / lista de convocados */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.85, delay: 0.1, ease: EASE }}
          className="relative mt-12 overflow-hidden border border-[#C9A86A]/30 bg-[#0A1628]/75 backdrop-blur-md"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-3 border border-[#C9A86A]/15"
          />

          {/* Barra superior tipo ficha FIFA / call-up */}
          <div className="relative z-10 flex items-center justify-between border-b border-[#C9A86A]/25 bg-[#C9A86A]/10 px-5 py-3 sm:px-7">
            <span className="font-body text-[10px] font-bold uppercase tracking-[0.32em] text-[#C9A86A]">
              Ficha de convocação
            </span>
            <span className="font-display text-sm font-semibold text-[#F7F4EF]">
              S5
            </span>
          </div>

          <div className="relative z-10 p-5 sm:p-7">
            {status === "success" ? (
              <div
                role="status"
                aria-live="polite"
                className="space-y-5 py-4 text-center"
              >
                <CheckCircle2
                  size={44}
                  className="mx-auto text-[#C9A86A]"
                  aria-hidden
                />
                <h3 className="font-display text-2xl font-light text-[#F7F4EF]">
                  Está na lista de convocados
                </h3>
                <p className="font-body text-sm font-light leading-relaxed text-[#F7F4EF]/70">
                  Obrigado,{" "}
                  <strong className="font-semibold text-[#F7F4EF]">
                    {form.name.trim()}
                  </strong>
                  . A sua resposta foi registada. Nos vemos na estreia do Big 5.
                </p>
                <p className="font-body text-[10px] uppercase tracking-[0.28em] text-[#C9A86A]">
                  See you on Matchday
                </p>

                {whatsappUrl ? (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center gap-2 bg-[#25D366] px-6 py-3 font-body text-[11px] font-bold uppercase tracking-[0.18em] text-white"
                  >
                    <Send size={14} aria-hidden />
                    Contactar por WhatsApp
                  </a>
                ) : null}
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <div className="absolute -left-[9999px] opacity-0" aria-hidden>
                  <label htmlFor="stan-rsvp-company">Empresa</label>
                  <input
                    id="stan-rsvp-company"
                    tabIndex={-1}
                    autoComplete="off"
                    value={form.honeypot}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, honeypot: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label
                    htmlFor="stan-rsvp-name"
                    className="mb-2 block font-body text-[10px] font-semibold uppercase tracking-[0.28em] text-[#C9A86A]"
                  >
                    Nome do convocado
                  </label>
                  <input
                    id="stan-rsvp-name"
                    required
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, name: e.target.value }))
                    }
                    placeholder="Nome completo"
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label
                    htmlFor="stan-rsvp-phone"
                    className="mb-2 block font-body text-[10px] font-semibold uppercase tracking-[0.28em] text-[#C9A86A]"
                  >
                    Contacto / WhatsApp
                  </label>
                  <input
                    id="stan-rsvp-phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, phone: e.target.value }))
                    }
                    placeholder="+258 …"
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label
                    htmlFor="stan-rsvp-email"
                    className="mb-2 block font-body text-[10px] font-semibold uppercase tracking-[0.28em] text-[#C9A86A]"
                  >
                    Email{" "}
                    <span className="text-[#F7F4EF]/40">(opcional)</span>
                  </label>
                  <input
                    id="stan-rsvp-email"
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, email: e.target.value }))
                    }
                    placeholder="nome@email.com"
                    className={fieldClass}
                  />
                </div>

                <fieldset>
                  <legend className="mb-3 block font-body text-[10px] font-semibold uppercase tracking-[0.28em] text-[#C9A86A]">
                    Resposta à convocatória
                  </legend>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      aria-pressed={form.attending === "yes"}
                      onClick={() =>
                        setForm((p) => ({ ...p, attending: "yes" }))
                      }
                      className={`min-h-12 border px-4 py-3.5 font-body text-[11px] font-bold uppercase tracking-[0.18em] transition ${
                        form.attending === "yes"
                          ? "border-[#C9A86A] bg-[#C9A86A] text-[#07101C]"
                          : "border-[#C9A86A]/25 bg-transparent text-[#F7F4EF]/70 hover:border-[#C9A86A]/50"
                      }`}
                    >
                      Aceito — estou convocado
                    </button>
                    <button
                      type="button"
                      aria-pressed={form.attending === "no"}
                      onClick={() =>
                        setForm((p) => ({
                          ...p,
                          attending: "no",
                          companions: 0,
                          companionNames: [],
                        }))
                      }
                      className={`min-h-12 border px-4 py-3.5 font-body text-[11px] font-bold uppercase tracking-[0.18em] transition ${
                        form.attending === "no"
                          ? "border-red-400/50 bg-red-500/15 text-red-200"
                          : "border-[#C9A86A]/25 bg-transparent text-[#F7F4EF]/70 hover:border-[#C9A86A]/50"
                      }`}
                    >
                      Indisponível
                    </button>
                  </div>
                </fieldset>

                {form.attending === "yes" ? (
                  <div className="space-y-4 border-t border-[#C9A86A]/20 pt-5">
                    <fieldset>
                      <legend className="mb-2 block font-body text-[10px] font-semibold uppercase tracking-[0.28em] text-[#C9A86A]">
                        Acompanhantes na bancada
                      </legend>
                      <div className="flex flex-wrap gap-2">
                        {Array.from({ length: maxCompanions + 1 }, (_, n) => (
                          <button
                            key={n}
                            type="button"
                            aria-pressed={form.companions === n}
                            onClick={() =>
                              setForm((p) => ({
                                ...p,
                                companions: n,
                                companionNames: p.companionNames.slice(0, n),
                              }))
                            }
                            className={`min-h-11 min-w-11 border px-3 py-2 font-body text-xs transition ${
                              form.companions === n
                                ? "border-[#C9A86A] bg-[#C9A86A] font-bold text-[#07101C]"
                                : "border-[#C9A86A]/25 text-[#F7F4EF]/70"
                            }`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                      <p className="mt-2 font-body text-[10px] uppercase tracking-[0.2em] text-[#F7F4EF]/40">
                        Plantel no evento: {1 + form.companions}{" "}
                        {1 + form.companions === 1 ? "pessoa" : "pessoas"}
                      </p>
                    </fieldset>

                    {form.companions > 0
                      ? Array.from({ length: form.companions }, (_, index) => (
                          <div key={index}>
                            <label
                              htmlFor={`stan-companion-${index}`}
                              className="mb-2 block font-body text-[10px] font-semibold uppercase tracking-[0.28em] text-[#C9A86A]"
                            >
                              Nome do acompanhante {index + 1}
                              {!STAN_RSVP.requireCompanionNames
                                ? " (opcional)"
                                : ""}
                            </label>
                            <input
                              id={`stan-companion-${index}`}
                              type="text"
                              value={form.companionNames[index] ?? ""}
                              onChange={(e) => {
                                const next = [...form.companionNames];
                                next[index] = e.target.value;
                                setForm((p) => ({
                                  ...p,
                                  companionNames: next,
                                }));
                              }}
                              placeholder={`Acompanhante ${index + 1}`}
                              className={fieldClass}
                            />
                          </div>
                        ))
                      : null}
                  </div>
                ) : null}

                <div>
                  <label
                    htmlFor="stan-rsvp-message"
                    className="mb-2 block font-body text-[10px] font-semibold uppercase tracking-[0.28em] text-[#C9A86A]"
                  >
                    Mensagem ao plantel{" "}
                    <span className="text-[#F7F4EF]/40">(opcional)</span>
                  </label>
                  <textarea
                    id="stan-rsvp-message"
                    rows={3}
                    maxLength={280}
                    value={form.message}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, message: e.target.value }))
                    }
                    placeholder="Uma nota para a família do Stan…"
                    className={`${fieldClass} resize-none`}
                  />
                </div>

                {status === "error" && errorMessage ? (
                  <p
                    role="alert"
                    className="border border-red-400/30 bg-red-500/10 px-4 py-3 font-body text-xs text-red-200"
                  >
                    {errorMessage}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={status === "sending"}
                  aria-busy={status === "sending"}
                  className="flex min-h-12 w-full items-center justify-center bg-[#C9A86A] px-6 py-3.5 font-body text-[11px] font-extrabold uppercase tracking-[0.24em] text-[#07101C] shadow-[0_14px_40px_rgba(201,168,106,0.25)] transition hover:bg-[#D4B87A] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {status === "sending"
                    ? "A registar…"
                    : "Confirmar convocatória"}
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
