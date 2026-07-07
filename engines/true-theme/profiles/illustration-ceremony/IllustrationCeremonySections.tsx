"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { Calendar, Clock, MapPin, Navigation, Send, Sparkles } from "lucide-react";
import { formatCopyright, formatStudioCredit, HAXR_AUTH } from "@lib/brand/authorship";
import { useExperience } from "../../context";
import { createMotionVariants, defaultViewport } from "../../motion";
import {
  IllustratedBride,
  InvitationCardFrame,
  IllustratedMapFrame,
  CelebrationBurst,
  LingerieSymbol,
} from "../../illustrations/BrideIllustrations";
import { IllustrationHeroScene } from "./IllustrationHeroScene";

function formatEventDate(isoDate: string): string {
  const date = new Date(isoDate + "T12:00:00");
  return date.toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** @deprecated Use IllustrationHeroScene — kept as alias for composition stability */
export function StoryRevealScene() {
  return <IllustrationHeroScene />;
}

export function InvitationCardDetailsScene() {
  const { theme, tokens, config } = useExperience();
  const variants = createMotionVariants(tokens);

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={defaultViewport}
      variants={variants.staggerContainer}
      className="relative py-28 md:py-36 px-6 flex flex-col items-center overflow-hidden bg-[#F7F1EC]"
      id="details"
    >
      <motion.span variants={variants.fadeUp} className="text-[10px] uppercase tracking-[0.4em] mb-12 text-[#A24B5A] font-semibold">
        {theme.copy.detailsTitle}
      </motion.span>

      <motion.div variants={variants.fadeUp} className="relative w-full max-w-md mx-auto">
        <InvitationCardFrame className="absolute inset-0 w-full h-full" accent={theme.colors.accent} primary={theme.colors.primary} fill="rgba(247, 241, 236, 0.75)" />
        <div className="relative z-10 p-10 md:p-14 text-center bg-[#F7F1EC]/65 backdrop-blur-xl border border-[#B89B5E]/30 rounded-lg shadow-[0_20px_50px_rgba(28,22,18,0.06)] m-4 overflow-hidden">
          
          <div className="flex justify-center mb-6">
            <div className="w-10 h-10 rounded-full border border-[#B89B5E]/40 flex items-center justify-center font-display italic text-sm text-[#B89B5E]">
              {theme.assets.monogram}
            </div>
          </div>

          <span className="font-display text-xs uppercase tracking-[0.35em] text-[#A24B5A] font-semibold">
            {config.metadata.eventType}
          </span>
          <div className="w-16 h-px mx-auto my-6 bg-gradient-to-r from-transparent via-[#B89B5E]/50 to-transparent" />
          
          <div className="space-y-4 font-body text-left max-w-xs mx-auto">
            <DetailRow icon={<Calendar size={16} strokeWidth={1.2} />} label="Data" value={formatEventDate(config.metadata.date)} />
            <DetailRow icon={<Clock size={16} strokeWidth={1.2} />} label="Horário" value={config.metadata.time} />
            <DetailRow icon={<MapPin size={16} strokeWidth={1.2} />} label="Local" value={config.metadata.location} />
          </div>

          <p className="mt-10 font-display italic text-xs leading-relaxed text-[#1C1612] opacity-80 max-w-xs mx-auto">
            &ldquo;{theme.copy.detailsQuote}&rdquo;
          </p>
        </div>
      </motion.div>
    </motion.section>
  );
}

interface DetailRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function DetailRow({ icon, label, value }: DetailRowProps) {
  return (
    <div className="flex gap-4 items-center justify-start border-b border-[#B89B5E]/15 py-3.5 last:border-b-0">
      <div className="text-[#B89B5E] shrink-0">{icon}</div>
      <div className="text-left">
        <span className="block text-[8px] font-body uppercase tracking-[0.25em] text-[#A24B5A] font-medium mb-0.5">{label}</span>
        <p className="text-xs font-semibold text-[#1C1612] capitalize leading-snug">{value}</p>
      </div>
    </div>
  );
}

