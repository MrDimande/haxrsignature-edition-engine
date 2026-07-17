"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  Calendar,
  Clock,
  MapPin,
  MessageCircle,
  Navigation,
  Send,
  Shirt,
  UserCheck,
} from "lucide-react";
import { useExperience } from "../../context";
import { createMotionVariants } from "../../motion";
import { GiftRegistryPanel } from "./GiftRegistry";
import { roseType } from "./rose-typography";
import {
  buildFarewellGoogleCalendarUrl,
  downloadFarewellIcsFile,
  getFarewellWhatsAppUrl,
  isFarewellRsvpDeadlinePassed,
} from "@lib/farewell/event-details";
import {
  resolveRsvpSubmitUiStateInFinally,
} from "@lib/rsvp/client-outcome";
import { submitUniversalRsvp } from "@lib/rsvp/universal-client";
import {
  buildEditionRsvpStorageKey,
  buildLegacyRsvpStorageKey,
} from "@lib/rsvp/storage-keys";

const SIZE_OPTIONS = ["", "XS", "S", "M", "L", "XL", "XXL"] as const;

const EASE_APPLE = [0.16, 1, 0.3, 1] as const;
const cinematicViewport = { once: true, amount: 0.12 } as const;
const RSVP_FETCH_TIMEOUT_MS = 30_000;

const cinematicRevealVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 1.1, ease: EASE_APPLE },
  },
};

const cinematicStagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.22, delayChildren: 0.3 },
  },
};

function formatEventDate(isoDate: string): string {
  const date = new Date(isoDate + "T12:00:00");
  return date.toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

type StoredRsvp = {
  name: string;
  attending: boolean;
};

function readStoredRsvp(slug: string): StoredRsvp | null {
  if (typeof window === "undefined") return null;
  try {
    const raw =
      localStorage.getItem(buildEditionRsvpStorageKey(slug)) ??
      localStorage.getItem(buildLegacyRsvpStorageKey(slug));
    if (!raw) return null;
    return JSON.parse(raw) as StoredRsvp;
  } catch {
    return null;
  }
}

function storeRsvp(slug: string, data: StoredRsvp): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(buildEditionRsvpStorageKey(slug), JSON.stringify(data));
}

function clearStoredRsvp(slug: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(buildEditionRsvpStorageKey(slug));
  localStorage.removeItem(buildLegacyRsvpStorageKey(slug));
}

const inputClass = (theme: ReturnType<typeof useExperience>["theme"]) =>
  `w-full bg-white/35 border-b py-3.5 text-sm ${theme.palette.textPrimary} placeholder-black/35 focus:outline-none focus-visible:border-b-2 transition-all duration-500`;

