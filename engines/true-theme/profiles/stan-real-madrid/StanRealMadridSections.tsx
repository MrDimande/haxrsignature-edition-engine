"use client";

import React, { useState } from "react";
import Image from "next/image";
import { AtSign, Globe, Mail, Music2 } from "lucide-react";
import {
  formatCopyright,
  formatStudioCredit,
  HAXR_AUTH,
} from "@lib/brand/authorship";
import { useExperience } from "../../context";
import {
  STAN_CHAPTERS_DATA,
  STAN_CLOSING_PHOTO,
  STAN_IDOL_PHOTOS,
  isValidStanImageSrc,
  type StanChapter,
  type StanPhoto,
} from "./stan-gallery-data";
import { StanRSVPSection } from "./StanRSVP";
import { STAN_ASSETS_MANIFEST } from "@lib/stan/assets-manifest";

export { StanRSVPSection };
export { StanRitualGate as StanGateOverlay } from "./StanRitualGate";
export { StanHeroSection } from "./StanHero";
export { StanMatchdaySection } from "./StanMatchday";
export { StanGiftsSection } from "./StanGiftsCountdown";

const READY_STAN_SRC = new Set(
  STAN_ASSETS_MANIFEST.filter(
    (asset) =>
      asset.status === "received" ||
      asset.status === "approved" ||
      asset.status === "generated"
  ).map((asset) => asset.file)
);

function isStanPhotoReady(src: string): boolean {
  return READY_STAN_SRC.has(src);
}

function PhotoFallback({
  label,
  aspect,
}: {
  label: string;
  aspect: string;
}) {
  return (
    <div
      className={`relative w-full ${aspect} rounded-2xl overflow-hidden border border-[#C59B27]/25 bg-gradient-to-br from-[#1C2541]/40 via-[#0B132B]/30 to-[#C59B27]/10 flex flex-col items-center justify-center gap-2 px-6 text-center`}
      role="img"
      aria-label={`${label} — fotografia a carregar`}
    >
      <span className="font-display text-3xl text-[#C59B27]/50">5</span>
      <span className="font-body text-[10px] uppercase tracking-[0.25em] text-[#94A3B8]">
        Fotografia em breve
      </span>
    </div>
  );
}

function PhotoFrame({
  photo,
  aspect,
  priority = false,
}: {
  photo: StanPhoto;
  aspect: string;
  priority?: boolean;
}) {
  const valid = isValidStanImageSrc(photo.src);
  const ready = isStanPhotoReady(photo.src);
  const [failed, setFailed] = useState(!valid || !ready);

  if (failed) {
    return <PhotoFallback label={photo.alt} aspect={aspect} />;
  }

  return (
    <div
      className={`relative w-full ${aspect} rounded-2xl overflow-hidden bg-[#E2E8F0]/30 border border-[#C59B27]/25 shadow-lg group`}
    >
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        priority={priority}
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
        style={
          photo.focalPosition
            ? { objectPosition: photo.focalPosition }
            : undefined
        }
        onError={() => setFailed(true)}
      />
    </div>
  );
}

/** 02. HISTÓRIA EDITORIAL — 5 CAPÍTULOS */
export function StanChaptersSection() {
  return (
    <section className="w-full">
      {STAN_CHAPTERS_DATA.map((chapter) => (
        <ChapterBlock key={chapter.id} chapter={chapter} />
      ))}
    </section>
  );
}

