"use client";

import React, { useRef, useState } from "react";

/* --------------------------------------------------------------------------
   Bespoke Authorial Haute Couture SVG Icons (Rule 1: No generic icons / Sparkles)
   Thin continuous hairline strokes (1.2px) for haute horlogerie elegance
   -------------------------------------------------------------------------- */

function HauteCoutureMapPinIcon({ className = "w-5 h-5", size = 20 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M20 10c0 4.993-5.5 11-8 11s-8-6.007-8-11a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function HauteCoutureCompassIcon({ className = "w-5 h-5", size = 20 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9.5" />
      <polygon points="15.8 8.2 13.4 13.4 8.2 15.8 10.6 10.6 15.8 8.2" strokeWidth="1.2" fill="currentColor" fillOpacity="0.15" />
    </svg>
  );
}

function HauteCoutureClockIcon({ className = "w-4 h-4", size = 18 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9.5" />
      <polyline points="12 6.5 12 12 15.5 14" />
    </svg>
  );
}

function HauteCoutureMapIcon({ className = "w-4 h-4", size = 16 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" y1="3" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="21" />
    </svg>
  );
}

function HauteCoutureNavigationIcon({ className = "w-4 h-4", size = 16 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polygon points="3 11 21 3 13 21 11 13 3 11" />
    </svg>
  );
}

function HauteCoutureVerifiedIcon({ className = "w-3.5 h-3.5", size = 13 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9.5" />
      <polyline points="8 12 11 15 16 9" />
    </svg>
  );
}

function HauteCouturePlusIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function HauteCoutureMinusIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function HauteCoutureResetIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

function HauteCoutureExpandIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  );
}

/* --------------------------------------------------------------------------
   Data
   -------------------------------------------------------------------------- */

interface VenueItem {
  id: string;
  name: string;
  ceremony: string;
  time: string;
  address: string;
  reference: string;
  scheduleNote: string;
  isConfirmed: boolean;
  lat: number;
  lng: number;
}

const VENUES: VenueItem[] = [
  {
    id: "civil",
    name: "3.ª Conservatória do Registo Civil",
    ceremony: "Casamento Civil",
    time: "08h00",
    address: "Rua 5343, Bairro 25 de Junho B, KaMubukwana, Maputo.",
    reference: "Junto ao Mercado 25 de Junho.",
    scheduleNote: "Início pontual às 08h00. Recomenda-se chegada dos convidados às 07h45.",
    isConfirmed: true,
    lat: -25.9096223,
    lng: 32.5674959,
  },
  {
    id: "religioso",
    name: "Igreja Internacional Casa da Glória da Palavra",
    ceremony: "Casamento Religioso",
    time: "10h00",
    address: "Av. de Moçambique, Coqueiros, Zimpeto, KaMubukwana, Maputo.",
    reference: "Perto das bombas da BP, na zona da Missão Roque.",
    scheduleNote: "Cerimónia Religiosa às 10h00. Celebração da bênção matrimonial.",
    isConfirmed: true,
    lat: -25.8680067,
    lng: 32.5667773,
  },
  {
    id: "copo-agua",
    name: "Salão da Igreja Evangélica Assembleia Livre em Moçambique – Ministério Filadélfia",
    ceremony: "Recepção · Copo de Água",
    time: "15h00",
    address: "Rua do Rio Revue, Zimpeto, Maputo.",
    reference: "Acesso pela rua do portão principal da Escola Secundária Quisse Mavota.",
    scheduleNote: "Recepção, banquete e celebração a partir das 15h00.",
    isConfirmed: true,
    lat: -25.8503187,
    lng: 32.5789995,
  },
];

