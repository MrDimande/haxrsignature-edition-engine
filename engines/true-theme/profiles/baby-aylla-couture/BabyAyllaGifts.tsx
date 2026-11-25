"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Feather,
  Gift,
  Heart,
  Lock,
  LogOut,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  BABY_AYLLA_EDITORIAL_CATEGORIES,
  getBabyAyllaEditorialGalleryItems,
} from "@lib/aylla/gifts/editorial-gallery";
import { humanizeAyllaError } from "@lib/aylla/gifts/error-copy";
import { resolveBabyAyllaGiftPresentation } from "@lib/aylla/gifts/presentation";
import { CoutureBowIcon } from "./BabyAyllaCoutureIcons";
import { CoutureReveal } from "./BabyAyllaCouture";
import styles from "./BabyAyllaCelebration.module.css";
import ui from "./BabyAyllaGifts.module.css";

type AvailabilityItem = {
  itemId: string;
  familyApproved: boolean;
  enabled: boolean;
  approvedQuantity: number | null;
  reservedQuantity: number;
  remainingQuantity: number;
  reservable: boolean;
};

type MyReservation = {
  id: string;
  giftId: string;
  quantity: number;
  status: "reserved" | "purchased" | "delivered" | "cancelled" | string;
  createdAt: string;
  updatedAt: string;
};

type StagingTestItem = {
  id: string;
  name: string;
  description: string;
  category: (typeof BABY_AYLLA_EDITORIAL_CATEGORIES)[number]["id"];
  priority: "high" | "standard";
  syntheticStaging: true;
  availability: AvailabilityItem;
};

type DisplayGiftItem = {
  id: string;
  name: string;
  description: string;
  category: (typeof BABY_AYLLA_EDITORIAL_CATEGORIES)[number]["id"];
  priority: "high" | "standard";
  syntheticStaging?: boolean;
  availability?: AvailabilityItem;
};

type CatalogPayload = {
  success: boolean;
  registryEnabled: boolean;
  testActivation: boolean;
  inventoryItems: AvailabilityItem[];
  stagingTestItems: StagingTestItem[];
  myReservations: MyReservation[];
  guest: { name: string } | null;
  sessionExpired: boolean;
  error?: string;
};

type AuthModalState =
  | { kind: "closed" }
  | { kind: "verify"; step: "contact" | "otp"; reason?: string }
  | { kind: "reserve"; gift: DisplayGiftItem; idempotencyKey: string }
  | { kind: "confirmed"; giftName: string; quantity: number }
  | { kind: "conflict"; giftName: string; message: string };

const INITIAL_EDITORIAL_ITEMS = getBabyAyllaEditorialGalleryItems();

function createIdempotencyUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `aylla-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function applyLocalAvailabilityReserve(item: AvailabilityItem, qty: number): AvailabilityItem {
  const reservedQuantity = item.reservedQuantity + qty;
  const remainingQuantity = Math.max(0, item.remainingQuantity - qty);
  return {
    ...item,
    reservedQuantity,
    remainingQuantity,
    reservable: Boolean(
      item.familyApproved &&
        item.enabled &&
        item.approvedQuantity !== null &&
        remainingQuantity > 0
    ),
  };
}

export function BabyAyllaGifts() {
  const [selectedCategory, setSelectedCategory] = useState(
    BABY_AYLLA_EDITORIAL_CATEGORIES[0].id
  );
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [registryEnabled, setRegistryEnabled] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<AvailabilityItem[]>([]);
  const [stagingTestItems, setStagingTestItems] = useState<StagingTestItem[]>([]);
  const [myReservations, setMyReservations] = useState<MyReservation[]>([]);
  const [guest, setGuest] = useState<{ name: string } | null>(null);

  const [modalState, setModalState] = useState<AuthModalState>({ kind: "closed" });
  const [pendingGiftAfterAuth, setPendingGiftAfterAuth] =
    useState<DisplayGiftItem | null>(null);

  const [contactInput, setContactInput] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalBusy, setModalBusy] = useState(false);

  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const dialogHeadingId = useId();
  const dialogPanelRef = useRef<HTMLDivElement | null>(null);

  const presentation = resolveBabyAyllaGiftPresentation({
    invitationStatus: "draft",
    hasConfirmedRsvp: Boolean(guest),
    hasVerifiedIdentity: Boolean(guest),
  });

  const fetchCatalog = useCallback(async () => {
    setCatalogError(null);
    try {
      const response = await fetch("/api/gifts/aylla/catalog", {
        method: "GET",
        cache: "no-store",
        credentials: "same-origin",
        headers: { "x-request-id": createIdempotencyUuid() },
      });

      const data = (await response.json()) as CatalogPayload;

      setRegistryEnabled(Boolean(data.registryEnabled));
      setInventoryItems(Array.isArray(data.inventoryItems) ? data.inventoryItems : []);
      setStagingTestItems(Array.isArray(data.stagingTestItems) ? data.stagingTestItems : []);
      setMyReservations(Array.isArray(data.myReservations) ? data.myReservations : []);
      setGuest(data.guest ?? null);

      if (data.sessionExpired) {
        setStatusMessage(humanizeAyllaError("session_expired"));
      }

      if (!response.ok || !data.success) {
        setCatalogError(
          data.error || humanizeAyllaError("service_unavailable")
        );
      }

      return data;
    } catch {
      setCatalogError(humanizeAyllaError("CORE_NETWORK_ERROR"));
      return null;
    } finally {
      setLoadingCatalog(false);
    }
  }, []);

  useEffect(() => {
    void fetchCatalog();
  }, [fetchCatalog]);

  useEffect(() => {
    if (modalState.kind === "closed") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setModalState({ kind: "closed" });
        setModalError(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modalState.kind]);

  const inventoryById = useMemo(() => {
    const map = new Map<string, AvailabilityItem>();
    for (const item of inventoryItems) {
      map.set(item.itemId, item);
    }
    return map;
  }, [inventoryItems]);

  const allDisplayItems = useMemo<DisplayGiftItem[]>(() => {
    const editorialMapped: DisplayGiftItem[] = INITIAL_EDITORIAL_ITEMS.map((item) => ({
      ...item,
      availability: inventoryById.get(item.id),
    }));
    const stagingMapped: DisplayGiftItem[] = stagingTestItems.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      category: item.category,
      priority: item.priority,
      syntheticStaging: true,
      availability: item.availability,
    }));
    return [...stagingMapped, ...editorialMapped];
  }, [inventoryById, stagingTestItems]);

  const giftTitleById = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of allDisplayItems) {
      map.set(item.id, item.name);
    }
    return map;
  }, [allDisplayItems]);

  const activeGuestReservations = useMemo(
    () => myReservations.filter((r) => r.status !== "cancelled"),
    [myReservations]
  );

  const reservedByMeItemIds = useMemo(() => {
    return new Set(
      activeGuestReservations
        .filter((r) => r.status === "reserved" || r.status === "purchased" || r.status === "delivered")
        .map((r) => r.giftId)
    );
  }, [activeGuestReservations]);

  const anyReservableItemExists = useMemo(
    () => allDisplayItems.some((item) => Boolean(item.availability?.reservable)),
    [allDisplayItems]
  );

  const selectedCategoryMeta =
    BABY_AYLLA_EDITORIAL_CATEGORIES.find((category) => category.id === selectedCategory) ??
    BABY_AYLLA_EDITORIAL_CATEGORIES[0];

  const categoryItems = useMemo(() => {
    const items = allDisplayItems.filter((item) => item.category === selectedCategoryMeta.id);
    if (!onlyAvailable) return items;
    return items.filter(
      (item) => Boolean(item.availability?.reservable) || reservedByMeItemIds.has(item.id)
    );
  }, [allDisplayItems, onlyAvailable, reservedByMeItemIds, selectedCategoryMeta.id]);

  function openVerifyDialog(reason?: string, pendingGift?: DisplayGiftItem) {
    setModalError(null);
    setOtpInput("");
    if (pendingGift) {
      setPendingGiftAfterAuth(pendingGift);
    }
    setModalState({ kind: "verify", step: "contact", reason });
  }

  function handleSelectGiftToReserve(gift: DisplayGiftItem) {
    setModalError(null);
    if (!guest) {
      openVerifyDialog(undefined, gift);
      return;
    }
    setModalState({
      kind: "reserve",
      gift,
      idempotencyKey: createIdempotencyUuid(),
    });
  }

  async function handleRequestOtp(event: React.FormEvent) {
    event.preventDefault();
    setModalError(null);
    const trimmed = contactInput.trim();
    if (trimmed.length < 4) {
      setModalError("Por favor, indique o telemóvel ou e-mail usado na sua confirmação de presença.");
      return;
    }

    setModalBusy(true);
    try {
      const response = await fetch("/api/gifts/aylla/challenge", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-request-id": createIdempotencyUuid(),
        },
        credentials: "same-origin",
        body: JSON.stringify({ contact: trimmed }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setModalError(humanizeAyllaError(data.code || data.outcome, data.error));
        return;
      }

      setModalState((prev) =>
        prev.kind === "verify" ? { ...prev, step: "otp" } : prev
      );
    } catch {
      setModalError(humanizeAyllaError("CORE_NETWORK_ERROR"));
    } finally {
      setModalBusy(false);
    }
  }

  async function handleVerifyOtp(event: React.FormEvent) {
    event.preventDefault();
    setModalError(null);
    const normalized = otpInput.trim();
    if (!normalized) {
      setModalError("Introduza o código numérico enviado para o seu contacto.");
      return;
    }

    setModalBusy(true);
    try {
      const response = await fetch("/api/gifts/aylla/verify", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-request-id": createIdempotencyUuid(),
        },
        credentials: "same-origin",
        body: JSON.stringify({ code: normalized }),
      });
      const data = await response.json();

      if (!response.ok || !data.success || data.outcome !== "verified") {
        setModalError(humanizeAyllaError(data.outcome || data.code, data.error));
        return;
      }

      setStatusMessage("Identidade confirmada. Bem-vindo(a) ao ateliê de mimos da Aylla.");
      const refreshed = await fetchCatalog();

      if (pendingGiftAfterAuth && refreshed) {
        const refreshedInventory = new Map(
          (refreshed.inventoryItems ?? []).map((i) => [i.itemId, i])
        );
        const stagingFound = (refreshed.stagingTestItems ?? []).find(
          (s) => s.id === pendingGiftAfterAuth.id
        );
        const freshAvailability =
          stagingFound?.availability ?? refreshedInventory.get(pendingGiftAfterAuth.id);
        const giftToReserve: DisplayGiftItem = {
          ...pendingGiftAfterAuth,
          availability: freshAvailability,
        };
        setPendingGiftAfterAuth(null);

        if (freshAvailability?.reservable) {
          setModalState({
            kind: "reserve",
            gift: giftToReserve,
            idempotencyKey: createIdempotencyUuid(),
          });
          return;
        }

        setModalState({
          kind: "conflict",
          giftName: giftToReserve.name,
          message: humanizeAyllaError("item_unavailable"),
        });
        return;
      }

      setPendingGiftAfterAuth(null);
      setModalState({ kind: "closed" });
    } catch {
      setModalError(humanizeAyllaError("CORE_NETWORK_ERROR"));
    } finally {
      setModalBusy(false);
    }
  }

  async function handleConfirmReservation() {
    if (modalState.kind !== "reserve") return;
    const { gift, idempotencyKey } = modalState;
    setModalError(null);
    setModalBusy(true);

    try {
      const response = await fetch("/api/gifts/aylla/reserve", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-request-id": createIdempotencyUuid(),
        },
        credentials: "same-origin",
        body: JSON.stringify({
          itemId: gift.id,
          quantity: 1,
          idempotencyKey,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.success || data.outcome !== "reservation_confirmed") {
        const outcome = data.outcome || data.code;
        if (response.status === 401 || outcome === "session_expired") {
          setGuest(null);
          setMyReservations([]);
          setPendingGiftAfterAuth(gift);
          setModalState({
            kind: "verify",
            step: "contact",
            reason: humanizeAyllaError("session_expired"),
          });
          return;
        }

        if (response.status === 409 || outcome === "item_unavailable") {
          await fetchCatalog();
          setModalState({
            kind: "conflict",
            giftName: gift.name,
            message: humanizeAyllaError("item_unavailable", data.error),
          });
          return;
        }

        setModalError(humanizeAyllaError(outcome, data.error));
        return;
      }

      const confirmed = data.reservation as Partial<MyReservation> | undefined;
      const confirmedQty = confirmed?.quantity ?? 1;
      if (confirmed?.id) {
        const nowIso = new Date().toISOString();
        setMyReservations((prev) =>
          prev.some((r) => r.id === confirmed.id)
            ? prev
            : [
                {
                  id: confirmed.id!,
                  giftId: confirmed.giftId || gift.id,
                  quantity: confirmedQty,
                  status: confirmed.status || "reserved",
                  createdAt: nowIso,
                  updatedAt: nowIso,
                },
                ...prev,
              ]
        );
      }
      setInventoryItems((prev) =>
        prev.map((item) => (item.itemId === gift.id ? applyLocalAvailabilityReserve(item, confirmedQty) : item))
      );
      setStagingTestItems((prev) =>
        prev.map((item) =>
          item.id === gift.id
            ? { ...item, availability: applyLocalAvailabilityReserve(item.availability, confirmedQty) }
            : item
        )
      );

      setStatusMessage(`O mimo "${gift.name}" foi reservado com carinho.`);
      setModalState({
        kind: "confirmed",
        giftName: gift.name,
        quantity: confirmedQty,
      });

      // Refresh authoritative snapshot without blocking reservation confirmation modal
      void fetchCatalog();
    } catch {
      setModalError(humanizeAyllaError("CORE_NETWORK_ERROR"));
    } finally {
      setModalBusy(false);
    }
  }

  async function handleCancelReservation(reservationId: string) {
    setCancellingId(reservationId);
    setCatalogError(null);

    try {
      const response = await fetch("/api/gifts/aylla/cancel", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-request-id": createIdempotencyUuid(),
        },
        credentials: "same-origin",
        body: JSON.stringify({ reservationId }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        const outcome = data.outcome || data.code;
        if (response.status === 401 || outcome === "session_expired") {
          setGuest(null);
          setMyReservations([]);
          openVerifyDialog(humanizeAyllaError("session_expired"));
          return;
        }
        setCatalogError(humanizeAyllaError(outcome, data.error));
        return;
      }

      setConfirmCancelId(null);
      setStatusMessage("Reserva libertada. O presente voltou a ficar disponível para os convidados.");
      await fetchCatalog();
    } catch {
      setCatalogError(humanizeAyllaError("CORE_NETWORK_ERROR"));
    } finally {
      setCancellingId(null);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/gifts/aylla/session", {
        method: "DELETE",
        headers: { "x-request-id": createIdempotencyUuid() },
        credentials: "same-origin",
      });
    } finally {
      setGuest(null);
      setMyReservations([]);
      setConfirmCancelId(null);
      setStatusMessage("Sessão encerrada com segurança.");
      void fetchCatalog();
    }
  }

  return (
    <section
      id="mimos"
      aria-labelledby="aylla-gifts-title"
      className={`${styles.section} ${styles.giftsSection}`}
    >
      <header className={styles.sectionHeader}>
        <p className={`aylla-font-calligraphy ${styles.scriptLead}`}>Com carinho</p>
        <h2 id="aylla-gifts-title" className={`aylla-font-serif ${styles.sectionTitle}`}>
          Pequenos Mimos para Aylla
        </h2>
        <p className={`aylla-font-serif ${styles.sectionLead}`}>
          Uma colecção delicada, em curadoria pela família, para acompanhar os seus primeiros sonhos.
        </p>
      </header>

      <CoutureReveal className={`${styles.giftAtelier} ${ui.atelierWide}`}>
        <p className={styles.giftOverline}>HAXR GIFT REGISTRY™ · ÉDITION ROSE</p>

        {catalogError && (
          <div className={ui.bannerAlert} role="alert">
            <span>{catalogError}</span>
            <button
              type="button"
              className={ui.secondaryButton}
              onClick={() => void fetchCatalog()}
            >
              <RefreshCw size={15} aria-hidden="true" />
              Tentar novamente
            </button>
          </div>
        )}

        {statusMessage && (
          <div className={ui.bannerStatus} role="status">
            <span>{statusMessage}</span>
            <button
              type="button"
              className={ui.subtleButton}
              aria-label="Fechar aviso"
              onClick={() => setStatusMessage(null)}
            >
              <X size={15} aria-hidden="true" />
            </button>
          </div>
        )}

        <div className={ui.guestBar}>
          <div className={ui.guestBarText}>
            {registryEnabled ? (
              guest ? (
                <>
                  <span className={ui.guestBadgeRow}>
                    <ShieldCheck size={16} aria-hidden="true" />
                    Sessão confirmada · {guest.name}
                  </span>
                  <p className={ui.guestSubcopy}>
                    {activeGuestReservations.length > 0
                      ? `Tem ${activeGuestReservations.length} ${activeGuestReservations.length === 1 ? "mimo reservado" : "mimos reservados"} associados ao seu convite.`
                      : "Pode reservar o seu mimo em um clique com total privacidade."}
                  </p>
                </>
              ) : (
                <>
                  <span className={ui.guestBadgeRow}>
                    <Feather size={16} aria-hidden="true" />
                    Acesso exclusivo para convidados confirmados
                  </span>
                  <p className={ui.guestSubcopy}>
                    Confirme o contacto do seu RSVP para reservar presentes e acompanhar as suas escolhas.
                  </p>
                </>
              )
            ) : (
              <>
                <span className={ui.guestBadgeRow}>
                  <Lock size={15} aria-hidden="true" />
                  Lista em Curadoria Familiar
                </span>
                <p className={ui.guestSubcopy}>{presentation.message}</p>
              </>
            )}
          </div>

          {registryEnabled && (
            <div className={ui.guestActions}>
              {guest ? (
                <button
                  type="button"
                  className={ui.secondaryButton}
                  onClick={() => void handleLogout()}
                >
                  <LogOut size={15} aria-hidden="true" />
                  Terminar sessão
                </button>
              ) : (
                <button
                  type="button"
                  className={ui.primaryButton}
                  onClick={() => openVerifyDialog()}
                >
                  <ShieldCheck size={15} aria-hidden="true" />
                  Identificar Convidado
                </button>
              )}
            </div>
          )}
        </div>

        {registryEnabled && guest && activeGuestReservations.length > 0 && (
          <div className={ui.myMimosPanel} aria-label="As suas reservas confirmadas">
            <div className={ui.myMimosHeader}>
              <h3 className={`aylla-font-serif ${ui.myMimosTitle}`}>Os Meus Mimos</h3>
              <span className={ui.cardTag}>
                <CheckCircle2 size={14} aria-hidden="true" />
                {activeGuestReservations.length}{" "}
                {activeGuestReservations.length === 1 ? "reserva activa" : "reservas activas"}
              </span>
            </div>

            <div className={ui.myMimosList}>
              {activeGuestReservations.map((res) => {
                const title = giftTitleById.get(res.giftId) ?? res.giftId;
                const isConfirming = confirmCancelId === res.id;
                const isCancelling = cancellingId === res.id;

                return (
                  <article key={res.id} className={ui.myMimoCard}>
                    <div>
                      <h4 className={`aylla-font-serif ${ui.myMimoTitle}`}>{title}</h4>
                      <p className={ui.myMimoMeta}>
                        Quantidade: {res.quantity} · Estado:{" "}
                        {res.status === "reserved"
                          ? "Reservado por si"
                          : res.status === "purchased"
                          ? "Acompanhado pela família"
                          : "Entregue com carinho"}
                      </p>
                    </div>

                    {res.status === "reserved" && (
                      <div>
                        {isConfirming ? (
                          <div className={ui.confirmInlineRow}>
                            <button
                              type="button"
                              className={ui.primaryButton}
                              disabled={isCancelling}
                              onClick={() => void handleCancelReservation(res.id)}
                            >
                              {isCancelling ? "A libertar..." : "Confirmar libertação"}
                            </button>
                            <button
                              type="button"
                              className={ui.secondaryButton}
                              disabled={isCancelling}
                              onClick={() => setConfirmCancelId(null)}
                            >
                              Manter
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className={ui.secondaryButton}
                            onClick={() => setConfirmCancelId(res.id)}
                          >
                            Libertar reserva
                          </button>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        )}

        <div
          className={styles.giftTabs}
          role="tablist"
          aria-label="Categorias de presentes"
        >
          {BABY_AYLLA_EDITORIAL_CATEGORIES.map((category) => {
            const count = allDisplayItems.filter((item) => item.category === category.id).length;
            const isSelected = selectedCategoryMeta.id === category.id;
            return (
              <button
                key={category.id}
                type="button"
                role="tab"
                id={`tab-${category.id}`}
                aria-selected={isSelected}
                aria-controls={`panel-${category.id}`}
                className={isSelected ? styles.giftTabActive : styles.giftTab}
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.title} ({String(count).padStart(2, "0")})
              </button>
            );
          })}
        </div>

        <div
          id={`panel-${selectedCategoryMeta.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${selectedCategoryMeta.id}`}
          className={styles.giftCategoryCard}
        >
          <span aria-hidden="true" className={styles.giftPearl}>A</span>
          <p className={`aylla-font-serif ${styles.giftCategoryTitle}`}>
            {selectedCategoryMeta.title}
          </p>
          <p className={styles.giftCategoryLead}>{selectedCategoryMeta.lead}</p>

          {registryEnabled && anyReservableItemExists && (
            <div className={ui.filterRow}>
              <span className={ui.guestSubcopy}>
                Mostrando {categoryItems.length} sugestões nesta selecção
              </span>
              <button
                type="button"
                aria-pressed={onlyAvailable}
                className={`${ui.filterChip} ${onlyAvailable ? ui.filterChipActive : ""}`}
                onClick={() => setOnlyAvailable((prev) => !prev)}
              >
                <Gift size={14} aria-hidden="true" />
                {onlyAvailable ? "Mostrar todos os mimos" : "Ver disponíveis para reserva"}
              </button>
            </div>
          )}

          {loadingCatalog ? (
            <div className={ui.skeletonGrid} aria-label="A carregar lista de mimos">
              <div className={ui.skeletonCard} />
              <div className={ui.skeletonCard} />
              <div className={ui.skeletonCard} />
            </div>
          ) : (
            <div className={ui.grid}>
              {categoryItems.map((gift) => {
                const avail = gift.availability;
                const isMine = reservedByMeItemIds.has(gift.id);
                const isReservable = Boolean(registryEnabled && avail?.reservable);
                const isDepleted = Boolean(
                  registryEnabled && avail && !avail.reservable && avail.approvedQuantity !== null
                );

                return (
                  <article
                    key={gift.id}
                    className={`${ui.giftCard} ${
                      isMine
                        ? ui.giftCardReservedByMe
                        : isReservable || gift.priority === "high"
                        ? ui.giftCardHighlight
                        : ""
                    }`}
                  >
                    <div>
                      <div className={ui.giftCardTop}>
                        <span className={ui.cardTag}>
                          <Heart size={12} aria-hidden="true" />
                          {gift.syntheticStaging
                            ? "Homologação Staging"
                            : gift.priority === "high"
                            ? "Prioridade Editorial"
                            : "Curadoria Aylla"}
                        </span>

                        {isMine ? (
                          <span className={ui.statusMine}>
                            <CheckCircle2 size={12} aria-hidden="true" />
                            Reservado por si
                          </span>
                        ) : isReservable && avail ? (
                          <span className={ui.statusAvailable}>
                            {avail.remainingQuantity === 1
                              ? "Último disponível"
                              : `${avail.remainingQuantity} disponíveis`}
                          </span>
                        ) : isDepleted ? (
                          <span className={ui.statusReserved}>Reservado com carinho</span>
                        ) : (
                          <span className={ui.statusCurating}>Em curadoria</span>
                        )}
                      </div>

                      <h3 className={`aylla-font-serif ${ui.cardTitle}`} style={{ marginTop: 12 }}>
                        {gift.name}
                      </h3>
                      <p className={ui.cardDesc} style={{ marginTop: 8 }}>
                        {gift.description}
                      </p>
                    </div>

                    <div className={ui.cardFooter}>
                      {isReservable ? (
                        <button
                          type="button"
                          className={ui.cardReserveBtn}
                          onClick={() => handleSelectGiftToReserve(gift)}
                        >
                          <Gift size={15} aria-hidden="true" />
                          {isMine ? "Reservar outro" : "Reservar mimo"}
                        </button>
                      ) : isDepleted ? (
                        <p className={ui.cardEditorialNote}>
                          Todos os mimos desta edição já receberam carinho.
                        </p>
                      ) : (
                        <p className={ui.cardEditorialNote}>
                          Quantidades e especificações a confirmar pela família.
                        </p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <p className={styles.giftEligibility} role="status">
          {registryEnabled
            ? "As reservas ficam protegidas pelo seu convite confirmado, sem pagamentos na plataforma."
            : presentation.message}
        </p>
      </CoutureReveal>

      {modalState.kind !== "closed" && (
        <div
          className={ui.modalBackdrop}
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setModalState({ kind: "closed" });
              setModalError(null);
            }
          }}
        >
          <div
            ref={dialogPanelRef}
            className={ui.modalPanel}
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogHeadingId}
          >
            <button
              type="button"
              className={ui.modalClose}
              aria-label="Fechar janela"
              onClick={() => {
                setModalState({ kind: "closed" });
                setModalError(null);
              }}
            >
              <X size={18} aria-hidden="true" />
            </button>

            {modalState.kind === "verify" && modalState.step === "contact" && (
              <form onSubmit={(event) => void handleRequestOtp(event)}>
                <p className={ui.modalOverline}>VERIFICAÇÃO DE CONVIDADO</p>
                <h3 id={dialogHeadingId} className={`aylla-font-serif ${ui.modalTitle}`}>
                  Confirmar Convite
                </h3>
                <p className={ui.modalBodyCopy}>
                  Para proteger a lista da Aylla, confirme o telemóvel ou endereço de e-mail usado na sua confirmação de presença (RSVP).
                </p>

                {(modalState.reason || modalError) && (
                  <div className={ui.bannerAlert} role="alert">
                    <AlertCircle size={16} aria-hidden="true" />
                    <span>{modalError || modalState.reason}</span>
                  </div>
                )}

                <div className={ui.fieldGroup}>
                  <label htmlFor="aylla-guest-contact" className={ui.fieldLabel}>
                    Contacto confirmado no RSVP
                  </label>
                  <input
                    id="aylla-guest-contact"
                    type="text"
                    className={ui.fieldInput}
                    autoComplete="tel"
                    placeholder="+258 84 000 0001 ou e-mail"
                    value={contactInput}
                    onChange={(event) => setContactInput(event.target.value)}
                    disabled={modalBusy}
                    required
                  />
                  <p className={ui.fieldHelp}>
                    Enviaremos um código numérico de uso único. Não partilhamos o seu contacto.
                  </p>
                </div>

                <div className={ui.modalActions}>
                  <button type="submit" className={ui.primaryButton} disabled={modalBusy}>
                    {modalBusy ? "A enviar código..." : "Enviar código de verificação"}
                  </button>
                  <button
                    type="button"
                    className={ui.secondaryButton}
                    onClick={() => setModalState({ kind: "closed" })}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            {modalState.kind === "verify" && modalState.step === "otp" && (
              <form onSubmit={(event) => void handleVerifyOtp(event)}>
                <p className={ui.modalOverline}>CÓDIGO DE VERIFICAÇÃO</p>
                <h3 id={dialogHeadingId} className={`aylla-font-serif ${ui.modalTitle}`}>
                  Introduza o Código
                </h3>
                <p className={ui.modalBodyCopy}>
                  Se o contacto indicado corresponder a um convite confirmado para a celebração da Aylla, enviámos um código numérico de 6 dígitos.
                </p>

                {modalError && (
                  <div className={ui.bannerAlert} role="alert">
                    <AlertCircle size={16} aria-hidden="true" />
                    <span>{modalError}</span>
                  </div>
                )}

                <div className={ui.fieldGroup}>
                  <label htmlFor="aylla-guest-otp" className={ui.fieldLabel}>
                    Código de verificação
                  </label>
                  <input
                    id="aylla-guest-otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    className={ui.fieldInput}
                    placeholder="000000"
                    value={otpInput}
                    onChange={(event) => setOtpInput(event.target.value)}
                    disabled={modalBusy}
                    required
                  />
                </div>

                <div className={ui.modalActions}>
                  <button type="submit" className={ui.primaryButton} disabled={modalBusy}>
                    {modalBusy ? "A validar..." : "Validar e continuar"}
                  </button>
                  <button
                    type="button"
                    className={ui.secondaryButton}
                    disabled={modalBusy}
                    onClick={() => {
                      setModalError(null);
                      setModalState({ kind: "verify", step: "contact" });
                    }}
                  >
                    Alterar contacto
                  </button>
                </div>
              </form>
            )}

            {modalState.kind === "reserve" && (
              <div>
                <p className={ui.modalOverline}>CONFIRMAÇÃO DE RESERVA</p>
                <h3 id={dialogHeadingId} className={`aylla-font-serif ${ui.modalTitle}`}>
                  {modalState.gift.name}
                </h3>
                <p className={ui.modalBodyCopy}>{modalState.gift.description}</p>

                {modalError && (
                  <div className={ui.bannerAlert} role="alert">
                    <AlertCircle size={16} aria-hidden="true" />
                    <span>{modalError}</span>
                  </div>
                )}

                <div className={ui.bannerStatus}>
                  <span>
                    Reserva em nome de <strong>{guest?.name}</strong> · Quantidade: <strong>1 unidade</strong>.
                    Sem custos ou pagamentos nesta página.
                  </span>
                </div>

                <div className={ui.modalActions}>
                  <button
                    type="button"
                    className={ui.primaryButton}
                    disabled={modalBusy}
                    onClick={() => void handleConfirmReservation()}
                  >
                    {modalBusy ? "A confirmar reserva..." : "Confirmar minha reserva"}
                  </button>
                  <button
                    type="button"
                    className={ui.secondaryButton}
                    disabled={modalBusy}
                    onClick={() => setModalState({ kind: "closed" })}
                  >
                    Voltar
                  </button>
                </div>
              </div>
            )}

            {modalState.kind === "confirmed" && (
              <div className={ui.confirmationBox}>
                <CoutureBowIcon size={30} className="mx-auto mb-3 text-[#C5A17F]" />
                <p className={ui.modalOverline}>RESERVADO COM CARINHO</p>
                <h3 id={dialogHeadingId} className={`aylla-font-serif ${ui.modalTitle}`}>
                  Obrigado pelo seu gesto
                </h3>
                <p className={ui.modalBodyCopy}>
                  O mimo <strong>{modalState.giftName}</strong> ({modalState.quantity} unidade) foi associado ao seu convite para celebrar a Baby Aylla.
                </p>
                <div className={ui.modalActions}>
                  <button
                    type="button"
                    className={ui.primaryButton}
                    onClick={() => setModalState({ kind: "closed" })}
                  >
                    <CheckCircle2 size={15} aria-hidden="true" />
                    Concluir
                  </button>
                </div>
              </div>
            )}

            {modalState.kind === "conflict" && (
              <div className={ui.confirmationBox}>
                <p className={ui.modalOverline}>DISPONIBILIDADE ACTUALIZADA</p>
                <h3 id={dialogHeadingId} className={`aylla-font-serif ${ui.modalTitle}`}>
                  {modalState.giftName}
                </h3>
                <p className={ui.modalBodyCopy}>{modalState.message}</p>
                <div className={ui.modalActions}>
                  <button
                    type="button"
                    className={ui.primaryButton}
                    onClick={() => setModalState({ kind: "closed" })}
                  >
                    Explorar outros mimos
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
