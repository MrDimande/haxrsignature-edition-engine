"use client";

import { useApp } from "@/lib/context";
import { defaultViewport, fadeUp, staggerContainer } from "@/lib/motion";
import { COLORS } from "@/styles/tokens";
import { formatStudioCredit } from "@lib/brand/authorship";
import { KULAYA_VENUE } from "@lib/kulaya/event-details";
import { Download, Printer, Send } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import React, { useState } from "react";
import { downloadAccessPass, printAccessPass } from "@/lib/pass-export";
import CountdownSection from "./CountdownSection";

export default function RSVPSection() {
  const { rsvpStatus, setRsvpStatus } = useApp();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    attending: "yes",
    guests: "1",
    honeypot: "",
  });
  const [errorMsg, setErrorMsg] = useState("");
  const [passAction, setPassAction] = useState<"idle" | "printing" | "saving">(
    "idle"
  );
  const [passActionError, setPassActionError] = useState("");
  const [submittedData, setSubmittedData] = useState<{
    name: string;
    attending: boolean;
    guests: number;
    guestEmailSent?: boolean;
  } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMsg) setErrorMsg("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRsvpStatus("sending");
    setErrorMsg("");

    try {
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          attending: formData.attending === "yes",
          guests: formData.attending === "yes" ? parseInt(formData.guests, 10) : 0,
          honeypot: formData.honeypot,
          slug: "jessicakulaya",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ocorreu um erro ao processar o seu RSVP.");
      }

      setSubmittedData({
        name: formData.name,
        attending: formData.attending === "yes",
        guests: formData.attending === "yes" ? parseInt(formData.guests, 10) : 0,
        guestEmailSent: Boolean(data.guestEmailSent),
      });

      setRsvpStatus("success");
    } catch (error: any) {
      console.error("RSVP Submission Error:", error);
      setErrorMsg(error.message || "Erro de ligação. Por favor tente mais tarde.");
      setRsvpStatus("error");
    }
  };

  const handlePrintPass = async () => {
    setPassActionError("");
    setPassAction("printing");
    try {
      await printAccessPass(submittedData?.name);
    } catch (error) {
      console.error("[kulaya-pass] print failed:", error);
      setPassActionError(
        "Não foi possível preparar a impressão. Tente guardar a imagem."
      );
    } finally {
      setPassAction("idle");
    }
  };

  const handleSavePass = async () => {
    setPassActionError("");
    setPassAction("saving");
    try {
      await downloadAccessPass(submittedData?.name);
    } catch (error) {
      console.error("[kulaya-pass] save failed:", error);
      setPassActionError(
        "Não foi possível guardar o passe. Tente imprimir ou tire screenshot."
      );
    } finally {
      setPassAction("idle");
    }
  };

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={defaultViewport}
      variants={staggerContainer}
      className="relative w-full py-28 md:py-36 px-6 overflow-hidden z-10 flex flex-col items-center justify-center border-t border-[#FAF5F0]/5"
      id="rsvp"
    >
      {/* ─── Upper Block: Countdown Experience ─── */}
      <div className="max-w-4xl w-full flex flex-col items-center mb-24 md:mb-32">
        <CountdownSection />
      </div>

      {/* Symmetrical fine gold separator divider between Countdown and RSVP */}
      <motion.div 
        variants={fadeUp}
        className="flex items-center justify-center gap-4 mb-24 w-full max-w-sm select-none"
      >
        <div className="h-[0.5px] flex-grow bg-gradient-to-r from-transparent to-[#D4AF37]/30" />
        <div className="w-1.5 h-1.5 rotate-45 border border-[#D4AF37]/45" />
        <div className="h-[0.5px] flex-grow bg-gradient-to-l from-transparent to-[#D4AF37]/30" />
      </motion.div>

      {/* ─── Lower Block: RSVP Form ─── */}
      <div className="max-w-xl w-full text-center">
        {/* Section Label */}
        <motion.span 
          variants={fadeUp}
          className="font-body text-[10px] font-light uppercase tracking-[0.45em] mb-4 block"
          style={{ color: COLORS.burntGoldDark }}
        >
          CONFIRMAÇÃO
        </motion.span>

        {/* Section Title */}
        <motion.h2 
          variants={fadeUp}
          className="font-display text-3xl md:text-4xl font-extralight uppercase tracking-[0.15em] mb-12 text-[#FAF5F0]"
        >
          R.S.V.P.
        </motion.h2>

        {rsvpStatus === "success" && submittedData ? (
          /* ─── Success Feedback Screen (Luxury Digital Ticket) ─── */
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md mx-auto relative flex flex-col items-center"
          >
            {/* The Ticket Body */}
            <div 
              id="luxury-ticket"
              className="w-full border border-[#D4AF37]/35 bg-[#1E100A] p-8 relative overflow-hidden shadow-[0_0_40px_rgba(61,27,11,0.6)] rounded-xs print:bg-white print:text-black print:border-black"
              style={{
                backgroundImage: "radial-gradient(circle at center, rgba(61,27,11,0.2) 0%, transparent 80%)"
              }}
            >
              {/* Outer double border */}
              <div className="absolute inset-2.5 border border-[#D4AF37]/15 pointer-events-none print:border-black/20" />

              {/* Ticket Corner Cuts (Sober luxury details) */}
              <div className="absolute top-0 left-0 w-4 h-4 bg-[#120A07] border-r border-b border-[#D4AF37]/35 rounded-br-full print:hidden" />
              <div className="absolute top-0 right-0 w-4 h-4 bg-[#120A07] border-l border-b border-[#D4AF37]/35 rounded-bl-full print:hidden" />
              <div className="absolute bottom-0 left-0 w-4 h-4 bg-[#120A07] border-r border-t border-[#D4AF37]/35 rounded-tr-full print:hidden" />
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-[#120A07] border-l border-t border-[#D4AF37]/35 rounded-tl-full print:hidden" />

              {/* Logo / Monogram Head */}
              <div className="relative z-10 flex flex-col items-center mb-6">
                <div className="w-16 h-16 relative mb-3 rounded-full border border-[#D4AF37]/30 overflow-hidden bg-[#120A07] p-1 flex items-center justify-center print:border-black">
                  <Image 
                    src="/icon.jpg" 
                    alt="Logo JM" 
                    width={56} 
                    height={56} 
                    className="object-cover rounded-full"
                  />
                </div>
                <span className="font-alt text-[8px] uppercase tracking-[0.45em] text-[#D4AF37] print:text-black/60">
                  Passe de Acesso
                </span>
                <h4 className="font-cinzel text-xs font-semibold tracking-[0.2em] text-[#FAF5F0]/90 mt-1 print:text-black">
                  K U L A Y A
                </h4>
              </div>

              {/* Ticket Status Bar */}
              <div className="relative z-10 border-t border-b border-[#D4AF37]/20 py-2.5 my-4 text-center print:border-black/20">
                <span className="font-body text-[10px] uppercase tracking-[0.3em] text-[#D4AF37] font-medium print:text-black">
                  {submittedData.attending ? "Presença Confirmada" : "Impossibilidade Registada"}
                </span>
              </div>

              {/* Guest Information */}
              <div className="relative z-10 space-y-4 my-6 text-center">
                <div>
                  <span className="block font-alt text-[8px] uppercase tracking-wider text-[#FAF5F0]/30 print:text-black/40">Convidado</span>
                  <p className="font-display text-lg text-white font-light mt-0.5 max-w-xs mx-auto truncate print:text-black">
                    {submittedData.name}
                  </p>
                </div>

                {submittedData.attending && (
                  <div className="grid grid-cols-2 gap-4 border-t border-[#FAF5F0]/5 pt-4 print:border-black/10">
                    <div>
                      <span className="block font-alt text-[8px] uppercase tracking-wider text-[#FAF5F0]/30 print:text-black/40">Acesso</span>
                      <p className="font-body text-xs text-[#FAF5F0]/80 font-light mt-0.5 print:text-black/80">
                        Passe Individual
                      </p>
                    </div>
                    <div>
                      <span className="block font-alt text-[8px] uppercase tracking-wider text-[#FAF5F0]/30 print:text-black/40">Total</span>
                      <p className="font-body text-xs text-[#FAF5F0]/80 font-light mt-0.5 print:text-black/80">
                        {Number(submittedData.guests) === 1
                          ? "1 pessoa"
                          : `${submittedData.guests} pessoas`}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Event Metadata Stamp */}
              <div className="relative z-10 border-t border-[#FAF5F0]/5 pt-4 flex items-center justify-between text-left print:border-black/10">
                <div>
                  <span className="block font-alt text-[7px] uppercase tracking-wider text-[#FAF5F0]/30 print:text-black/40">Localização</span>
                  <span className="block font-body text-[10px] text-[#FAF5F0]/65 font-light print:text-black/80">{KULAYA_VENUE.short}</span>
                </div>
                <div className="text-right">
                  <span className="block font-alt text-[7px] uppercase tracking-wider text-[#FAF5F0]/30 print:text-black/40">Data do Evento</span>
                  <span className="block font-body text-[10px] text-[#FAF5F0]/65 font-light print:text-black/80">01 de Agosto de 2026</span>
                </div>
              </div>

              {/* Autoria HAXR — visível no passe exportado */}
              <div className="relative z-10 mt-5 pt-3 border-t border-[#FAF5F0]/5 text-center print:border-black/10">
                <span className="font-alt text-[7px] uppercase tracking-[0.28em] text-[#FAF5F0]/25 print:text-black/35">
                  {formatStudioCredit()}
                </span>
              </div>

              {/* Mock Barcode */}
              <div className="relative z-10 mt-6 flex justify-center opacity-40 hover:opacity-75 transition-opacity duration-300 print:text-black print:opacity-60">
                <svg viewBox="0 0 160 20" className="w-48 h-6 text-[#D4AF37] print:text-black">
                  <rect x="0" y="0" width="2" height="20" fill="currentColor" />
                  <rect x="4" y="0" width="1" height="20" fill="currentColor" />
                  <rect x="7" y="0" width="3" height="20" fill="currentColor" />
                  <rect x="12" y="0" width="1" height="20" fill="currentColor" />
                  <rect x="15" y="0" width="2" height="20" fill="currentColor" />
                  <rect x="20" y="0" width="4" height="20" fill="currentColor" />
                  <rect x="26" y="0" width="1" height="20" fill="currentColor" />
                  <rect x="29" y="0" width="2" height="20" fill="currentColor" />
                  <rect x="33" y="0" width="3" height="20" fill="currentColor" />
                  <rect x="38" y="0" width="1" height="20" fill="currentColor" />
                  <rect x="41" y="0" width="2" height="20" fill="currentColor" />
                  <rect x="45" y="0" width="4" height="20" fill="currentColor" />
                  <rect x="51" y="0" width="1" height="20" fill="currentColor" />
                  <rect x="54" y="0" width="2" height="20" fill="currentColor" />
                  <rect x="58" y="0" width="3" height="20" fill="currentColor" />
                  <rect x="63" y="0" width="1" height="20" fill="currentColor" />
                  <rect x="66" y="0" width="2" height="20" fill="currentColor" />
                  <rect x="70" y="0" width="4" height="20" fill="currentColor" />
                  <rect x="76" y="0" width="1" height="20" fill="currentColor" />
                  <rect x="79" y="0" width="2" height="20" fill="currentColor" />
                  <rect x="83" y="0" width="3" height="20" fill="currentColor" />
                  <rect x="88" y="0" width="1" height="20" fill="currentColor" />
                  <rect x="91" y="0" width="2" height="20" fill="currentColor" />
                  <rect x="95" y="0" width="4" height="20" fill="currentColor" />
                  <rect x="101" y="0" width="1" height="20" fill="currentColor" />
                  <rect x="104" y="0" width="2" height="20" fill="currentColor" />
                  <rect x="108" y="0" width="3" height="20" fill="currentColor" />
                  <rect x="113" y="0" width="1" height="20" fill="currentColor" />
                  <rect x="116" y="0" width="2" height="20" fill="currentColor" />
                  <rect x="120" y="0" width="4" height="20" fill="currentColor" />
                  <rect x="126" y="0" width="1" height="20" fill="currentColor" />
                  <rect x="129" y="0" width="2" height="20" fill="currentColor" />
                  <rect x="133" y="0" width="3" height="20" fill="currentColor" />
                  <rect x="138" y="0" width="1" height="20" fill="currentColor" />
                  <rect x="141" y="0" width="2" height="20" fill="currentColor" />
                  <rect x="145" y="0" width="4" height="20" fill="currentColor" />
                  <rect x="151" y="0" width="1" height="20" fill="currentColor" />
                  <rect x="154" y="0" width="2" height="20" fill="currentColor" />
                  <rect x="158" y="0" width="2" height="20" fill="currentColor" />
                </svg>
              </div>
            </div>

            {/* Instruction tooltip */}
            <p className="font-body text-[9px] text-[#FAF5F0]/40 mt-4 max-w-xs leading-relaxed print:hidden">
              {submittedData.guestEmailSent
                ? "Confirmação enviada para a equipa HAXR, Jessica Muege e para o seu email."
                : "Confirmação enviada para a equipa HAXR e Jessica Muege."}
              {" "}Guarde só este passe — use os botões abaixo para descarregar a imagem ou imprimir.
            </p>

            {passActionError && (
              <p className="font-body text-[9px] text-red-400/90 mt-3 max-w-xs print:hidden">
                {passActionError}
              </p>
            )}

            {/* Ticket Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-3 mt-8 w-full max-w-sm print:hidden">
              <button
                type="button"
                onClick={handleSavePass}
                disabled={passAction !== "idle"}
                className="flex-1 py-3.5 border border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/10 font-body text-[9px] uppercase tracking-[0.25em] font-light transition-all duration-500 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={11} />
                {passAction === "saving" ? "A guardar..." : "Guardar passe"}
              </button>
              <button
                type="button"
                onClick={handlePrintPass}
                disabled={passAction !== "idle"}
                className="flex-1 py-3.5 border border-[#FAF5F0]/15 text-[#FAF5F0] hover:bg-[#FAF5F0]/5 hover:border-[#FAF5F0]/30 font-body text-[9px] uppercase tracking-[0.25em] font-light transition-all duration-500 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Printer size={11} />
                {passAction === "printing" ? "A preparar..." : "Imprimir passe"}
              </button>
            </div>
          </motion.div>
        ) : (
          /* ─── Standard RSVP Form ─── */
          <motion.form 
            variants={fadeUp}
            onSubmit={handleSubmit}
            className="text-left space-y-8 p-8 border border-[#FAF5F0]/5 bg-[#1E100A]/35 backdrop-blur-md"
          >
            {/* Honeypot Spam Protection (Visually Hidden) */}
            <div className="hidden" aria-hidden="true">
              <input
                type="text"
                name="honeypot"
                value={formData.honeypot}
                onChange={handleInputChange}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            {/* Input: Name */}
            <div className="space-y-2">
              <label 
                htmlFor="name" 
                className="block font-body text-[10px] uppercase tracking-[0.25em] text-[#FAF5F0]/40 font-light"
              >
                Nome Completo
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                disabled={rsvpStatus === "sending"}
                placeholder="Introduza o seu nome"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full bg-transparent border-b border-[#FAF5F0]/20 py-3 text-sm text-[#FAF5F0] placeholder-[#FAF5F0]/25 focus:border-[#D4AF37] focus:outline-none transition-all duration-300 font-body font-light rounded-none"
              />
            </div>

            {/* Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block font-body text-[10px] uppercase tracking-[0.25em] text-[#FAF5F0]/40 font-light"
                >
                  Email {formData.attending === "yes" ? "" : "(opcional)"}
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  autoComplete="email"
                  disabled={rsvpStatus === "sending"}
                  placeholder="exemplo@email.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full bg-transparent border-b border-[#FAF5F0]/20 py-3 text-sm text-[#FAF5F0] placeholder-[#FAF5F0]/25 focus:border-[#D4AF37] focus:outline-none transition-all duration-300 font-body font-light rounded-none"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="phone"
                  className="block font-body text-[10px] uppercase tracking-[0.25em] text-[#FAF5F0]/40 font-light"
                >
                  Telefone {formData.attending === "yes" ? "" : "(opcional)"}
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  autoComplete="tel"
                  disabled={rsvpStatus === "sending"}
                  placeholder="+258 ..."
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full bg-transparent border-b border-[#FAF5F0]/20 py-3 text-sm text-[#FAF5F0] placeholder-[#FAF5F0]/25 focus:border-[#D4AF37] focus:outline-none transition-all duration-300 font-body font-light rounded-none"
                />
              </div>
            </div>
            {formData.attending === "yes" && (
              <p className="font-body text-[9px] text-[#FAF5F0]/35 font-light -mt-4">
                Indique email ou telefone para contacto e confirmação.
              </p>
            )}

            {/* Input: Attendance */}
            <div className="space-y-2">
              <span className="block font-body text-[10px] uppercase tracking-[0.25em] text-[#FAF5F0]/40 font-light">
                Presença
              </span>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  disabled={rsvpStatus === "sending"}
                  onClick={() => setFormData(prev => ({ ...prev, attending: "yes" }))}
                  className={`py-3.5 border font-body text-xs font-light tracking-widest uppercase transition-all duration-500 cursor-pointer ${
                    formData.attending === "yes"
                      ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]"
                      : "border-[#FAF5F0]/10 text-[#FAF5F0]/60 hover:border-[#FAF5F0]/30"
                  }`}
                >
                  Confirmar
                </button>
                <button
                  type="button"
                  disabled={rsvpStatus === "sending"}
                  onClick={() => setFormData(prev => ({ ...prev, attending: "no" }))}
                  className={`py-3.5 border font-body text-xs font-light tracking-widest uppercase transition-all duration-500 cursor-pointer ${
                    formData.attending === "no"
                      ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]"
                      : "border-[#FAF5F0]/10 text-[#FAF5F0]/60 hover:border-[#FAF5F0]/30"
                  }`}
                >
                  Declinar
                </button>
              </div>
            </div>

            {/* Input: Guests (Only shown if attending is YES) */}
            {formData.attending === "yes" && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-2 overflow-hidden"
              >
                <label 
                  htmlFor="guests" 
                  className="block font-body text-[10px] uppercase tracking-[0.25em] text-[#FAF5F0]/40 font-light"
                >
                  Total de Pessoas
                </label>
                <select
                  id="guests"
                  name="guests"
                  disabled={rsvpStatus === "sending"}
                  value={formData.guests}
                  onChange={handleInputChange}
                  className="w-full bg-[#120A07] border border-[#FAF5F0]/20 py-3 px-3 text-sm text-[#FAF5F0] focus:border-[#D4AF37] focus:outline-none transition-all duration-300 font-body font-light rounded-none cursor-pointer"
                >
                  <option value="1">Apenas eu (1 pessoa)</option>
                  <option value="2">Eu e mais 1 acompanhante (2 pessoas)</option>
                  <option value="3">Eu e mais 2 acompanhantes (3 pessoas)</option>
                </select>
              </motion.div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <p className="font-body text-xs text-red-400 font-light">
                {errorMsg}
              </p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={rsvpStatus === "sending"}
              className="w-full py-4 border border-[#D4AF37]/60 text-[#FAF5F0] hover:text-[#120A07] hover:bg-[#D4AF37] hover:border-[#D4AF37] font-body text-[10px] uppercase tracking-[0.3em] font-light transition-all duration-500 ease-out cursor-pointer flex items-center justify-center gap-3"
            >
              {rsvpStatus === "sending" ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border border-white/20 border-t-white animate-spin" />
                  A enviar...
                </>
              ) : (
                <>
                  <Send size={12} />
                  Enviar Confirmação
                </>
              )}
            </button>
          </motion.form>
        )}

        {/* Footer citation */}
        <motion.p 
          variants={fadeUp}
          className="font-body text-[9px] uppercase tracking-[0.25em] text-[#FAF5F0]/30 mt-16"
        >
          A presença de cada convidado representa a honra e continuidade da nossa história.
        </motion.p>
      </div>
    </motion.section>
  );
}