function RoseExperienceCard({
  theme,
  icon,
  title,
  description,
  children,
  className = "",
}: {
  theme: ReturnType<typeof useExperience>["theme"];
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`w-full flex flex-col backdrop-blur-lg rounded-sm transition-all duration-500 shadow-sm border p-8 ${theme.palette.cardBg} ${className}`}
      style={{ borderColor: `${theme.colors.accent}15` }}
    >
      <div className="flex items-start gap-3 mb-6">
        <div
          className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full border"
          style={{
            borderColor: `${theme.colors.accent}35`,
            color: theme.colors.accent,
          }}
        >
          {icon}
        </div>
        <div className="space-y-2 min-w-0">
          <h3
            className={`font-display italic text-base font-light tracking-[0.04em] ${theme.palette.textPrimary}`}
          >
            {title}
          </h3>
          {description && (
            <p
              className={`font-body text-xs font-light leading-relaxed ${theme.palette.textSecondary} opacity-85`}
            >
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}

export function RoseRSVPSection() {
  const { theme, tokens, config, rsvpStatus, setRsvpStatus } = useExperience();
  const variants = createMotionVariants(tokens);
  const rsvpCopy = theme.copy.rsvp;
  const dress = theme.copy.dressCode;
  const location = theme.copy.location;
  const deadlinePassed = isFarewellRsvpDeadlinePassed(
    new Date(),
    rsvpCopy?.deadlineIso
  );

  const [mounted, setMounted] = useState(false);
  const [storedRsvp, setStoredRsvp] = useState<StoredRsvp | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    size: "",
    messageForBride: "",
    dressCodeConfirmed: false,
    attending: "yes" as "yes" | "no",
    honeypot: "",
  });
  const [errorMsg, setErrorMsg] = useState("");
  const [submitted, setSubmitted] = useState<StoredRsvp | null>(null);
  const submitInFlightRef = useRef(false);

  useEffect(() => {
    setMounted(true);
    const saved = readStoredRsvp(config.slug);
    if (saved) {
      setStoredRsvp(saved);
      setSubmitted(saved);
      setRsvpStatus("success");
      return;
    }

    setRsvpStatus((current) => (current === "sending" ? "idle" : current));
  }, [config.slug, setRsvpStatus]);

  const persistLocalSuccess = (result: StoredRsvp) => {
    storeRsvp(config.slug, result);
    setStoredRsvp(result);
    setSubmitted(result);
    setRsvpStatus("success");
    setErrorMsg("");
  };

  const clearRsvpError = () => {
    setRsvpStatus((current) => (current === "error" ? "idle" : current));
    setErrorMsg("");
  };

  const whatsappUrl = getFarewellWhatsAppUrl(
    rsvpCopy?.whatsappNumber,
    rsvpCopy?.whatsappDefaultMessage
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitInFlightRef.current || rsvpStatus === "sending") {
      return;
    }

    if (deadlinePassed) {
      setErrorMsg("O prazo para confirmação terminou. Contacte a organizadora.");
      return;
    }

    if (!formData.phone.trim()) {
      setErrorMsg("Indique o telefone para contacto (WhatsApp).");
      return;
    }

    const isAttending = formData.attending === "yes";

    submitInFlightRef.current = true;
    setRsvpStatus("sending");
    setErrorMsg("");

    const controller = new AbortController();
    const timeoutId = window.setTimeout(
      () => controller.abort(),
      RSVP_FETCH_TIMEOUT_MS
    );
    let settled = false;

    try {
      const { outcome } = await submitUniversalRsvp(
        {
          name: formData.name,
          phone: formData.phone,
          email: formData.email || undefined,
          attending: isAttending,
          guests: isAttending ? 1 : 0,
          messageForBride: formData.messageForBride || undefined,
          size: formData.size || undefined,
          dressCodeConfirmed: isAttending
            ? formData.dressCodeConfirmed
            : undefined,
          honeypot: formData.honeypot,
          slug: config.slug,
        },
        controller.signal
      );
      const result: StoredRsvp = {
        name: formData.name,
        attending: isAttending,
      };

      if (
        outcome.kind === "success" ||
        outcome.kind === "persisted_partial"
      ) {
        persistLocalSuccess(result);
        settled = true;
        return;
      }

      setErrorMsg(outcome.message);
      setRsvpStatus("error");
      settled = true;
    } catch (err) {
      const isTimeout = err instanceof DOMException && err.name === "AbortError";
      setErrorMsg(
        isTimeout
          ? "O pedido demorou demasiado. Verifique a ligação e tente novamente."
          : err instanceof Error
            ? err.message
            : "Erro de ligação."
      );
      setRsvpStatus("error");
      settled = true;
    } finally {
      window.clearTimeout(timeoutId);
      submitInFlightRef.current = false;
      if (!settled) {
        setRsvpStatus((current) => resolveRsvpSubmitUiStateInFinally(current));
      }
    }
  };

  const activeSubmission = submitted ?? storedRsvp;

  const handleEditResponse = () => {
    const previousName = activeSubmission?.name ?? "";
    clearStoredRsvp(config.slug);
    setStoredRsvp(null);
    setSubmitted(null);
    setRsvpStatus("idle");
    setErrorMsg("");
    setFormData({
      name: previousName,
      phone: "",
      email: "",
      size: "",
      messageForBride: "",
      dressCodeConfirmed: false,
      attending: "yes",
      honeypot: "",
    });
  };

  const showSuccess = rsvpStatus === "success" && activeSubmission;

  if (!mounted) return null;

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={cinematicViewport}
      variants={cinematicStagger}
      className="relative w-full min-h-screen py-24 px-6 flex flex-col items-center z-10 border-t scroll-mt-6"
      style={{ borderColor: `${theme.colors.accent}12` }}
      id="rsvp"
    >
      <motion.span
        variants={cinematicRevealVariants}
        className={`${roseType.sectionLabel} mb-4 ${theme.palette.textSecondary}`}
      >
        Participação
      </motion.span>

      <motion.h2
        variants={cinematicRevealVariants}
        className={`${roseType.sectionTitle} mb-4 text-center ${theme.palette.textPrimary}`}
      >
        {rsvpCopy?.title ?? "Vens comigo?"}
      </motion.h2>

      <motion.p
        variants={cinematicRevealVariants}
        className={`${roseType.bodyPoetic} text-sm max-w-xl text-center mb-12 ${theme.palette.textSecondary} opacity-85`}
      >
        {rsvpCopy?.subtitle ??
          "Reserva o teu lugar nesta tarde só de mulheres"}
      </motion.p>

      <div className="flex flex-col gap-8 max-w-5xl w-full items-stretch">
        {/* Card — Gestos de Carinho (primeiro) */}
        <motion.div
          variants={cinematicRevealVariants}
          className="w-full scroll-mt-6"
          id="presentes"
        >
          <GiftRegistryPanel embedded />
        </motion.div>

        {/* Card — Confirmação de Presença */}
        <motion.div variants={cinematicRevealVariants} className="min-h-0 w-full">
          <RoseExperienceCard
            theme={theme}
            icon={<UserCheck size={16} strokeWidth={1.2} />}
            title="A tua confirmação"
            description={
              rsvpCopy?.deadlineLabel && !deadlinePassed
                ? `Confirme até ${rsvpCopy.deadlineLabel}.`
                : deadlinePassed && !showSuccess
                  ? "O prazo de confirmação terminou. Contacte a organizadora."
                  : undefined
            }
          >
            {showSuccess && activeSubmission ? (
              <RoseRsvpSuccessRitual
                submission={activeSubmission}
                whatsappUrl={whatsappUrl}
                theme={theme}
                config={config}
                dress={dress}
                location={location}
                compact
                onEditResponse={handleEditResponse}
              />
            ) : (
              <motion.form
                variants={variants.fadeUp}
                onSubmit={handleSubmit}
                className="relative space-y-6 flex-1 flex flex-col"
              >
            <input
              type="text"
              name="company_website"
              value={formData.honeypot}
              onChange={(e) => {
                setFormData((p) => ({ ...p, honeypot: e.target.value }));
                clearRsvpError();
              }}
              title="Leave blank"
              aria-hidden="true"
              className="absolute -left-[9999px] h-0 w-0 opacity-0 pointer-events-none"
              tabIndex={-1}
              autoComplete="off"
            />

            <div className="grid grid-cols-2 gap-3">
              {(["yes", "no"] as const).map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    setFormData((p) => ({ ...p, attending: val }));
                    clearRsvpError();
                  }}
                  disabled={deadlinePassed}
                  className="py-3.5 min-h-[48px] border font-body text-[11px] uppercase tracking-[0.18em] transition-all duration-500 cursor-pointer disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{
                    borderColor:
                      formData.attending === val
                        ? theme.colors.accent
                        : `${theme.colors.accent}20`,
                    color:
                      formData.attending === val
                        ? theme.colors.accent
                        : theme.palette.textSecondary,
                    backgroundColor:
                      formData.attending === val
                        ? `${theme.colors.accent}08`
                        : "transparent",
                  }}
                >
                  {val === "yes"
                    ? "Confirmar presença"
                    : "Não poderei comparecer"}
                </button>
              ))}
            </div>

            <div className="space-y-5">
              <input
                required
                value={formData.name}
                onChange={(e) => {
                  setFormData((p) => ({ ...p, name: e.target.value }));
                  clearRsvpError();
                }}
                placeholder="Nome completo"
                disabled={deadlinePassed}
                className={inputClass(theme)}
                style={{ borderColor: `${theme.colors.accent}30` }}
              />
              <input
                required
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, phone: e.target.value }))
                }
                placeholder="Telefone (WhatsApp)"
                disabled={deadlinePassed}
                className={inputClass(theme)}
                style={{ borderColor: `${theme.colors.accent}30` }}
              />
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, email: e.target.value }))
                }
                placeholder="Email (recomendado — confirmação por email)"
                disabled={deadlinePassed}
                className={inputClass(theme)}
                style={{ borderColor: `${theme.colors.accent}30` }}
              />

              {formData.attending === "yes" && (
                <>
                  <div className="space-y-2">
                    <label
                      htmlFor="rsvp-size"
                      className={`font-display italic text-[11px] tracking-[0.06em] ${theme.palette.textSecondary} opacity-75`}
                    >
                      O teu tamanho (opcional)
                    </label>
                    <p
                      className={`font-display italic text-[11px] leading-relaxed ${theme.palette.textSecondary} opacity-75 -mt-1`}
                    >
                      Para a lingerie que trouxeres — consulta as medidas da
                      Jessica por peça no guia acima.
                    </p>
                    <select
                      id="rsvp-size"
                      value={formData.size}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, size: e.target.value }))
                      }
                      disabled={deadlinePassed}
                      className={`${inputClass(theme)} cursor-pointer`}
                      style={{ borderColor: `${theme.colors.accent}30` }}
                    >
                      {SIZE_OPTIONS.map((opt) => (
                        <option key={opt || "empty"} value={opt}>
                          {opt || "Seleccionar tamanho"}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="rsvp-message"
                      className={`text-[10px] uppercase tracking-[0.22em] ${theme.palette.textPrimary} opacity-80`}
                    >
                      Deixe um carinho para a Jessica (opcional)
                    </label>
                    <textarea
                      id="rsvp-message"
                      value={formData.messageForBride}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          messageForBride: e.target.value.slice(0, 280),
                        }))
                      }
                      disabled={deadlinePassed}
                      rows={3}
                      placeholder="Uma palavra, desejo ou memória partilhada..."
                      className={`${inputClass(theme)} resize-none border rounded-sm px-3 py-3`}
                      style={{ borderColor: `${theme.colors.accent}20` }}
                    />
                    <span className={`text-[9px] opacity-55 block text-right ${theme.palette.textSecondary}`}>
                      {formData.messageForBride.length}/280
                    </span>
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formData.dressCodeConfirmed}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          dressCodeConfirmed: e.target.checked,
                        }))
                      }
                      disabled={deadlinePassed}
                      className="mt-1 accent-[#C59E66]"
                    />
                    <span
                      className={`text-[11px] leading-relaxed font-normal ${theme.palette.textPrimary} group-hover:opacity-90`}
                    >
                      Confirmo cumprir o dress code:{" "}
                      <strong className="font-medium">
                        pelo menos uma peça rosa
                      </strong>
                      .
                    </span>
                  </label>
                </>
              )}
            </div>

            {errorMsg && (
              <p className="text-xs text-[#B83256] font-medium leading-relaxed">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={rsvpStatus === "sending" || deadlinePassed}
              className="w-full min-h-[48px] py-4 font-body text-[11px] uppercase tracking-[0.28em] font-medium border rounded-full transition-all duration-700 cursor-pointer flex items-center justify-center gap-3 hover:text-white group relative isolate overflow-hidden touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{
                borderColor: theme.colors.accent,
                color: theme.colors.accent,
              }}
            >
              <span
                className="absolute inset-0 z-0 scale-x-0 group-hover:scale-x-100 transition-transform duration-600 origin-left rounded-full"
                style={{ backgroundColor: theme.colors.accent }}
                aria-hidden
              />
              <span className="relative z-10 flex items-center justify-center gap-3 group-hover:text-white transition-colors duration-500">
                <Send size={11} />
                {rsvpStatus === "sending"
                  ? "A enviar..."
                  : rsvpStatus === "error"
                    ? "Tentar novamente"
                    : "Enviar confirmação"}
              </span>
            </button>
              </motion.form>
            )}

            <p
              className={`text-[10px] uppercase tracking-[0.22em] mt-auto pt-8 text-center ${theme.palette.textSecondary} opacity-60`}
            >
              {theme.copy.rsvpClosing}
            </p>
          </RoseExperienceCard>
        </motion.div>
      </div>
    </motion.section>
  );
}

