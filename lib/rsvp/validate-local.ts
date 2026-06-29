import { isFarewellRsvpDeadlinePassed, FAREWELL_EVENT } from "@lib/farewell/event-details";
import { resolveInvitationSlug } from "@lib/rsvp/events";
import type { RsvpSubmission } from "@lib/rsvp/send-notification";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizePhone(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, 30);
}

function normalizeEmail(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase().slice(0, 160);
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
  if (!body || typeof body !== "object") {
    return {
      ok: false,
      status: 400,
      outcome: "validation_error",
      body: {
        success: false,
        error: "Por favor, introduza o seu nome.",
      },
    };
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

  const canonicalSlug = resolveInvitationSlug(
    typeof slug === "string" ? slug : undefined
  );

  if (typeof honeypot === "string" && honeypot.trim() !== "") {
    return {
      ok: false,
      status: 200,
      outcome: "honeypot",
      body: {
        success: true,
        message: "RSVP process completed (honeypot trigger).",
      },
    };
  }

  if (typeof name !== "string" || name.trim() === "") {
    return {
      ok: false,
      status: 400,
      outcome: "validation_error",
      body: {
        success: false,
        error: "Por favor, introduza o seu nome.",
      },
    };
  }

  if (attending === undefined) {
    return {
      ok: false,
      status: 400,
      outcome: "validation_error",
      body: {
        success: false,
        error: "Por favor, indique se irá comparecer.",
      },
    };
  }

  const parsedGuests = parseInt(String(guests), 10);
  if (
    attending &&
    (Number.isNaN(parsedGuests) || parsedGuests < 1 || parsedGuests > 10)
  ) {
    return {
      ok: false,
      status: 400,
      outcome: "validation_error",
      body: {
        success: false,
        error: "O número de pessoas deve ser entre 1 e 10.",
      },
    };
  }

  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = normalizePhone(phone);

  if (normalizedEmail && !EMAIL_PATTERN.test(normalizedEmail)) {
    return {
      ok: false,
      status: 400,
      outcome: "validation_error",
      body: {
        success: false,
        error: "Por favor, introduza um email válido.",
      },
    };
  }

  const isFarewell = canonicalSlug === FAREWELL_EVENT.slug;

  if (isFarewell && !normalizedPhone) {
    return {
      ok: false,
      status: 400,
      outcome: "validation_error",
      body: {
        success: false,
        error: "Indique o telefone para contacto (WhatsApp).",
      },
    };
  }

  if (attending && !normalizedEmail && !normalizedPhone) {
    return {
      ok: false,
      status: 400,
      outcome: "validation_error",
      body: {
        success: false,
        error: "Indique email ou telefone para contacto.",
      },
    };
  }

  if (isFarewell && isFarewellRsvpDeadlinePassed()) {
    return {
      ok: false,
      status: 400,
      outcome: "validation_error",
      body: {
        success: false,
        error: "O prazo para confirmação terminou. Contacte a organizadora.",
      },
    };
  }

  const normalizedMessage =
    typeof messageForBride === "string"
      ? messageForBride.trim().slice(0, 280)
      : undefined;
  const normalizedSize =
    typeof size === "string" ? size.trim().slice(0, 12) : undefined;

  const resolvedSlug =
    canonicalSlug ?? (typeof slug === "string" ? slug : "jessicakulaya");

  return {
    ok: true,
    slug: resolvedSlug,
    isFarewell,
    submission: {
      name: name.trim(),
      attending: Boolean(attending),
      guests: attending ? parsedGuests : 0,
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
