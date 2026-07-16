"use client";

import { useCallback, useState } from "react";
import {
  resolveRsvpClientOutcome,
  type RsvpApiPayload,
  type RsvpClientOutcome,
} from "@lib/rsvp/client-outcome";

export type UniversalRsvpPayload = {
  slug: string;
  name: string;
  attending: boolean;
  guests: number;
  email?: string;
  phone?: string;
  messageForBride?: string;
  size?: string;
  dressCodeConfirmed?: boolean;
  honeypot?: string;
};

export type UniversalRsvpResult = {
  response: Response;
  data: RsvpApiPayload;
  outcome: RsvpClientOutcome;
};

/** One browser contract for every theme. event_id is intentionally absent. */
export async function submitUniversalRsvp(
  payload: UniversalRsvpPayload,
  signal?: AbortSignal
): Promise<UniversalRsvpResult> {
  const response = await fetch("/api/rsvp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });

  let data: RsvpApiPayload;
  try {
    data = (await response.json()) as RsvpApiPayload;
  } catch {
    throw new Error("Resposta inválida do servidor.");
  }

  return {
    response,
    data,
    outcome: resolveRsvpClientOutcome(response.ok, data),
  };
}

export type UniversalRsvpSubmitStatus =
  | "idle"
  | "sending"
  | "success"
  | "error";

/** Reusable submission state for new invitations and simple RSVP themes. */
export function useRsvpSubmission() {
  const [status, setStatus] = useState<UniversalRsvpSubmitStatus>("idle");
  const [error, setError] = useState("");

  const submit = useCallback(
    async (
      payload: UniversalRsvpPayload,
      signal?: AbortSignal
    ): Promise<UniversalRsvpResult> => {
      if (status === "sending") {
        throw new Error("Já existe uma confirmação em processamento.");
      }

      setStatus("sending");
      setError("");

      try {
        const result = await submitUniversalRsvp(payload, signal);
        if (
          result.outcome.kind === "success" ||
          result.outcome.kind === "persisted_partial"
        ) {
          setStatus("success");
        } else {
          setStatus("error");
          setError(result.outcome.message);
        }
        return result;
      } catch (cause) {
        const message =
          cause instanceof Error
            ? cause.message
            : "Não foi possível enviar a confirmação.";
        setStatus("error");
        setError(message);
        throw cause;
      }
    },
    [status]
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setError("");
  }, []);

  return { status, error, submit, reset };
}
