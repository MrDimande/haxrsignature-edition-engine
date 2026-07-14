import { isFarewellRsvpDeadlinePassed, FAREWELL_EVENT } from "@lib/farewell/event-details";
import { resolveActiveRsvpSlug } from "@lib/rsvp/events";
import { parseAttending } from "@lib/rsvp/parse-attending";
import type { RsvpSubmission } from "@lib/rsvp/send-notification";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const RSVP_FIELD_LIMITS = {
  name: 120,
  email: 160,
  phone: 30,
  message: 280,
  size: 12,
} as const;

function normalizePhone(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, RSVP_FIELD_LIMITS.phone);
}

function normalizeEmail(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase().slice(0, RSVP_FIELD_LIMITS.email);
}

function validationError(error: string): LocalRsvpValidationError {
  return {
    ok: false,
    status: 400,
    outcome: "validation_error",
    body: {
      success: false,
      error,
    },
  };
}

export type LocalRsvpValidationError = {
  ok: false;
  status: 400;
  body: {
    success: false;
    error: string;
  };
  outcome: "validation_error";
};

export type LocalRsvpHoneypot = {
  ok: false;
  status: 200;
  body: {
    success: true;
    message: string;
  };
  outcome: "honeypot";
};

export type LocalRsvpValidationSuccess = {
  ok: true;
  submission: RsvpSubmission;
  slug: string;
  isFarewell: boolean;
};

export type LocalRsvpValidationResult =
  | LocalRsvpValidationError
  | LocalRsvpHoneypot
  | LocalRsvpValidationSuccess;

export function validateLocalRsvpPayload(body: unknown): LocalRsvpValidationResult {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return validationError("Por favor, introduza o seu nome.");
  }

  const record = body as Record<string, unknown>;
  const {
    name,
    attending,
    guests,
    honeypot,
    slug,
    email,
    phone,
    messageForBride,
    size,
    dressCodeConfirmed,
  } = record;

  if (typeof honeypot === "string" && honeypot.trim() !== "") {
    return {
      ok: false,
      status: 200,
      outcome: "honeypot",
      body: {
        success: true,
        message: "RSVP process completed.",
      },
    };
  }

  const resolvedSlug = resolveActiveRsvpSlug(
    typeof slug === "string" ? slug : undefined
  );
  if (!resolvedSlug) {
    return validationError("Convite inválido ou indisponível.");
  }

  if (typeof name !== "string" || name.trim() === "") {
    return validationError("Por favor, introduza o seu nome.");
  }

  const trimmedName = name.trim().slice(0, RSVP_FIELD_LIMITS.name);
  if (trimmedName.length === 0) {
    return validationError("Por favor, introduza o seu nome.");
  }

  const attendingResult = parseAttending(attending);
  if (!attendingResult.ok) {
    return validationError(attendingResult.error);
  }
  const isAttending = attendingResult.attending;

  const parsedGuests = parseInt(String(guests), 10);
  if (
    isAttending &&
    (Number.isNaN(parsedGuests) || parsedGuests < 1 || parsedGuests > 10)
  ) {
    return validationError("O número de pessoas deve ser entre 1 e 10.");
  }

  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = normalizePhone(phone);

  if (normalizedEmail && !EMAIL_PATTERN.test(normalizedEmail)) {
    return validationError("Por favor, introduza um email válido.");
  }

  const isFarewell = resolvedSlug === FAREWELL_EVENT.slug;

  if (isFarewell && !normalizedPhone) {
    return validationError("Indique o telefone para contacto (WhatsApp).");
  }

  if (isAttending && !normalizedEmail && !normalizedPhone) {
    return validationError("Indique email ou telefone para contacto.");
  }

  if (isFarewell && isFarewellRsvpDeadlinePassed()) {
    return validationError(
      "O prazo para confirmação terminou. Contacte a organizadora."
    );
  }

  const normalizedMessage =
    typeof messageForBride === "string"
      ? messageForBride.trim().slice(0, RSVP_FIELD_LIMITS.message)
      : undefined;
  const normalizedSize =
    typeof size === "string"
      ? size.trim().slice(0, RSVP_FIELD_LIMITS.size)
      : undefined;

  return {
    ok: true,
    slug: resolvedSlug,
    isFarewell,
    submission: {
      name: trimmedName,
      attending: isAttending,
      guests: isAttending ? parsedGuests : 0,
      slug: resolvedSlug,
      email: normalizedEmail || undefined,
      phone: normalizedPhone || undefined,
      messageForBride: normalizedMessage || undefined,
      size: normalizedSize || undefined,
      dressCodeConfirmed:
        typeof dressCodeConfirmed === "boolean"
          ? dressCodeConfirmed
          : undefined,
    },
  };
}