export function DressCodeMoodBoardScene() {
  const { theme, tokens } = useExperience();
  const variants = createMotionVariants(tokens);
  const dress = theme.copy.dressCode;
  if (!dress) return null;

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={defaultViewport}
      variants={variants.staggerContainer}
      className="relative py-28 md:py-36 px-6 bg-[#F7F1EC]"
      id="dress-code"
    >
      <div className="max-w-4xl mx-auto space-y-12">
        <motion.div variants={variants.fadeUp} className="text-center space-y-3">
          <span className="text-[10px] uppercase tracking-[0.45em] text-[#B89B5E] font-medium">
            {dress.label}
          </span>
          <h3 className="font-display italic text-3xl sm:text-4xl text-[#1C1612]">
            One piece in Pink — Elegância em tom de celebração
          </h3>
          <p className="font-body text-xs font-light leading-relaxed max-w-md mx-auto text-[#A24B5A] opacity-90">
            {dress.description}
          </p>
        </motion.div>

        {/* Curated Fashion Mood Board Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          
          {/* Asymmetrical Left Panel: Fabric Flow Illustration */}
          <motion.div
            variants={variants.fadeUp}
            className="relative bg-[#E9DDCF]/40 border border-[#B89B5E]/20 p-8 flex flex-col justify-between rounded-lg overflow-hidden min-h-[250px] shadow-sm"
          >
            <div className="absolute inset-0 opacity-[0.03] pattern-overlay pointer-events-none" />
            <div className="opacity-40">
              <LingerieSymbol className="w-16 h-12" accent={theme.colors.accent} />
            </div>
            <div className="space-y-2 relative z-10">
              <span className="text-[8px] font-body uppercase tracking-[0.25em] text-[#A24B5A] font-semibold">Fabric & Textures</span>
              <h4 className="font-display italic text-lg text-[#1C1612] leading-tight">Seda, Tule e Linho Fino</h4>
              <p className="text-[10px] text-[#1C1612] opacity-75">Caimentos fluidos e leves para uma tarde editorial de pura elegância.</p>
            </div>
          </motion.div>

          {/* Asymmetrical Center Panel: Silhouette Visual Focus */}
          <motion.div
            variants={variants.fadeUp}
            className="bg-[#1C1612] text-[#F7F1EC] p-8 flex flex-col justify-between rounded-lg relative overflow-hidden min-h-[250px] shadow-md border border-[#B89B5E]/20"
          >
            <div className="absolute right-0 bottom-0 opacity-20 translate-x-4 translate-y-4">
              <IllustratedBride className="w-36 h-36" accent={theme.colors.accent} primary="#F7F1EC" fill="none" />
            </div>
            <div className="space-y-1">
              <Sparkles size={16} className="text-[#B89B5E] opacity-80" />
              <span className="block text-[8px] font-body uppercase tracking-[0.25em] text-[#B89B5E] font-semibold">Mood Board Concept</span>
            </div>
            <div className="space-y-2 relative z-10">
              <h4 className="font-display text-2xl font-light text-[#F7F1EC] leading-tight">Silhueta Feminina</h4>
              <p className="text-[10px] text-[#E9DDCF]/80 leading-relaxed">Formatos orgânicos e traços minimalistas em comemoração ao autocuidado.</p>
            </div>
          </motion.div>

          {/* Asymmetrical Right Panel: Pink Tonal Swatches (Editorial Strips) */}
          <motion.div
            variants={variants.fadeUp}
            className="bg-white/40 border border-[#B89B5E]/20 p-6 rounded-lg shadow-sm flex flex-col justify-between min-h-[250px]"
          >
            <span className="text-[8px] font-body uppercase tracking-[0.25em] text-[#A24B5A] font-semibold mb-4 block">Paleta Editorial</span>
            
            <div className="grid grid-cols-5 gap-1.5 h-36 items-stretch flex-1">
              {[
                { color: "#FFE4EB", name: "Blush Light" },
                { color: "#F5A8B8", name: "Soft Blush" },
                { color: "#D9A6B3", name: "Blush Accent" },
                { color: "#A24B5A", name: "Deep Rose" },
                { color: "#E9DDCF", name: "Champagne" }
              ].map((swatch) => (
                <div key={swatch.color} className="flex flex-col justify-between items-center py-2 bg-[#F7F1EC]/60 border border-[#B89B5E]/10 rounded-sm">
                  <div className="w-3 h-10 rounded-full border border-white/50 shadow-sm shrink-0" style={{ backgroundColor: swatch.color }} />
                  <span className="text-[7px] uppercase tracking-widest text-[#1C1612] select-none font-medium mt-2 whitespace-nowrap" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
                    {swatch.name}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-4 text-center">
              <span className="text-[9px] uppercase tracking-widest text-[#B89B5E] font-semibold">Tonal Pink Spectrum</span>
            </div>
          </motion.div>

        </div>
      </div>
    </motion.section>
  );
}

export function IllustratedLocationScene() {
  const { theme, tokens } = useExperience();
  const variants = createMotionVariants(tokens);
  const { location } = theme.copy;

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={defaultViewport}
      variants={variants.staggerContainer}
      className="relative py-28 md:py-36 px-6 bg-[#F7F1EC]"
      id="location"
    >
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <motion.div variants={variants.fadeUp} className="text-center md:text-left space-y-6">
          <div>
            <span className="text-[10px] uppercase tracking-[0.35em] text-[#B89B5E] font-medium">
              The Journey
            </span>
            <h3 className="font-display text-3xl font-light mt-3 mb-4 text-[#1C1612]">
              {location.name}
            </h3>
            <p className="font-body text-xs font-medium text-[#A24B5A]">
              {location.address}
            </p>
            <p className="font-body text-xs mt-4 font-light text-[#1C1612]/70 leading-relaxed max-w-sm">
              {location.directions}
            </p>
          </div>
          
          <a
            href={location.externalMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-3 mt-4 px-8 py-4 border border-[#B89B5E] font-body text-[10px] uppercase tracking-[0.28em] transition-all duration-500 hover:bg-[#B89B5E] hover:text-[#F7F1EC] rounded-xs font-semibold"
            style={{ color: "#1C1612", backgroundColor: "rgba(184, 155, 94, 0.05)" }}
          >
            <Navigation size={12} />
            Open Journey
          </a>
        </motion.div>

        <motion.div variants={variants.fadeIn} className="relative max-w-sm mx-auto w-full">
          {/* Ambient glow beneath the map */}
          <div className="absolute inset-0 bg-[#B89B5E]/5 blur-lg rounded-lg -z-10" />
          <IllustratedMapFrame className="w-full h-auto drop-shadow-md" accent={theme.colors.accent} primary={theme.colors.primary} fill="rgba(247, 241, 236, 0.8)" />
          
          {/* Animated map pin marker */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <MapPin size={32} strokeWidth={1.2} style={{ color: theme.colors.secondary }} />
            <div className="absolute top-2 left-2 w-4 h-4 bg-[#A24B5A]/20 rounded-full animate-ping pointer-events-none" />
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
}

export function EmotionalRSVPScene() {
  const { theme, tokens, config, rsvpStatus, setRsvpStatus } = useExperience();
  const variants = createMotionVariants(tokens);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    attending: "yes",
    guests: "1",
    honeypot: "",
  });
  const [errorMsg, setErrorMsg] = useState("");
  const [submittedName, setSubmittedName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRsvpStatus("sending");
    setErrorMsg("");
    try {
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          attending: formData.attending === "yes",
          guests: formData.attending === "yes" ? parseInt(formData.guests, 10) : 0,
          honeypot: formData.honeypot,
          slug: config.slug,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao processar RSVP.");
      setSubmittedName(formData.name);
      setRsvpStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erro de ligação.");
      setRsvpStatus("error");
    }
  };

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={defaultViewport}
      variants={variants.staggerContainer}
      className="relative py-28 md:py-36 px-6 overflow-hidden bg-[#F7F1EC]"
      id="rsvp"
    >
      <CelebrationBurst className="absolute top-10 right-[8%] w-32 h-32 opacity-15 pointer-events-none" accent={theme.colors.accent} />
      <CelebrationBurst className="absolute bottom-10 left-[6%] w-24 h-24 opacity-10 pointer-events-none" accent={theme.colors.accent} />

      <div className="max-w-md mx-auto text-center relative z-10">
        <motion.span variants={variants.fadeUp} className="text-[10px] uppercase tracking-[0.45em] text-[#B89B5E] block mb-4 font-semibold">
          R.S.V.P.
        </motion.span>

        {rsvpStatus === "success" ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="py-12 px-6 bg-[#1C1612] border border-[#B89B5E]/30 rounded-lg shadow-2xl space-y-6 text-center text-[#F7F1EC]"
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="w-24 h-24 mx-auto mb-6 opacity-80"
            >
              <CelebrationBurst className="w-full h-full" accent="#B89B5E" />
            </motion.div>
            <h3 className="font-display text-2xl font-light tracking-wide text-[#B89B5E]">
              Presença Confirmada
            </h3>
            <div className="w-12 h-px bg-[#B89B5E]/40 mx-auto my-4" />
            <p className="font-display italic text-[#E9DDCF] max-w-sm mx-auto leading-relaxed">
              “Que a sua energia abençoe esta transição.”
            </p>
            <p className="font-body text-xs tracking-widest uppercase text-white/50 pt-4">
              {submittedName}
            </p>
          </motion.div>
        ) : (
          <motion.form
            variants={variants.fadeUp}
            onSubmit={handleSubmit}
            className="text-left space-y-6 p-8 md:p-12 bg-[#1C1612] border border-[#B89B5E]/30 rounded-lg shadow-2xl relative overflow-hidden"
          >
            {/* Subtle light bloom in input background */}
            <div className="absolute -right-20 -top-20 w-40 h-40 rounded-full filter blur-[40px] opacity-15 pointer-events-none" style={{ background: "radial-gradient(circle, #B89B5E 0%, transparent 100%)" }} />

            <div className="space-y-4">
              <input
                required
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                placeholder="Nome completo"
                className="w-full bg-transparent border-b py-3 text-sm text-[#F7F1EC] placeholder-white/30 focus:outline-none focus:border-[#B89B5E] focus:shadow-[0_2px_10px_rgba(184,155,94,0.15)] transition-all duration-300"
                style={{ borderColor: "rgba(184, 155, 94, 0.25)" }}
              />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                placeholder="Email"
                className="w-full bg-transparent border-b py-3 text-sm text-[#F7F1EC] placeholder-white/30 focus:outline-none focus:border-[#B89B5E] focus:shadow-[0_2px_10px_rgba(184,155,94,0.15)] transition-all duration-300"
                style={{ borderColor: "rgba(184, 155, 94, 0.25)" }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {(["yes", "no"] as const).map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, attending: val }))}
                  className="py-3 border text-xs uppercase tracking-widest transition-all duration-300 font-semibold rounded-xs"
                  style={{
                    borderColor: formData.attending === val ? "#B89B5E" : "rgba(247, 241, 236, 0.1)",
                    color: formData.attending === val ? "#B89B5E" : "rgba(247, 241, 236, 0.6)",
                    backgroundColor: formData.attending === val ? "rgba(184, 155, 94, 0.08)" : "transparent"
                  }}
                >
                  {val === "yes" ? "Confirmar" : "Declinar"}
                </button>
              ))}
            </div>

            {errorMsg && <p className="text-xs text-red-400 font-medium">{errorMsg}</p>}

            <button
              type="submit"
              disabled={rsvpStatus === "sending"}
              className="w-full py-4 flex items-center justify-center gap-2 border text-[10px] uppercase tracking-[0.3em] transition-all duration-500 hover:bg-[#B89B5E] hover:text-[#1C1612] font-bold rounded-xs cursor-pointer"
              style={{ borderColor: "#B89B5E", color: "#B89B5E", backgroundColor: "transparent" }}
            >
              <Send size={12} />
              {rsvpStatus === "sending" ? "A enviar..." : "Enviar Confirmação"}
            </button>
          </motion.form>
        )}

        <motion.p variants={variants.fadeUp} className="text-[9px] uppercase tracking-[0.25em] mt-12 opacity-50 text-[#A24B5A] font-semibold">
          {theme.copy.rsvpClosing}
        </motion.p>
      </div>
    </motion.section>
  );
}

