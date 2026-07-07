"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useScroll, useSpring, useTransform, useMotionValue } from "motion/react";
import {
  Calendar,
  Clock,
  MapPin,
  Navigation,
  Shirt,
  Send,
} from "lucide-react";
import { formatStudioCredit, formatCopyright, HAXR_AUTH } from "@lib/brand/authorship";
import { useExperience } from "./context";
import { createMotionVariants, defaultViewport } from "./motion";

function formatEventDate(isoDate: string): string {
  const date = new Date(isoDate + "T12:00:00");
  return date.toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function HeroSection() {
  const { introComplete, theme, tokens, config } = useExperience();
  const variants = createMotionVariants(tokens);
  const containerRef = useRef<HTMLDivElement>(null);
  const clientName =
    config.admin?.clientName ??
    config.metadata.title.split("—").pop()?.trim() ??
    config.metadata.title;
  const isMagazine = theme.visuals.composition === "magazine-layout";
  const isCenter = theme.visuals.composition === "center-focus";

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });
  const scrollImageY = useTransform(scrollYProgress, [0, 1], [0, 70]);

  if (!introComplete) return null;

  const nameParts = clientName.split(/[&\s]+/).filter(Boolean);
  const displayName = nameParts.length > 1 ? clientName : nameParts[0] ?? clientName;

  return (
    <motion.section
      ref={containerRef}
      initial="hidden"
      animate="visible"
      variants={variants.staggerContainer}
      className={`relative min-h-screen w-full flex flex-col items-center justify-center px-6 ${tokens.layout.sectionPadding} overflow-hidden z-10`}
      id="hero"
    >
      <div className={`w-full ${tokens.layout.heroGrid}`}>
        <motion.div
          className={`flex flex-col z-20 ${
            isMagazine
              ? "lg:col-span-5 items-center lg:items-start text-center lg:text-left order-2 lg:order-1"
              : isCenter
                ? "items-center text-center"
                : "items-center text-center lg:items-start lg:text-left"
          }`}
        >
          <motion.span
            variants={variants.fadeUp}
            className={`font-body text-[10px] font-light uppercase tracking-[0.4em] mb-4 ${theme.palette.textSecondary}`}
          >
            {theme.copy.heroEyebrow}
          </motion.span>

          <motion.h1
            variants={variants.fadeUp}
            className={`font-display text-xs font-light uppercase tracking-[0.5em] mb-3 ${theme.palette.textPrimary}`}
          >
            {config.metadata.eventType}
          </motion.h1>

          <motion.h2
            variants={variants.fadeUp}
            className={`font-display text-5xl sm:text-6xl md:text-7xl font-extralight tracking-[0.02em] leading-[1.05] ${theme.palette.textPrimary} mb-6`}
          >
            {displayName.includes("&") ? (
              displayName
            ) : (
              <>
                {displayName.split(" ")[0]}
                <br />
                <span className="italic font-normal" style={{ color: theme.colors.accent }}>
                  {displayName.split(" ").slice(1).join(" ") || displayName}
                </span>
              </>
            )}
          </motion.h2>

          <motion.p
            variants={variants.fadeUp}
            className={`font-body text-xs sm:text-sm font-light leading-relaxed max-w-md mb-8 ${theme.palette.textSecondary} opacity-90`}
          >
            {config.metadata.description}
          </motion.p>

          <motion.div variants={variants.fadeUp} className="flex items-center gap-4">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.colors.accent }} />
            <div className="text-left">
              <span className={`block font-body text-[9px] uppercase tracking-wider ${theme.palette.textSecondary} opacity-50`}>
                Presença Solicitada
              </span>
              <span className={`font-body text-xs ${theme.palette.textPrimary} font-medium capitalize`}>
                {formatEventDate(config.metadata.date)}
              </span>
            </div>
          </motion.div>
        </motion.div>

        {isMagazine && theme.assets.heroImage && (
          <div className="lg:col-span-7 flex justify-center items-center z-10 order-1 lg:order-2">
            <motion.div
              style={{ y: scrollImageY }}
              variants={variants.fadeIn}
              className="relative w-[75vw] sm:w-[50vw] md:w-[42vw] lg:w-[32vw] aspect-[2/3] group"
            >
              <HeroFrame />
              <div
                className="relative w-full h-full overflow-hidden border"
                style={{
                  boxShadow: `0 20px 45px ${theme.colors.accent}20`,
                  borderColor: `${theme.colors.accent}18`,
                }}
              >
                <Image
                  src={theme.assets.heroImage}
                  alt={clientName}
                  fill
                  priority
                  sizes="(max-width: 640px) 75vw, (max-width: 1024px) 50vw, 32vw"
                  className="object-cover object-top scale-110 group-hover:scale-[1.18] transition-transform duration-1000"
                />
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </motion.section>
  );
}

