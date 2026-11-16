"use client";

import React, { useState } from "react";
import { submitUniversalRsvp } from "@lib/rsvp/universal-client";
import { triggerCelebrationConfetti } from "./AlexandrinaKennethAmbient";

/* --------------------------------------------------------------------------
   Bespoke Authorial Haute Couture SVG Icons (Hairline 1.2px / 1.4px)
   Strictly aligned with Alexandrina & Kenneth Wedding Atelier aesthetics
   -------------------------------------------------------------------------- */

function AtelierHeartIcon({ className = "w-5 h-5", color = "#d4af37" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

function AtelierCalendarIcon({ className = "w-4 h-4", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function AtelierWhatsAppIcon({ className = "w-4 h-4", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
    </svg>
  );
}

function AtelierPhoneIcon({ className = "w-4 h-4", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92Z" />
    </svg>
  );
}

function AtelierCheckIcon({ className = "w-4 h-4", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" />
      <polyline points="16 9 10.5 15 8 12.5" />
    </svg>
  );
}

function AtelierSparklesIcon({ className = "w-4 h-4", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <polygon points="12 2 15 9 22 12 15 15 12 22 9 15 2 12 9 9 12 2" />
    </svg>
  );
}

function AtelierDoveIcon({ className = "w-4 h-4", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 21.5c-4.5 0-8-3.5-8-8 0-4.5 3.5-8 8-8s8 3.5 8 8c0 2.2-.9 4.2-2.3 5.7" />
      <path d="m15 9-6 6" />
    </svg>
  );
}

function AtelierGiftRibbonIcon({ className = "w-4 h-4", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="3" y="8" width="18" height="13" rx="2" />
      <line x1="12" y1="8" x2="12" y2="21" />
      <line x1="3" y1="13" x2="21" y2="13" />
      <path d="M12 8C10.5 5 7.5 3.5 6 5C4.5 6.5 6.5 8 12 8Z" />
      <path d="M12 8C13.5 5 16.5 3.5 18 5C19.5 6.5 17.5 8 12 8Z" />
    </svg>
  );
}

/* --------------------------------------------------------------------------
   Calendar Integration Helpers
   -------------------------------------------------------------------------- */

function getGoogleCalendarUrl(): string {
  const title = encodeURIComponent("Casamento de Alexandrina Mitilane & Kenneth Novele");
  // 09 de Janeiro de 2027 â€” Maputo Time UTC+2 (08h00 - 23h00 local = 06h00 - 21h00 UTC)
  const dates = "20270109T060000Z/20270109T210000Z";
  const details = encodeURIComponent(
    "Casamento de Alexandrina Mitilane & Kenneth Novele\n\n" +
    "Programa do Grande Dia:\n" +
    "â€¢ 08h00 â€” Registo Civil: 3.Âª ConservatÃ³ria do Registo Civil (Bairro 25 de Junho B)\n" +
    "â€¢ 10h00 â€” MatrimÃ³nio Religioso: Igreja Internacional Casa da GlÃ³ria da Palavra (Zimpeto)\n" +
    "â€¢ 15h00 â€” Copo de Ãgua: SalÃ£o da Igreja EvangÃ©lica Assembleia Livre (Zimpeto)\n\n" +
    "A vossa presenÃ§a Ã© a nossa maior honra e bÃªnÃ§Ã£o!"
  );
  const location = encodeURIComponent("Maputo, MoÃ§ambique");
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
}

function downloadIcsCalendarFile(): void {
  const icsData = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//HAXR Signature//Alexandrina & Kenneth Wedding//PT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    "UID:alexandrina-kenneth-wedding-20270109@haxrsignature.com",
    "DTSTAMP:20261115T000000Z",
    "DTSTART:20270109T060000Z",
    "DTEND:20270109T210000Z",
    "SUMMARY:Casamento de Alexandrina & Kenneth",
    "DESCRIPTION:Casamento de Alexandrina Mitilane & Kenneth Novele\\n08h00: Registo Civil\\n10h00: Casamento Religioso\\n15h00: Copo de Ãgua (SalÃ£o Assembleia Livre Zimpeto)",
    "LOCATION:Maputo\\, MoÃ§ambique",
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([icsData], { type: "text/calendar;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", "Casamento-Alexandrina-e-Kenneth.ics");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/* --------------------------------------------------------------------------
   Phone Ergonomics & Mozambican Formatting Helpers (+258)
   -------------------------------------------------------------------------- */

function formatPhoneInput(value: string): string {
  if (!value) return "";

  // Se comeÃ§ar com +, formata suavemente sem bloquear dÃ­gitos internacionais
  if (value.startsWith("+")) {
    const clean = value.replace(/[^\d+]/g, "");
    if (clean.startsWith("+258")) {
      const localDigits = clean.slice(4).replace(/\D/g, "");
      if (localDigits.length <= 2) return `+258 ${localDigits}`;
      if (localDigits.length <= 5) return `+258 ${localDigits.slice(0, 2)} ${localDigits.slice(2)}`;
      return `+258 ${localDigits.slice(0, 2)} ${localDigits.slice(2, 5)} ${localDigits.slice(5, 9)}`;
    }
    return value;
  }

  // Se o utilizador digitar 258 sem o prefixo +
  if (value.startsWith("258") && value.length > 3) {
    const localDigits = value.slice(3).replace(/\D/g, "");
    if (localDigits.length <= 2) return `+258 ${localDigits}`;
    if (localDigits.length <= 5) return `+258 ${localDigits.slice(0, 2)} ${localDigits.slice(2)}`;
    return `+258 ${localDigits.slice(0, 2)} ${localDigits.slice(2, 5)} ${localDigits.slice(5, 9)}`;
  }

  // Se digitar dÃ­gitos locais moÃ§ambicanos diretamente (84, 85, 86, 87, 82, 83...)
  const digitsOnly = value.replace(/\D/g, "");
  if (digitsOnly.length <= 2) return digitsOnly;
  if (digitsOnly.length <= 5) return `${digitsOnly.slice(0, 2)} ${digitsOnly.slice(2)}`;
  return `${digitsOnly.slice(0, 2)} ${digitsOnly.slice(2, 5)} ${digitsOnly.slice(5, 9)}`;
}

function normalizePhoneForSubmission(raw: string): string {
  const clean = raw.trim();
  const digits = clean.replace(/\D/g, "");
  if (digits.length === 9 && digits.startsWith("8") && !clean.startsWith("+")) {
    return `+258 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
  }
  if (digits.length === 12 && digits.startsWith("2588")) {
    return `+258 ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  }
  return clean;
}

export function AlexandrinaKennethRsvp() {
  const [formData, setFormData] = useState({
    nome: "",
    nomeAcompanhante: "",
    email: "",
    telefone: "",
    acompanhantes: "0",
    presenca: "",
    restricoes: "",
    mensagem: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successStatus, setSuccessStatus] = useState<null | {
    attending: boolean;
    name: string;
    guestsCount: number;
    companionName?: string;
    phone: string;
  }>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMessage("");
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneInput(e.target.value);
    setFormData((prev) => ({ ...prev, telefone: formatted }));
    setErrorMessage("");
  };

  const handlePhoneBlur = () => {
    const raw = formData.telefone.trim();
    const normalized = normalizePhoneForSubmission(raw);
    if (normalized !== raw) {
      setFormData((prev) => ({ ...prev, telefone: normalized }));
    }
  };

  const handlePresenceSelect = (value: string) => {
    setFormData((prev) => ({ ...prev, presenca: value }));
    setErrorMessage("");
  };

  const handleGuestsSelect = (value: string) => {
    setFormData((prev) => ({ ...prev, acompanhantes: value }));
  };

  const validate = (): boolean => {
    if (!formData.presenca) {
      setErrorMessage("Por favor, indica se vais poder estar presente ou nÃ£o.");
      return false;
    }

    if (!formData.nome.trim()) {
      setErrorMessage("Por favor, preenche o teu nome completo.");
      return false;
    }

    if (!formData.telefone.trim()) {
      setErrorMessage("Por favor, indica o teu telemÃ³vel para contacto.");
      return false;
    }

    const digits = formData.telefone.replace(/\D/g, "");
    if (digits.length < 8) {
      setErrorMessage("Por favor, indica um telemÃ³vel vÃ¡lido (mÃ­nimo 8 dÃ­gitos).");
      return false;
    }

    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setErrorMessage("Por favor, indica um email vÃ¡lido ou deixa o campo em branco.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrorMessage("");

    const isAttending = formData.presenca === "Sim, com muito gosto";
    const guestsCount = isAttending ? (formData.acompanhantes === "1" ? 2 : 1) : 0;
    const companionNameTrimmed = formData.nomeAcompanhante.trim();
    const normalizedPhone = normalizePhoneForSubmission(formData.telefone.trim());

    const companionLine =
      isAttending && formData.acompanhantes === "1" && companionNameTrimmed
        ? `Acompanhante: ${companionNameTrimmed}`
        : "";
    const restrictionsLine = formData.restricoes.trim() ? `RestriÃ§Ãµes: ${formData.restricoes.trim()}` : "";
    const messageLine = formData.mensagem.trim() ? `Mensagem: ${formData.mensagem.trim()}` : "";

    const messageLines = [companionLine, restrictionsLine, messageLine]
      .filter(Boolean)
      .join("\n");

    try {
      const result = await submitUniversalRsvp({
        slug: "alexandrinaekennethwedding",
        name: formData.nome.trim(),
        attending: isAttending,
        guests: guestsCount,
        email: formData.email.trim() || undefined,
        phone: normalizedPhone || undefined,
        messageForBride: messageLines || undefined,
        honeypot: "",
      });

      if (result.outcome.kind !== "success" && result.outcome.kind !== "persisted_partial") {
        setErrorMessage(result.outcome.message || "NÃ£o foi possÃ­vel registar a confirmaÃ§Ã£o.");
        return;
      }

      setSuccessStatus({
        attending: isAttending,
        name: formData.nome.trim(),
        guestsCount,
        companionName: isAttending && formData.acompanhantes === "1" ? companionNameTrimmed : undefined,
        phone: normalizedPhone,
      });

      if (isAttending) {
        setTimeout(() => {
          triggerCelebrationConfetti();
        }, 200);
      }
    } catch (err) {
      console.error("RSVP error:", err);
      setErrorMessage("NÃ£o foi possÃ­vel enviar o RSVP agora. Verifica a ligaÃ§Ã£o e tenta novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenGiftsModal = () => {
    const modalBtn = document.getElementById("openArtigosModal");
    if (modalBtn) {
      modalBtn.click();
    } else {
      document.getElementById("presentes")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // Mensagem prÃ©-formatada para contacto oficial de WhatsApp com Kenneth
  const whatsappPrefilledMessage = encodeURIComponent(
    "OlÃ¡ Kenneth! Recebi o convite do vosso casamento com a Alexandrina e gostaria de confirmar a minha presenÃ§a."
  );

  return (
    <div className="panel panel--rsvp panel--rsvp-layout" id="rsvpPanel">
      {/* =================================================================
          1. CABEÃ‡ALHO CERIMONIAL DO RSVP â€” IDENTIDADE HAUTE COUTURE
          (Perfeitamente alinhado com "Presente de Casamento" no painel ao lado)
          ================================================================= */}
      <div className="ak-gifts-header text-left">
        <div className="ak-gifts-tag">
          <span className="ak-gifts-tag__glyph">â–</span>
          <span>RSVP &amp; ConfirmaÃ§Ã£o</span>
        </div>

        <h3 id="rsvp-card-title" className="ak-gifts-title">
          <AtelierHeartIcon className="w-6 h-6 shrink-0" color="#d4af37" />
          <span>ConfirmaÃ§Ã£o de PresenÃ§a</span>
        </h3>

        <p className="ak-gifts-lead">
          A tua presenÃ§a Ã© a nossa maior honra e alegria. Confirma aqui a tua participaÃ§Ã£o no nosso
          casamento directamente com os noivos.
        </p>
      </div>

      {/* =================================================================
          2. ESTADO DE SUCESSO PÃ“S-ENVIO (RECIBO CERIMONIAL HAUTE COUTURE)
          ================================================================= */}
      {successStatus ? (
        <div
          className={`rsvp-confirmation ak-rsvp-success-card animate-in fade-in duration-300 ${
            successStatus.attending ? "rsvp-confirmation--yes" : "rsvp-confirmation--no"
          }`}
          role="status"
        >
          <div className="ak-rsvp-success-crest">
            {successStatus.attending ? (
              <AtelierSparklesIcon className="w-6 h-6" color="#d4af37" />
            ) : (
              <AtelierDoveIcon className="w-6 h-6" color="#8b7355" />
            )}
          </div>

          <h3 className="rsvp-confirmation__title ak-rsvp-success-title">
            {successStatus.attending
              ? `PresenÃ§a Confirmada, ${successStatus.name}!`
              : `Obrigado pelo carinho, ${successStatus.name}`}
          </h3>

          <p className="rsvp-confirmation__text ak-rsvp-success-text">
            {successStatus.attending
              ? "A tua presenÃ§a ficou registada com muito amor. Estamos a preparar cada detalhe com imenso carinho para celebrar este dia inesquecÃ­vel contigo!"
              : "RegistÃ¡mos com carinho a tua resposta. Sentiremos a tua falta na celebraÃ§Ã£o, mas sabemos que estarÃ¡s connosco em oraÃ§Ã£o e pensamento."}
          </p>

          {/* Resumo Visual Oficial do Registo (User Value & ConfirmaÃ§Ã£o Fidedigna) */}
          <div className="ak-rsvp-receipt-card animate-in fade-in duration-300">
            <div className="ak-rsvp-receipt-header">
              <AtelierSparklesIcon className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Comprovativo Oficial de ConfirmaÃ§Ã£o</span>
            </div>
            <div className="ak-rsvp-receipt-body">
              <div className="ak-rsvp-receipt-row">
                <span className="ak-rsvp-receipt-label">Convidado(a)</span>
                <span className="ak-rsvp-receipt-value">{successStatus.name}</span>
              </div>
              <div className="ak-rsvp-receipt-row">
                <span className="ak-rsvp-receipt-label">Lugares Reservados</span>
                <span className="ak-rsvp-receipt-value">
                  {successStatus.attending ? (
                    successStatus.guestsCount === 2 ? (
                      <>
                        <span><strong>2 lugares</strong> (Tu e Acompanhante)</span>
                        {successStatus.companionName && (
                          <span className="ak-rsvp-receipt-subvalue">
                            Acompanhante: {successStatus.companionName}
                          </span>
                        )}
                      </>
                    ) : (
                      <span><strong>1 lugar individual</strong></span>
                    )
                  ) : (
                    <span>AusÃªncia registada</span>
                  )}
                </span>
              </div>
              <div className="ak-rsvp-receipt-row">
                <span className="ak-rsvp-receipt-label">Contacto Registado</span>
                <span className="ak-rsvp-receipt-value">{successStatus.phone}</span>
              </div>
              <div className="ak-rsvp-receipt-row">
                <span className="ak-rsvp-receipt-label">Estado</span>
                <span
                  className={`ak-rsvp-receipt-badge ${
                    successStatus.attending ? "is-confirmed" : "is-declined"
                  }`}
                >
                  {successStatus.attending ? "PresenÃ§a Confirmada âœ“" : "AusÃªncia Notificada"}
                </span>
              </div>
            </div>
            <div className="ak-rsvp-receipt-footer">
              Registo cerimonial HAXR Signature Â· Alexandrina &amp; Kenneth 2027
            </div>
          </div>

          <div className="ak-rsvp-success-actions">
            {successStatus.attending && (
              <>
                <a
                  href={getGoogleCalendarUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ak-rsvp-btn-calendar"
                  style={{ textDecoration: "none" }}
                >
                  <AtelierCalendarIcon className="w-4 h-4" color="#d4af37" />
                  <span>Adicionar ao Google Calendar</span>
                </a>

                <button
                  type="button"
                  onClick={downloadIcsCalendarFile}
                  className="ak-rsvp-btn-calendar"
                >
                  <AtelierCalendarIcon className="w-4 h-4" color="#8b7355" />
                  <span>Guardar no iPhone / Apple (.ics)</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={handleOpenGiftsModal}
              className="ak-rsvp-btn-gifts"
            >
              <AtelierGiftRibbonIcon className="w-4 h-4" />
              <span>Ver Lista de Presentes</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSuccessStatus(null);
                setFormData({
                  nome: "",
                  nomeAcompanhante: "",
                  email: "",
                  telefone: "",
                  acompanhantes: "0",
                  presenca: "",
                  restricoes: "",
                  mensagem: "",
                });
              }}
              style={{
                background: "transparent",
                border: "none",
                fontSize: "0.75rem",
                color: "var(--accent, #8b7355)",
                textDecoration: "underline",
                cursor: "pointer",
                padding: "8px",
                marginTop: "4px",
              }}
            >
              Alterar ou enviar nova confirmaÃ§Ã£o
            </button>
          </div>
        </div>
      ) : (
        /* =================================================================
            3. CANAIS DIRETOS & FORMULÃRIO OFICIAL INTELIGENTE
            ================================================================= */
        <div className="rsvp-main-block" style={{ marginTop: "18px" }}>
          {/* A. Cards de Contacto Direto Cerimonial (Ambos do Kenneth Novele) */}
          <div className="rsvp-contact-row" role="group" aria-label="Contactos oficiais para confirmaÃ§Ã£o com Kenneth Novele">
            <a
              href={`https://wa.me/258870410112?text=${whatsappPrefilledMessage}`}
              className="phone-btn phone-btn--whatsapp cursor-pointer ak-rsvp-contact-card ak-rsvp-contact-card--whatsapp"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Confirmar por WhatsApp com Kenneth Novele (+258 87 041 0112)"
            >
              <div className="ak-rsvp-contact-card__top">
                <span className="ak-rsvp-contact-card__target-name">Kenneth Novele Â· Noivo</span>
                <div className="ak-rsvp-contact-card__icon-box">
                  <AtelierWhatsAppIcon className="w-4 h-4" />
                </div>
              </div>
              <span className="phone-number">+258 87 041 0112</span>
              <span className="phone-label">
                <span>Confirmar via WhatsApp</span>
              </span>
            </a>

            <a
              href="tel:+258849674279"
              className="phone-btn phone-btn--call cursor-pointer ak-rsvp-contact-card ak-rsvp-contact-card--call"
              aria-label="Ligar para Kenneth Novele (+258 84 967 4279)"
            >
              <div className="ak-rsvp-contact-card__top">
                <span className="ak-rsvp-contact-card__target-name">Kenneth Novele Â· Noivo</span>
                <div className="ak-rsvp-contact-card__icon-box">
                  <AtelierPhoneIcon className="w-4 h-4" />
                </div>
              </div>
              <span className="phone-number">+258 84 967 4279</span>
              <span className="phone-label">
                <span>Confirmar por Chamada</span>
              </span>
            </a>
          </div>

          <div className="ak-rsvp-divider">
            <span>Ou confirma directamente online</span>
          </div>

          {errorMessage && (
            <div
              className="rsvp-error mb-4 animate-in fade-in duration-200"
              role="alert"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <AtelierHeartIcon className="w-4 h-4 shrink-0" color="#ffffff" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form id="rsvp-form" className="rsvp-form" onSubmit={handleSubmit} noValidate>
            {/* Escolha TÃ¡til de PresenÃ§a */}
            <div className="form-group" style={{ marginBottom: "22px" }}>
              <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>Vais estar presente? <span style={{ color: "var(--gold, #d4af37)" }}>*</span></span>
                {formData.presenca && (
                  <span style={{ fontSize: "0.68rem", textTransform: "none", color: "#166534", fontWeight: 600 }}>
                    OpÃ§Ã£o selecionada âœ“
                  </span>
                )}
              </label>

              <div className="ak-rsvp-choice-grid" role="radiogroup" aria-label="ConfirmaÃ§Ã£o de presenÃ§a">
                <button
                  type="button"
                  className={`ak-rsvp-choice-card ${
                    formData.presenca === "Sim, com muito gosto" ? "is-selected-yes" : ""
                  }`}
                  onClick={() => handlePresenceSelect("Sim, com muito gosto")}
                  role="radio"
                  aria-checked={formData.presenca === "Sim, com muito gosto"}
                >
                  <div className="ak-rsvp-choice-card__badge">
                    <AtelierSparklesIcon className="w-4 h-4" />
                  </div>
                  <h4 className="ak-rsvp-choice-card__title">
                    <span>Sim, com muito gosto</span>
                    {formData.presenca === "Sim, com muito gosto" && (
                      <AtelierCheckIcon className="w-4 h-4 shrink-0" color="#d4af37" />
                    )}
                  </h4>
                  <p className="ak-rsvp-choice-card__desc">
                    Estarei presente para celebrar convosco este grande dia.
                  </p>
                </button>

                <button
                  type="button"
                  className={`ak-rsvp-choice-card ${
                    formData.presenca === "Infelizmente nÃ£o poderei comparecer" ? "is-selected-no" : ""
                  }`}
                  onClick={() => handlePresenceSelect("Infelizmente nÃ£o poderei comparecer")}
                  role="radio"
                  aria-checked={formData.presenca === "Infelizmente nÃ£o poderei comparecer"}
                >
                  <div className="ak-rsvp-choice-card__badge">
                    <AtelierDoveIcon className="w-4 h-4" />
                  </div>
                  <h4 className="ak-rsvp-choice-card__title">
                    <span>Infelizmente nÃ£o poderei</span>
                    {formData.presenca === "Infelizmente nÃ£o poderei comparecer" && (
                      <AtelierCheckIcon className="w-4 h-4 shrink-0" color="#8b7355" />
                    )}
                  </h4>
                  <p className="ak-rsvp-choice-card__desc">
                    NÃ£o poderei estar, mas celebro em oraÃ§Ã£o e carinho.
                  </p>
                </button>
              </div>

              {/* Hidden select para retrocompatibilidade semÃ¢ntica com scripts/testes */}
              <select
                id="presenca"
                name="presenca"
                value={formData.presenca}
                onChange={handleChange}
                style={{ display: "none" }}
                tabIndex={-1}
                aria-hidden="true"
              >
                <option value="">Por favor, seleciona...</option>
                <option value="Sim, com muito gosto">Sim, com muito gosto</option>
                <option value="Infelizmente nÃ£o poderei comparecer">Infelizmente nÃ£o poderei comparecer</option>
              </select>
            </div>

            {/* IdentificaÃ§Ã£o do Convidado */}
            <div className="form-group">
              <label htmlFor="nome">
                Nome e apelido <span style={{ color: "var(--gold, #d4af37)" }}>*</span>
              </label>
              <input
                id="nome"
                name="nome"
                type="text"
                placeholder="O teu primeiro e Ãºltimo nome"
                value={formData.nome}
                onChange={handleChange}
                required
                autoComplete="name"
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "0" }}>
              <div className="form-group">
                <label htmlFor="telefone">
                  TelemÃ³vel / WhatsApp <span style={{ color: "var(--gold, #d4af37)" }}>*</span>
                </label>
                <input
                  id="telefone"
                  name="telefone"
                  type="tel"
                  placeholder="Ex.: 84 000 0000 ou +258..."
                  value={formData.telefone}
                  onChange={handlePhoneChange}
                  onBlur={handlePhoneBlur}
                  required
                  autoComplete="tel"
                />
                <span className="ak-rsvp-input-hint">
                  MoÃ§ambique (84, 85, 86, 87, 82, 83) ou indicativo internacional
                </span>
              </div>

              <div className="form-group">
                <label htmlFor="email">Email (opcional)</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="exemplo@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* LÃ³gica Condicional Progressiva: Apenas quando vai comparecer */}
            {formData.presenca === "Sim, com muito gosto" && (
              <div className="animate-in fade-in duration-300">
                {/* Seletor de Acompanhantes em Pills TÃ¡teis */}
                <div className="form-group">
                  <label htmlFor="acompanhantes">Acompanhantes</label>
                  <div className="ak-rsvp-guests-pills" role="radiogroup" aria-label="NÃºmero de acompanhantes">
                    <button
                      type="button"
                      className={`ak-rsvp-guest-pill ${formData.acompanhantes === "0" ? "is-active" : ""}`}
                      onClick={() => handleGuestsSelect("0")}
                      role="radio"
                      aria-checked={formData.acompanhantes === "0"}
                    >
                      <span>Apenas eu (1 pessoa)</span>
                    </button>
                    <button
                      type="button"
                      className={`ak-rsvp-guest-pill ${formData.acompanhantes === "1" ? "is-active" : ""}`}
                      onClick={() => handleGuestsSelect("1")}
                      role="radio"
                      aria-checked={formData.acompanhantes === "1"}
                    >
                      <span>Eu e +1 acompanhante (2 pessoas)</span>
                    </button>
                  </div>

                  {/* Hidden select para retrocompatibilidade */}
                  <select
                    id="acompanhantes"
                    name="acompanhantes"
                    value={formData.acompanhantes}
                    onChange={handleChange}
                    style={{ display: "none" }}
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    <option value="0">Apenas eu (1 pessoa)</option>
                    <option value="1">Eu e mais 1 acompanhante (2 pessoas)</option>
                  </select>
                </div>

                {/* Campo Inteligente: Nome do Acompanhante quando 2 pessoas selecionadas */}
                {formData.acompanhantes === "1" && (
                  <div className="ak-rsvp-companion-wrap animate-in fade-in duration-200">
                    <label htmlFor="nomeAcompanhante">
                      Nome do(a) acompanhante{" "}
                      <span style={{ fontSize: "0.68rem", textTransform: "none", color: "#8b7355", fontWeight: 500 }}>
                        (opcional â€” para a lista de convidados e lugares Ã  mesa)
                      </span>
                    </label>
                    <input
                      id="nomeAcompanhante"
                      name="nomeAcompanhante"
                      type="text"
                      placeholder="Nome e apelido do acompanhante"
                      value={formData.nomeAcompanhante}
                      onChange={handleChange}
                      autoComplete="off"
                    />
                  </div>
                )}

                <div className="form-group" style={{ marginTop: "14px" }}>
                  <label htmlFor="restricoes">RestriÃ§Ãµes alimentares (opcional)</label>
                  <input
                    id="restricoes"
                    name="restricoes"
                    type="text"
                    placeholder="Ex.: Vegetariano, alergia a mariscos ou amendoim..."
                    value={formData.restricoes}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}

            {/* Mensagem de BÃªnÃ§Ã£o para os Noivos */}
            <div className="form-group">
              <label htmlFor="mensagem">
                {formData.presenca === "Infelizmente nÃ£o poderei comparecer"
                  ? "Mensagem de carinho para os noivos (opcional)"
                  : "Mensagem de bÃªnÃ§Ã£o aos noivos (opcional)"}
              </label>
              <textarea
                id="mensagem"
                name="mensagem"
                rows={formData.presenca === "Infelizmente nÃ£o poderei comparecer" ? 3 : 2}
                placeholder={
                  formData.presenca === "Infelizmente nÃ£o poderei comparecer"
                    ? "Deixa uma palavra de carinho e felicidades para Alexandrina e Kenneth..."
                    : "Escreve uma bÃªnÃ§Ã£o especial para Alexandrina & Kenneth..."
                }
                value={formData.mensagem}
                onChange={handleChange}
                style={{ resize: "none" }}
              />
            </div>

            {/* BotÃ£o de SubmissÃ£o Cerimonial */}
            <button
              type="submit"
              className="submit cursor-pointer"
              id="submitRsvp"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span>A registar com carinho...</span>
              ) : formData.presenca === "Infelizmente nÃ£o poderei comparecer" ? (
                <>
                  <AtelierDoveIcon className="w-4 h-4" />
                  <span>Enviar Resposta com Carinho</span>
                </>
              ) : (
                <>
                  <AtelierHeartIcon className="w-4 h-4" color="currentColor" />
                  <span>Confirmar PresenÃ§a com Alegria</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
