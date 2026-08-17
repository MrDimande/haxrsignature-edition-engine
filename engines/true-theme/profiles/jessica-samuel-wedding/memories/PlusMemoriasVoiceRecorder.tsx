"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Mic, RotateCcw, Send, Square } from "lucide-react";
import { uploadPlusMemoriesVoice } from "./plus-memorias-voice-upload";

const VOICE_MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/mp4",
  "audio/ogg;codecs=opus",
  "audio/webm",
] as const;

export function chooseSupportedVoiceMimeType(
  isTypeSupported: (mimeType: string) => boolean
): string | null {
  return VOICE_MIME_CANDIDATES.find(isTypeSupported) ?? null;
}

function formatDuration(seconds: number): string {
  return `00:${String(seconds).padStart(2, "0")}`;
}

export function PlusMemoriasVoiceRecorder({
  slug,
  photoId,
  participantId,
  guestName,
  maxDurationSeconds,
}: {
  slug: string;
  photoId: string;
  participantId?: string;
  guestName?: string;
  maxDurationSeconds: number;
}) {
  const [state, setState] = useState<
    "idle" | "requesting" | "recording" | "recorded" | "uploading" | "sent" | "error"
  >("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const clearTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const stopRecording = () => {
    clearTimer();
    const recorder = recorderRef.current;
    if (recorder?.state === "recording") recorder.stop();
  };

  useEffect(() => {
    return () => {
      clearTimer();
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      stopStream();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    setErrorMessage("");
    if (
      typeof MediaRecorder === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setState("error");
      setErrorMessage("Este browser não suporta gravação de áudio.");
      return;
    }

    setState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = chooseSupportedVoiceMimeType(MediaRecorder.isTypeSupported);
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const duration = Math.max(
          1,
          Math.min(maxDurationSeconds, Math.ceil((Date.now() - startedAtRef.current) / 1000))
        );
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || mimeType || "audio/webm",
        });
        const nextUrl = URL.createObjectURL(blob);
        setDurationSeconds(duration);
        setAudioBlob(blob);
        setAudioUrl(nextUrl);
        setState("recorded");
        stopStream();
      };
      recorder.onerror = () => {
        setState("error");
        setErrorMessage("Não foi possível concluir a gravação.");
        stopStream();
      };

      startedAtRef.current = Date.now();
      setElapsedSeconds(0);
      recorder.start(250);
      setState("recording");
      timerRef.current = setInterval(() => {
        const elapsed = Math.min(
          maxDurationSeconds,
          Math.floor((Date.now() - startedAtRef.current) / 1000)
        );
        setElapsedSeconds(elapsed);
        if (elapsed >= maxDurationSeconds) stopRecording();
      }, 250);
    } catch {
      stopStream();
      setState("error");
      setErrorMessage("O acesso ao microfone foi recusado ou não está disponível.");
    }
  };

  const recordAgain = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setAudioBlob(null);
    setDurationSeconds(0);
    setElapsedSeconds(0);
    setErrorMessage("");
    setState("idle");
  };

  const sendVoice = async () => {
    if (!audioBlob || durationSeconds < 1) return;
    setState("uploading");
    const result = await uploadPlusMemoriesVoice({
      slug,
      photoId,
      blob: audioBlob,
      durationSeconds,
      participantId,
      guestName,
    });
    if (result.success) {
      setState("sent");
      return;
    }
    setState("error");
    setErrorMessage(result.error);
  };

  return (
    <div className="mt-5 rounded-xl border border-[#C9939B]/30 bg-[#F1E3CF] p-4 text-left">
      <p className="font-display italic text-base text-[#171312]">
        “Há coisas que uma fotografia não consegue dizer.”
      </p>
      <p className="mt-1 text-[11px] leading-relaxed text-[#171312]/60">
        A sua mensagem será guardada para os anfitriões juntamente com esta memória.
      </p>

      {state === "idle" && (
        <button
          type="button"
          onClick={startRecording}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-sm bg-[#7A2332] px-4 py-3 text-[10px] font-display tracking-[0.22em] uppercase text-[#FFF9F2]"
        >
          <Mic className="h-4 w-4" />
          Gravar mensagem de voz
        </button>
      )}

      {state === "requesting" && (
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#7A2332]">
          <Loader2 className="h-4 w-4 animate-spin" />
          A pedir acesso ao microfone…
        </div>
      )}

      {state === "recording" && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-[#7A2332]">
            <span className="flex items-center gap-2 font-medium">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-600" />
              A gravar
            </span>
            <span>{formatDuration(elapsedSeconds)} / {formatDuration(maxDurationSeconds)}</span>
          </div>
          <button
            type="button"
            onClick={stopRecording}
            className="flex w-full items-center justify-center gap-2 rounded-sm border border-[#7A2332] px-4 py-2.5 text-[10px] font-display tracking-[0.2em] uppercase text-[#7A2332]"
          >
            <Square className="h-3.5 w-3.5 fill-current" />
            Parar
          </button>
        </div>
      )}

      {state === "recorded" && audioUrl && (
        <div className="mt-4 space-y-3">
          <audio controls preload="metadata" src={audioUrl} className="w-full" />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={recordAgain}
              className="flex items-center justify-center gap-2 rounded-sm border border-[#7A2332] px-3 py-2.5 text-[10px] font-display tracking-[0.16em] uppercase text-[#7A2332]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Gravar novamente
            </button>
            <button
              type="button"
              onClick={sendVoice}
              className="flex items-center justify-center gap-2 rounded-sm bg-[#7A2332] px-3 py-2.5 text-[10px] font-display tracking-[0.16em] uppercase text-[#FFF9F2]"
            >
              <Send className="h-3.5 w-3.5" />
              Enviar mensagem
            </button>
          </div>
        </div>
      )}

      {state === "uploading" && (
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#7A2332]">
          <Loader2 className="h-4 w-4 animate-spin" />
          A guardar a mensagem…
        </div>
      )}

      {state === "sent" && (
        <div className="mt-4 flex items-center justify-center gap-2 text-xs font-medium text-[#7A2332]">
          <Check className="h-4 w-4" />
          Mensagem guardada para os anfitriões.
        </div>
      )}

      {state === "error" && (
        <div className="mt-4 space-y-2">
          <p role="alert" className="text-xs text-red-700">{errorMessage}</p>
          <button
            type="button"
            onClick={recordAgain}
            className="text-[10px] font-display tracking-[0.18em] uppercase text-[#7A2332] underline underline-offset-4"
          >
            Tentar novamente
          </button>
        </div>
      )}
    </div>
  );
}