function HeroFrame() {
  const { theme, tokens } = useExperience();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const smoothY = useSpring(mouseY, { stiffness: 50, damping: 20 });
  const frameX = useTransform(smoothX, [-0.5, 0.5], [14, -14]);
  const frameY = useTransform(smoothY, [-0.5, 0.5], [14, -14]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX / window.innerWidth - 0.5);
      mouseY.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  if (tokens.layout.frameStyle === "african-shield") {
    return (
      <motion.div style={{ x: frameX, y: frameY }} className="absolute inset-[-12px] -z-10">
        <svg viewBox="0 0 100 120" className="w-full h-full" style={{ color: theme.colors.accent }}>
          <path d="M50 5 L90 25 L90 65 Q90 95 50 115 Q10 95 10 65 L10 25 Z" fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.6" />
        </svg>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        style={{ border: `1px solid ${theme.colors.accent}`, opacity: 0.3, x: frameX, y: frameY }}
        className="absolute inset-[-8px] -z-10"
      />
      <motion.div
        style={{ border: `1.5px solid ${theme.colors.accent}`, opacity: 0.85, x: frameX, y: frameY }}
        className="absolute inset-[-3px] -z-10 group-hover:scale-[1.01] transition-transform"
      />
    </>
  );
}

export function DetailsSection() {
  const { theme, tokens, config } = useExperience();
  const variants = createMotionVariants(tokens);

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={defaultViewport}
      variants={variants.staggerContainer}
      className={`relative w-full ${tokens.layout.sectionPadding} px-6 overflow-hidden z-10 flex flex-col items-center border-t border-b`}
      id="details"
      style={{
        backgroundColor: theme.palette.accentLight,
        borderColor: `${theme.colors.accent}10`,
      }}
    >
      <div className={`${tokens.layout.maxWidth} w-full text-center`}>
        <motion.span
          variants={variants.fadeUp}
          className={`font-body text-[10px] font-light uppercase tracking-[0.45em] mb-4 block ${theme.palette.textSecondary}`}
        >
          OS DETALHES
        </motion.span>

        <motion.h2
          variants={variants.fadeUp}
          className={`font-display text-3xl md:text-4xl font-extralight uppercase tracking-[0.15em] mb-8 ${theme.palette.textPrimary}`}
        >
          {theme.copy.detailsTitle}
        </motion.h2>

        <motion.p
          variants={variants.fadeUp}
          className={`font-body text-sm md:text-base font-light leading-relaxed max-w-2xl mx-auto mb-20 ${theme.palette.textSecondary} italic opacity-90`}
        >
          &ldquo;{theme.copy.detailsQuote}&rdquo;
        </motion.p>

        <div className={`grid grid-cols-1 ${theme.structure === "minimal" ? "md:grid-cols-2" : "md:grid-cols-3"} gap-6 mb-20 max-w-4xl mx-auto`}>
          <DetailCard icon={<Calendar size={20} strokeWidth={1} />} label="Data" value={formatEventDate(config.metadata.date)} />
          <DetailCard icon={<Clock size={20} strokeWidth={1} />} label="Horário" value={config.metadata.time} />
          <DetailCard
            icon={<MapPin size={20} strokeWidth={1} />}
            label="Localização"
            value={config.metadata.location}
            action={{ label: "Ver Mapa", target: "location" }}
          />
        </div>

        {theme.copy.dressCode && (
          <div className="max-w-2xl mx-auto w-full border-t pt-16" style={{ borderColor: `${theme.colors.accent}18` }}>
            <motion.div variants={variants.fadeUp} className={`relative p-8 md:p-12 text-center backdrop-blur-lg shadow-md ${theme.palette.cardBg} ${tokens.layout.cardRadius}`}>
              <Shirt size={22} strokeWidth={1.2} style={{ color: theme.colors.accent }} className="mx-auto mb-4 opacity-70" />
              <span className={`block font-body text-[9px] uppercase tracking-[0.3em] ${theme.palette.textSecondary} opacity-50 mb-3`}>
                {theme.copy.dressCode.label}
              </span>
              <h3 className="font-display italic text-3xl md:text-4xl font-light leading-tight mb-4" style={{ color: theme.colors.primary }}>
                &ldquo;{theme.copy.dressCode.title}&rdquo;
              </h3>
              <p className={`font-body text-[10px] md:text-xs leading-relaxed max-w-sm mx-auto font-light ${theme.palette.textSecondary}`}>
                {theme.copy.dressCode.description}
              </p>
            </motion.div>
          </div>
        )}
      </div>
    </motion.section>
  );
}