export function IllustrationFooterScene() {
  const { theme, tokens, config } = useExperience();
  const variants = createMotionVariants(tokens);

  return (
    <motion.footer
      initial="hidden"
      whileInView="visible"
      viewport={defaultViewport}
      variants={variants.staggerContainer}
      className="relative py-20 px-6 border-t bg-[#F7F1EC]"
      style={{ borderColor: `${theme.colors.accent}25` }}
    >
      <div className="max-w-md mx-auto flex flex-col items-center text-center space-y-4">
        <div className="relative w-36 h-36 mb-2">
          <Image src={theme.assets.logoImage} alt={HAXR_AUTH.brand} fill className="object-contain opacity-90" />
        </div>
        <p className="text-[8px] tracking-[0.35em] uppercase text-[#1C1612] opacity-40">{HAXR_AUTH.tagline}</p>
        
        <div className="pt-4 space-y-1">
          <p className="text-[9px] text-[#1C1612] opacity-35">{formatCopyright()}</p>
          <p className="text-[8px] text-[#1C1612] opacity-30">{formatStudioCredit()}</p>
          <p className="text-[8px] text-[#A24B5A] font-semibold tracking-[0.2em] uppercase pt-2">{config.metadata.subtitle}</p>
        </div>
      </div>
    </motion.footer>
  );
}

export function IllustrationCeremonyExperience() {
  return (
    <>
      <IllustrationHeroScene />
      <InvitationCardDetailsScene />
      <DressCodeMoodBoardScene />
      <IllustratedLocationScene />
      <EmotionalRSVPScene />
      <IllustrationFooterScene />
    </>
  );
}

