export type LocalRsvpOutcome =
  | "honeypot"
  | "validation_error"
  | "rate_limited"
  | "persist_failed"
  | "email_failed"
  | "success"
  | "server_error";

export type LocalRsvpLogFields = {
  requestId: string;
  slug?: string;
  stage: "validate" | "rate_limit" | "persist" | "email" | "complete";
  durationMs: number;
  httpStatus: number;
  outcome: LocalRsvpOutcome;
  persisted?: boolean;
  emailSent?: boolean;
  guestEmailSent?: boolean;
};

export function logLocalRsvp(fields: LocalRsvpLogFields): void {
  const payload = {
    scope: "edition/rsvp/local",
    backend: "local" as const,
    ...fields,
  };
  console.info(JSON.stringify(payload));
}
