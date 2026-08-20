"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Camera, Image as ImageIcon, Video, X, Check, AlertCircle, Loader2, Sparkles } from "lucide-react";
import { uploadPlusMemory } from "./plus-memorias-upload";
import { optimizePhoto, isEnhanceable } from "./plus-memorias-enhance";
import { queueOfflineMemory } from "./plus-memorias-offline-queue";
import type { MemoryChallenge } from "./plus-memorias-challenges";

interface PlusMemoriasCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  challenge: MemoryChallenge | null;
  slug: string;
  tableId?: string;
  participantId?: string;
  onSuccess: (challengeId?: string) => void;
}

export function PlusMemoriasCaptureModal({
  isOpen,
  onClose,
  challenge,
  slug,
  tableId,
  participantId,
  onSuccess,
}: PlusMemoriasCaptureModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [guestName, setGuestName] = useState("");
  const [caption, setCaption] = useState("");
  const [showNameField, setShowNameField] = useState(false);
  const [enhanceEnabled, setEnhanceEnabled] = useState(true);
  const [status, setStatus] = useState<"idle" | "optimizing" | "uploading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setStatus("idle");
    setErrorMessage("");

    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else if (file.type.startsWith("video/")) {
      setPreviewUrl(null);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setGuestName("");
    setCaption("");
    setShowNameField(false);
    setEnhanceEnabled(true);
    setStatus("idle");
    setErrorMessage("");
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    let fileToUpload = selectedFile;

    // Optimizar fotografia se activado e elegível
    if (enhanceEnabled && isEnhanceable(selectedFile)) {
      setStatus("optimizing");
      try {
        fileToUpload = await optimizePhoto(selectedFile);
      } catch {
        // Falha silenciosa — envia original
        fileToUpload = selectedFile;
      }
    }

    setStatus("uploading");
    setErrorMessage("");

    try {
      const result = await uploadPlusMemory({
        slug,
        file: fileToUpload,
        challengeId: challenge?.id,
        tableId,
        guestName: guestName.trim() || undefined,
        caption: caption.trim() || undefined,
        participantId,
      });

      if (result.success) {
        setStatus("success");
        setTimeout(() => {
          onSuccess(challenge?.id);
          handleClose();
        }, 1800);
      } else {
        // Se a falha for de ligação (offline), guardar na fila offline do dispositivo
        if (!navigator.onLine || result.error.includes("ligação")) {
          await queueOfflineMemory({
            slug,
            blob: fileToUpload,
            fileName: fileToUpload.name,
            contentType: fileToUpload.type,
            guestName: guestName.trim() || undefined,
            caption: caption.trim() || undefined,
            challengeId: challenge?.id,
            tableId,
            participantId,
          });
          setStatus("success");
          setErrorMessage("");
          setTimeout(() => {
            onSuccess(challenge?.id);
            handleClose();
          }, 2200);
          return;
        }

        setStatus("error");
        setErrorMessage(result.error);
      }
    } catch {
      await queueOfflineMemory({
        slug,
        blob: fileToUpload,
        fileName: fileToUpload.name,
        contentType: fileToUpload.type,
        guestName: guestName.trim() || undefined,
        caption: caption.trim() || undefined,
        challengeId: challenge?.id,
        tableId,
        participantId,
      });
      setStatus("success");
      setTimeout(() => {
        onSuccess(challenge?.id);
        handleClose();
      }, 2200);
    }
  };

  const showEnhanceToggle = selectedFile && isEnhanceable(selectedFile);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-lg bg-[#FFF9F2] rounded-t-2xl sm:rounded-xl shadow-2xl border border-[#C9939B]/25 overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#C9939B]/20 bg-[#F1E3CF]">
            <div>
              <p className="font-display text-[9px] tracking-[0.26em] uppercase text-[#7A2332]">
                {challenge ? `Desafio #${challenge.number}` : "Momento Especial"}
              </p>
              <h3 className="font-display text-lg text-[#171312] font-normal leading-snug">
                {challenge ? challenge.title : "Partilhar outro momento"}
              </h3>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-[#171312]/50 hover:text-[#171312] transition-colors rounded-full"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-6">
            {status === "success" ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-14 h-14 bg-[#7A2332] text-[#FFF9F2] rounded-full flex items-center justify-center mx-auto shadow-md">
                  <Check className="w-8 h-8" />
                </div>
                <h4 className="font-display text-2xl text-[#171312] font-light">MOMENTO GUARDADO</h4>
                <p className="font-body text-sm text-[#171312]/60 italic">
                  Obrigado por nos ajudar a guardar este dia.
                </p>
              </div>
            ) : (
              <>
                {/* Inputs de ficheiro invisíveis */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {!selectedFile ? (
                  /* Botões de Selecção */
                  <div className="space-y-4 py-4">
                    <p className="font-body text-xs text-[#171312]/55 text-center">
                      Escolha como pretende registar este momento:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button
                        onClick={() => cameraInputRef.current?.click()}
                        className="flex flex-col items-center justify-center p-5 rounded-lg border border-[#C9939B]/35 bg-[#F1E3CF] text-[#171312] hover:bg-[#C9939B]/10 transition-all gap-2"
                      >
                        <Camera className="w-6 h-6 text-[#7A2332]" />
                        <span className="font-display text-[10px] tracking-[0.2em] uppercase">Tirar Foto</span>
                      </button>

                      <button
                        onClick={() => galleryInputRef.current?.click()}
                        className="flex flex-col items-center justify-center p-5 rounded-lg border border-[#C9939B]/35 bg-[#F1E3CF] text-[#171312] hover:bg-[#C9939B]/10 transition-all gap-2"
                      >
                        <ImageIcon className="w-6 h-6 text-[#7A2332]" />
                        <span className="font-display text-[10px] tracking-[0.2em] uppercase">Galeria</span>
                      </button>

                      <button
                        onClick={() => videoInputRef.current?.click()}
                        className="flex flex-col items-center justify-center p-5 rounded-lg border border-[#C9939B]/35 bg-[#F1E3CF] text-[#171312] hover:bg-[#C9939B]/10 transition-all gap-2"
                      >
                        <Video className="w-6 h-6 text-[#7A2332]" />
                        <span className="font-display text-[10px] tracking-[0.2em] uppercase">Vídeo Curto</span>
                      </button>
                    </div>

                    <p className="text-[10px] text-[#171312]/45 text-center pt-2">
                      Fotos até 25 MB · Vídeos até 100 MB
                    </p>
                  </div>
                ) : (
                  /* Ficheiro Seleccionado + Preview + Form */
                  <div className="space-y-4">
                    <div className="relative rounded-lg overflow-hidden border border-[#C9939B]/25 bg-black/5 max-h-56 flex items-center justify-center">
                      {previewUrl ? (
                        <img src={previewUrl} alt="Preview" className="max-h-56 object-contain w-full" />
                      ) : (
                        <div className="py-10 text-center">
                          <Video className="w-10 h-10 text-[#7A2332] mx-auto mb-2" />
                          <p className="font-body text-xs text-[#171312] font-medium">{selectedFile.name}</p>
                          <p className="text-[10px] text-[#171312]/45">{(selectedFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                        </div>
                      )}
                      <button
                        onClick={handleReset}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black transition-colors"
                        title="Trocar ficheiro"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Toggle de optimização — apenas para fotos */}
                    {showEnhanceToggle && (
                      <button
                        type="button"
                        onClick={() => setEnhanceEnabled(!enhanceEnabled)}
                        className="plus-memorias-enhance-toggle w-full flex items-center gap-3 text-left"
                        data-active={enhanceEnabled}
                      >
                        <div className={`w-9 h-5 rounded-full relative transition-colors ${enhanceEnabled ? "bg-[#7A2332]" : "bg-[#C9939B]/30"}`}>
                          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${enhanceEnabled ? "left-4" : "left-0.5"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-[#7A2332]" />
                            <span className="font-display text-[10px] tracking-[0.15em] uppercase text-[#171312] font-medium">
                              Optimizar fotografia
                            </span>
                          </div>
                          <p className="text-[10px] text-[#171312]/50 mt-0.5">
                            Corrige orientação e optimiza qualidade antes do envio.
                          </p>
                        </div>
                      </button>
                    )}

                    {/* Campo de legenda/mensagem pessoal com emojis */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] tracking-[0.2em] uppercase text-[#171312]/55">
                        Mensagem / Legenda (opcional)
                      </label>
                      <textarea
                        rows={2}
                        maxLength={240}
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        placeholder="Ex: Um brinde à felicidade do casal! 🥂❤️"
                        className="w-full px-3 py-2 text-sm rounded border border-[#C9939B]/35 bg-[#F1E3CF] text-[#171312] focus:outline-none focus:ring-1 focus:ring-[#7A2332] resize-none"
                      />
                      {/* Picker rápido de Emojis */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5">
                        <span className="text-[9px] uppercase tracking-wider text-[#171312]/45 shrink-0 mr-1">
                          Emojis:
                        </span>
                        {["🥂", "❤️", "🎉", "👏", "💍", "🍾", "✨", "🥳"].map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setCaption((prev) => prev + emoji)}
                            className="p-1 text-base hover:scale-125 transition-transform bg-[#F1E3CF] rounded border border-[#C9939B]/20 shrink-0"
                            title={`Adicionar ${emoji}`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Campo discreto opcional de nome */}
                    {!showNameField ? (
                      <button
                        type="button"
                        onClick={() => setShowNameField(true)}
                        className="text-xs text-[#7A2332] hover:underline font-body transition-all block"
                      >
                        + Quer assinar esta memória? (opcional)
                      </button>
                    ) : (
                      <div className="space-y-1">
                        <label className="block text-[10px] tracking-[0.2em] uppercase text-[#171312]/55">
                          Seu Nome (opcional)
                        </label>
                        <input
                          type="text"
                          maxLength={80}
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          placeholder="Ex: Maria & João"
                          className="w-full px-3 py-2 text-sm rounded border border-[#C9939B]/35 bg-[#F1E3CF] text-[#171312] focus:outline-none focus:ring-1 focus:ring-[#7A2332]"
                        />
                      </div>
                    )}

                    {status === "error" && (
                      <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    {/* Botão Enviar */}
                    <button
                      onClick={handleUpload}
                      disabled={status === "uploading" || status === "optimizing"}
                      className="w-full py-3.5 px-6 rounded-sm bg-[#7A2332] text-[#FFF9F2] font-display text-[10px] sm:text-[11px] tracking-[0.26em] uppercase shadow-md hover:bg-[#5A1825] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {status === "optimizing" ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>A OPTIMIZAR...</span>
                        </>
                      ) : status === "uploading" ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>A GUARDAR...</span>
                        </>
                      ) : (
                        <span>GUARDAR MOMENTO</span>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
