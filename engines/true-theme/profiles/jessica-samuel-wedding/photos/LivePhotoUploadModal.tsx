"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  JESSICA_SAMUEL_PHOTO_WALL,
  PHOTO_WALL_ACCEPTED_MIME_TYPES,
  PHOTO_WALL_COPY,
  PHOTO_WALL_UPLOAD_CONSENT,
  PHOTO_WALL_UPLOAD_SUCCESS,
} from "@lib/jessica-samuel-wedding/photo-wall/config";
import {
  formatMegabytes,
  isVideoContentType,
  maxBytesForContentType,
  resolveContentType,
  validateFileSize,
} from "@lib/jessica-samuel-wedding/photo-wall/validation";
import { jsType } from "../jessica-samuel-typography";

type LivePhotoUploadModalProps = {
  open: boolean;
  onClose: () => void;
  accentColor: string;
  blushColor: string;
};

const ACCEPT_ATTR = [
  ...PHOTO_WALL_ACCEPTED_MIME_TYPES,
  "image/*",
  "video/*",
  ".heic",
  ".heif",
  ".mov",
  ".mp4",
].join(",");

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
  const [previewKind, setPreviewKind] = useState<"image" | "video" | null>(
    null
  );
  const [guestName, setGuestName] = useState("");
  const [caption, setCaption] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("A preparar…");

  const reset = useCallback(() => {
    setFile(null);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setPreviewKind(null);
    setGuestName("");
    setCaption("");
    setConsent(false);
    setError(null);
    setSubmitting(false);
    setSuccess(false);
    setProgress(0);
    setProgressLabel("A preparar…");
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
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return next ? URL.createObjectURL(next) : null;
    });

    if (!next) {
      setPreviewKind(null);
      return;
    }

    const resolved = resolveContentType(next.type, next.name);
    setPreviewKind(
      resolved && isVideoContentType(resolved) ? "video" : "image"
    );
  };

  const handleSubmit = async () => {
    if (!file || !consent || submitting) return;

    const resolvedType = resolveContentType(file.type, file.name);
    if (!resolvedType) {
      setError(
        "Tipo não suportado. Use foto (JPEG, PNG, HEIC) ou vídeo (MP4, MOV)."
      );
      return;
    }

    const sizeError = validateFileSize(file.size, resolvedType);
    if (sizeError) {
      setError(sizeError);
      return;
    }

    setSubmitting(true);
    setError(null);
    setProgress(4);
    setProgressLabel("A preparar o envio…");

    try {
      const intentRes = await fetch("/api/wedding-photos/upload-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: JESSICA_SAMUEL_PHOTO_WALL.invitationSlug,
          fileName: file.name,
          contentType: resolvedType,
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

      setProgress(12);
      setProgressLabel("A enviar a memória…");

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", intent.uploadUrl!);
        xhr.setRequestHeader("Content-Type", resolvedType);
        xhr.upload.onprogress = (event) => {
          if (!event.lengthComputable) return;
          const pct = Math.round((event.loaded / event.total) * 78) + 12;
          setProgress(Math.min(90, pct));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
            return;
          }
          reject(new Error("upload_failed"));
        };
        xhr.onerror = () => reject(new Error("network"));
        xhr.onabort = () => reject(new Error("aborted"));
        xhr.send(file);
      });

      setProgress(92);
      setProgressLabel("A concluir…");

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

      setProgress(100);
      setProgressLabel("Memória guardada");
      setSuccess(true);
    } catch (err) {
      if (err instanceof Error && err.message === "upload_failed") {
        setError("Não foi possível enviar o ficheiro.");
      } else {
        setError("Ocorreu um erro. Tente novamente.");
      }
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
                  accept={ACCEPT_ATTR}
                  className="sr-only"
                  onChange={(e) =>
                    onFileChange(e.target.files?.[0] ?? null)
                  }
                />

                {preview ? (
                  <div className="relative">
                    {previewKind === "video" ? (
                      <video
                        src={preview}
                        className="max-h-48 w-full object-contain"
                        controls
                        playsInline
                        muted
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={preview}
                        alt="Pré-visualização"
                        className="max-h-48 w-full object-contain"
                      />
                    )}
                    <button
                      type="button"
                      className={`${jsType.micro} mt-2 text-white/55 underline`}
                      onClick={() => fileRef.current?.click()}
                    >
                      Alterar ficheiro
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className={`w-full border border-dashed px-4 py-10 ${jsType.micro} text-white/55`}
                    style={{ borderColor: `${blushColor}55` }}
                  >
                    Tirar ou seleccionar foto / vídeo
                  </button>
                )}

                <p className={`${jsType.micro} text-white/40`}>
                  {PHOTO_WALL_COPY.acceptHint}
                  {file
                    ? ` · Limite deste ficheiro: ${formatMegabytes(
                        maxBytesForContentType(
                          resolveContentType(file.type, file.name) ??
                            "image/jpeg"
                        )
                      )} MB`
                    : null}
                </p>

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

                {submitting ? (
                  <div
                    className="js-photo-upload-progress"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={progress}
                    aria-label={progressLabel}
                  >
                    <div className="js-photo-upload-progress__track">
                      <motion.div
                        className="js-photo-upload-progress__fill"
                        style={{ backgroundColor: accentColor }}
                        initial={false}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                    <p
                      className={`${jsType.micro} js-photo-upload-progress__label`}
                    >
                      {progressLabel}
                      {progress > 0 && progress < 100
                        ? ` · ${progress}%`
                        : null}
                    </p>
                  </div>
                ) : null}

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