function RoseRsvpSuccessRitual({
  submission,
  whatsappUrl,
  theme,
  config,
  dress,
  location,
  compact = false,
  onEditResponse,
}: {
  submission: StoredRsvp;
  whatsappUrl: string | null;
  theme: ReturnType<typeof useExperience>["theme"];
  config: ReturnType<typeof useExperience>["config"];
  dress: ReturnType<typeof useExperience>["theme"]["copy"]["dressCode"];
  location: ReturnType<typeof useExperience>["theme"]["copy"]["location"];
  compact?: boolean;
  onEditResponse?: () => void;
}) {
  if (!submission.attending) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.4, ease: EASE_APPLE }}
        className="text-center py-10 space-y-5"
      >
        <div
          className="w-16 h-16 rounded-full border mx-auto flex items-center justify-center"
          style={{ borderColor: `${theme.colors.accent}55` }}
        >
          <span
            className="font-display italic text-lg"
            style={{ color: theme.colors.accent }}
          >
            ✓
          </span>
        </div>
        <h3
          className={`font-display text-xl font-light tracking-wide ${theme.palette.textPrimary}`}
        >
          Resposta registada
        </h3>
        <p
          className={`font-body text-sm leading-relaxed ${theme.palette.textSecondary} opacity-85 max-w-sm mx-auto`}
        >
          Sentiremos a sua falta — obrigada por avisar com carinho,{" "}
          <span className="italic">{submission.name}</span>.
        </p>
        {onEditResponse && (
          <button
            type="button"
            onClick={onEditResponse}
            className="mt-6 w-full py-3 border rounded-full font-body text-[9px] uppercase tracking-[0.22em] transition-all duration-500 cursor-pointer hover:opacity-90"
            style={{
              borderColor: `${theme.colors.accent}35`,
              color: theme.colors.accent,
            }}
          >
            Alterar a minha resposta
          </button>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.4, ease: EASE_APPLE }}
      className={`space-y-6 ${compact ? "py-2" : "py-6"}`}
    >
      <div className="text-center space-y-4">
        <div
          className="w-16 h-16 rounded-full border mx-auto flex items-center justify-center"
          style={{ borderColor: `${theme.colors.accent}55` }}
        >
          <span
            className="font-display italic text-lg"
            style={{ color: theme.colors.accent }}
          >
            ✓
          </span>
        </div>
        <h3
          className={`font-display text-xl font-light tracking-wide ${theme.palette.textPrimary}`}
        >
          Estamos à sua espera
        </h3>
        <p
          className={`font-body text-xs tracking-widest uppercase ${theme.palette.textSecondary} opacity-60`}
        >
          {submission.name}
        </p>
      </div>

      <div
        className={`space-y-4 p-6 border rounded-sm ${theme.palette.cardBg}`}
        style={{ borderColor: `${theme.colors.accent}18` }}
      >
        <div className="flex items-start gap-3">
          <Calendar size={14} className="mt-0.5 shrink-0" style={{ color: theme.colors.accent }} />
          <div>
            <span className="text-[8px] uppercase tracking-widest opacity-50 block mb-1">
              Data
            </span>
            <span className={`text-sm font-light ${theme.palette.textPrimary}`}>
              {formatEventDate(config.metadata.date)}
            </span>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Clock size={14} className="mt-0.5 shrink-0" style={{ color: theme.colors.accent }} />
          <div>
            <span className="text-[8px] uppercase tracking-widest opacity-50 block mb-1">
              Horário
            </span>
            <span className={`text-sm font-light ${theme.palette.textPrimary}`}>
              {config.metadata.time}
            </span>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <MapPin size={14} className="mt-0.5 shrink-0" style={{ color: theme.colors.accent }} />
          <div>
            <span className="text-[8px] uppercase tracking-widest opacity-50 block mb-1">
              Local
            </span>
            <span className={`text-sm font-light ${theme.palette.textPrimary}`}>
              {config.metadata.location}
            </span>
          </div>
        </div>
      </div>

      {dress && (
        <div
          className="flex items-start gap-3 p-5 border rounded-sm"
          style={{
            borderColor: `${theme.colors.secondary}30`,
            backgroundColor: `${theme.colors.secondary}08`,
          }}
        >
          <Shirt size={16} className="shrink-0 mt-0.5" style={{ color: theme.colors.accent }} />
          <div>
            <span className="text-[9px] uppercase tracking-widest font-semibold opacity-60 block mb-1">
              Dress Code · Obrigatório
            </span>
            <p className={`text-xs leading-relaxed ${theme.palette.textPrimary}`}>
              <strong>{dress.title}</strong>
            </p>
            <p
              className={`text-[11px] leading-relaxed mt-2 ${theme.palette.textSecondary} opacity-85`}
            >
              {dress.description}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <a
          href={location.externalMapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-3.5 border text-[9px] uppercase tracking-[0.22em] font-medium transition-all hover:opacity-90"
          style={{
            borderColor: theme.colors.accent,
            color: theme.colors.accent,
            backgroundColor: `${theme.colors.accent}08`,
          }}
        >
          <Navigation size={12} />
          Abrir no Google Maps
        </a>
        <button
          type="button"
          onClick={downloadFarewellIcsFile}
          className="flex items-center justify-center gap-2 py-3.5 border text-[9px] uppercase tracking-[0.22em] font-medium transition-all hover:opacity-90 cursor-pointer"
          style={{
            borderColor: theme.colors.accent,
            color: theme.colors.accent,
          }}
        >
          <Calendar size={12} />
          Adicionar ao calendário
        </button>
      </div>

      <a
        href={buildFarewellGoogleCalendarUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className={`block text-center text-[9px] uppercase tracking-[0.2em] opacity-50 hover:opacity-80 transition-opacity ${theme.palette.textSecondary}`}
      >
        Ou abrir no Google Calendar
      </a>

      {whatsappUrl && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3.5 text-[9px] uppercase tracking-[0.22em] font-medium text-white transition-all hover:opacity-90"
          style={{ backgroundColor: "#25D366" }}
        >
          <MessageCircle size={14} />
          Dúvidas via WhatsApp
        </a>
      )}

      {onEditResponse && (
        <div className="pt-2 space-y-2 text-center">
          <p
            className={`text-[10px] leading-relaxed ${theme.palette.textSecondary} opacity-55`}
          >
            Precisas de corrigir algo? Podes voltar ao formulário.
          </p>
          <button
            type="button"
            onClick={onEditResponse}
            className="w-full py-3 border rounded-full font-body text-[9px] uppercase tracking-[0.22em] transition-all duration-500 cursor-pointer hover:opacity-90"
            style={{
              borderColor: `${theme.colors.accent}35`,
              color: theme.colors.accent,
            }}
          >
            Alterar a minha resposta
          </button>
        </div>
      )}
    </motion.div>
  );
}
