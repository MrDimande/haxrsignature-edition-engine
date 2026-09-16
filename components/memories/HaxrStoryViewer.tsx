"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import type { MomentItem, StageStoryGroup } from "@lib/memories/moments";
import type { CommentItem, ReactionType } from "@lib/memories/social-store";
import {
  X,
  Volume2,
  VolumeX,
  Pause,
  Heart,
  MessageCircle,
  Bookmark,
  Send,
  Wine,
  Gem,
  Award,
  Loader2,
  AlertCircle,
  Clock,
} from "lucide-react";

interface HaxrStoryViewerProps {
  stage: StageStoryGroup;
  initialIndex?: number;
  slug: string;
  onClose: () => void;
  onNextStage?: () => void;
  onPrevStage?: () => void;
  onMediaSeen?: (mediaId: string) => void;
}

interface MediaSocialState {
  reactionCounts: Record<ReactionType, number>;
  totalReactions: number;
  userReaction: ReactionType | null;
  isFavorite: boolean;
  commentsCount: number;
}

const REACTION_OPTIONS: Array<{
  type: ReactionType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  activeColor: string;
}> = [
  { type: "love", label: "Afeto", icon: Heart, activeColor: "text-rose-400 fill-rose-400/20" },
  { type: "applause", label: "Ovação", icon: Award, activeColor: "text-amber-300 fill-amber-300/20" },
  { type: "champagne", label: "Champanhe", icon: Wine, activeColor: "text-[#D4AF37] fill-[#D4AF37]/20" },
  { type: "elegance", label: "Elegância", icon: Gem, activeColor: "text-emerald-300 fill-emerald-300/20" },
  { type: "toast", label: "Brinde", icon: Wine, activeColor: "text-orange-300 fill-orange-300/20" },
];

