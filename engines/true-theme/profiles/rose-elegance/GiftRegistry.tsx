"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { Search, Lock, Gift, Check, X, ChevronDown, Sparkles } from "lucide-react";
import { useExperience } from "../../context";
import type { GiftItem } from "@data/gifts/rose-elegance";
import { ROSE_ELEGANCE_GIFTS } from "@data/gifts/rose-elegance";
import { roseType } from "./rose-typography";
import { BrideSizesGuide } from "./BrideSizesGuide";

const EMOTIONAL_SUCCESS_MESSAGES = [
  "Um mimo foi guardado para a Jessica — ela vai adorar.",
  "A tua escolha entrou na lista com todo o charme desta despedida.",
  "Carinho registado. Obrigada por fazer parte desta tarde só de mulheres.",
  "Um gesto delicado que a Jessica vai sentir com o coração.",
];

const KITCHEN_GIFT_TOTAL = ROSE_ELEGANCE_GIFTS.filter(
  (g) => g.category === "cozinha"
).length;

function GiftKitchenProgress({
  reserved,
  total,
  theme,
  compact = false,
}: {
  reserved: number;
  total: number;
  theme: ReturnType<typeof useExperience>["theme"];
  compact?: boolean;
}) {
  const percent = total > 0 ? Math.round((reserved / total) * 100) : 0;

  return (
    <div className={compact ? "space-y-2" : "space-y-2.5"}>
      <div className="flex items-center justify-between gap-3">
        <p
          className={`font-display italic leading-relaxed ${theme.palette.textPrimary} ${
            compact ? "text-[10px]" : "text-[11px]"
          } opacity-85`}
        >
          <span style={{ color: theme.colors.secondary }}>{reserved}</span>
          {" de "}
          <span>{total}</span>
          {" peças já escolhidas"}
        </p>
        <span
          className={`shrink-0 font-body uppercase tracking-[0.18em] ${
            compact ? "text-[9px]" : "text-[10px]"
          }`}
          style={{ color: theme.colors.accent }}
        >
          {percent}%
        </span>
      </div>
      <div className="w-full h-1.5 rounded-full overflow-hidden bg-white/55">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(to right, ${theme.colors.secondary}, ${theme.colors.accent})`,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

export function GiftRegistryPanel({ embedded = false }: { embedded?: boolean }) {
  const { theme } = useExperience();
  const [isOpen, setIsOpen] = useState(embedded);
  const [showModal, setShowModal] = useState(false);
  const [totalReserved, setTotalReserved] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    setMounted(true);
    const check = () => setIsDesktop(window.innerWidth >= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (embedded) setIsOpen(true);
  }, [embedded]);

  // Poll reservations count on panel mount
  useEffect(() => {
    if (!mounted) return;
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/gifts");
        const data = await res.json();
        if (data.success && Array.isArray(data.gifts)) {
          const reservedCount = data.gifts.filter(
            (g: GiftItem) => g.status === "reserved" && g.category === "cozinha"
          ).length;
          setTotalReserved(reservedCount);
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
      }
    };
    fetchStats();
  }, [showModal, mounted]);

  if (!mounted) return null;

  const panelContent = (
    <>
      {!embedded && (
        <>
          <div
            className="flex md:hidden items-center justify-between cursor-pointer"
            onClick={() => setIsOpen(!isOpen)}
          >
            <div className="flex items-center gap-3">
              <Gift size={18} style={{ color: theme.colors.accent }} />
              <h3
                className={`${roseType.sectionTitle} text-base sm:text-lg ${theme.palette.textPrimary}`}
              >
                Gestos de carinho
              </h3>
            </div>
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDown size={18} className="opacity-50" />
            </motion.div>
          </div>

          <div className="hidden md:flex flex-col space-y-3 mb-6">
            <div className="flex items-center gap-3">
              <Gift size={18} style={{ color: theme.colors.accent }} />
              <h3
                className={`${roseType.sectionTitle} text-base ${theme.palette.textPrimary}`}
              >
                Gestos de carinho
              </h3>
            </div>
            <p
              className={`font-display italic text-xs font-light leading-relaxed ${theme.palette.textSecondary} opacity-85`}
            >
              Escolhe e reserva uma peça de cozinha na lista.
            </p>

            {totalReserved > 0 && (
              <div className="pt-2">
                <GiftKitchenProgress
                  reserved={totalReserved}
                  total={KITCHEN_GIFT_TOTAL}
                  theme={theme}
                  compact
                />
              </div>
            )}
          </div>
        </>
      )}

      {embedded && (
        <div className="mb-4">
          <GiftKitchenProgress
            reserved={totalReserved}
            total={KITCHEN_GIFT_TOTAL}
            theme={theme}
            compact
          />
        </div>
      )}

      <AnimatePresence initial={false}>
        {(isOpen || isDesktop || embedded) && (
          <motion.div
            initial={false}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="overflow-hidden"
          >
            <div className={embedded ? "" : "pt-5 md:pt-0"}>
              {!embedded && (
                <p
                  className={`block md:hidden font-display italic text-xs font-light leading-relaxed mb-5 ${theme.palette.textSecondary} opacity-85`}
                >
                  Escolhe e reserva uma peça de cozinha na lista.
                </p>
              )}

              {!embedded && totalReserved > 0 && (
                <div className="flex md:hidden items-center gap-2 pb-4 text-[9px] uppercase tracking-widest text-[#C59E66] font-medium">
                  <Sparkles size={10} />
                  <span>{totalReserved} {totalReserved === 1 ? "gesto escolhido" : "gestos escolhidos"}</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowModal(true)}
                className={`w-full font-display italic text-[11px] tracking-[0.12em] font-light border rounded-full transition-all duration-700 cursor-pointer flex items-center justify-center gap-3 hover:text-white group relative isolate overflow-hidden touch-manipulation ${
                  embedded ? "py-3.5" : "py-4 mt-auto"
                }`}
                style={{
                  borderColor: theme.colors.accent,
                  color: theme.colors.accent,
                }}
              >
                <span
                  className="absolute inset-0 z-0 scale-x-0 group-hover:scale-x-100 transition-transform duration-600 origin-left rounded-full"
                  style={{ backgroundColor: theme.colors.accent }}
                  aria-hidden
                />
                <span className="relative z-10 flex items-center justify-center gap-3 group-hover:text-white transition-colors duration-500">
                  <Gift size={12} />
                  Ver lista de mimos
                </span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </>
  );

  const modalPortal =
    mounted && typeof document !== "undefined"
      ? createPortal(
          <AnimatePresence>
            {showModal ? (
              <GiftSelectionModal
                key="gift-selection-modal"
                onClose={() => setShowModal(false)}
              />
            ) : null}
          </AnimatePresence>,
          document.body
        )
      : null;

  if (embedded) {
    return (
      <>
        <RoseGiftCardShell theme={theme}>{panelContent}</RoseGiftCardShell>
        {modalPortal}
      </>
    );
  }

  return (
    <>
      <div
        className={`w-full backdrop-blur-lg rounded-sm transition-all duration-500 shadow-sm border p-8 ${theme.palette.cardBg}`}
        style={{ borderColor: `${theme.colors.accent}15` }}
      >
        {panelContent}
      </div>
      {modalPortal}
    </>
  );
}

function RoseGiftCardShell({
  theme,
  children,
}: {
  theme: ReturnType<typeof useExperience>["theme"];
  children: React.ReactNode;
}) {
  return (
    <div
      className={`w-full backdrop-blur-lg rounded-sm transition-all duration-500 shadow-sm border p-6 md:p-8 ${theme.palette.cardBg}`}
      style={{ borderColor: `${theme.colors.accent}15` }}
    >
      <div className="flex items-start gap-3 mb-5">
        <div
          className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full border"
          style={{
            borderColor: `${theme.colors.accent}35`,
            color: theme.colors.accent,
          }}
        >
          <Gift size={15} strokeWidth={1.2} />
        </div>
        <div className="space-y-1.5 min-w-0">
          <p className={`${roseType.sectionLabel} ${theme.palette.textSecondary}`}>
            Lista de presentes
          </p>
          <h3
            className={`${roseType.sectionTitle} text-xl sm:text-2xl ${theme.palette.textPrimary}`}
          >
            Gestos de carinho
          </h3>
          <p
            className={`font-display italic text-[11px] sm:text-xs font-light leading-relaxed ${theme.palette.textSecondary} opacity-85`}
          >
            Mimose com lingerie (medidas abaixo) e reserva uma peça de cozinha na lista.
          </p>
        </div>
      </div>

      <div className="mb-5">
        <BrideSizesGuide theme={theme} />
      </div>

      {children}
    </div>
  );
}

function GiftSelectionModal({ onClose }: { onClose: () => void }) {
  const { theme } = useExperience();
  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedGift, setSelectedGift] = useState<GiftItem | null>(null);
  const [confirmName, setConfirmName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successAnimation, setSuccessAnimation] = useState<string | null>(null);
  const [emotionalMessage, setEmotionalMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [sessionReservedId, setSessionReservedId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("haxr_reserved_gift_id");
      if (stored) setSessionReservedId(stored);
    }
    fetchGifts();

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.classList.add("lenis-stopped");

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.documentElement.classList.remove("lenis-stopped");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  const fetchGifts = async () => {
    try {
      const res = await fetch("/api/gifts");
      const data = await res.json();
      if (data.success) {
        setGifts(data.gifts);
      }
    } catch (err) {
      console.error("Error fetching gifts:", err);
    } finally {
      setLoading(false);
    }
  };

  const kitchenGifts = useMemo(
    () => gifts.filter((g) => g.category === "cozinha"),
    [gifts]
  );

  const stats = useMemo(() => {
    const reservedGifts = kitchenGifts.filter((g) => g.status === "reserved");
    const totalSelectable = kitchenGifts.length;
    const reservedCount = reservedGifts.length;
    const reservedPercent =
      totalSelectable > 0
        ? Math.round((reservedCount / totalSelectable) * 100)
        : 0;

    let activityLevel: "low" | "high" | "balanced" = "balanced";
    if (reservedPercent < 20) activityLevel = "low";
    else if (reservedPercent >= 90) activityLevel = "high";

    return { totalSelectable, reservedCount, reservedPercent, activityLevel };
  }, [kitchenGifts]);

  // 2. Smart Context Messaging (Notion AI Layer + Emotional State Engine)
  const contextHeaderMessage = useMemo(() => {
    if (stats.reservedCount === 0) {
      return "Sê a primeira a escolher um mimo para a Jessica.";
    }
    if (stats.reservedCount === 1) {
      return "O primeiro carinho já foi escolhido — a lista começou a encher-se.";
    }
    if (stats.reservedPercent >= 90) {
      return "Quase tudo reservado. Obrigada por mimarem a noiva.";
    }
    return `${stats.reservedCount} mimos já escolhidos com carinho.`;
  }, [stats]);

  const adaptiveRecommendation = useMemo(() => {
    if (stats.activityLevel === "high") return null;
    if (stats.activityLevel !== "low") return null;

    const available = kitchenGifts.filter((g) => g.status === "available");
    if (available.length === 0) return null;

    const best = [...available].sort(
      (a, b) => (b.popularityScore || 0) - (a.popularityScore || 0)
    )[0];

    return {
      message: `Sugestão: ${best.name}`,
      isSuggestion: true,
    };
  }, [kitchenGifts, stats.activityLevel]);

  const handleSelect = (gift: GiftItem) => {
    if (gift.status === "reserved") {
      // Soft emotional already reserved response (Airbnb style)
      setErrorMessage("Este mimo já foi escolhido por outra convidada.");
      setTimeout(() => setErrorMessage(""), 4000);
      return;
    }
    if (gift.category === "noiva") return;
    if (sessionReservedId) {
      setErrorMessage("Já escolheste um mimo nesta sessão.");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }
    setSelectedGift(gift);
    setConfirmName("");
    setErrorMessage("");
  };

  const handleConfirmReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGift || !confirmName.trim()) return;

    setSubmitting(true);
    setErrorMessage("");

    const originalGifts = [...gifts];

    // Optimistic UI Update
    setGifts(prev =>
      prev.map(g =>
        g.id === selectedGift.id
          ? { ...g, status: "reserved", reservedBy: confirmName.trim(), reservedAt: new Date().toISOString() }
          : g
      )
    );

    try {
      const response = await fetch("/api/gifts/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          giftId: selectedGift.id,
          reservedBy: confirmName.trim()
        })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao reservar.");
      }

      if (data.success) {
        setGifts(data.gifts);
        
        // Choose emotional response text
        const randomMsg = EMOTIONAL_SUCCESS_MESSAGES[Math.floor(Math.random() * EMOTIONAL_SUCCESS_MESSAGES.length)];
        setEmotionalMessage(randomMsg);
        setSuccessAnimation(selectedGift.id);
        setSessionReservedId(selectedGift.id);

        if (typeof window !== "undefined") {
          localStorage.setItem("haxr_reserved_gift_id", selectedGift.id);
        }

        setTimeout(() => {
          setSelectedGift(null);
          setSuccessAnimation(null);
          setEmotionalMessage("");
        }, 3200);
      }
    } catch (err) {
      // Rollback
      setGifts(originalGifts);
      setErrorMessage(err instanceof Error ? err.message : "Ocorreu um erro ao processar.");
    } finally {
      setSubmitting(false);
    }
  };

  const visibleGifts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return kitchenGifts.filter((gift) =>
      query ? gift.name.toLowerCase().includes(query) : true
    );
  }, [kitchenGifts, search]);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gift-modal-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/35 backdrop-blur-md"
        aria-hidden
      />

      {/* Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-2xl max-h-[min(92vh,820px)] flex flex-col rounded-t-2xl sm:rounded-sm shadow-2xl overflow-hidden border p-5 sm:p-8"
        style={{
          borderColor: `${theme.colors.secondary}40`,
          background: `linear-gradient(180deg, ${theme.colors.background} 0%, #FFFFFF 42%, ${theme.colors.background} 100%)`,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b pb-4 mb-4"
          style={{ borderColor: `${theme.colors.accent}12` }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <Gift size={20} style={{ color: theme.colors.secondary }} />
            <div>
              <p className={`${roseType.sectionLabel} ${theme.palette.textSecondary}`}>
                Lista de presentes
              </p>
              <h2
                id="gift-modal-title"
                className={`${roseType.sectionTitle} text-xl sm:text-2xl ${theme.palette.textPrimary}`}
              >
                Lista de cozinha
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="p-1 cursor-pointer opacity-40 hover:opacity-100 transition-opacity"
          >
            <X size={20} />
          </button>
        </div>

        {/* Info Message */}
        {sessionReservedId && (
          <div
            className="mb-4 p-3 border rounded-sm text-center font-display italic text-xs tracking-wide"
            style={{
              borderColor: `${theme.colors.accent}40`,
              backgroundColor: `${theme.colors.secondary}12`,
            }}
          >
            <span style={{ color: theme.colors.accent }}>✓</span> Já escolheste
            um mimo — a Jessica agradece de coração.
          </div>
        )}

        {!loading && (
          <div
            className="mb-4 rounded-sm p-3.5 space-y-2.5"
            style={{ backgroundColor: `${theme.colors.secondary}10` }}
          >
            <GiftKitchenProgress
              reserved={stats.reservedCount}
              total={stats.totalSelectable}
              theme={theme}
            />
            <p
              className={`font-display italic text-[11px] leading-relaxed ${theme.palette.textPrimary} opacity-85`}
            >
              {contextHeaderMessage}
            </p>
            {adaptiveRecommendation && !sessionReservedId ? (
              <p
                className={`flex items-start gap-1.5 font-display italic text-[10px] leading-relaxed ${theme.palette.textSecondary} opacity-75`}
              >
                <Sparkles
                  size={10}
                  className="shrink-0 mt-0.5"
                  style={{ color: theme.colors.accent }}
                />
                <span>{adaptiveRecommendation.message}</span>
              </p>
            ) : null}
          </div>
        )}

        {/* Soft Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 border border-red-200/50 bg-red-50 text-[10px] tracking-wider text-red-500 rounded-sm text-center">
            {errorMessage}
          </div>
        )}

        <div className="flex flex-col gap-3 mb-4">
          <div className="relative flex items-center">
            <Search size={16} className="absolute left-3 opacity-30" />
            <input
              type="text"
              placeholder="Procurar peça de cozinha..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-sm pl-10 pr-4 py-2.5 text-xs font-display italic focus:outline-none focus:ring-1 transition-all border"
              style={{
                backgroundColor: `${theme.colors.secondary}12`,
                borderColor: `${theme.colors.accent}15`,
              }}
            />
          </div>
          <p
            className={`font-display italic text-[10px] ${theme.palette.textSecondary} opacity-65`}
          >
            Escolhe uma peça e reserva — lingerie tamanho L trazes à festa.
          </p>
        </div>

        {/* Main List Area */}
        <div className="flex-1 overflow-y-auto pr-1 min-h-[200px] scrollbar-thin">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <div className="w-5 h-5 border-2 border-t-transparent animate-spin rounded-full" style={{ borderColor: `${theme.colors.accent}40`, borderTopColor: theme.colors.accent }} />
              <span className="text-[10px] uppercase tracking-widest opacity-40">A carregar sugestões...</span>
            </div>
          ) : visibleGifts.length === 0 ? (
            <div
              className={`text-center py-16 font-display italic text-xs ${theme.palette.textSecondary} opacity-50`}
            >
              Nenhuma peça encontrada.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
              {visibleGifts.map((gift) => (
                <GiftCard
                  key={gift.id}
                  gift={gift}
                  theme={theme}
                  onSelect={() => handleSelect(gift)}
                  disabled={Boolean(sessionReservedId)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Dialog confirmation popup */}
        <AnimatePresence>
          {selectedGift && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white z-20 p-6 md:p-8 flex flex-col justify-center items-center text-center"
            >
              {successAnimation === selectedGift.id ? (
                // SUCCESS STATE WITH GOLD SHIMMER GLOW
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="space-y-4 max-w-sm"
                >
                  <div
                    className="w-20 h-20 rounded-full border border-[#C59E66]/40 mx-auto flex items-center justify-center relative bg-gradient-to-tr to-white shadow-xl"
                    style={{
                      backgroundImage: `linear-gradient(to top right, ${theme.colors.background}, white)`,
                      boxShadow: `0 20px 40px ${theme.colors.secondary}22`,
                    }}
                  >
                    <motion.div
                      initial={{ scale: 0.5, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 120, damping: 10 }}
                    >
                      <Check size={28} className="text-[#C59E66]" />
                    </motion.div>
                    <div className="absolute inset-0 bg-[#C59E66]/10 rounded-full filter blur-xl animate-pulse" />
                  </div>

                  <h3
                    className={`${roseType.sectionTitle} text-lg ${theme.palette.textPrimary}`}
                  >
                    Mimo registado
                  </h3>
                  <p
                    className={`font-display italic text-xs leading-relaxed ${theme.palette.textSecondary}`}
                  >
                    &ldquo;{emotionalMessage}&rdquo;
                  </p>
                  <p
                    className={`font-display italic text-[10px] pt-2 ${theme.palette.textSecondary} opacity-55`}
                  >
                    Com carinho, {confirmName}
                  </p>
                </motion.div>
              ) : (
                // CONFIRMATION DIALOG FORM (Airbnb style wording)
                <form
                  onSubmit={handleConfirmReservation}
                  className="w-full max-w-md space-y-6 flex flex-col justify-center h-full"
                >
                  <div className="space-y-3">
                    <span
                      className={`${roseType.sectionLabel} block ${theme.palette.textSecondary}`}
                    >
                      Confirmar escolha
                    </span>
                    <h3
                      className={`${roseType.sectionTitle} text-lg sm:text-xl ${theme.palette.textPrimary}`}
                    >
                      &ldquo;{selectedGift.name}&rdquo;
                    </h3>
                    {selectedGift.emotionalTag ? (
                      <p
                        className="font-display italic text-[10px]"
                        style={{ color: theme.colors.secondary }}
                      >
                        {selectedGift.emotionalTag}
                      </p>
                    ) : null}
                    <p
                      className={`font-display italic text-xs leading-relaxed ${theme.palette.textSecondary} opacity-85 max-w-xs mx-auto`}
                    >
                      Escreve o teu nome para a Jessica saber quem a mimou.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <input
                      required
                      type="text"
                      placeholder="O teu nome"
                      value={confirmName}
                      onChange={(e) => setConfirmName(e.target.value)}
                      className={`w-full bg-transparent border-b py-3 text-sm text-center ${theme.palette.textPrimary} placeholder-black/25 focus:outline-none transition-all duration-500`}
                      style={{ borderColor: `${theme.colors.accent}30` }}
                    />
                    {errorMessage && (
                      <p className="text-xs text-red-500 font-medium">{errorMessage}</p>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => setSelectedGift(null)}
                      className="flex-1 py-3 font-display italic text-[10px] tracking-[0.08em] border transition-all duration-500 cursor-pointer"
                      style={{ borderColor: "#E5E5E5" }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !confirmName.trim()}
                      className="flex-1 py-3 font-display italic text-[10px] tracking-[0.08em] text-white transition-all duration-500 cursor-pointer flex items-center justify-center gap-2 hover:opacity-90"
                      style={{ backgroundColor: theme.colors.accent }}
                    >
                      {submitting ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent animate-spin rounded-full" />
                      ) : (
                        "Confirmar mimo"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

function GiftCard({
  gift,
  theme,
  onSelect,
  disabled,
}: {
  gift: GiftItem;
  theme: ReturnType<typeof useExperience>["theme"];
  onSelect: () => void;
  disabled: boolean;
}) {
  const isReserved = gift.status === "reserved";
  const isHighlyRecommended =
    gift.popularityScore === 5 && !isReserved;

  return (
    <div
      className={`border rounded-sm p-4 flex flex-col justify-between transition-all duration-500 relative overflow-hidden ${
        isReserved
          ? "opacity-50"
          : isHighlyRecommended
          ? "shadow-md"
          : "shadow-sm hover:shadow-md"
      }`}
      style={{
        borderColor: isReserved
          ? `${theme.colors.accent}15`
          : isHighlyRecommended
          ? `${theme.colors.secondary}55`
          : `${theme.colors.accent}18`,
        background: isReserved
          ? `${theme.colors.secondary}08`
          : `linear-gradient(160deg, #FFFFFF 0%, ${theme.colors.secondary}10 100%)`,
      }}
    >
      {isHighlyRecommended && !isReserved ? (
        <div
          className="absolute top-0 right-0 px-2 py-0.5 text-[7px] font-display italic tracking-wide rounded-bl-sm"
          style={{
            backgroundColor: `${theme.colors.secondary}30`,
            color: theme.colors.primary,
          }}
        >
          favorito
        </div>
      ) : null}

      <div className="flex justify-between items-start gap-4 mb-3">
        <div className="space-y-1.5 min-w-0">
          <span
            className={`${roseType.sectionLabel} block ${theme.palette.textSecondary}`}
          >
            Cozinha
          </span>
          <h4
            className="font-display italic text-sm font-medium leading-snug"
            style={{ color: "#3D2430" }}
          >
            {gift.name}
          </h4>
          {gift.emotionalTag ? (
            <span
              className="font-display italic text-[10px] block mt-0.5"
              style={{ color: "#7A4F62" }}
            >
              {gift.emotionalTag}
            </span>
          ) : null}
        </div>

        <div className="shrink-0 pt-0.5">
          {isReserved ? (
            <Lock size={12} className="opacity-40" style={{ color: theme.colors.secondary }} />
          ) : isHighlyRecommended ? (
            <Sparkles size={12} style={{ color: theme.colors.accent }} />
          ) : (
            <span
              className="w-1.5 h-1.5 rounded-full block opacity-70"
              style={{ backgroundColor: theme.colors.secondary }}
            />
          )}
        </div>
      </div>

      <div className="mt-2">
        {isReserved ? (
          <p
            className={`font-display italic text-[10px] leading-relaxed ${theme.palette.textSecondary}`}
          >
            Reservado por {gift.reservedBy}
          </p>
        ) : (
          <button
            onClick={onSelect}
            disabled={disabled}
            className={`w-full py-2.5 rounded-full border font-display italic text-[10px] tracking-[0.06em] transition-all duration-500 cursor-pointer flex items-center justify-center gap-1.5 ${
              disabled
                ? "opacity-30 cursor-not-allowed"
                : "hover:text-white"
            }`}
            style={{
              borderColor: isHighlyRecommended ? "#9E3D6B" : "rgba(61, 36, 48, 0.22)",
              color: "#3D2430",
              backgroundColor: isHighlyRecommended
                ? "rgba(232, 180, 200, 0.25)"
                : "rgba(255, 255, 255, 0.9)",
            }}
          >
            Escolher este mimo
          </button>
        )}
      </div>
    </div>
  );
}