export function AlexandrinaKennethLocation() {
  const [selectedVenueId, setSelectedVenueId] = useState<string>("civil");
  const [mapScale, setMapScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedVenue = VENUES.find((v) => v.id === selectedVenueId) || VENUES[0];

  const pin = `${selectedVenue.lat}%2C${selectedVenue.lng}`;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${pin}`;
  const wazeUrl = `https://waze.com/ul?ll=${pin}&navigate=yes`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${pin}`;
  const mapEmbedUrl = `https://maps.google.com/maps?q=${selectedVenue.lat},${selectedVenue.lng}&hl=pt&z=16&output=embed`;

  const zoomIn = () => setMapScale((prev) => Math.min(3, prev * 1.2));
  const zoomOut = () => setMapScale((prev) => Math.max(0.5, prev * 0.8));
  const resetMap = () => setMapScale(1);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <section className="location-section" id="localizacao" aria-labelledby="location-heading">
      <div className="container">
        <div className="section-title">Localização</div>
        <h2 className="script-title" id="location-heading">
          Onde a magia acontece
        </h2>
        <p className="lead">
          Conhece os locais onde celebraremos o nosso amor em cada momento deste dia tão especial.
        </p>

        {/* Seletor dos Três Momentos — Atelier Haute Couture */}
        <div
          className="ak-ceremony-tabs-wrap flex flex-wrap items-center justify-center gap-3 mb-8"
          role="tablist"
          aria-label="Selecione o momento da celebração"
        >
          {VENUES.map((venue) => {
            const isSelected = venue.id === selectedVenueId;
            return (
              <button
                key={venue.id}
                type="button"
                role="tab"
                id={`tab-${venue.id}`}
                aria-controls={`panel-${venue.id}`}
                aria-selected={isSelected}
                onClick={() => {
                  setSelectedVenueId(venue.id);
                  setMapScale(1);
                }}
                className={`ak-ceremony-tab ${isSelected ? "is-active" : ""}`}
              >
                <div className="ak-ceremony-tab__header">
                  <span className="ak-ceremony-tab__title">{venue.ceremony}</span>
                  {isSelected && (
                    <span className="ak-ceremony-tab__heraldic" aria-hidden="true">
                      ❖
                    </span>
                  )}
                </div>
                <div className="ak-ceremony-tab__time-badge">
                  <span className="ak-ceremony-tab__time">{venue.time.toUpperCase()}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="location-grid" id={`panel-${selectedVenue.id}`} role="tabpanel" aria-labelledby={`tab-${selectedVenue.id}`}>
          {/* Coluna de Informações do Local Seleccionado */}
          <div className="location-info">
            <div className="venue-card venue-card--premium">
              <div className="venue-header">
                <span className="text-xs uppercase tracking-widest text-[#b8941f] font-semibold block mb-1">
                  {selectedVenue.ceremony} · {selectedVenue.time}
                </span>
                <h3>{selectedVenue.name}</h3>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-2.5 rounded-full bg-[#e8f5e9] border border-[#a5d6a7] text-[11px] text-[#2e7d32] font-medium">
                  <HauteCoutureVerifiedIcon size={13} className="text-[#2e7d32]" />
                  <span>Localização e coordenadas confirmadas</span>
                </div>
              </div>

              <div className="venue-details venue-details--essential">
                {/* 1. Morada */}
                <div className="detail-item flex items-start gap-3">
                  <HauteCoutureMapPinIcon size={20} className="icon mt-1 text-[#d4af37] shrink-0" />
                  <div>
                    <span className="text-[11px] font-bold tracking-wider uppercase text-[#b8941f] block mb-0.5">
                      Morada
                    </span>
                    <p className="venue-address-lines text-sm text-[#2c2c2c] leading-relaxed">
                      {selectedVenue.address}
                    </p>
                  </div>
                </div>

                {/* 2. Referência de Chegada */}
                <div className="detail-item flex items-start gap-3">
                  <HauteCoutureCompassIcon size={20} className="icon mt-1 text-[#d4af37] shrink-0" />
                  <div>
                    <span className="text-[11px] font-bold tracking-wider uppercase text-[#b8941f] block mb-0.5">
                      Referência de Chegada
                    </span>
                    <p className="venue-reference text-sm text-[#5a5245] leading-relaxed">
                      {selectedVenue.reference}
                    </p>
                  </div>
                </div>

                {/* 3. Horário e Recomendação */}
                <div className="detail-item flex items-start gap-3">
                  <HauteCoutureClockIcon size={18} className="icon mt-1 text-[#b8941f] shrink-0" />
                  <div>
                    <span className="text-[11px] font-bold tracking-wider uppercase text-[#b8941f] block mb-0.5">
                      Horário
                    </span>
                    <p className="venue-schedule text-xs text-[#6a6255] leading-relaxed">
                      {selectedVenue.scheduleNote}
                    </p>
                  </div>
                </div>
              </div>

              {/* Botões de Navegação Activos com Coordenadas do Local Seleccionado */}
              <div className="navigation-buttons">
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nav-btn google-maps cursor-pointer"
                  title="Abrir no Google Maps"
                >
                  <HauteCoutureMapIcon size={16} className="nav-icon" /> Google Maps
                </a>

                <a
                  href={wazeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nav-btn waze cursor-pointer"
                  title="Abrir no Waze"
                >
                  <HauteCoutureNavigationIcon size={16} className="nav-icon" /> Waze
                </a>

                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nav-btn directions cursor-pointer"
                  title="Como chegar no Google Maps"
                >
                  <HauteCoutureCompassIcon size={16} className="nav-icon" /> Como chegar
                </a>
              </div>
            </div>
          </div>

          {/* Coluna do Mapa Interactivo */}
          <div className="location-map">
            <div
              ref={containerRef}
              className="map-container relative overflow-hidden rounded-2xl shadow-lg border border-[#d4af37]/20 flex items-center justify-center min-h-[450px] bg-gradient-to-b from-[#faf7f2] to-[#fff8f0]"
            >
              <div
                id="map"
                className="map-embed-root w-full h-full"
                style={{ background: "none", width: "100%", height: "100%", minHeight: "450px" }}
              >
                <div
                  className="map-content w-full h-full"
                  style={{
                    transform: `scale(${mapScale})`,
                    transformOrigin: "center center",
                    transition: "transform 0.25s ease",
                    width: "100%",
                    height: "100%",
                    minHeight: "450px",
                  }}
                >
                  <iframe
                    key={selectedVenue.id}
                    title={`${selectedVenue.name}, Maputo`}
                    src={mapEmbedUrl}
                    style={{
                      border: 0,
                      width: "100%",
                      height: "100%",
                      minHeight: "450px",
                    }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>

              {/* Controlos de Zoom e Ecrã Inteiro */}
              <div className="map-controls">
                <button
                  type="button"
                  className="map-btn cursor-pointer"
                  onClick={zoomIn}
                  aria-label="Aumentar zoom do mapa"
                  title="Aumentar zoom"
                >
                  <HauteCouturePlusIcon size={16} />
                </button>
                <button
                  type="button"
                  className="map-btn cursor-pointer"
                  onClick={zoomOut}
                  aria-label="Diminuir zoom do mapa"
                  title="Diminuir zoom"
                >
                  <HauteCoutureMinusIcon size={16} />
                </button>
                <button
                  type="button"
                  className="map-btn cursor-pointer"
                  onClick={resetMap}
                  aria-label="Repor zoom do mapa"
                  title="Repor zoom"
                >
                  <HauteCoutureResetIcon size={14} />
                </button>
                <button
                  type="button"
                  className="map-btn cursor-pointer"
                  onClick={toggleFullscreen}
                  aria-label="Mapa em ecrã inteiro"
                  title="Ecrã inteiro"
                >
                  <HauteCoutureExpandIcon size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
