"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { Heart, Send, UserCheck } from "lucide-react";
import {
  resolveRsvpSubmitUiStateInFinally,
} from "@lib/rsvp/client-outcome";
import { submitUniversalRsvp } from "@lib/rsvp/universal-client";
import { TRADITIONAL_COPY } from "@lib/jessica-samuel-traditional/event-details";
import { useExperience } from "../../context";
import { primaveraType } from "./primavera-typography";
import { primaveraReveal, primaveraStagger, primaveraViewport } from "./primavera-motion";
import { PrimaveraEditorialHeading } from "./primavera-editorial-heading";
import { PRIMAVERA_LAYOUT, PRIMAVERA_SURFACES } from "./primavera-surfaces";

const RSVP_FETCH_TIMEOUT_MS = 30_000;

const MAX_COMPANIONS = 4;

type FormState = {
  name: string;
  email: string;
  phone: string;
  attending: "" | "yes" | "no";
  companions: number;
  companionNames: string[];
  honeypot: string;
};

const initialForm: FormState = {
  name: "",
  email: "",
  phone: "",
  attending: "",
  companions: 0,
  companionNames: [],
  honeypot: "",
};

function buildCompanionNote(companions: number, names: string[]): string | undefined {
  if (companions <= 0) return undefined;

  const filledNames = names
    .slice(0, companions)
    .map((n) => n.trim())
    .filter((n) => n.length > 0);

  if (filledNames.length === 0) {
    return `${companions} acompanhante(s) · nomes não indicados`;
  }

  return `${companions} acompanhante(s): ${filledNames.join(", ")}`;
}

