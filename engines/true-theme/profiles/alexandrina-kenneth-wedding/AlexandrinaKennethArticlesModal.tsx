"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  ALEXANDRINA_KENNETH_CATEGORIES,
  ALEXANDRINA_KENNETH_CATALOG,
  type AlexandrinaKennethPublicGiftItem,
  type GiftCategory,
} from "@data/gifts/alexandrina-kenneth";

const INITIAL_GIFTS: AlexandrinaKennethPublicGiftItem[] = ALEXANDRINA_KENNETH_CATALOG.map((item) => ({
  ...item,
  selectedQuantity: 0,
  availableQuantity: item.totalQuantity,
  status: "available",
}));

interface AlexandrinaKennethArticlesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/* ==========================================================================
   Bespoke Authorial SVG Icons (Rule 1: No generic icons / Sparkles / Emojis)
   All strokes calibrated between 1.0px and 1.2px for atelier luxury precision.
   ========================================================================== */

function AtelierCloseIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function AtelierCrestIcon({ className = "w-3.5 h-3.5", color = "#d4af37" }: { className?: string; color?: string }) {
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
      <polygon points="12 2 20 12 12 22 4 12" />
      <circle cx="12" cy="12" r="2.5" strokeWidth="1" />
    </svg>
  );
}

function AtelierAllCategoriesIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polygon points="12 2 2 12 12 22 22 12 12 2" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function AtelierMixerIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 6h16M7 6v6a5 5 0 0 0 10 0V6M12 17v4M8 21h8" />
      <path d="M12 2v4" />
    </svg>
  );
}

function AtelierKitchenIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 12h14a4 4 0 0 1 4 4v1H3v-5zM17 12V7a2 2 0 0 0-2-2h-3M6 17v3M14 17v3" />
    </svg>
  );
}

function AtelierTablewareIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="2" x2="12" y2="4" />
      <line x1="12" y1="20" x2="12" y2="22" />
    </svg>
  );
}

function AtelierLivingIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 11V7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v4" />
      <path d="M3 11h18v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6Z" />
      <path d="M6 19v2M18 19v2" />
    </svg>
  );
}

function AtelierDecorIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2L8 9h8l-4-7Z" />
      <path d="M8 9l-4 7h16l-4-7H8Z" />
      <path d="M10 16v6h4v-6" />
    </svg>
  );
}

function AtelierGiftRibbonIcon({ className = "w-4 h-4", color = "currentColor" }: { className?: string; color?: string }) {
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
      <rect x="3" y="10" width="18" height="11" rx="1.5" />
      <line x1="12" y1="10" x2="12" y2="21" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <path d="M12 10C10.5 7.5 7.5 6 6 7.5C4.5 9 6.5 10 12 10Z" />
      <path d="M12 10C13.5 7.5 16.5 6 18 7.5C19.5 9 17.5 10 12 10Z" />
    </svg>
  );
}

function AtelierCheckIcon({ className = "w-4 h-4", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9.5" />
      <polyline points="16 9 10.5 15 8 12.5" />
    </svg>
  );
}

function AtelierAlertIcon({ className = "w-4 h-4", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9.5" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function AtelierPackageCheckIcon({ className = "w-4 h-4", color = "#d4af37" }: { className?: string; color?: string }) {
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
      <path d="M16.5 9.4 7.55 4.24a1.78 1.78 0 0 0-2.5 1.55v12.42a1.78 1.78 0 0 0 .91 1.55l8.54 4.93a1.78 1.78 0 0 0 2.5-1.55V10.72a1.78 1.78 0 0 0-.91-1.32Z" />
      <polyline points="15 15 18 18 22 13" />
    </svg>
  );
}

function AtelierHeartIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