function ChapterBlock({ chapter }: { chapter: StanChapter }) {
  const isDark = chapter.bgTheme === "dark";

  return (
    <div
      id={chapter.id}
      className={`w-full py-24 sm:py-32 px-6 border-t border-[#C59B27]/15 ${
        isDark ? "bg-[#0B132B] text-[#F8F6F0]" : "bg-[#F8F6F0] text-[#1C2541]"
      }`}
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex items-baseline gap-4 mb-12">
          <span className="font-display text-5xl sm:text-7xl font-extrabold text-[#C59B27] opacity-90">
            {chapter.chapterNumber}
          </span>
          <div>
            <span className="font-body text-[10px] uppercase tracking-[0.3em] text-[#C59B27] font-semibold block">
              {chapter.subtitle}
            </span>
            <h2
              className={`font-display text-3xl sm:text-4xl font-light ${
                isDark ? "text-[#F8F6F0]" : "text-[#1C2541]"
              }`}
            >
              {chapter.title}
            </h2>
          </div>
        </div>

        {chapter.layoutType === "single-vertical" && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-8">
              <PhotoFrame photo={chapter.primaryPhoto} aspect="aspect-[3/4]" />
            </div>
            <div className="md:col-span-4 space-y-4">
              {chapter.primaryPhoto.caption && (
                <p className="font-body text-xs sm:text-sm font-light opacity-80 leading-relaxed italic">
                  &ldquo;{chapter.primaryPhoto.caption}&rdquo;
                </p>
              )}
            </div>
          </div>
        )}

        {chapter.layoutType === "asymmetric-duo" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center">
            <PhotoFrame photo={chapter.primaryPhoto} aspect="aspect-[3/4]" />
            {chapter.secondaryPhotos?.[0] && (
              <div className="sm:translate-y-8">
                <PhotoFrame
                  photo={chapter.secondaryPhotos[0]}
                  aspect="aspect-square"
                />
              </div>
            )}
          </div>
        )}

        {chapter.layoutType === "full-horizontal" && (
          <div className="w-full space-y-4">
            <PhotoFrame photo={chapter.primaryPhoto} aspect="aspect-[16/9]" />
            {chapter.primaryPhoto.caption && (
              <p className="font-body text-xs font-light opacity-75 max-w-lg">
                {chapter.primaryPhoto.caption}
              </p>
            )}
          </div>
        )}

        {chapter.layoutType === "editorial-mosaic" && (
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
            <div className="sm:col-span-7">
              <PhotoFrame photo={chapter.primaryPhoto} aspect="aspect-[3/4]" />
            </div>
            <div className="sm:col-span-5">
              {chapter.secondaryPhotos?.[0] && (
                <PhotoFrame
                  photo={chapter.secondaryPhotos[0]}
                  aspect="aspect-square"
                />
              )}
            </div>
          </div>
        )}

        {chapter.layoutType === "portrait-hero" && (
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <PhotoFrame photo={chapter.primaryPhoto} aspect="aspect-[3/4]" />
            {chapter.primaryPhoto.caption && (
              <p className="font-display italic text-lg opacity-90">
                {chapter.primaryPhoto.caption}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** 03. ÍDOLOS — Stan dominante + Mbappé + CR7 */
export function StanInspirationsSection() {
  return (
    <section
      id="inspiracoes"
      className="relative w-full scroll-mt-24 border-t border-[#C59B27]/20 bg-[#F8F6F0] px-6 py-28 text-center text-[#1C2541] sm:scroll-mt-28"
    >
      <div className="max-w-5xl mx-auto space-y-10">
        <span className="font-body text-[10px] uppercase tracking-[0.4em] text-[#C59B27] font-semibold">
          Inspiração & Paixão
        </span>

        <h2 className="font-display text-3xl sm:text-5xl font-light text-[#1C2541] leading-tight">
          Os campeões que inspiram o pequeno campeão
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-end pt-4">
          <div className="order-2 sm:order-1 opacity-90">
            <PhotoFrame
              photo={STAN_IDOL_PHOTOS.mbappe}
              aspect="aspect-[3/4]"
            />
            <p className="mt-3 font-display text-sm tracking-widest uppercase">
              Kylian Mbappé
            </p>
          </div>

          <div className="order-1 sm:order-2 sm:-translate-y-4">
            <PhotoFrame photo={STAN_IDOL_PHOTOS.stan} aspect="aspect-[3/4]" />
            <p className="mt-3 font-display text-base sm:text-lg font-semibold tracking-widest uppercase text-[#C59B27]">
              Stan
            </p>
          </div>

          <div className="order-3 opacity-90">
            <PhotoFrame
              photo={STAN_IDOL_PHOTOS.cristiano}
              aspect="aspect-[3/4]"
            />
            <p className="mt-3 font-display text-sm tracking-widest uppercase">
              Cristiano Ronaldo
            </p>
          </div>
        </div>

        <p className="font-body text-xs sm:text-sm text-[#64748B] max-w-lg mx-auto leading-relaxed font-light">
          A determinação, a alegria e a energia dos grandes nomes do futebol
          refletidas no sorriso do Stan.
        </p>
      </div>
    </section>
  );
}

/** 04. MATCHDAY — StanMatchday.tsx */
/** 05. PRESENTES + COUNTDOWN — StanGiftsCountdown.tsx */

/** 07. ENCERRAMENTO + assinatura HAXR */
export function StanFooterSection() {
  const { theme } = useExperience();
  const audioCredit =
    theme.audio.type !== "silent" ? theme.audio.credit : undefined;

  const linkClass =
    "inline-flex items-center gap-2 font-body text-[11px] tracking-[0.08em] text-[#0A1628]/70 transition hover:text-[#C9A86A]";

  return (
    <footer
      id="footer"
      className="relative w-full overflow-hidden border-t border-[#C9A86A]/25 bg-[#F7F4EF] px-6 py-24 text-[#0A1628] sm:py-28"
    >
      <div className="relative z-10 mx-auto max-w-4xl space-y-14 text-center">
        <div className="relative mx-auto w-full max-w-sm">
          <PhotoFrame photo={STAN_CLOSING_PHOTO} aspect="aspect-[3/4]" />
        </div>

        <div className="mx-auto max-w-md space-y-4">
          <p className="font-display text-2xl font-light italic leading-snug text-[#0A1628] sm:text-3xl">
            &ldquo;O jogo está prestes a começar. E esta celebração não será a
            mesma sem si.&rdquo;
          </p>
          <p className="font-body text-[10px] font-semibold uppercase tracking-[0.36em] text-[#C9A86A]">
            Stan · 5.º Aniversário
          </p>
        </div>

        <div
          className="mx-auto h-px w-16"
          style={{
            background:
              "linear-gradient(to right, transparent, rgba(201,168,106,0.65), transparent)",
          }}
          aria-hidden
        />

        {/* Assinatura HAXR — Alta-Costura Digital */}
        <div className="mx-auto flex max-w-lg flex-col items-center gap-5">
          <a
            href={HAXR_AUTH.website}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex flex-col items-center"
            aria-label={`${HAXR_AUTH.brand} — site oficial`}
          >
            <div className="relative h-28 w-28 transition-transform duration-500 group-hover:scale-[1.03] sm:h-32 sm:w-32">
              <Image
                src={HAXR_AUTH.assets.logoVertical}
                alt={HAXR_AUTH.brand}
                fill
                sizes="128px"
                className="object-contain"
              />
            </div>
            <p className="-mt-2 font-body text-[9px] font-semibold uppercase tracking-[0.36em] text-[#0A1628]/45">
              {HAXR_AUTH.tagline}
            </p>
          </a>

          <p className="max-w-sm font-body text-[11px] font-light leading-relaxed text-[#5B6B7C]">
            Experiências digitais com intenção, assinatura e elegância.
          </p>

          <nav
            aria-label="HAXR Signature"
            className="flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-6 sm:gap-y-2"
          >
            <a
              href={HAXR_AUTH.website}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              <Globe size={13} strokeWidth={1.5} aria-hidden />
              {HAXR_AUTH.domain}
            </a>
            <a
              href={HAXR_AUTH.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              <AtSign size={13} strokeWidth={1.5} aria-hidden />
              {HAXR_AUTH.social.handle}
            </a>
            <a
              href={`mailto:${HAXR_AUTH.email.convites}`}
              className={linkClass}
            >
              <Mail size={13} strokeWidth={1.5} aria-hidden />
              {HAXR_AUTH.email.convites}
            </a>
          </nav>
        </div>

        {audioCredit ? (
          <aside
            className="mx-auto w-full max-w-md border border-[#C9A86A]/30 bg-[#FFFCFA] px-5 py-5 text-left sm:px-6"
            aria-label="Créditos musicais"
          >
            <div className="flex items-start gap-3">
              <Music2
                size={15}
                strokeWidth={1.4}
                className="mt-0.5 shrink-0 text-[#C9A86A]"
                aria-hidden
              />
              <div className="min-w-0 space-y-2">
                <p className="font-body text-[9px] font-semibold uppercase tracking-[0.32em] text-[#C9A86A]">
                  Hino · Matchday
                </p>
                <p className="font-body text-[13px] leading-snug text-[#0A1628]">
                  <span className="font-display text-[15px] font-light italic">
                    {audioCredit.title}
                  </span>
                  <span className="text-[#0A1628]/40"> · </span>
                  <span className="text-[#5B6B7C]">{audioCredit.artist}</span>
                </p>
                <p className="font-body text-[11px] text-[#5B6B7C]">
                  {audioCredit.rightsHolder}
                </p>
                <p className="border-t border-[#C9A86A]/20 pt-2 font-body text-[10px] font-light leading-relaxed text-[#5B6B7C]/90">
                  {audioCredit.disclaimer}
                </p>
              </div>
            </div>
          </aside>
        ) : null}

        <div className="space-y-1.5 pt-2">
          <p className="font-body text-[9px] uppercase tracking-[0.2em] text-[#0A1628]/40">
            {formatCopyright()}
          </p>
          <p className="font-body text-[9px] uppercase tracking-[0.18em] text-[#0A1628]/35">
            {formatStudioCredit()}
          </p>
        </div>
      </div>
    </footer>
  );
}
