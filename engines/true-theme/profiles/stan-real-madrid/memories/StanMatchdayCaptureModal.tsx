"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Camera, Image as ImageIcon, Video, X, Check, AlertCircle, Loader2, Award } from "lucide-react";
import { uploadPlusMemory } from "../../jessica-samuel-wedding/memories/plus-memorias-upload";
import { createMemoryUploadClientId, MEMORY_UPLOAD_ERROR_MESSAGES, validateClientMediaFile } from "@lib/memories/upload-error-contract";

interface StanMatchdayCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  mission: {
    id: string;
    slug?: string;
    title: string;
    description?: string;
    points: number;
    category?: string;
  } | null;
  slug: string;
  tableId?: string;
  participantId?: string;
  onSuccess: (missionId: string, points: number) => void;
}

export function StanMatchdayCaptureModal({
  isOpen,
  onClose,
  mission,
  slug,
  tableId,
  participantId,
  onSuccess,
}: StanMatchdayCaptureModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [photographerName, setPhotographerName] = useState("");
  const [caption, setCaption] = useState("");
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [clientUploadId, setClientUploadId] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateClientMediaFile(file);
    if (validationError) {
      setSelectedFile(null);
      setPreviewUrl(null);
      setStatus("error");
      setErrorMessage(MEMORY_UPLOAD_ERROR_MESSAGES[validationError]);
      e.target.value = "";
      return;
    }

    setSelectedFile(file);
    setClientUploadId(createMemoryUploadClientId());
    setStatus("idle");
    setErrorMessage("");

    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setCaption("");
    setClientUploadId(null);
    setStatus("idle");
    setErrorMessage("");
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleUpload = async () => {
    if (!selectedFile || !mission) return;

    setStatus("uploading");
    setErrorMessage("");

    try {
      const result = await uploadPlusMemory({
        slug,
        file: selectedFile,
        challengeId: mission.id || mission.slug,
        tableId,
        participantId,
        clientUploadId: clientUploadId || undefined,
        guestName: photographerName.trim() || undefined,
        caption: caption.trim() || undefined,
      });

      if (result.success) {
        setStatus("success");
        setTimeout(() => {
          onSuccess(mission.id, result.pointsAwarded ?? (mission.points || 100));
          handleClose();
        }, 1200);
      } else {
        setStatus("error");
        setErrorMessage(result.error || "Não foi possível registar o momento.");
      }
    } catch (err: any) {
      setStatus("error");
      setErrorMessage("Erro de ligação ao servidor.");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && mission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            className="relative w-full max-w-lg bg-[#0A1628] border border-[#D4AF37]/40 rounded-2xl p-6 text-[#F7F4EF] shadow-2xl overflow-hidden z-10"
          >
            {/* Fechar */}
            <button
              type="button"
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 rounded-full text-[#5B6B7C] hover:text-[#F7F4EF] hover:bg-[#050A12] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header Missão */}
            <div className="mb-6 pr-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#050A12] border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] tracking-wider uppercase mb-2 font-mono">
                <Award className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Missão Matchday · +{mission.points} Pontos</span>
              </div>
              <h2 className="font-display text-lg sm:text-xl font-light text-[#F7F4EF] leading-snug">
                {mission.title}
              </h2>
              {mission.description && (
                <p className="font-body text-xs text-[#5B6B7C] mt-1">
                  {mission.description}
                </p>
              )}
            </div>

            {/* Upload Area / Preview */}
            <div className="mb-5">
              {previewUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-[#D4AF37]/30 aspect-4/3 max-h-64 bg-black flex items-center justify-center">
                  <img
                    src={previewUrl}
                    alt="Pré-visualização"
                    className="w-full h-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={handleReset}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex-1 p-5 rounded-xl border border-dashed border-[#D4AF37]/40 bg-[#050A12]/80 hover:bg-[#050A12] hover:border-[#D4AF37] transition-all flex flex-col items-center justify-center gap-2 text-center group cursor-pointer"
                  >
                    <div className="p-3 rounded-full bg-[#0A1628] text-[#D4AF37] group-hover:scale-110 transition-transform">
                      <Camera className="w-6 h-6" />
                    </div>
                    <span className="font-serif text-xs uppercase tracking-wider text-[#F7F4EF]">
                      Câmara Matchday
                    </span>
                    <span className="text-[10px] text-[#5B6B7C]">Capturar agora</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="flex-1 p-5 rounded-xl border border-dashed border-[#D4AF37]/40 bg-[#050A12]/80 hover:bg-[#050A12] hover:border-[#D4AF37] transition-all flex flex-col items-center justify-center gap-2 text-center group cursor-pointer"
                  >
                    <div className="p-3 rounded-full bg-[#0A1628] text-[#D4AF37] group-hover:scale-110 transition-transform">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <span className="font-serif text-xs uppercase tracking-wider text-[#F7F4EF]">
                      Galeria
                    </span>
                    <span className="text-[10px] text-[#5B6B7C]">Escolher do telemóvel</span>
                  </button>

                  {/* Hidden file inputs */}
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
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              )}
            </div>

            {/* Inputs Opcionais: Nome do Fotógrafo & Legenda */}
            {selectedFile && (
              <div className="space-y-3 mb-5">
                <div>
                  <input
                    type="text"
                    value={photographerName}
                    onChange={(e) => setPhotographerName(e.target.value)}
                    placeholder="O teu nome ou apelido de explorador (opcional)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#050A12] border border-[#D4AF37]/30 text-xs text-[#F7F4EF] placeholder-[#5B6B7C] focus:outline-hidden focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Adiciona uma legenda ao momento... (opcional)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#050A12] border border-[#D4AF37]/30 text-xs text-[#F7F4EF] placeholder-[#5B6B7C] focus:outline-hidden focus:border-[#D4AF37]"
                  />
                </div>
              </div>
            )}

            {/* Mensagem de Erro */}
            {errorMessage && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-xs mb-4">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Acção de Envio */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#D4AF37]/20">
              <button
                type="button"
                onClick={handleClose}
                disabled={status === "uploading"}
                className="px-4 py-2.5 rounded-xl text-xs text-[#5B6B7C] hover:text-[#F7F4EF] transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleUpload}
                disabled={!selectedFile || status === "uploading" || status === "success"}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C9A86A] text-[#0A1628] font-serif font-semibold text-xs tracking-wider uppercase flex items-center gap-2 shadow-md hover:brightness-105 active:scale-98 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {status === "uploading" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>A registar missão...</span>
                  </>
                ) : status === "success" ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Missão Concluída!</span>
                  </>
                ) : (
                  <span>Concluir Missão (+{mission.points} pts)</span>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