function PrimaveraField({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="font-body text-[10px] tracking-[0.22em] uppercase"
        style={{ color: PRIMAVERA_SURFACES.inkSoft }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

export function PrimaveraLoboloRSVPSection() {
  const { theme, config } = useExperience();
  const [form, setForm] = useState<FormState>(initialForm);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const inputClass =
    "w-full bg-transparent border-b py-3.5 text-sm focus:outline-none focus-visible:border-b-2 transition-colors duration-300";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "sending") return;

    setStatus("sending");
    setErrorMessage("");

    const isAttending = form.attending === "yes";
    const companions = isAttending ? form.companions : 0;
    const guests = isAttending ? 1 + companions : 0;
    const companionNote = isAttending
      ? buildCompanionNote(companions, form.companionNames)
      : undefined;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), RSVP_FETCH_TIMEOUT_MS);

    try {
      const { outcome } = await submitUniversalRsvp(
        {
          name: form.name.trim(),
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          attending: isAttending,
          guests,
          messageForBride: companionNote,
          honeypot: form.honeypot,
          slug: config.slug,
        },
        controller.signal
      );

      if (
        outcome.kind === "success" ||
        outcome.kind === "persisted_partial"
      ) {
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

  const deadline = theme.copy.rsvp?.deadlineLabel;

  return (
    <motion.section
      id="rsvp"
      initial="hidden"
      whileInView="visible"
      viewport={primaveraViewport}
      variants={primaveraStagger}
      className={`${PRIMAVERA_LAYOUT.section} py-24 md:py-32 lg:py-40`}
      style={{ backgroundColor: PRIMAVERA_SURFACES.ivory }}
    >
      <div className={`${PRIMAVERA_LAYOUT.containerWide} grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start`}>
        <motion.div variants={primaveraReveal} className="lg:col-span-5">
          <PrimaveraEditorialHeading
            eyebrow="R.S.V.P."
            title={TRADITIONAL_COPY.rsvpTitle}
            align="left"
          />
          <p
            className={`${primaveraType.heroSubtitle} mt-8 ${theme.palette.textPrimary} opacity-85`}
          >
            {TRADITIONAL_COPY.rsvpSubtitle}
          </p>
          {deadline ? (
            <p
              className="mt-4 text-xs tracking-[0.2em] uppercase"
              style={{ color: PRIMAVERA_SURFACES.terracotta }}
            >
              Até {deadline}
            </p>
          ) : null}
          <div className="hidden lg:flex items-center gap-3 mt-12 opacity-70">
            <Heart className="w-4 h-4" style={{ color: PRIMAVERA_SURFACES.terracotta }} strokeWidth={1.25} />
            <p className={`${primaveraType.bodyPoetic} text-base`}>
              A vossa presença é bênção para as nossas famílias.
            </p>
          </div>
        </motion.div>

        <motion.div variants={primaveraReveal} className="lg:col-span-7">
          {status === "success" ? (
            <div
              className="p-10 md:p-12 text-center rounded-sm border"
              style={{
                backgroundColor: PRIMAVERA_SURFACES.ivoryLight,
                borderColor: `${PRIMAVERA_SURFACES.gold}45`,
              }}
            >
              <UserCheck
                className="mx-auto mb-4 h-10 w-10"
                style={{ color: PRIMAVERA_SURFACES.terracotta }}
                strokeWidth={1.25}
              />
              <p className={`${primaveraType.sectionTitle} text-2xl mb-3 ${theme.palette.textPrimary}`}>
                Obrigado
              </p>
              <p className={`${primaveraType.heroSubtitle} opacity-80 ${theme.palette.textPrimary}`}>
                A sua confirmação foi recebida com gratidão e respeito.
              </p>
            </div>
          ) : (
            <>
              <p
                className={`${primaveraType.bodyPoetic} text-center lg:text-left text-lg mb-6 px-1`}
                style={{ color: PRIMAVERA_SURFACES.terracottaDeep }}
              >
                {TRADITIONAL_COPY.rsvpEmotionalLine}
              </p>
            <form
              onSubmit={handleSubmit}
              className="p-8 md:p-10 lg:p-12 rounded-sm border space-y-6"
              style={{
                backgroundColor: PRIMAVERA_SURFACES.ivoryLight,
                borderColor: `${PRIMAVERA_SURFACES.terracotta}30`,
                boxShadow: "0 20px 60px rgba(158, 66, 24, 0.1)",
              }}
            >
              <input
                type="text"
                name="honeypot"
                value={form.honeypot}
                onChange={(e) => setForm((p) => ({ ...p, honeypot: e.target.value }))}
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden
              />

              <PrimaveraField label="Nome completo" id="rsvp-name">
                <input
                  id="rsvp-name"
                  required
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className={`${inputClass} ${theme.palette.textPrimary}`}
                  style={{ borderColor: `${PRIMAVERA_SURFACES.gold}55` }}
                  placeholder="O seu nome"
                />
              </PrimaveraField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <PrimaveraField label="Email" id="rsvp-email">
                  <input
                    id="rsvp-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    className={`${inputClass} ${theme.palette.textPrimary}`}
                    style={{ borderColor: `${PRIMAVERA_SURFACES.gold}55` }}
                    placeholder="email@exemplo.com"
                  />
                </PrimaveraField>
                <PrimaveraField label="Telefone" id="rsvp-phone">
                  <input
                    id="rsvp-phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    className={`${inputClass} ${theme.palette.textPrimary}`}
                    style={{ borderColor: `${PRIMAVERA_SURFACES.gold}55` }}
                    placeholder="+258 ..."
                  />
                </PrimaveraField>
              </div>

              <PrimaveraField label="Presença" id="rsvp-attending">
                <div className="flex gap-3 pt-1">
                  {(["yes", "no"] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        setForm((p) => ({
                          ...p,
                          attending: value,
                          companions: value === "yes" ? p.companions : 0,
                          companionNames: value === "yes" ? p.companionNames : [],
                        }))
                      }
                      className={`flex-1 py-3.5 text-[10px] tracking-[0.2em] uppercase border rounded-sm transition-all duration-300 ${
                        form.attending === value ? "opacity-100" : "opacity-55"
                      }`}
                      style={{
                        borderColor: PRIMAVERA_SURFACES.terracotta,
                        backgroundColor:
                          form.attending === value
                            ? `${PRIMAVERA_SURFACES.terracotta}18`
                            : "transparent",
                        color: PRIMAVERA_SURFACES.ink,
                      }}
                    >
                      {value === "yes" ? "Confirmar" : "Declinar"}
                    </button>
                  ))}
                </div>
              </PrimaveraField>

              {form.attending === "yes" ? (
                <div className="space-y-5">
                  <PrimaveraField label="Número de acompanhantes" id="rsvp-companions">
                    <div id="rsvp-companions" className="flex flex-wrap gap-2.5 pt-1">
                      {Array.from({ length: MAX_COMPANIONS + 1 }, (_, n) => n).map(
                        (n) => (
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
                            className={`min-w-[46px] flex-1 py-3.5 px-3 text-[11px] tracking-[0.12em] uppercase border rounded-sm transition-all duration-300 ${
                              form.companions === n ? "opacity-100" : "opacity-55"
                            }`}
                            style={{
                              borderColor: PRIMAVERA_SURFACES.terracotta,
                              backgroundColor:
                                form.companions === n
                                  ? `${PRIMAVERA_SURFACES.terracotta}18`
                                  : "transparent",
                              color: PRIMAVERA_SURFACES.ink,
                            }}
                          >
                            {n === 0 ? "Só eu" : n}
                          </button>
                        )
                      )}
                    </div>
                  </PrimaveraField>

                  {form.companions > 0 ? (
                    <div className="space-y-4">
                      {Array.from({ length: form.companions }, (_, index) => index).map(
                        (index) => (
                          <PrimaveraField
                            key={index}
                            label={`Nome do acompanhante ${index + 1} (opcional)`}
                            id={`rsvp-companion-name-${index}`}
                          >
                            <input
                              id={`rsvp-companion-name-${index}`}
                              value={form.companionNames[index] ?? ""}
                              onChange={(e) =>
                                setForm((p) => {
                                  const next = [...p.companionNames];
                                  next[index] = e.target.value;
                                  return { ...p, companionNames: next };
                                })
                              }
                              className={`${inputClass} ${theme.palette.textPrimary}`}
                              style={{ borderColor: `${PRIMAVERA_SURFACES.gold}55` }}
                              placeholder={`Nome do acompanhante ${index + 1}`}
                              maxLength={80}
                            />
                          </PrimaveraField>
                        )
                      )}
                    </div>
                  ) : null}

                  <p
                    className="text-xs leading-relaxed opacity-70"
                    style={{ color: PRIMAVERA_SURFACES.inkSoft }}
                  >
                    {form.companions === 0
                      ? "A confirmação será registada apenas para si."
                      : `A confirmação será registada para ${1 + form.companions} pessoas.`}
                  </p>
                </div>
              ) : null}

              {errorMessage ? (
                <p className="text-sm text-red-800/80" role="alert">
                  {errorMessage}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={status === "sending" || !form.attending}
                className="w-full flex items-center justify-center gap-2 py-4 text-[11px] tracking-[0.26em] uppercase rounded-sm transition-opacity duration-300 disabled:opacity-40"
                style={{
                  backgroundColor: PRIMAVERA_SURFACES.terracotta,
                  color: PRIMAVERA_SURFACES.ivoryLight,
                  boxShadow: "0 8px 24px rgba(196, 92, 38, 0.25)",
                }}
              >
                <Send className="w-4 h-4" strokeWidth={1.5} />
                {status === "sending" ? "A enviar..." : "Enviar Confirmação"}
              </button>
            </form>
            </>
          )}
        </motion.div>
      </div>
    </motion.section>
  );
}