export function HaxrStoryViewer({
  stage,
  initialIndex = 0,
  slug,
  onClose,
  onNextStage,
  onPrevStage,
  onMediaSeen,
}: HaxrStoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [isMuted, setIsMuted] = useState(true);

  // Estados sociais por mídia
  const [socialMap, setSocialMap] = useState<Record<string, MediaSocialState>>({});
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const commentsEndRef = useRef<HTMLDivElement | null>(null);

  const items = stage.items;
  const currentItem: MomentItem | undefined = items[currentIndex];

  const durationMs = currentItem?.mediaType === "video" 
    ? (currentItem.durationSeconds ? currentItem.durationSeconds * 1000 : 8000)
    : 5000;

  // Inicializar estado social das mídias com base nas props
  useEffect(() => {
    const initialMap: Record<string, MediaSocialState> = {};
    for (const it of items) {
      initialMap[it.id] = {
        reactionCounts: {
          love: it.reactionCounts?.love || 0,
          applause: it.reactionCounts?.applause || 0,
          champagne: it.reactionCounts?.champagne || 0,
          elegance: it.reactionCounts?.elegance || 0,
          toast: it.reactionCounts?.toast || 0,
        },
        totalReactions: it.totalReactions || 0,
        userReaction: (it.userReaction as ReactionType) || null,
        isFavorite: Boolean(it.isFavorite),
        commentsCount: it.commentsCount || 0,
      };
    }
    setSocialMap(initialMap);
  }, [items]);

  const currentSocial: MediaSocialState = (currentItem && socialMap[currentItem.id]) || {
    reactionCounts: { love: 0, applause: 0, champagne: 0, elegance: 0, toast: 0 },
    totalReactions: 0,
    userReaction: null,
    isFavorite: false,
    commentsCount: 0,
  };

  // Notificar visualização de mídia
  const markSeen = useCallback(async (mediaId: string) => {
    onMediaSeen?.(mediaId);
    try {
      await fetch("/api/memories/seen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, mediaId, progress: 1.0 }),
      });
    } catch (err) {
      console.warn("Falha ao registar visualização:", err);
    }
  }, [slug, onMediaSeen]);

  // Avançar para a próxima mídia ou próximo stage
  const goToNext = useCallback(() => {
    setShowReactionPicker(false);
    setIsCommentsOpen(false);
    if (currentIndex < items.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
    } else if (onNextStage) {
      onNextStage();
    } else {
      onClose();
    }
  }, [currentIndex, items.length, onNextStage, onClose]);

  // Voltar para a mídia anterior ou stage anterior
  const goToPrev = useCallback(() => {
    setShowReactionPicker(false);
    setIsCommentsOpen(false);
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
    } else if (onPrevStage) {
      onPrevStage();
    }
  }, [currentIndex, onPrevStage]);

  // Registar visualização quando o item actual mudar
  useEffect(() => {
    if (currentItem && !currentItem.isSeen) {
      markSeen(currentItem.id);
    }
  }, [currentItem, markSeen]);

  // Gestão da barra de progresso e timer de reprodução
  useEffect(() => {
    if (isPaused || isCommentsOpen || !currentItem) return;

    setProgress(0);
    const intervalTime = 50;
    const step = (intervalTime / durationMs) * 100;

    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressIntervalRef.current!);
          goToNext();
          return 100;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [currentIndex, isPaused, isCommentsOpen, durationMs, goToNext, currentItem]);

  // Controlar vídeo quando pausado/reproduzido
  useEffect(() => {
    if (!videoRef.current) return;
    if (isPaused || isCommentsOpen) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {});
    }
  }, [isPaused, isCommentsOpen, currentIndex]);

  // Tratar teclas de navegação (Escape, Setas)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isCommentsOpen) {
          setIsCommentsOpen(false);
        } else if (showReactionPicker) {
          setShowReactionPicker(false);
        } else {
          onClose();
        }
      }
      if (isCommentsOpen) return;
      if (e.key === "ArrowRight") goToNext();
      if (e.key === "ArrowLeft") goToPrev();
      if (e.key === " ") {
        e.preventDefault();
        setIsPaused((p) => !p);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, goToNext, goToPrev, isCommentsOpen, showReactionPicker]);

  // Carregar comentários ao abrir o drawer
  useEffect(() => {
    if (!isCommentsOpen || !currentItem) return;

    let isMounted = true;
    async function fetchComments() {
      setLoadingComments(true);
      setCommentError(null);
      try {
        const res = await fetch(
          `/api/memories/media/${encodeURIComponent(currentItem!.id)}/comments?slug=${encodeURIComponent(slug)}`
        );
        if (!res.ok) throw new Error("Não foi possível carregar os comentários.");
        const json = await res.json();
        if (json.success && isMounted) {
          setComments(json.comments || []);
        }
      } catch (err: any) {
        if (isMounted) setCommentError(err.message || "Erro de ligação.");
      } finally {
        if (isMounted) setLoadingComments(false);
      }
    }

    fetchComments();
    return () => {
      isMounted = false;
    };
  }, [isCommentsOpen, currentItem, slug]);

  // Acções Sociais: Alternar Reacção
  const handleSelectReaction = async (reactionType: ReactionType) => {
    if (!currentItem) return;
    setShowReactionPicker(false);

    const prevSocial = { ...currentSocial };
    const isRemoving = prevSocial.userReaction === reactionType;

    // Actualização optimista imediata
    const nextReactions = { ...prevSocial.reactionCounts };
    if (prevSocial.userReaction) {
      nextReactions[prevSocial.userReaction] = Math.max(0, (nextReactions[prevSocial.userReaction] || 1) - 1);
    }
    if (!isRemoving) {
      nextReactions[reactionType] = (nextReactions[reactionType] || 0) + 1;
    }

    const nextTotal = Object.values(nextReactions).reduce((a, b) => a + b, 0);

    setSocialMap((prev) => ({
      ...prev,
      [currentItem.id]: {
        ...prev[currentItem.id],
        reactionCounts: nextReactions,
        totalReactions: nextTotal,
        userReaction: isRemoving ? null : reactionType,
      },
    }));

    try {
      if (isRemoving) {
        const res = await fetch(
          `/api/memories/media/${encodeURIComponent(currentItem.id)}/reaction?slug=${encodeURIComponent(slug)}`,
          { method: "DELETE" }
        );
        if (!res.ok) throw new Error("Falha ao remover reacção.");
      } else {
        const res = await fetch(`/api/memories/media/${encodeURIComponent(currentItem.id)}/reaction`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug, reactionType }),
        });
        if (!res.ok) throw new Error("Falha ao registar reacção.");
        const data = await res.json();
        if (data.success && data.reactionCounts) {
          setSocialMap((prev) => ({
            ...prev,
            [currentItem.id]: {
              ...prev[currentItem.id],
              reactionCounts: data.reactionCounts,
              totalReactions: data.totalReactions,
              userReaction: data.reactionType,
            },
          }));
        }
      }
    } catch (err) {
      console.warn("Rollback de reacção devido a erro:", err);
      // Reversão em caso de erro
      setSocialMap((prev) => ({
        ...prev,
        [currentItem.id]: prevSocial,
      }));
    }
  };

  // Acções Sociais: Alternar Favorito Privado
  const handleToggleFavorite = async () => {
    if (!currentItem) return;
    const prevSocial = { ...currentSocial };
    const nextFavorite = !prevSocial.isFavorite;

    // Actualização optimista
    setSocialMap((prev) => ({
      ...prev,
      [currentItem.id]: {
        ...prev[currentItem.id],
        isFavorite: nextFavorite,
      },
    }));

    try {
      const res = await fetch(`/api/memories/media/${encodeURIComponent(currentItem.id)}/favorite`, {
        method: nextFavorite ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, action: nextFavorite ? "add" : "remove" }),
      });
      if (!res.ok) throw new Error("Falha ao actualizar favorito.");
    } catch (err) {
      console.warn("Rollback de favorito devido a erro:", err);
      setSocialMap((prev) => ({
        ...prev,
        [currentItem.id]: prevSocial,
      }));
    }
  };

  // Acções Sociais: Submeter Comentário
  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentItem || !commentText.trim() || submittingComment) return;

    setSubmittingComment(true);
    setCommentError(null);

    const textToSend = commentText.trim();
    try {
      const res = await fetch(`/api/memories/media/${encodeURIComponent(currentItem.id)}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, body: textToSend }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Não foi possível enviar o comentário.");
      }

      // Adicionar à lista local
      if (data.comment) {
        setComments((prev) => [...prev, data.comment]);
        // Incrementar contador local
        setSocialMap((prev) => ({
          ...prev,
          [currentItem.id]: {
            ...prev[currentItem.id],
            commentsCount: prev[currentItem.id].commentsCount + 1,
          },
        }));
      }
      setCommentText("");
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    } catch (err: any) {
      setCommentError(err.message || "Falha ao submeter comentário.");
    } finally {
      setSubmittingComment(false);
    }
  };

  if (!currentItem) return null;

  const handleScreenClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isCommentsOpen || showReactionPicker) {
      setIsCommentsOpen(false);
      setShowReactionPicker(false);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;

    if (clickX < width * 0.3) {
      goToPrev();
    } else if (clickX > width * 0.7) {
      goToNext();
    } else {
      setIsPaused((p) => !p);
    }
  };

  const activeReactionOption = REACTION_OPTIONS.find((r) => r.type === currentSocial.userReaction);
  const ActiveReactionIcon = activeReactionOption ? activeReactionOption.icon : Heart;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center select-none overflow-hidden p-0 sm:p-4">
      {/* Moldura 9:16 de Alta-Costura */}
      <div
        className="relative w-full h-full sm:max-w-[440px] sm:max-h-[92vh] sm:aspect-[9/16] bg-neutral-950 sm:rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col justify-between"
        onMouseDown={() => {
          if (!isCommentsOpen && !showReactionPicker) setIsPaused(true);
        }}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => {
          if (!isCommentsOpen && !showReactionPicker) setIsPaused(true);
        }}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Camada Multimédia (Imagem ou Vídeo) */}
        <div
          className="absolute inset-0 z-0 flex items-center justify-center cursor-pointer"
          onClick={handleScreenClick}
        >
          {currentItem.mediaType === "video" ? (
            <video
              ref={videoRef}
              src={currentItem.originalUrl}
              poster={currentItem.posterUrl || currentItem.thumbnailUrl}
              autoPlay
              playsInline
              muted={isMuted}
              loop={false}
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={currentItem.mediumUrl || currentItem.originalUrl}
              alt={currentItem.caption || stage.label}
              className="w-full h-full object-cover"
              loading="eager"
            />
          )}

          {/* Gradiente editorial no topo e na base para legibilidade */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-transparent to-black/85 pointer-events-none" />
        </div>

        {/* Top Bar: Multi-segment Progress Bars & Header */}
        <div className="relative z-10 px-4 pt-3 pb-2 space-y-3">
          {/* Barras de Progresso Segmentadas */}
          <div className="flex items-center gap-1.5 w-full">
            {items.map((item, idx) => {
              let fillPercent = 0;
              if (idx < currentIndex) fillPercent = 100;
              else if (idx === currentIndex) fillPercent = progress;

              return (
                <div
                  key={item.id}
                  className="h-1 flex-1 bg-white/25 rounded-full overflow-hidden"
                >
                  <div
                    className="h-full bg-gradient-to-r from-[#D4AF37] to-[#F5E6C8] transition-all duration-75"
                    style={{ width: `${fillPercent}%` }}
                  />
                </div>
              );
            })}
          </div>

          {/* Cabeçalho do Story */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full border border-[#D4AF37]/60 p-0.5 overflow-hidden bg-black/40">
                {stage.coverThumbnailUrl ? (
                  <img
                    src={stage.coverThumbnailUrl}
                    alt={stage.label}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-[10px] text-[#D4AF37]">
                    HX
                  </div>
                )}
              </div>
              <div>
                <h4 className="text-xs font-serif tracking-wide text-white/95 leading-tight">
                  {stage.label}
                </h4>
                <p className="text-[10px] text-[#D4AF37] tracking-wider uppercase font-light">
                  {currentIndex + 1} de {items.length}
                </p>
              </div>
            </div>

            {/* Acessórios: Som e Fechar */}
            <div className="flex items-center gap-2">
              {currentItem.mediaType === "video" && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMuted((m) => !m);
                  }}
                  className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white/90 transition-colors"
                  aria-label={isMuted ? "Activar som" : "Desactivar som"}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#D4AF37]" />}
                </button>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white/90 transition-colors"
                aria-label="Fechar Story"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Indicador Flutuante de Pausa (quando segurado) */}
        {isPaused && !isCommentsOpen && (
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
            <div className="p-3 rounded-full bg-black/50 backdrop-blur-xs text-[#D4AF37]">
              <Pause className="w-6 h-6" />
            </div>
          </div>
        )}

        {/* Barra Flutuante de Reacções (Picker de Alta-Costura) */}
        {showReactionPicker && (
          <div
            className="absolute bottom-20 left-4 right-4 z-30 flex items-center justify-around bg-neutral-900/95 backdrop-blur-md rounded-2xl p-2 border border-[#D4AF37]/30 shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            {REACTION_OPTIONS.map((opt) => {
              const IconComponent = opt.icon;
              const isSelected = currentSocial.userReaction === opt.type;
              return (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => handleSelectReaction(opt.type)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-150 ${
                    isSelected
                      ? "bg-[#D4AF37]/20 scale-105 border border-[#D4AF37]/50"
                      : "hover:bg-white/10 hover:scale-105"
                  }`}
                  title={opt.label}
                >
                  <IconComponent
                    className={`w-6 h-6 ${isSelected ? opt.activeColor : "text-white/80"}`}
                  />
                  <span className="text-[9px] font-serif text-white/70 tracking-wider">
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Rodapé Editorial: Legenda + Barra de Interacção Social */}
        <div
          className="relative z-10 p-4 space-y-3 text-white"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          {/* Legenda e Autor */}
          <div className="space-y-1">
            {currentItem.caption && (
              <p className="text-sm font-sans font-light text-white/95 leading-snug drop-shadow-sm">
                {currentItem.caption}
              </p>
            )}
            <div className="flex items-center justify-between text-[11px] text-white/60 tracking-wider font-serif">
              <span>{currentItem.guestName ? `Por ${currentItem.guestName}` : "Convidado de Honra"}</span>
              {currentItem.capturedAt && (
                <span>
                  {new Date(currentItem.capturedAt).toLocaleTimeString("pt-MZ", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>
          </div>

          {/* Barra de Acções de Alta-Costura: Reacção, Comentários, Favorito */}
          <div className="flex items-center justify-between pt-1 border-t border-white/10">
            <div className="flex items-center gap-2">
              {/* Botão de Reacção */}
              <button
                type="button"
                onClick={() => setShowReactionPicker((p) => !p)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-sm border transition-all text-xs ${
                  currentSocial.userReaction
                    ? "bg-[#D4AF37]/20 border-[#D4AF37]/60 text-[#F5E6C8]"
                    : "bg-black/40 border-white/15 hover:border-white/30 text-white/90"
                }`}
                aria-label="Reagir à memória"
              >
                <ActiveReactionIcon
                  className={`w-4 h-4 ${
                    currentSocial.userReaction && activeReactionOption
                      ? activeReactionOption.activeColor
                      : "text-white/80"
                  }`}
                />
                <span className="font-serif tracking-wider font-light">
                  {currentSocial.totalReactions > 0 ? currentSocial.totalReactions : "Reagir"}
                </span>
              </button>

              {/* Botão de Comentários */}
              <button
                type="button"
                onClick={() => {
                  setShowReactionPicker(false);
                  setIsCommentsOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 hover:bg-black/60 border border-white/15 hover:border-white/30 text-white/90 text-xs transition-all"
                aria-label="Ver comentários"
              >
                <MessageCircle className="w-4 h-4 text-white/80" />
                <span className="font-serif tracking-wider font-light">
                  {currentSocial.commentsCount > 0 ? currentSocial.commentsCount : "Comentar"}
                </span>
              </button>
            </div>

            {/* Botão de Favorito Estritamente Privado */}
            <button
              type="button"
              onClick={handleToggleFavorite}
              className={`p-2 rounded-full backdrop-blur-sm border transition-all ${
                currentSocial.isFavorite
                  ? "bg-[#D4AF37]/20 border-[#D4AF37]/60 text-[#D4AF37]"
                  : "bg-black/40 border-white/15 hover:border-white/30 text-white/80"
              }`}
              title={currentSocial.isFavorite ? "Remover dos favoritos privados" : "Guardar nos favoritos privados"}
              aria-label="Favorito privado"
            >
              <Bookmark
                className={`w-4 h-4 ${
                  currentSocial.isFavorite ? "fill-[#D4AF37] text-[#D4AF37]" : "text-white/80"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Drawer de Comentários Moderados (Sheet deslizante) */}
        {isCommentsOpen && (
          <div
            className="absolute inset-0 z-40 bg-black/70 backdrop-blur-sm flex flex-col justify-end"
            onClick={() => setIsCommentsOpen(false)}
          >
            <div
              className="bg-neutral-900 border-t border-[#D4AF37]/40 rounded-t-3xl max-h-[80%] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
            >
              {/* Header do Drawer */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-neutral-950/60">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-serif tracking-wide text-white font-medium">
                    Mensagens de Celebração
                  </h3>
                  {currentSocial.commentsCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[10px] text-[#F5E6C8] font-serif">
                      {currentSocial.commentsCount}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setIsCommentsOpen(false)}
                  className="p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Fechar comentários"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Lista Scrollável de Comentários */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5 max-h-[50vh]">
                {loadingComments ? (
                  <div className="flex items-center justify-center py-8 text-white/50 gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                    <span className="text-xs font-serif">A carregar celebrações...</span>
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-10 space-y-1 text-white/50">
                    <p className="text-xs font-serif text-[#D4AF37]/90">Ainda sem mensagens nesta memória.</p>
                    <p className="text-[11px] text-white/40">Seja o primeiro a deixar uma bênção ou memória especial.</p>
                  </div>
                ) : (
                  comments.map((c) => (
                    <div
                      key={c.id}
                      className="bg-white/5 rounded-xl p-3 border border-white/5 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-serif text-[#F5E6C8] font-medium tracking-wide">
                          {c.authorName}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {c.status === "pending" && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] bg-amber-500/20 border border-amber-500/40 text-amber-300">
                              <Clock className="w-2.5 h-2.5" />
                              Em moderação
                            </span>
                          )}
                          <span className="text-[10px] text-white/40 font-serif">
                            {new Date(c.createdAt).toLocaleTimeString("pt-MZ", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-white/90 leading-relaxed break-words whitespace-pre-wrap font-sans">
                        {c.body}
                      </p>
                    </div>
                  ))
                )}
                <div ref={commentsEndRef} />
              </div>

              {/* Alerta de Erro de Comentário */}
              {commentError && (
                <div className="px-5 py-2 bg-rose-950/50 border-t border-rose-800/40 text-[11px] text-rose-300 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{commentError}</span>
                </div>
              )}

              {/* Campo Composer de Entrada */}
              <form
                onSubmit={handleSendComment}
                className="p-3 border-t border-white/10 bg-neutral-950/80 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Escreva uma mensagem de celebração..."
                  maxLength={500}
                  disabled={submittingComment}
                  className="flex-1 bg-white/10 border border-white/15 focus:border-[#D4AF37]/60 rounded-full px-4 py-2 text-xs text-white placeholder:text-white/40 outline-none transition-all"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim() || submittingComment}
                  className="p-2 rounded-full bg-[#D4AF37] hover:bg-[#F5E6C8] text-black disabled:opacity-40 disabled:hover:bg-[#D4AF37] transition-all shrink-0"
                  aria-label="Enviar comentário"
                >
                  {submittingComment ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
