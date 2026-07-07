"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  JESSICA_SAMUEL_PHOTO_WALL,
  PHOTO_WALL_UPLOAD_CONSENT,
  PHOTO_WALL_UPLOAD_SUCCESS,
} from "@lib/jessica-samuel-wedding/photo-wall/config";
import { jsType } from "../jessica-samuel-typography";

type LivePhotoUploadModalProps = {
  open: boolean;
  onClose: () => void;
  accentColor: string;
  blushColor: string;
};

export function LivePhotoUploadModal({
  open,
  onClose,
  accentColor,
  blushColor,
}: LivePhotoUploadModalProps) {
  const titleId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [guestName, setGuestName] = useState("");
  const [caption, setCaption] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const reset = useCallback(() => {
    setFile(null);
    setPreview(null);
    setGuestName("");
    setCaption("");
    setConsent(false);
    setError(null);
    setSubmitting(false);
    setSuccess(false);
    if (fileRef.current) fileRef.current.value = "";
  }, []);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, submitting]);

  const onFileChange = (next: File | null) => {
    setError(null);
    setFile(next);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(next ? URL.createObjectURL(next) : null);
  };

  const handleSubmit = async () => {
    if (!file || !consent || submitting) return;

    if (
      !JESSICA_SAMUEL_PHOTO_WALL.acceptedMimeTypes.includes(
        file.type as (typeof JESSICA_SAMUEL_PHOTO_WALL.acceptedMimeTypes)[number]
      )
    ) {
      setError("Tipo de ficheiro não suportado. Use JPEG, PNG ou WebP.");
      return;
    }

    if (file.size > JESSICA_SAMUEL_PHOTO_WALL.maxFileSizeBytes) {
      setError("A imagem excede o limite de 5 MB.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const intentRes = await fetch("/api/wedding-photos/upload-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: JESSICA_SAMUEL_PHOTO_WALL.invitationSlug,
          fileName: file.name,
          contentType: file.type,
          fileSizeBytes: file.size,
          guestName: guestName.trim() || undefined,
          caption: caption.trim() || undefined,
        }),
      });
      const intent = (await intentRes.json()) as {
        success?: boolean;
        error?: string;
        uploadUrl?: string;
        photoId?: string;
      };

      if (!intent.success || !intent.uploadUrl || !intent.photoId) {
        setError(intent.error ?? "Não foi possível preparar o envio.");
        return;
      }

      const uploadRes = await fetch(intent.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadRes.ok) {
        setError("Não foi possível enviar a imagem.");
        return;
      }

      const completeRes = await fetch("/api/wedding-photos/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: JESSICA_SAMUEL_PHOTO_WALL.invitationSlug,
          photoId: intent.photoId,
          guestName: guestName.trim() || undefined,
          caption: caption.trim() || undefined,
        }),
      });
      const complete = (await completeRes.json()) as {
        success?: boolean;
        error?: string;
        message?: string;
      };

      if (!complete.success) {
        setError(complete.error ?? "Não foi possível concluir o envio.");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Ocorreu um erro. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="presentation"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/75"
            aria-label="Fechar"
            onClick={() => !submitting && onClose()}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative z-10 w-full max-w-lg border px-6 py-6 sm:mx-4 sm:rounded-sm"
            style={{
              borderColor: `${accentColor}40`,
              backgroundColor: "#171217",
            }}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
          >
            <h2
              id={titleId}
              className={`${jsType.sectionTitle} mb-4 text-xl text-white/95`}
            >
              Partilhar Momento
            </h2>

            {success ? (
              <p className={`${jsType.body} text-white/75`}>
                {PHOTO_WALL_UPLOAD_SUCCESS}
              </p>
            ) : (
              <div className="space-y-4">
                <input
                  ref={fileRef}
                  type="file"
                  accept={JESSICA_SAMUEL_PHOTO_WALL.acceptedMimeTypes.join(",")}
                  className="sr-only"
                  onChange={(e) =>
                    onFileChange(e.target.files?.[0] ?? null)
                  }
                />

                {preview ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preview}
                      alt="Pré-visualização"
                      className="max-h-48 w-full object-contain"
                    />
                    <button
                      type="button"
                      className={`${jsType.micro} mt-2 text-white/55 underline`}
                      onClick={() => fileRef.current?.click()}
                    >
                      Alterar imagem
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className={`w-full border border-dashed px-4 py-10 ${jsType.micro} text-white/55`}
                    style={{ borderColor: `${blushColor}55` }}
                  >
                    Seleccionar imagem
                  </button>
                )}

                <input
                  type="text"
                  placeholder="O seu nome (opcional)"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  maxLength={JESSICA_SAMUEL_PHOTO_WALL.maxGuestNameLength}
                  className={`w-full border bg-transparent px-4 py-3 ${jsType.body} text-white/90 outline-none`}
                  style={{ borderColor: `${accentColor}30` }}
                />

                <textarea
                  placeholder="Legenda (opcional)"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  maxLength={JESSICA_SAMUEL_PHOTO_WALL.maxCaptionLength}
                  rows={2}
                  className={`w-full resize-none border bg-transparent px-4 py-3 ${jsType.body} text-white/90 outline-none`}
                  style={{ borderColor: `${accentColor}30` }}
                />

                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-1"
                  />
                  <span className={`${jsType.micro} text-white/50`}>
                    {PHOTO_WALL_UPLOAD_CONSENT}
                  </span>
                </label>

                {error && (
                  <p className={`${jsType.micro}`} style={{ color: blushColor }}>
                    {error}
                  </p>
                )}

                <button
                  type="button"
                  disabled={!file || !consent || submitting}
                  onClick={() => void handleSubmit()}
                  className={`w-full min-h-[48px] border px-4 py-3 ${jsType.micro} transition-opacity disabled:opacity-40`}
                  style={{
                    borderColor: accentColor,
                    color: "#F8F4F3",
                    backgroundColor: `${accentColor}18`,
                  }}
                >
                  {submitting ? "A guardar a sua memória…" : "Enviar memória"}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
