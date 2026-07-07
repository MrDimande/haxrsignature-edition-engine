"use client";

import { Flower2, Shirt } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import { useExperience } from "../../context";
import { roseType } from "./rose-typography";

import {
  cinematicRevealVariants,
  cinematicStagger
} from "./rose-motion";

const DRESS_CODE_REFERENCES = [
  {
    src: "/images/rose-elegance/dress-code/referencia-vestido-destaque.png",
    alt: "Referência — vestido rosa em camadas",
    label: "Referência 01",
    title: "Vestido rosa",
    caption:
      "Vestido longo em tons de rosa — uma peça só já cumpre o dress code.",
    featured: true,
  },
  {
    src: "/images/rose-elegance/dress-code/referencia-mini-rosa.png",
    alt: "Referência — mini vestido rosa",
    label: "Referência 02",
    title: "Mini vestido rosa",
    caption: "Curto e vibrante — uma peça rosa conta, mesmo em look casual.",
    featured: false,
  },
  {
    src: "/images/rose-elegance/dress-code/referencia-vestido-rosa.png",
    alt: "Referência — vestido comprido rosa",
    label: "Referência 03",
    title: "Vestido comprido",
    caption: "Comprido ou midi — o importante é a peça em tons de rosa.",
    featured: false,
  },
] as const;

function DressCodeReferenceCard({
  src,
  alt,
  label,
  title,
  caption,
  featured,
  accent,
}: {
  src: string;
  alt: string;
  label: string;
  title: string;
  caption: string;
  featured?: boolean;
  accent: string;
}) {
  return (
    <figure
      className={`group relative overflow-hidden rounded-sm border border-black/5 shadow-sm bg-white ${
        featured ? "lg:row-span-2" : ""
      }`}
    >
      <div className={`relative w-full ${featured ? "aspect-[3/4] lg:min-h-full lg:h-full" : "aspect-[3/4]"}`}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes={featured ? "(max-width: 1024px) 100vw, 280px" : "(max-width: 1024px) 50vw, 220px"}
          className="object-cover object-top transition-transform duration-[1.4s] ease-out group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#2D1D21]/55 via-[#2D1D21]/10 to-transparent" />
        <span className="absolute top-3 left-3 text-[8px] sm:text-[9px] uppercase tracking-[0.24em] text-white/85 font-mono">
          {label}
        </span>
      </div>
      <figcaption className="absolute bottom-0 left-0 right-0 p-4 text-white">
        <p className="font-display italic text-[11px] sm:text-xs tracking-[0.04em] mb-1">{title}</p>
        <p className="font-body text-[10px] leading-relaxed opacity-90">{caption}</p>
      </figcaption>
      <div
        className="absolute top-3 right-3 w-6 h-px opacity-60"
        style={{ backgroundColor: accent }}
      />
    </figure>
  );
}