function AtelierBackArrowIcon({ className = "w-3.5 h-3.5", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function getCategoryIcon(category: string) {
  switch (category) {
    case "electrodomesticos":
      return AtelierMixerIcon;
    case "cozinha":
      return AtelierKitchenIcon;
    case "loica-mesa":
      return AtelierTablewareIcon;
    case "sala":
      return AtelierLivingIcon;
    case "decoracao":
      return AtelierDecorIcon;
    default:
      return AtelierAllCategoriesIcon;
  }
}

export function AlexandrinaKennethArticlesModal({
  isOpen,
  onClose,
}: AlexandrinaKennethArticlesModalProps) {
  const [gifts, setGifts] = useState<AlexandrinaKennethPublicGiftItem[]>(INITIAL_GIFTS);
  const [selectedCategory, setSelectedCategory] = useState<GiftCategory | "todas">("todas");
  const [activeItem, setActiveItem] = useState<AlexandrinaKennethPublicGiftItem | null>(null);
  const [isHonorsExpanded, setIsHonorsExpanded] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  // Fetch live gifts state from API
  const fetchGifts = async () => {
    try {
      const res = await fetch(`/api/gifts?slug=alexandrinaekennethwedding&t=${Date.now()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.gifts)) {
        setGifts(data.gifts);
      }
    } catch (err) {
      console.error("Erro ao sincronizar catálogo de presentes:", err);
    }
  };

  // Pre-fetch immediately on mount so inventory is preloaded before modal opens
  useEffect(() => {
    fetchGifts();
  }, []);

  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement | null;
      fetchGifts();
      document.body.classList.add("artigos-modal-open");
      document.documentElement.classList.add("artigos-modal-open");

      // Set initial focus to close button for keyboard accessibility
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);
    } else {
      document.body.classList.remove("artigos-modal-open");
      document.documentElement.classList.remove("artigos-modal-open");
      setActiveItem(null);
      setFeedback(null);
      setIsHonorsExpanded(false);

      // Return focus to triggering element
      triggerRef.current?.focus();
    }
    return () => {
      document.body.classList.remove("artigos-modal-open");
      document.documentElement.classList.remove("artigos-modal-open");
    };
  }, [isOpen]);

  // Trap focus & Escape key navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        if (activeItem) {
          setActiveItem(null);
          setFeedback(null);
        } else {
          onClose();
        }
        return;
      }

      // Focus trap within modal
      if (e.key === "Tab" && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, activeItem, onClose]);

  const filteredGifts = useMemo(() => {
    if (selectedCategory === "todas") return gifts;
    return gifts.filter((g) => g.category === selectedCategory);
  }, [gifts, selectedCategory]);

  const selectedGifts = useMemo(() => {
    return gifts.filter((g) => g.selectedQuantity > 0);
  }, [gifts]);

  const totalArticles = gifts.length;

  const handleOpenReserve = (item: AlexandrinaKennethPublicGiftItem) => {
    if (item.availableQuantity <= 0) return;
    setActiveItem(item);
    setQuantity(1);
    setFeedback(null);
  };

  const handleReserveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem || isSubmitting) return;

    if (!guestName.trim()) {
      setFeedback({
        type: "error",
        message: "Por favor, indica o teu nome completo.",
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/gifts/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: "alexandrinaekennethwedding",
          itemId: activeItem.id,
          quantity,
          guestName: guestName.trim(),
          guestPhone: guestPhone.trim() || undefined,
          message: message.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setFeedback({
          type: "success",
          message: `Presente "${activeItem.name}" confirmado com carinho! Muito obrigado pela vossa bênção.`,
        });
        await fetchGifts();
        setTimeout(() => {
          setActiveItem(null);
          setGuestName("");
          setGuestPhone("");
          setMessage("");
          setFeedback(null);
        }, 2200);
      } else {
        const errorMsg =
          data.code === "GIFT_SOLD_OUT"
            ? "Este presente acabou de ser escolhido por outro convidado."
            : data.error || "Não foi possível confirmar a escolha. Tenta novamente.";
        setFeedback({
          type: "error",
          message: errorMsg,
        });
        await fetchGifts();
      }
    } catch {
      setFeedback({
        type: "error",
        message: "Ocorreu uma falha de ligação. Por favor, tenta novamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="artigos-modal-overlay ak-atelier-overlay is-open"
      id="artigosModalOverlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="artigos-modal-title"
      aria-describedby="artigos-modal-desc"
    >
      <div
        ref={modalRef}
        className="artigos-modal ak-atelier-modal"
        id="artigosModalDialog"
      >
        {/* =================================================================
            1. CABEÇALHO EDITORIAL — ATELIER DE CASAMENTO
            ================================================================= */}
        <div className="ak-atelier-header">
          <div className="ak-atelier-header__lead">
            <div className="ak-atelier-header__eyebrow">
              <AtelierCrestIcon className="w-3.5 h-3.5" color="#d4af37" />
              <span>LISTA OFICIAL DE CASAMENTO</span>
            </div>
            <h2 className="ak-atelier-header__title" id="artigos-modal-title">
              Lista de Presentes
            </h2>
            <p className="ak-atelier-header__desc" id="artigos-modal-desc">
              Com amor e carinho, escolha um presente para fazer parte do nosso novo lar.
            </p>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            className="ak-atelier-header__close"
            id="closeArtigosModal"
            onClick={onClose}
            aria-label="Fechar lista de presentes"
          >
            <AtelierCloseIcon className="w-4 h-4" />
          </button>
        </div>

        {/* =================================================================
            2. MURAL DE PRESENTES OFERECIDOS — FAIXA EDITORIAL COMPACTA
            ================================================================= */}
        {selectedGifts.length > 0 && (
          <div className="ak-atelier-mural">
            <button
              type="button"
              onClick={() => setIsHonorsExpanded((prev) => !prev)}
              className="ak-atelier-mural__btn"
              aria-expanded={isHonorsExpanded}
              aria-label={`Mural de presentes oferecidos: ${selectedGifts.length} artigos já escolhidos. Clique para ${isHonorsExpanded ? "ocultar" : "ver"} lista.`}
            >
              <div className="ak-atelier-mural__left">
                <div className="ak-atelier-mural__icon-box">
                  <AtelierPackageCheckIcon className="w-4 h-4" color="#d4af37" />
                </div>
                <div>
                  <h3 className="ak-atelier-mural__title">
                    Mural de Presentes Oferecidos
                  </h3>
                  <p className="ak-atelier-mural__sub">
                    {selectedGifts.length} {selectedGifts.length === 1 ? "presente já foi carinhosamente escolhido" : "presentes já foram carinhosamente escolhidos"}
                  </p>
                </div>
              </div>

              <div className="ak-atelier-mural__right">
                <span className="ak-atelier-mural__badge">
                  {selectedGifts.length}
                </span>
                <span className="ak-atelier-mural__toggle-text">
                  {isHonorsExpanded ? "Ocultar ▲" : "Ver lista ▼"}
                </span>
              </div>
            </button>

            {isHonorsExpanded && (
              <div className="ak-atelier-mural__grid">
                {selectedGifts.map((item) => (
                  <div
                    key={`selected-${item.id}`}
                    className="ak-atelier-mural__item"
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
                      <AtelierCheckIcon className="w-4 h-4 shrink-0" color="#1E6B37" />
                      <span style={{ fontWeight: 600, color: "var(--dark, #1a1a1a)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{item.name}</span>
                    </div>
                    <span style={{ fontSize: "0.68rem", fontWeight: 700, padding: "2px 8px", borderRadius: "6px", background: "var(--cream, #faf7f2)", border: "1px solid rgba(212,175,55,0.25)", color: "var(--accent, #8b7355)", flexShrink: 0 }}>
                      {item.selectedQuantity} {item.selectedQuantity === 1 ? "unidade" : "unidades"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =================================================================
            3. NAVEGAÇÃO POR CATEGORIAS — CARROSSEL TÁCTIL INDEPENDENTE
            ================================================================= */}
        <div className="ak-atelier-nav-categories">
          <div
            className="ak-atelier-nav-categories__track"
            role="tablist"
            aria-label="Filtrar presentes por categoria"
          >
            {ALEXANDRINA_KENNETH_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const count =
                cat.id === "todas"
                  ? totalArticles
                  : gifts.filter((g) => g.category === cat.id).length;

              return (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  aria-label={cat.label}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`ak-atelier-pill ${isSelected ? "is-active" : ""}`}
                >
                  {cat.id === "todas" ? (
                    <span>
                      <span className="ak-all-short">TODAS</span>
                      <span className="ak-all-long"> AS CATEGORIAS</span>
                    </span>
                  ) : (
                    <span>{cat.label}</span>
                  )}
                  <span className="ak-atelier-pill__badge">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* =================================================================
            4. CATÁLOGO DE PRESENTES — SCROLL VERTICAL EXCLUSIVO
            ================================================================= */}
        <div className="ak-atelier-catalog">
          <div className="ak-atelier-grid">
            {filteredGifts.map((item) => {
              const isSoldOut = item.availableQuantity <= 0;
              const isPartial = item.selectedQuantity > 0 && item.availableQuantity > 0;
              const CategoryIcon = getCategoryIcon(item.category);

              return (
                <div
                  key={item.id}
                  className={`ak-atelier-card ${isSoldOut ? "is-sold-out" : ""}`}
                >
                  {/* Área Superior: Categoria & Disponibilidade */}
                  <div className="ak-atelier-card__top">
                    <div className="ak-atelier-card__category">
                      <div className="ak-atelier-card__cat-icon">
                        <CategoryIcon className="w-3.5 h-3.5" />
                      </div>
                      <span className="ak-atelier-card__cat-label">
                        {item.categoryLabel}
                      </span>
                    </div>

                    <div style={{ flexShrink: 0 }}>
                      {isSoldOut ? (
                        <span className="ak-atelier-card__badge ak-atelier-card__badge--sold">
                          Já oferecido
                        </span>
                      ) : isPartial ? (
                        <span className="ak-atelier-card__badge ak-atelier-card__badge--available">
                          {item.availableQuantity} de {item.totalQuantity} disponíveis
                        </span>
                      ) : (
                        <span className="ak-atelier-card__badge ak-atelier-card__badge--available">
                          {item.availableQuantity} {item.availableQuantity === 1 ? "disponível" : "disponíveis"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Área Central: Nome Editorial do Presente */}
                  <div className="ak-atelier-card__body">
                    <h3 className="ak-atelier-card__title">
                      {item.name}
                    </h3>
                    <p className="ak-atelier-card__meta">
                      {isSoldOut
                        ? "Totalmente oferecido para o enxoval dos noivos"
                        : isPartial
                          ? `${item.selectedQuantity} de ${item.totalQuantity} já oferecido(s) · Resta ${item.availableQuantity} para oferta`
                          : item.totalQuantity > 1
                            ? `${item.totalQuantity} unidades no enxoval · Disponíveis para oferta`
                            : "Artigo oficial do enxoval · 1 unidade disponível"}
                    </p>
                  </div>

                  {/* Área Inferior: Botão Escolher Presente (Full-Width sem Competição) */}
                  <div className="ak-atelier-card__bottom">
                    <button
                      type="button"
                      disabled={isSoldOut}
                      onClick={() => handleOpenReserve(item)}
                      aria-label={
                        isSoldOut
                          ? `Presente ${item.name} já escolhido`
                          : `Escolher presente ${item.name}`
                      }
                      className="ak-atelier-card__btn"
                    >
                      {!isSoldOut && (
                        <AtelierGiftRibbonIcon className="w-4 h-4 shrink-0" />
                      )}
                      <span>{isSoldOut ? "Já escolhido ✓" : "Escolher presente"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredGifts.length === 0 && (
            <div
              className="ak-atelier-card"
              style={{ textAlign: "center", padding: "36px 20px" }}
            >
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#786A5B" }}>
                Todos os artigos desta categoria já foram gentilmente escolhidos para o novo lar.
              </p>
            </div>
          )}
        </div>

        {/* =================================================================
            5. RODAPÉ EDITORIAL SERENO — ZERO COLISÃO COM O CATÁLOGO
            ================================================================= */}
        <div className="ak-atelier-footer">
          <AtelierHeartIcon className="w-3.5 h-3.5 shrink-0" />
          <span className="ak-atelier-footer__text">
            A vossa bênção é o nosso maior presente.
          </span>
        </div>

        {/* =================================================================
            PAINEL DE RESERVA EXCLUSIVO (CONCIERGE RESERVATION DRAWER)
            ================================================================= */}
        {activeItem && (
          <div
            className="ak-atelier-drawer animate-in fade-in duration-200"
            id="reservationFormContainer"
            role="region"
            aria-label="Painel de Confirmação de Presente"
          >
            {/* Header: idêntico ao cabeçalho principal */}
            <div className="ak-atelier-drawer__header">
              <div className="ak-atelier-header__eyebrow">
                <AtelierGiftRibbonIcon className="w-4 h-4" color="#d4af37" />
                <span>Gesto de Carinho &amp; Enxoval</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveItem(null);
                  setFeedback(null);
                }}
                className="ak-atelier-pill"
                style={{ minHeight: "38px", padding: "6px 14px", display: "inline-flex", alignItems: "center", gap: "8px" }}
                aria-label="Voltar à lista de presentes"
              >
                <AtelierBackArrowIcon className="w-3.5 h-3.5 shrink-0" color="currentColor" />
                <span>Voltar à lista</span>
              </button>
            </div>

            {/* Conteúdo do Formulário */}
            <div className="ak-atelier-drawer__content">
              <div className="ak-atelier-drawer__form-box">
                {/* Joia do Artigo Escolhido */}
                <div className="ak-atelier-jewel">
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "12px",
                      background: "#ffffff",
                      border: "1px solid rgba(212, 175, 55, 0.35)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--gold, #d4af37)",
                      marginBottom: "8px",
                      boxShadow: "0 2px 6px rgba(0, 0, 0, 0.05)",
                    }}
                  >
                    {React.createElement(getCategoryIcon(activeItem.category), { className: "w-5 h-5" })}
                  </div>
                  <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--accent, #8b7355)" }}>
                    {activeItem.categoryLabel}
                  </span>
                  <h3
                    style={{
                      fontFamily: "var(--font-playfair-display), var(--font-display), 'Playfair Display', Georgia, serif",
                      fontSize: "1.6rem",
                      fontWeight: 400,
                      color: "var(--dark, #1a1a1a)",
                      margin: "4px 0 6px 0",
                    }}
                  >
                    {activeItem.name}
                  </h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-light, #4a4a4a)", margin: 0 }}>
                    Artigo oficial do enxoval · Disponível:{" "}
                    <strong style={{ color: "var(--dark, #1a1a1a)" }}>{activeItem.availableQuantity}</strong> de{" "}
                    {activeItem.totalQuantity}
                  </p>
                </div>

                {feedback && (
                  <div
                    style={{
                      padding: "14px 18px",
                      borderRadius: "12px",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      background: feedback.type === "success" ? "#F0FDF4" : "#FEF2F2",
                      color: feedback.type === "success" ? "#166534" : "#991B1B",
                      border: feedback.type === "success" ? "1px solid #BBF7D0" : "1px solid #FECACA",
                    }}
                    role="alert"
                  >
                    {feedback.type === "success" ? (
                      <AtelierCheckIcon className="shrink-0" color="#166534" />
                    ) : (
                      <AtelierAlertIcon className="shrink-0" color="#991B1B" />
                    )}
                    <span>{feedback.message}</span>
                  </div>
                )}

                <form
                  onSubmit={handleReserveSubmit}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                    background: "#ffffff",
                    padding: "20px",
                    borderRadius: "18px",
                    border: "1px solid rgba(212, 175, 55, 0.25)",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                  }}
                >
                  <div>
                    <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--accent, #8b7355)", marginBottom: "6px" }}>
                      O teu nome completo <span style={{ color: "var(--gold, #d4af37)" }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="O teu primeiro e último nome"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="ak-atelier-input"
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "14px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--accent, #8b7355)", marginBottom: "6px" }}>
                        Telemóvel / WhatsApp (opcional)
                      </label>
                      <input
                        type="tel"
                        placeholder="Ex.: +258 84 000 0000"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        className="ak-atelier-input"
                      />
                    </div>

                    {activeItem.availableQuantity > 1 ? (
                      <div>
                        <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--accent, #8b7355)", marginBottom: "6px" }}>
                          Quantidade a oferecer
                        </label>
                        <select
                          value={quantity}
                          onChange={(e) => setQuantity(Number(e.target.value))}
                          className="ak-atelier-input"
                          style={{ cursor: "pointer" }}
                        >
                          {Array.from(
                            { length: activeItem.availableQuantity },
                            (_, i) => i + 1
                          ).map((q) => (
                            <option key={q} value={q}>
                              {q} {q === 1 ? "conjunto/unidade" : "conjuntos/unidades"}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--accent, #8b7355)", marginBottom: "6px" }}>
                          Unidades no enxoval
                        </label>
                        <div
                          style={{
                            minHeight: "48px",
                            display: "flex",
                            alignItems: "center",
                            padding: "12px 16px",
                            borderRadius: "12px",
                            border: "1px solid rgba(212, 175, 55, 0.2)",
                            background: "var(--cream, #faf7f2)",
                            color: "var(--accent, #8b7355)",
                            fontSize: "0.8rem",
                            fontWeight: 500,
                          }}
                        >
                          1 unidade única
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--accent, #8b7355)", marginBottom: "6px" }}>
                      Mensagem de bênção aos noivos (opcional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Escreve uma bênção especial para Alexandrina &amp; Kenneth..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="ak-atelier-input"
                      style={{ minHeight: "72px", resize: "none" }}
                    />
                  </div>

                  <div style={{ paddingTop: "6px" }}>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="ak-atelier-drawer__submit-btn"
                    >
                      <AtelierGiftRibbonIcon className="w-4 h-4" />
                      <span>{isSubmitting ? "A confirmar com carinho..." : "Confirmar escolha com carinho"}</span>
                    </button>
                    <p style={{ fontSize: "0.72rem", color: "var(--accent, #8b7355)", textAlign: "center", margin: "10px 0 0 0", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                      <span style={{ color: "var(--gold, #d4af37)" }}>❖</span>
                      <span>A tua oferta será associada com carinho ao novo lar dos noivos.</span>
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
