"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  resolveRsvpSubmitUiStateInFinally,
} from "@lib/rsvp/client-outcome";
import { submitUniversalRsvp } from "@lib/rsvp/universal-client";
import {
  WEDDING_COPY,
  WEDDING_COUPLE,
  WEDDING_EVENT,
  WEDDING_ITINERARY_SCHEDULE_CONFIRMED,
  WEDDING_VENUE,
  buildWeddingGoogleCalendarUrl,
  downloadWeddingIcsFile,
  formatWeddingEventDate,
} from "@lib/jessica-samuel-wedding/event-details";
import {
  WEDDING_RSVP_MAX_COMPANIONS,
  WEDDING_RSVP_MESSAGE_LIMIT,
  buildCompanionNote,
  clearLocalPreviousRsvpResponse,
  daysUntilWedding,
  formatDaysUntilLabel,
  isWeddingRsvpSafePreviewEnabled,
  mapRsvpHttpError,
  nextPhaseAfterPresence,
  packWeddingRsvpMessage,
  progressStepIndex,
  readLocalPreviousRsvpResponse,
  validateWeddingRsvpContact,
  writeLocalPreviousRsvpResponse,
  type RitualPhase,
} from "@lib/jessica-samuel-wedding/rsvp-ritual";
import { useExperience } from "../../context";
import { jsType } from "./jessica-samuel-typography";
import { JS_LAYOUT, JS_SECTION_BG, JS_SURFACES } from "./jessica-samuel-surfaces";

const RSVP_FETCH_TIMEOUT_MS = 30_000;

type FormState = {
  name: string;
  email: string;
  phone: string;
  attending: "" | "yes" | "no";
  companions: number;
  companionNames: string[];
  dietary: string;
  accessibility: string;
  other: string;
  personalMessage: string;
  honeypot: string;
};

const initialForm: FormState = {
  name: "",
  email: "",
  phone: "",
  attending: "",
  companions: 0,
  companionNames: [],
  dietary: "",
  accessibility: "",
  other: "",
  personalMessage: "",
  honeypot: "",
};

const EASE = [0.22, 1, 0.36, 1] as const;

function StepShell({
  children,
  keyId,
  reduceMotion,
}: {
  children: React.ReactNode;
  keyId: string;
  reduceMotion: boolean | null;
}) {
  return (
    <motion.div
      key={keyId}
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0, y: -10 }}
      transition={{ duration: reduceMotion ? 0 : 0.45, ease: EASE }}
      className="js-rsvp-ritual__step"
    >
      {children}
    </motion.div>
  );
}

function ProgressRail({ phase }: { phase: RitualPhase }) {
  const step = progressStepIndex(phase);
  if (!step) return null;

  const labels = [
    { n: 1, label: "Presença" },
    { n: 2, label: "Convidados" },
    { n: 3, label: "Detalhes" },
    { n: 4, label: "Confirmado" },
  ] as const;

  return (
    <div className="js-rsvp-ritual__progress" aria-hidden={false}>
      <p className="js-rsvp-ritual__progress-mobile">
        <span>{String(step).padStart(2, "0")}</span>
        <span className="js-rsvp-ritual__progress-bar" aria-hidden>
          <span
            className="js-rsvp-ritual__progress-bar-fill"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </span>
      </p>
      <ol className="js-rsvp-ritual__progress-desktop">
        {labels.map((item) => (
          <li
            key={item.n}
            className={
              item.n === step
                ? "js-rsvp-ritual__progress-item is-active"
                : item.n < step
                  ? "js-rsvp-ritual__progress-item is-done"
                  : "js-rsvp-ritual__progress-item"
            }
          >
            <span>{String(item.n).padStart(2, "0")}</span>
            <span>{item.label}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function MonogramMark({ animateOnce }: { animateOnce?: boolean }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.p
      className="js-rsvp-ritual__monogram"
      initial={animateOnce && !reduceMotion ? { opacity: 0, scale: 0.92 } : false}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, ease: EASE }}
      aria-hidden
    >
      J&amp;S
    </motion.p>
  );
}

function PrimaryButton({
  children,
  onClick,
  type = "button",
  disabled,
  fullWidth,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  fullWidth?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`js-rsvp-ritual__btn-primary${fullWidth ? " is-full" : ""}`}
    >
      {children}
    </button>
  );
}

function GhostButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="js-rsvp-ritual__btn-ghost"
    >
      {children}
    </button>
  );
}

