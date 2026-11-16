"use client";

import React, { useState } from "react";
import { AlexandrinaKennethArticlesModal } from "./AlexandrinaKennethArticlesModal";

function HauteCoutureGiftIcon({ className = "w-6 h-6", color = "#d4af37" }: { className?: string; color?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3.5" y="8.5" width="17" height="12.5" rx="1.5" />
      <line x1="12" y1="8.5" x2="12" y2="21" />
      <line x1="3.5" y1="13.5" x2="20.5" y2="13.5" />
      <path d="M12 8.5C10.5 5.5 7.5 4 6 5.5C4.5 7 6.5 8.5 12 8.5Z" />
      <path d="M12 8.5C13.5 5.5 16.5 4 18 5.5C19.5 7 17.5 8.5 12 8.5Z" />
      <circle cx="12" cy="8.5" r="1" fill={color} />
    </svg>
  );
}

export function AlexandrinaKennethGifts() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div
        className="ak-gifts-panel panel gift-box gift-box--premium panel--presentes-layout"
        id="presentes"
        aria-labelledby="presentes-heading"
      >
        <div className="ak-gifts-panel__inner">
          {/* Header com ícone de alta costura */}
          <div className="ak-gifts-header">
            <div className="ak-gifts-tag">
              <span className="ak-gifts-tag__glyph">❖</span>
              <span>Lista &amp; Bênçãos</span>
            </div>
            <h3 id="presentes-heading" className="ak-gifts-title">
              <HauteCoutureGiftIcon className="w-6 h-6 shrink-0" color="#d4af37" />
              <span>Presente de Casamento</span>
            </h3>
            <p className="ak-gifts-lead">
              A vossa presença é a nossa maior bênção e alegria. Para quem desejar mimar o nosso novo
              lar, preparámos com muito amor e carinho a nossa lista oficial de presentes.
            </p>
          </div>

          {/* CTA Principal da Lista Online de Artigos */}
          <div className="ak-gifts-cta-wrap">
            <button
              type="button"
              className="btn presentes-lista-btn ak-gifts-modal-btn cursor-pointer"
              id="openArtigosModal"
              onClick={() => setIsModalOpen(true)}
            >
              <HauteCoutureGiftIcon className="w-4 h-4 shrink-0" color="currentColor" />
              <span>Ver Lista de Presentes</span>
            </button>
            <p className="ak-gifts-modal-hint">
              Escolhe artigos para cozinha, sala de estar e decoração com reserva instantânea.
            </p>
          </div>
        </div>
      </div>

      <AlexandrinaKennethArticlesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