function DetailCard({
  icon,
  label,
  value,
  action,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  action?: { label: string; target: string };
}) {
  const { theme, tokens } = useExperience();
  const variants = createMotionVariants(tokens);

  return (
    <motion.div
      variants={variants.fadeUp}
      className={`flex flex-col items-center p-8 backdrop-blur-md ${tokens.layout.cardRadius} transition-all duration-500 shadow-sm ${theme.palette.cardBg}`}
    >
      <div className="w-10 h-10 flex items-center justify-center mb-5" style={{ color: theme.colors.accent }}>
        {icon}
      </div>
      <span className={`text-[9px] uppercase tracking-[0.3em] ${theme.palette.textSecondary} opacity-50 mb-3`}>{label}</span>
      <span className={`font-display text-lg ${theme.palette.textPrimary} font-light leading-tight capitalize`}>{value}</span>
      {action && (
        <button
          type="button"
          onClick={() => document.getElementById(action.target)?.scrollIntoView({ behavior: "smooth" })}
          className="mt-4 text-[9px] uppercase tracking-[0.25em] font-medium underline underline-offset-4 cursor-pointer"
          style={{ color: theme.colors.accent }}
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
}

export function LocationSection() {
  const { theme, tokens } = useExperience();
  const variants = createMotionVariants(tokens);
  const { location } = theme.copy;
  const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(location.mapCoordinates)}&z=16&output=embed`;

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={defaultViewport}
      variants={variants.staggerContainer}
      className={`relative w-full ${tokens.layout.sectionPadding} px-6 flex flex-col items-center bg-white/10`}
      id="location"
    >
      <div className={`${tokens.layout.maxWidth} w-full grid grid-cols-1 md:grid-cols-12 gap-10 items-center`}>
        <div className="md:col-span-5 text-center md:text-left space-y-6">
          <div>
            <span className="text-[9px] font-body uppercase tracking-[0.25em] font-medium" style={{ color: theme.colors.accent }}>
              O Endereço
            </span>
            <h3 className={`font-display text-2xl sm:text-3xl font-light mt-3 ${theme.palette.textPrimary}`}>
              {location.name}
            </h3>
            <p className={`font-body text-xs mt-3 font-light leading-relaxed ${theme.palette.textSecondary}`}>
              {location.address}
            </p>
          </div>
          <p className={`font-body text-[11px] font-light leading-relaxed ${theme.palette.textSecondary} opacity-80`}>
            {location.directions}
          </p>
          <a
            href={location.externalMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-3 w-full py-4 border font-body text-[10px] uppercase tracking-[0.22em] font-medium transition-all duration-500"
            style={{
              borderColor: theme.colors.accent,
              color: theme.colors.accent,
              backgroundColor: `${theme.colors.accent}08`,
            }}
          >
            <Navigation size={11} />
            Como Chegar no Mapa
          </a>
        </div>
        <div className="md:col-span-7 h-72 sm:h-80 md:h-96 relative border overflow-hidden shadow-lg" style={{ borderColor: `${theme.colors.accent}18` }}>
          <iframe
            title={`Localização — ${location.name}`}
            src={mapEmbedUrl}
            width="100%"
            height="100%"
            style={{ border: 0, filter: location.mapFilter }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </motion.section>
  );
}

export function RSVPSection() {
  const { rsvpStatus, setRsvpStatus, theme, tokens, config } = useExperience();
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
  const [submittedData, setSubmittedData] = useState<{
    name: string;
    attending: boolean;
    guests: number;
  } | null>(null);

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
      setSubmittedData({
        name: formData.name,
        attending: formData.attending === "yes",
        guests: formData.attending === "yes" ? parseInt(formData.guests, 10) : 0,
      });
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
      className={`relative w-full ${tokens.layout.sectionPadding} px-6 z-10 flex flex-col items-center border-t`}
      id="rsvp"
      style={{ borderColor: `${theme.colors.accent}08` }}
    >
      <div className="max-w-xl w-full text-center">
        <motion.h2 variants={variants.fadeUp} className={`font-display text-3xl md:text-4xl font-extralight uppercase tracking-[0.15em] mb-12 ${theme.palette.textPrimary}`}>
          R.S.V.P.
        </motion.h2>

        {rsvpStatus === "success" && submittedData ? (
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <p className={`font-display text-lg ${theme.palette.textPrimary} mb-4`}>
              {submittedData.attending ? "Presença Confirmada ✓" : "Ausência Registada"}
            </p>
            <p className={`font-body text-sm ${theme.palette.textSecondary}`}>{submittedData.name}</p>
          </motion.div>
        ) : (
          <motion.form variants={variants.fadeUp} onSubmit={handleSubmit} className={`text-left space-y-8 p-8 shadow-sm ${theme.palette.cardBg}`}>
            <input type="text" name="honeypot" value={formData.honeypot} onChange={(e) => setFormData((p) => ({ ...p, honeypot: e.target.value }))} className="hidden" tabIndex={-1} autoComplete="off" />
            <input required name="name" value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} placeholder="Nome completo" className={`w-full bg-transparent border-b py-3 text-sm ${theme.palette.textPrimary} focus:outline-none`} style={{ borderColor: `${theme.colors.primary}15` }} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <input type="email" name="email" value={formData.email} onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))} placeholder="Email" className={`w-full bg-transparent border-b py-3 text-sm ${theme.palette.textPrimary} focus:outline-none`} style={{ borderColor: `${theme.colors.primary}15` }} />
              <input type="tel" name="phone" value={formData.phone} onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))} placeholder="Telefone" className={`w-full bg-transparent border-b py-3 text-sm ${theme.palette.textPrimary} focus:outline-none`} style={{ borderColor: `${theme.colors.primary}15` }} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {(["yes", "no"] as const).map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, attending: val }))}
                  className="py-3.5 border font-body text-xs uppercase tracking-widest transition-all"
                  style={{
                    borderColor: formData.attending === val ? theme.colors.accent : `${theme.colors.primary}10`,
                    color: formData.attending === val ? theme.colors.accent : theme.colors.secondary,
                  }}
                >
                  {val === "yes" ? "Confirmar" : "Declinar"}
                </button>
              ))}
            </div>
            {errorMsg && <p className="text-xs text-red-500">{errorMsg}</p>}
            <button type="submit" disabled={rsvpStatus === "sending"} className="w-full py-4 border font-body text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all" style={{ borderColor: theme.colors.primary, color: theme.colors.primary }}>
              <Send size={12} />
              {rsvpStatus === "sending" ? "A enviar..." : "Enviar Confirmação"}
            </button>
          </motion.form>
        )}

        <motion.p variants={variants.fadeUp} className={`font-body text-[9px] uppercase tracking-[0.25em] ${theme.palette.textSecondary} opacity-40 mt-16`}>
          {theme.copy.rsvpClosing}
        </motion.p>
      </div>
    </motion.section>
  );
}

export function FooterSection() {
  const { theme, tokens, config } = useExperience();
  const variants = createMotionVariants(tokens);

  return (
    <motion.footer
      variants={variants.staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={defaultViewport}
      className="relative w-full pb-12 pt-24 border-t z-10 bg-white/20"
      style={{ borderColor: `${theme.colors.accent}08` }}
    >
      <div className={`mx-auto ${tokens.layout.maxWidth} px-6 md:px-12`}>
        <div className="flex flex-col items-center mb-16">
          <div className="relative w-48 h-48">
            <Image src={theme.assets.logoImage} alt={HAXR_AUTH.brand} fill className="object-contain" />
          </div>
          <p className="font-body text-[8px] tracking-[0.35em] uppercase -mt-4 text-black/30">{HAXR_AUTH.tagline}</p>
        </div>
        <motion.div variants={variants.fadeIn} className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t text-center sm:text-left" style={{ borderColor: `${theme.colors.accent}08` }}>
          <p className="font-body text-[9px] tracking-[0.2em] text-black/25">{formatCopyright()}</p>
          <p className="font-body text-[8px] tracking-[0.15em] text-black/20">{formatStudioCredit()}</p>
          <p className="font-body text-[8px] tracking-[0.25em]" style={{ color: `${theme.colors.accent}80` }}>
            {config.metadata.subtitle}
          </p>
        </motion.div>
      </div>
    </motion.footer>
  );
}