/** Contador da mensagem empacotada (preferências + prefixos + mensagem). */
function MessagePackMeter({
  length,
  remaining,
  ok,
  error,
}: {
  length: number;
  remaining: number;
  ok: boolean;
  error?: string;
}) {
  if (length === 0 && ok) return null;

  return (
    <div className="js-rsvp-ritual__pack-meter" aria-live="polite">
      <p
        className={`js-rsvp-ritual__pack-count${!ok ? " is-over" : ""}`}
      >
        {ok
          ? remaining === 0
            ? `Limite atingido (${WEDDING_RSVP_MESSAGE_LIMIT} caracteres).`
            : `${remaining} caracteres restantes (mensagem combinada).`
          : error}
      </p>
      {!ok ? (
        <p className="js-rsvp-ritual__pack-hint">
          Inclui preferências, acessibilidade, mensagem e separadores internos.
          Reduza o texto antes de enviar.
        </p>
      ) : null}
    </div>
  );
}

export function JessicaSamuelRSVPSection() {
  const { theme, config } = useExperience();
  const reduceMotion = useReducedMotion();
  const formId = useId();
  const stepTitleRef = useRef<HTMLHeadingElement | null>(null);
  const [phase, setPhase] = useState<RitualPhase>("welcome");
  const [form, setForm] = useState<FormState>(initialForm);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewOutcome, setPreviewOutcome] = useState<"success" | "error">(
    "success"
  );
  const submittingRef = useRef(false);

  const calendarUrl = buildWeddingGoogleCalendarUrl();
  const daysLeft = daysUntilWedding(WEDDING_EVENT.dateIso);
  const deadline = theme.copy.rsvp?.deadlineLabel;

  const messagePack = packWeddingRsvpMessage({
    companionNote:
      form.attending === "yes"
        ? buildCompanionNote(form.companions, form.companionNames)
        : undefined,
    preferences:
      form.attending === "yes"
        ? {
            dietary: form.dietary,
            accessibility: form.accessibility,
            other: form.other,
          }
        : undefined,
    personalMessage: form.personalMessage,
  });

  useEffect(() => {
    const preview = isWeddingRsvpSafePreviewEnabled();
    setPreviewMode(preview);
    if (!preview) {
      const stored = readLocalPreviousRsvpResponse(config.slug);
      if (stored) {
        setForm((prev) => ({ ...prev, name: stored.name }));
        setPhase("already");
      }
    }
    setHydrated(true);
  }, [config.slug]);

  useEffect(() => {
    if (!hydrated) return;
    const node = stepTitleRef.current;
    if (node) {
      node.focus({ preventScroll: false });
    }
  }, [phase, hydrated]);

  const guestDisplayName = form.name.trim() || "Convidado";

  const goPresence = () => {
    if (!form.name.trim()) {
      setErrorMessage("Indique o seu nome para iniciar a confirmação.");
      return;
    }
    setErrorMessage("");
    setPhase("presence");
  };

  const selectAttendance = (value: "yes" | "no") => {
    setForm((p) => ({
      ...p,
      attending: value,
      companions: value === "no" ? 0 : p.companions,
      companionNames: value === "no" ? [] : p.companionNames,
    }));
    setErrorMessage("");
    setPhase(nextPhaseAfterPresence(value));
  };

  const continueFromGuests = () => {
    setErrorMessage("");
    setPhase("details");
  };

  const continueFromDetails = () => {
    const contact = validateWeddingRsvpContact({
      email: form.email,
      phone: form.phone,
      requireContact: true,
    });
    if (!contact.ok) {
      setErrorMessage(contact.error);
      return;
    }
    if (!messagePack.ok) {
      setErrorMessage(messagePack.error);
      return;
    }
    setErrorMessage("");
    setPhase("review");
  };

  const submitRsvp = async () => {
    if (submittingRef.current || phase === "sending") return;

    const isAttending = form.attending === "yes";
    if (!form.name.trim() || !form.attending) {
      setErrorMessage("Complete a confirmação antes de enviar.");
      setPhase("presence");
      return;
    }

    const contact = validateWeddingRsvpContact({
      email: form.email,
      phone: form.phone,
      requireContact: true,
    });
    if (!contact.ok) {
      setErrorMessage(contact.error);
      setPhase(isAttending ? "details" : "absence-message");
      return;
    }

    if (!messagePack.ok) {
      setErrorMessage(messagePack.error);
      setPhase(isAttending ? "review" : "absence-message");
      return;
    }

    submittingRef.current = true;
    setPhase("sending");
    setErrorMessage("");
    setStatusMessage("A reservar o seu lugar…");

    const companions = isAttending ? form.companions : 0;
    const guests = isAttending ? 1 + companions : 0;

    /* Preview seguro: percorre UI sem POST /api/rsvp (apenas fora de produção). */
    if (previewMode) {
      await new Promise((r) => setTimeout(r, 600));
      if (previewOutcome === "error") {
        setErrorMessage("Pré-visualização: erro simulado (sem escrita na API).");
        setStatusMessage("");
        setPhase("error");
        submittingRef.current = false;
        return;
      }
      setStatusMessage("Pré-visualização: sucesso simulado (sem escrita na API).");
      setPhase(isAttending ? "success-attending" : "success-absent");
      submittingRef.current = false;
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), RSVP_FETCH_TIMEOUT_MS);

    try {
      const { response, outcome } = await submitUniversalRsvp(
        {
          name: form.name.trim(),
          email: contact.email,
          phone: contact.phone,
          attending: isAttending,
          guests,
          messageForBride: messagePack.value,
          honeypot: form.honeypot,
          slug: config.slug,
        },
        controller.signal
      );

      if (
        outcome.kind === "success" ||
        outcome.kind === "persisted_partial"
      ) {
        /* Detecção local de resposta anterior — não é idempotência de servidor. */
        writeLocalPreviousRsvpResponse(config.slug, {
          name: form.name.trim(),
          attending: isAttending,
        });
        setStatusMessage(
          isAttending ? "Está confirmado." : "Resposta recebida com carinho."
        );
        setPhase(isAttending ? "success-attending" : "success-absent");
        return;
      }

      setErrorMessage(mapRsvpHttpError(response.status, outcome.message));
      setStatusMessage("");
      setPhase("error");
    } catch (err) {
      setErrorMessage(
        err instanceof Error && err.name === "AbortError"
          ? "O pedido demorou demasiado. Tente novamente."
          : "Falha de rede. Verifique a ligação e tente novamente."
      );
      setStatusMessage("");
      setPhase("error");
    } finally {
      clearTimeout(timeout);
      submittingRef.current = false;
      setPhase((prev) => {
        if (prev === "sending") {
          const mapped = resolveRsvpSubmitUiStateInFinally("sending");
          return mapped === "idle"
            ? isAttending
              ? "review"
              : "absence-message"
            : prev;
        }
        return prev;
      });
    }
  };

  const continueFromAbsence = () => {
    const contact = validateWeddingRsvpContact({
      email: form.email,
      phone: form.phone,
      requireContact: true,
    });
    if (!contact.ok) {
      setErrorMessage(contact.error);
      return;
    }
    if (!messagePack.ok) {
      setErrorMessage(messagePack.error);
      return;
    }
    setErrorMessage("");
    void submitRsvp();
  };

  const resetToEdit = () => {
    setErrorMessage("");
    setStatusMessage("");
    if (form.attending === "no") {
      setPhase("absence-message");
      return;
    }
    setPhase("review");
  };

  const startOver = () => {
    clearLocalPreviousRsvpResponse(config.slug);
    setForm(initialForm);
    setErrorMessage("");
    setStatusMessage("");
    setPhase("welcome");
  };

  const scrollToInvite = () => {
    document.getElementById("hero")?.scrollIntoView({ behavior: "smooth" });
  };

  const fieldStyle = {
    color: JS_SURFACES.ink,
    borderColor: JS_SURFACES.champagneDeep,
    backgroundColor: JS_SURFACES.ivory,
  } as const;

  const titleProps = {
    ref: stepTitleRef,
    tabIndex: -1,
    className: "js-rsvp-ritual__title",
  } as const;

  if (!hydrated) {
    return (
      <section
        id="rsvp"
        className={`${JS_LAYOUT.section} py-20 md:py-28`}
        style={{ backgroundColor: JS_SECTION_BG.accent }}
        aria-busy="true"
      >
        <div className={`${JS_LAYOUT.containerNarrow} text-center`}>
          <p className={jsType.micro} style={{ color: JS_SURFACES.champagne }}>
            A preparar a sua confirmação…
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      id="rsvp"
      className={`js-rsvp-ritual ${JS_LAYOUT.section} py-16 md:py-24`}
      style={{ backgroundColor: JS_SECTION_BG.accent }}
      aria-labelledby={`${formId}-title`}
    >
      <div className={`${JS_LAYOUT.containerNarrow} relative`}>
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

        {previewMode ? (
          <div className="js-rsvp-ritual__preview-banner" role="status">
            <p>
              Modo pré-visualização seguro — percorre o fluxo sem chamar{" "}
              <code>POST /api/rsvp</code> e sem gravar na base de dados.
            </p>
            <div className="js-rsvp-ritual__preview-toggle" role="group" aria-label="Simular resultado">
              <button
                type="button"
                className={`js-rsvp-ritual__pill${
                  previewOutcome === "success" ? " is-selected" : ""
                }`}
                onClick={() => setPreviewOutcome("success")}
                aria-pressed={previewOutcome === "success"}
              >
                Simular sucesso
              </button>
              <button
                type="button"
                className={`js-rsvp-ritual__pill${
                  previewOutcome === "error" ? " is-selected" : ""
                }`}
                onClick={() => setPreviewOutcome("error")}
                aria-pressed={previewOutcome === "error"}
              >
                Simular erro
              </button>
            </div>
          </div>
        ) : null}

        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {statusMessage}
          {errorMessage}
        </div>

        <ProgressRail phase={phase} />

        <AnimatePresence mode="wait">
          {phase === "welcome" ? (
            <StepShell keyId="welcome" reduceMotion={reduceMotion}>
              <div className="js-rsvp-ritual__panel js-rsvp-ritual__panel--welcome text-center">
                <MonogramMark animateOnce />
                <h2
                  id={`${formId}-title`}
                  {...titleProps}
                >
                  {WEDDING_COUPLE.brideFirst} &amp; {WEDDING_COUPLE.groomFirst}{" "}
                  reservaram este momento para si.
                </h2>
                <p className="js-rsvp-ritual__lead">
                  Confirme a sua presença e faça parte desta celebração.
                </p>
                {deadline ? (
                  <p className="js-rsvp-ritual__meta">Até {deadline}</p>
                ) : null}

                <label className="js-rsvp-ritual__field block text-left mt-8">
                  <span className="js-rsvp-ritual__label">O seu nome</span>
                  <input
                    required
                    name="name"
                    value={form.name}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, name: e.target.value }))
                    }
                    maxLength={120}
                    autoComplete="name"
                    className="js-rsvp-ritual__input"
                    style={fieldStyle}
                    placeholder="Nome completo"
                  />
                </label>
                {form.name.trim() ? (
                  <p className="js-rsvp-ritual__personal mt-4">
                    {form.name.trim()}, este convite foi preparado especialmente
                    para si.
                  </p>
                ) : null}

                {errorMessage ? (
                  <p className="js-rsvp-ritual__error" role="alert">
                    {errorMessage}
                  </p>
                ) : null}

                <div className="mt-8">
                  <PrimaryButton onClick={goPresence} fullWidth>
                    Iniciar confirmação
                  </PrimaryButton>
                </div>
              </div>
            </StepShell>
          ) : null}

          {phase === "presence" ? (
            <StepShell keyId="presence" reduceMotion={reduceMotion}>
              <div className="js-rsvp-ritual__panel text-center">
                <MonogramMark />
                <h2 {...titleProps}>
                  Podemos contar consigo?
                </h2>
                <p className="js-rsvp-ritual__lead">
                  O seu lugar faz parte desta história.
                </p>

                <div className="js-rsvp-ritual__choice-grid mt-8">
                  <button
                    type="button"
                    className={`js-rsvp-ritual__choice${
                      form.attending === "yes" ? " is-selected" : ""
                    }`}
                    onClick={() => selectAttendance("yes")}
                    aria-pressed={form.attending === "yes"}
                  >
                    <span className="js-rsvp-ritual__choice-mark" aria-hidden>
                      ✓
                    </span>
                    Sim, estarei presente
                  </button>
                  <button
                    type="button"
                    className={`js-rsvp-ritual__choice${
                      form.attending === "no" ? " is-selected is-soft" : ""
                    }`}
                    onClick={() => selectAttendance("no")}
                    aria-pressed={form.attending === "no"}
                  >
                    Infelizmente, não poderei estar
                  </button>
                </div>

                <div className="mt-8">
                  <GhostButton onClick={() => setPhase("welcome")}>
                    Voltar
                  </GhostButton>
                </div>
              </div>
            </StepShell>
          ) : null}

          {phase === "guests" ? (
            <StepShell keyId="guests" reduceMotion={reduceMotion}>
              <div className="js-rsvp-ritual__panel">
                <h2 {...titleProps} className="js-rsvp-ritual__title text-center">
                  Quem celebrará connosco?
                </h2>
                <p className="js-rsvp-ritual__lead text-center">
                  O seu convite inclui até {1 + WEDDING_RSVP_MAX_COMPANIONS}{" "}
                  lugares.
                </p>

                <div className="js-rsvp-ritual__seat-list mt-8">
                  <div className="js-rsvp-ritual__seat is-locked">
                    <span className="js-rsvp-ritual__seat-check" aria-hidden>
                      ✓
                    </span>
                    <div>
                      <p className="js-rsvp-ritual__seat-name">
                        {guestDisplayName}
                      </p>
                      <p className="js-rsvp-ritual__seat-meta">
                        Titular do convite
                      </p>
                    </div>
                  </div>

                  <p className="js-rsvp-ritual__label mt-6 mb-3">
                    Acompanhantes (opcional)
                  </p>
                  <div className="js-rsvp-ritual__companion-pills" role="group">
                    {Array.from(
                      { length: WEDDING_RSVP_MAX_COMPANIONS + 1 },
                      (_, i) => (
                        <button
                          key={i}
                          type="button"
                          className={`js-rsvp-ritual__pill${
                            form.companions === i ? " is-selected" : ""
                          }`}
                          onClick={() =>
                            setForm((p) => ({
                              ...p,
                              companions: i,
                              companionNames: Array.from(
                                { length: i },
                                (_, idx) => p.companionNames[idx] ?? ""
                              ),
                            }))
                          }
                          aria-pressed={form.companions === i}
                        >
                          {i === 0 ? "Só eu" : `+${i}`}
                        </button>
                      )
                    )}
                  </div>

                  {form.companionNames.map((name, index) => (
                    <label key={index} className="js-rsvp-ritual__field mt-4 block">
                      <span className="js-rsvp-ritual__label">
                        Nome do acompanhante {index + 1}
                      </span>
                      <input
                        value={name}
                        onChange={(e) => {
                          const next = [...form.companionNames];
                          next[index] = e.target.value;
                          setForm((p) => ({ ...p, companionNames: next }));
                        }}
                        className="js-rsvp-ritual__input"
                        style={fieldStyle}
                        placeholder="Nome completo"
                      />
                    </label>
                  ))}
                </div>

                <div className="js-rsvp-ritual__actions mt-8">
                  <PrimaryButton onClick={continueFromGuests} fullWidth>
                    Continuar
                  </PrimaryButton>
                  <GhostButton onClick={() => setPhase("presence")}>
                    Voltar
                  </GhostButton>
                </div>
              </div>
            </StepShell>
          ) : null}

          {phase === "details" ? (
            <StepShell keyId="details" reduceMotion={reduceMotion}>
              <div className="js-rsvp-ritual__panel">
                <h2 {...titleProps} className="js-rsvp-ritual__title text-center">
                  Como podemos recebê-lo melhor?
                </h2>
                <p className="js-rsvp-ritual__lead text-center">
                  Esta informação é opcional — excepto o contacto para a
                  confirmação.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                  <label className="js-rsvp-ritual__field block">
                    <span className="js-rsvp-ritual__label">Email</span>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, email: e.target.value }))
                      }
                      className="js-rsvp-ritual__input"
                      style={fieldStyle}
                      autoComplete="email"
                      inputMode="email"
                    />
                  </label>
                  <label className="js-rsvp-ritual__field block">
                    <span className="js-rsvp-ritual__label">
                      Telefone (+258)
                    </span>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, phone: e.target.value }))
                      }
                      className="js-rsvp-ritual__input"
                      style={fieldStyle}
                      autoComplete="tel"
                      inputMode="tel"
                      placeholder="84 123 4567"
                      aria-describedby={`${formId}-phone-hint`}
                    />
                    <span
                      id={`${formId}-phone-hint`}
                      className="js-rsvp-ritual__field-hint"
                    >
                      Formato moçambicano; o indicativo +258 é preservado no
                      envio.
                    </span>
                  </label>
                </div>

                <label className="js-rsvp-ritual__field block mt-5">
                  <span className="js-rsvp-ritual__label">
                    Restrições alimentares
                  </span>
                  <input
                    value={form.dietary}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, dietary: e.target.value }))
                    }
                    className="js-rsvp-ritual__input"
                    style={fieldStyle}
                    placeholder="Ex.: vegetariano, alergias…"
                  />
                </label>
                <label className="js-rsvp-ritual__field block mt-4">
                  <span className="js-rsvp-ritual__label">
                    Necessidades de acessibilidade
                  </span>
                  <input
                    value={form.accessibility}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, accessibility: e.target.value }))
                    }
                    className="js-rsvp-ritual__input"
                    style={fieldStyle}
                  />
                </label>
                <label className="js-rsvp-ritual__field block mt-4">
                  <span className="js-rsvp-ritual__label">
                    Outra informação importante
                  </span>
                  <input
                    value={form.other}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, other: e.target.value }))
                    }
                    className="js-rsvp-ritual__input"
                    style={fieldStyle}
                  />
                </label>

                <div className="js-rsvp-ritual__divider" aria-hidden />

                <h3 className="js-rsvp-ritual__subtitle text-center">
                  Uma palavra para {WEDDING_COUPLE.brideFirst} &amp;{" "}
                  {WEDDING_COUPLE.groomFirst}
                </h3>
                <p className="js-rsvp-ritual__lead text-center">
                  Se desejar, deixe uma mensagem que os noivos poderão guardar.
                </p>
                <label className="js-rsvp-ritual__field block mt-4">
                  <span className="sr-only">Mensagem aos noivos</span>
                  <textarea
                    value={form.personalMessage}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        personalMessage: e.target.value,
                      }))
                    }
                    rows={4}
                    className="js-rsvp-ritual__input js-rsvp-ritual__textarea"
                    style={fieldStyle}
                    placeholder="Que esta nova caminhada seja repleta de amor…"
                    aria-invalid={!messagePack.ok}
                    aria-describedby={`${formId}-pack-meter`}
                  />
                </label>
                <div id={`${formId}-pack-meter`}>
                  <MessagePackMeter
                    length={messagePack.length}
                    remaining={messagePack.remaining}
                    ok={messagePack.ok}
                    error={!messagePack.ok ? messagePack.error : undefined}
                  />
                </div>

                {errorMessage ? (
                  <p className="js-rsvp-ritual__error" role="alert">
                    {errorMessage}
                  </p>
                ) : null}

                <div className="js-rsvp-ritual__actions mt-8">
                  <PrimaryButton
                    onClick={continueFromDetails}
                    fullWidth
                    disabled={!messagePack.ok}
                  >
                    Rever confirmação
                  </PrimaryButton>
                  <GhostButton
                    onClick={() =>
                      setPhase(form.companions === 0 ? "presence" : "guests")
                    }
                  >
                    Voltar
                  </GhostButton>
                </div>
              </div>
            </StepShell>
          ) : null}

          {phase === "review" ? (
            <StepShell keyId="review" reduceMotion={reduceMotion}>
              <div className="js-rsvp-ritual__panel">
                <h2 {...titleProps} className="js-rsvp-ritual__title text-center">
                  Confirme o seu lugar
                </h2>
                <ul className="js-rsvp-ritual__summary mt-8">
                  <li>
                    <span>Nome</span>
                    <strong>{guestDisplayName}</strong>
                  </li>
                  <li>
                    <span>Presença</span>
                    <strong>Sim, estarei presente</strong>
                  </li>
                  <li>
                    <span>Lugares</span>
                    <strong>
                      {1 + form.companions}
                      {form.companionNames.some((n) => n.trim())
                        ? ` · ${[
                            guestDisplayName,
                            ...form.companionNames
                              .map((n) => n.trim())
                              .filter(Boolean),
                          ].join(", ")}`
                        : form.companions > 0
                          ? ` · ${form.companions} acompanhante(s)`
                          : " · só o titular"}
                    </strong>
                  </li>
                  {(form.dietary || form.accessibility || form.other) && (
                    <li>
                      <span>Preferências</span>
                      <strong>
                        {[
                          form.dietary && `Alimentação: ${form.dietary}`,
                          form.accessibility &&
                            `Acessibilidade: ${form.accessibility}`,
                          form.other && form.other,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </strong>
                    </li>
                  )}
                  {form.personalMessage.trim() ? (
                    <li>
                      <span>Mensagem</span>
                      <strong>{form.personalMessage.trim()}</strong>
                    </li>
                  ) : null}
                  {(form.email.trim() || form.phone.trim()) && (
                    <li>
                      <span>Contacto</span>
                      <strong>
                        {[form.email.trim(), form.phone.trim()]
                          .filter(Boolean)
                          .join(" · ")}
                      </strong>
                    </li>
                  )}
                </ul>

                <MessagePackMeter
                  length={messagePack.length}
                  remaining={messagePack.remaining}
                  ok={messagePack.ok}
                  error={!messagePack.ok ? messagePack.error : undefined}
                />

                {errorMessage ? (
                  <p className="js-rsvp-ritual__error" role="alert">
                    {errorMessage}
                  </p>
                ) : null}

                <div className="js-rsvp-ritual__actions mt-8">
                  <PrimaryButton
                    onClick={() => void submitRsvp()}
                    fullWidth
                    disabled={!messagePack.ok}
                  >
                    Confirmar o meu lugar
                  </PrimaryButton>
                  <GhostButton onClick={() => setPhase("details")}>
                    Voltar e corrigir
                  </GhostButton>
                </div>
              </div>
            </StepShell>
          ) : null}

          {phase === "absence-message" ? (
            <StepShell keyId="absence" reduceMotion={reduceMotion}>
              <div className="js-rsvp-ritual__panel text-center">
                <h2 {...titleProps}>
                  Sentiremos a sua falta.
                </h2>
                <p className="js-rsvp-ritual__lead">
                  Agradecemos por nos informar. Indique um contacto e, se
                  desejar, deixe uma mensagem para {WEDDING_COUPLE.brideFirst}{" "}
                  &amp; {WEDDING_COUPLE.groomFirst}.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 text-left">
                  <label className="js-rsvp-ritual__field block">
                    <span className="js-rsvp-ritual__label">Email</span>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, email: e.target.value }))
                      }
                      className="js-rsvp-ritual__input"
                      style={fieldStyle}
                      autoComplete="email"
                      inputMode="email"
                    />
                  </label>
                  <label className="js-rsvp-ritual__field block">
                    <span className="js-rsvp-ritual__label">
                      Telefone (+258)
                    </span>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, phone: e.target.value }))
                      }
                      className="js-rsvp-ritual__input"
                      style={fieldStyle}
                      autoComplete="tel"
                      inputMode="tel"
                      placeholder="84 123 4567"
                    />
                  </label>
                </div>

                <label className="js-rsvp-ritual__field block text-left mt-6">
                  <span className="js-rsvp-ritual__label">Mensagem (opcional)</span>
                  <textarea
                    value={form.personalMessage}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        personalMessage: e.target.value,
                      }))
                    }
                    rows={4}
                    className="js-rsvp-ritual__input js-rsvp-ritual__textarea"
                    style={fieldStyle}
                    placeholder="Que esta nova caminhada seja repleta de amor…"
                    aria-invalid={!messagePack.ok}
                  />
                </label>
                <MessagePackMeter
                  length={messagePack.length}
                  remaining={messagePack.remaining}
                  ok={messagePack.ok}
                  error={!messagePack.ok ? messagePack.error : undefined}
                />

                {errorMessage ? (
                  <p className="js-rsvp-ritual__error" role="alert">
                    {errorMessage}
                  </p>
                ) : null}

                <div className="js-rsvp-ritual__actions mt-8">
                  <PrimaryButton
                    onClick={continueFromAbsence}
                    fullWidth
                    disabled={!messagePack.ok}
                  >
                    Enviar resposta
                  </PrimaryButton>
                  <GhostButton onClick={() => setPhase("presence")}>
                    Voltar
                  </GhostButton>
                </div>
              </div>
            </StepShell>
          ) : null}

          {phase === "sending" ? (
            <StepShell keyId="sending" reduceMotion={reduceMotion}>
              <div
                className="js-rsvp-ritual__panel text-center"
                aria-live="polite"
                aria-busy="true"
              >
                <MonogramMark />
                <h2 {...titleProps}>A reservar o seu lugar…</h2>
                <p className="js-rsvp-ritual__lead">Um momento, por favor.</p>
              </div>
            </StepShell>
          ) : null}

          {phase === "success-attending" ? (
            <StepShell keyId="success-yes" reduceMotion={reduceMotion}>
              <div
                className="js-rsvp-ritual__panel js-rsvp-ritual__panel--success text-center"
                aria-live="polite"
              >
                <MonogramMark animateOnce />
                <div className="js-rsvp-ritual__wine-line" aria-hidden />
                <h2
                  {...titleProps}
                  className="js-rsvp-ritual__title js-rsvp-ritual__title--ink"
                >
                  Está confirmado.
                </h2>
                <p className="js-rsvp-ritual__lead js-rsvp-ritual__lead--ink">
                  {guestDisplayName}, o seu lugar faz parte desta história.
                </p>
                <p className="js-rsvp-ritual__meta js-rsvp-ritual__meta--ink">
                  {formatWeddingEventDate(WEDDING_EVENT.dateIso)} ·{" "}
                  {WEDDING_VENUE.city.split(",")[0]}
                </p>
                <p className="js-rsvp-ritual__countdown">
                  {formatDaysUntilLabel(daysLeft)}
                </p>
                <div className="js-rsvp-ritual__actions mt-8">
                  {WEDDING_ITINERARY_SCHEDULE_CONFIRMED && calendarUrl ? (
                    <a
                      href={calendarUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="js-rsvp-ritual__btn-primary is-full"
                    >
                      Adicionar ao calendário
                    </a>
                  ) : null}
                  {WEDDING_ITINERARY_SCHEDULE_CONFIRMED ? (
                    <GhostButton onClick={() => downloadWeddingIcsFile()}>
                      Descarregar .ics
                    </GhostButton>
                  ) : (
                    <p
                      className="js-rsvp-ritual__lead"
                      role="status"
                      aria-live="polite"
                    >
                      O horário da cerimónia religiosa ainda está por confirmar.
                      Google Calendar e o ficheiro .ics ficam disponíveis assim
                      que a hora for confirmada.
                    </p>
                  )}
                  <GhostButton onClick={scrollToInvite}>
                    Voltar ao convite
                  </GhostButton>
                </div>
              </div>
            </StepShell>
          ) : null}

          {phase === "success-absent" ? (
            <StepShell keyId="success-no" reduceMotion={reduceMotion}>
              <div
                className="js-rsvp-ritual__panel text-center"
                aria-live="polite"
              >
                <MonogramMark />
                <h2 {...titleProps}>
                  Resposta recebida com carinho.
                </h2>
                <p className="js-rsvp-ritual__lead">
                  Obrigado por nos informar, {guestDisplayName}.
                </p>
                <div className="mt-8">
                  <GhostButton onClick={scrollToInvite}>
                    Voltar ao convite
                  </GhostButton>
                </div>
              </div>
            </StepShell>
          ) : null}

          {phase === "already" ? (
            <StepShell keyId="already" reduceMotion={reduceMotion}>
              <div className="js-rsvp-ritual__panel text-center">
                <MonogramMark />
                <h2 {...titleProps}>
                  Já temos a sua resposta neste dispositivo.
                </h2>
                <p className="js-rsvp-ritual__lead">
                  {form.name
                    ? `${form.name}, detectámos uma resposta anterior guardada neste navegador.`
                    : "Detectámos uma resposta anterior guardada neste navegador."}
                </p>
                <p className="js-rsvp-ritual__meta">
                  Isto é apenas detecção local de resposta anterior — não
                  impede respostas noutro dispositivo, após limpar dados ou via
                  API. Para alterar, contacte-nos ou inicie de novo se
                  necessário.
                </p>
                <div className="js-rsvp-ritual__actions mt-8">
                  <GhostButton onClick={startOver}>
                    Iniciar nova confirmação
                  </GhostButton>
                  <GhostButton onClick={scrollToInvite}>
                    Voltar ao convite
                  </GhostButton>
                </div>
              </div>
            </StepShell>
          ) : null}

          {phase === "error" ? (
            <StepShell keyId="error" reduceMotion={reduceMotion}>
              <div className="js-rsvp-ritual__panel text-center">
                <h2 {...titleProps}>
                  Não foi possível concluir
                </h2>
                <p className="js-rsvp-ritual__error" role="alert">
                  {errorMessage ||
                    "Ocorreu um erro ao enviar. Tente novamente."}
                </p>
                <div className="js-rsvp-ritual__actions mt-8">
                  <PrimaryButton onClick={resetToEdit} fullWidth>
                    Tentar novamente
                  </PrimaryButton>
                  <GhostButton onClick={() => setPhase("welcome")}>
                    Começar de novo
                  </GhostButton>
                </div>
              </div>
            </StepShell>
          ) : null}
        </AnimatePresence>

        <p className="js-rsvp-ritual__footnote">
          {WEDDING_COPY.rsvpEmotionalLine}
        </p>
      </div>
    </section>
  );
}
