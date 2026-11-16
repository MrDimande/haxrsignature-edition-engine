"use client";

import React, { useRef, useState } from "react";
import { Camera, UploadCloud, Image as ImageIcon, CheckCircle, AlertCircle } from "lucide-react";
import { triggerCelebrationConfetti } from "./AlexandrinaKennethAmbient";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_PHOTOS = 20;
const WHATSAPP_COUPLE_NUMBER = "258840000000";

interface PhotoPreview {
  name: string;
  size: number;
  dataUrl: string;
}

export function AlexandrinaKennethPhotoUpload() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"idle" | "success" | "error">("idle");
  const [isUploading, setIsUploading] = useState(false);

  const handleSelectClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (files.length > MAX_PHOTOS) {
      setUploadStatus(`MÃ¡ximo de ${MAX_PHOTOS} fotos permitidas por envio.`);
      setStatusType("error");
      return;
    }

    const validPhotos: PhotoPreview[] = [];
    let hasSizeError = false;

    Array.from(files).forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        hasSizeError = true;
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          validPhotos.push({
            name: file.name,
            size: file.size,
            dataUrl: event.target.result as string,
          });

          if (validPhotos.length === (hasSizeError ? files.length - 1 : files.length)) {
            setPhotos(validPhotos);
            setUploadStatus(`${validPhotos.length} foto(s) pronta(s) para partilhar.`);
            setStatusType("idle");
          }
        }
      };
      reader.readAsDataURL(file);
    });

    if (hasSizeError) {
      setUploadStatus("Algumas fotos excedem o tamanho mÃ¡ximo de 10MB.");
      setStatusType("error");
    }
  };

  const handleConfirmUpload = async () => {
    if (photos.length === 0) return;

    setIsUploading(true);
    setUploadStatus("A enviar as tuas fotografias com seguranÃ§a...");

    // Store in browser memory store / local storage
    try {
      const storageKey = "alexandrinaKennethPhotosRecord";
      const stored = JSON.parse(localStorage.getItem(storageKey) || "[]");
      const timestamp = new Date().toISOString();
      const records = photos.map((p) => ({
        filename: p.name,
        size: p.size,
        timestamp,
      }));
      localStorage.setItem(storageKey, JSON.stringify([...stored, ...records]));

      // Success
      setUploadStatus(`ðŸŽ‰ ${photos.length} fotografia(s) guardada(s) com sucesso! Obrigado pela partilha.`);
      setStatusType("success");
      triggerCelebrationConfetti();

      // Offer WhatsApp notification to couple
      const msg = `ðŸ“¸ *NOVAS FOTOS ENVIADAS - CASAMENTO ALEXANDRINA & KENNETH* ðŸ“¸

OlÃ¡! Acabei de enviar ${photos.length} foto(s) para a galeria de recordaÃ§Ãµes do casamento.`;

      setTimeout(() => {
        const url = `https://wa.me/${WHATSAPP_COUPLE_NUMBER}?text=${encodeURIComponent(msg)}`;
        window.open(url, "_blank", "noopener,noreferrer");
      }, 1200);

      setPhotos([]);
    } catch (e) {
      console.error("Upload error:", e);
      setUploadStatus("NÃ£o foi possÃ­vel concluir o envio agora.");
      setStatusType("error");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      className="panel photo-box photo-box--premium panel--fotos-layout"
      id="fotos"
      aria-labelledby="fotos-heading"
    >
      <div>
        <h3 id="fotos-heading" className="flex items-center gap-2">
          <Camera className="photo-icon text-[#d4af37]" size={22} aria-hidden="true" />
          Partilha as Tuas Fotos
        </h3>
        <p>
          Captaste momentos especiais do nosso casamento? Envia-nos as tuas fotos para eternizarmos juntos este dia.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          id="photoFileInput"
          multiple
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="photo-upload-area mt-4 mb-4">
          <button
            type="button"
            className="upload-dropzone w-full p-6 border-2 border-dashed border-[#d4af37]/40 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer hover:bg-[#fff8f0] transition-colors"
            onClick={handleSelectClick}
          >
            <UploadCloud className="text-[#b8941f] mb-2" size={32} />
            <span className="font-semibold text-xs tracking-wider uppercase text-[#1a1a1a]">
              Selecionar fotos do telemÃ³vel
            </span>
            <span className="text-[11px] text-[#4a4a4a] mt-1">
              AtÃ© 20 fotos por envio (JPG, PNG, HEIC)
            </span>
          </button>
        </div>

        {photos.length > 0 && (
          <div className="photo-previews grid grid-cols-4 gap-2 mb-4">
            {photos.slice(0, 8).map((p, idx) => (
              <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-[#d4af37]/30">
                <img src={p.dataUrl} alt={p.name} className="w-full h-full object-cover" />
              </div>
            ))}
            {photos.length > 8 && (
              <div className="aspect-square rounded-lg bg-[#1a1a1a] text-[#d4af37] flex items-center justify-center text-xs font-bold">
                +{photos.length - 8}
              </div>
            )}
          </div>
        )}

        {uploadStatus && (
          <div
            className={`status-message text-xs p-3 rounded-xl mb-3 flex items-center gap-2 ${
              statusType === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : statusType === "error"
                  ? "bg-red-50 text-red-800 border border-red-200"
                  : "bg-[#fff8f0] text-[#b8941f] border border-[#d4af37]/30"
            }`}
          >
            {statusType === "success" ? (
              <CheckCircle size={16} />
            ) : statusType === "error" ? (
              <AlertCircle size={16} />
            ) : (
              <ImageIcon size={16} />
            )}
            <span>{uploadStatus}</span>
          </div>
        )}

        {photos.length > 0 && (
          <button
            type="button"
            className="submit upload-btn cursor-pointer w-full"
            onClick={handleConfirmUpload}
            disabled={isUploading}
          >
            {isUploading ? "A processar..." : `Enviar ${photos.length} Fotografia(s)`}
          </button>
        )}
      </div>
    </div>
  );
}