export function DressCodeExperienceLayer() {
  const { theme } = useExperience();
  const dress = theme.copy.dressCode;

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.12 }}
      variants={cinematicStagger}
      className={`relative w-full py-14 md:py-20 px-5 sm:px-6 flex flex-col items-center z-10 scroll-mt-6 ${theme.palette.textPrimary}`}
      id="dress-code"
    >
      <motion.span
        variants={cinematicRevealVariants}
        className={`${roseType.sectionLabel} mb-4 ${theme.palette.textSecondary}`}
      >
        {dress?.label ?? "Dress code"}
      </motion.span>

      <motion.h2
        variants={cinematicRevealVariants}
        className={`${roseType.sectionTitle} mb-3 text-center ${theme.palette.textPrimary}`}
      >
        {dress?.title ?? "Uma peça rosa"}
      </motion.h2>

      <motion.p
        variants={cinematicRevealVariants}
        className={`font-display italic text-[11px] tracking-[0.18em] mb-6 text-center ${theme.palette.textSecondary} opacity-75`}
      >
        Paleta · tons de rosa
      </motion.p>

      <motion.div
        variants={cinematicRevealVariants}
        className="max-w-2xl w-full mb-8 md:mb-10 px-5 py-4 border rounded-sm text-center"
        style={{
          borderColor: `${theme.colors.accent}25`,
          backgroundColor: `${theme.colors.secondary}10`,
        }}
      >
        <p
          className={`font-display italic text-sm sm:text-base font-light ${theme.palette.textPrimary} mb-1`}
        >
          Obrigatório: <span className="not-italic font-normal" style={{ color: theme.colors.secondary }}>uma peça rosa</span>
        </p>
        <p className={`font-body text-xs sm:text-sm leading-relaxed ${theme.palette.textSecondary} opacity-90`}>
          Blusa, saia, vestido, blazer ou outra peça em tons de rosa. Não é
          necessário estar toda de rosa, o branco fica reservado à noiva.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10 max-w-5xl w-full items-start">
        {/* Referências visuais */}
        <motion.div
          variants={cinematicStagger}
          className="lg:col-span-7 grid grid-cols-2 lg:grid-rows-2 gap-2.5 md:gap-4 w-full max-w-xl mx-auto lg:max-w-none"
        >
          {DRESS_CODE_REFERENCES.map((ref) => (
            <motion.div
              key={ref.src}
              variants={cinematicRevealVariants}
              className={ref.featured ? "col-span-2 lg:col-span-1 lg:row-span-2" : "col-span-1"}
            >
              <DressCodeReferenceCard {...ref} accent={theme.colors.accent} />
            </motion.div>
          ))}
        </motion.div>

        {/* Diretrizes */}
        <motion.div
          variants={cinematicRevealVariants}
          className="lg:col-span-5 space-y-5 flex flex-col max-w-md mx-auto lg:mx-0 w-full"
        >
          <div className="space-y-3">
            <h3
              className={`text-[10px] sm:text-[11px] uppercase tracking-[0.22em] font-semibold ${theme.palette.textPrimary} opacity-80`}
            >
              Como interpretar
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div
                  className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
                  style={{ backgroundColor: theme.colors.secondary }}
                />
                <p className={`text-[11px] leading-relaxed font-light ${theme.palette.textPrimary}`}>
                  <strong className="font-medium">Uma peça rosa</strong> — mínimo
                  exigido. Pode ser a peça principal do look ou um destaque
                  (blazer, blusa, saia…).
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div
                  className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
                  style={{ backgroundColor: theme.colors.accent }}
                />
                <p className={`text-[11px] leading-relaxed font-light ${theme.palette.textPrimary}`}>
                  <strong className="font-medium">Branco só para a noiva</strong>{" "}
                  — as convidadas escolhem o resto do look em tons neutros ou
                  rosa; evite cores fora do tema.
                </p>
              </div>
            </div>
          </div>

          <div
            className={`p-4 sm:p-5 border rounded-sm space-y-2.5 ${theme.palette.cardBg}`}
            style={{
              borderColor: `${theme.colors.accent}22`,
            }}
          >
            <div
              className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-semibold"
              style={{ color: theme.colors.accent }}
            >
              <Shirt size={13} />
              <span>Resumo</span>
            </div>
            <ul
              className={`text-[11px] sm:text-xs space-y-2 leading-relaxed font-light ${theme.palette.textPrimary}`}
            >
              <li>✓ Pelo menos uma peça de vestuário rosa</li>
              <li>✓ Branco reservado à noiva</li>
              <li className={theme.palette.textSecondary}>
                ✗ Evitar preto, azul marinho ou vermelho forte
              </li>
            </ul>
          </div>

          <div
            className={`flex items-start gap-2.5 p-4 rounded-sm border ${theme.palette.cardBg}`}
            style={{
              borderColor: `${theme.colors.secondary}30`,
            }}
          >
            <Flower2
              size={14}
              className="shrink-0 mt-0.5"
              strokeWidth={1.4}
              style={{ color: theme.colors.secondary }}
            />
            <p
              className={`font-display italic text-[11px] sm:text-xs leading-relaxed ${theme.palette.textSecondary}`}
            >
              {dress?.description ??
                "Cada convidada contribui para uma composição visual harmoniosa, delicada e elegante."}
            </p>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}
