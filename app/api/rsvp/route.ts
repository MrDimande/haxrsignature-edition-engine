import { NextResponse } from "next/server";
import { getRsvpEmailConfig } from "@lib/rsvp/config";
import { isEditionPersistenceConfigured } from "@lib/rsvp/events";
import { persistEditionRsvp } from "@lib/rsvp/persist";
import { sendRsvpNotificationEmail } from "@lib/rsvp/send-notification";
import {
  getRequestIp,
  RATE_LIMITS,
  rateLimitResponse,
} from "@lib/security/rate-limit";
import { persistentRateLimit } from "@lib/security/persistent-rate-limit";
import { isSupabaseConfigured } from "@lib/supabase/server";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizePhone(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, 30);
}

function normalizeEmail(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase().slice(0, 160);
}

export async function POST(request: Request) {
  try {
    const ip = getRequestIp(request);
    const rateKey = `edition:rsvp:${ip}`;
    const rateResult = await persistentRateLimit(
      rateKey,
      RATE_LIMITS.editionRsvp
    );

    if (!rateResult.allowed) {
      return rateLimitResponse(rateResult);
    }

    const body = await request.json();
    const { name, attending, guests, honeypot, slug, email, phone } = body;

    if (honeypot && honeypot.trim() !== "") {
      console.warn("Spam submission blocked via honeypot field.");
      return NextResponse.json(
        { success: true, message: "RSVP process completed (honeypot trigger)." },
        { status: 200 }
      );
    }

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Por favor, introduza o seu nome." },
        { status: 400 }
      );
    }

    if (attending === undefined) {
      return NextResponse.json(
        { success: false, error: "Por favor, indique se irá comparecer." },
        { status: 400 }
      );
    }

    const parsedGuests = parseInt(guests, 10);
    if (
      attending &&
      (isNaN(parsedGuests) || parsedGuests < 1 || parsedGuests > 10)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "O número de pessoas deve ser entre 1 e 10.",
        },
        { status: 400 }
      );
    }

    const normalizedEmail = normalizeEmail(email);
    const normalizedPhone = normalizePhone(phone);

    if (normalizedEmail && !EMAIL_PATTERN.test(normalizedEmail)) {
      return NextResponse.json(
        { success: false, error: "Por favor, introduza um email válido." },
        { status: 400 }
      );
    }

    if (attending && !normalizedEmail && !normalizedPhone) {
      return NextResponse.json(
        {
          success: false,
          error: "Indique email ou telefone para contacto.",
        },
        { status: 400 }
      );
    }

    const submission = {
      name: name.trim(),
      attending: Boolean(attending),
      guests: attending ? parsedGuests : 0,
      slug: typeof slug === "string" ? slug : "jessicakulaya",
      email: normalizedEmail || undefined,
      phone: normalizedPhone || undefined,
    };

    const persistenceRequired =
      isSupabaseConfigured() && isEditionPersistenceConfigured(submission.slug);

    let persistResult: Awaited<ReturnType<typeof persistEditionRsvp>> | null =
      null;

    if (persistenceRequired) {
      persistResult = await persistEditionRsvp(submission);

      if (!persistResult.ok) {
        console.error("[RSVP] Persist failed:", persistResult.error);
        return NextResponse.json(
          {
            success: false,
            error:
              "Não foi possível registar a confirmação. Tente novamente em instantes.",
          },
          { status: 502 }
        );
      }
    } else if (isSupabaseConfigured()) {
      console.warn(
        `[RSVP] Event ID não configurado para slug "${submission.slug}" — apenas email.`
      );
    }

    const emailConfig = getRsvpEmailConfig(submission.slug);
    let emailResult: Awaited<ReturnType<typeof sendRsvpNotificationEmail>> | null =
      null;

    if (emailConfig) {
      try {
        emailResult = await sendRsvpNotificationEmail(submission, emailConfig);
      } catch (emailError) {
        console.error("[RSVP] Email delivery failed:", emailError);

        if (persistResult?.ok) {
          return NextResponse.json(
            {
              success: false,
              error:
                "A confirmação foi registada, mas não foi possível enviar o email. Contacte a equipa HAXR.",
            },
            { status: 502 }
          );
        }

        if (process.env.RESEND_API_KEY) {
          return NextResponse.json(
            {
              success: false,
              error:
                "Não foi possível enviar a confirmação. Tente novamente em instantes.",
            },
            { status: 502 }
          );
        }
      }
    }

    console.log(
      `[RSVP SUCCESS] Guest: ${submission.name}, Attending: ${submission.attending}, Guests: ${submission.guests}, Persisted: ${Boolean(persistResult?.ok)}, TeamEmail: ${Boolean(emailResult?.teamSent)}, GuestEmail: ${Boolean(emailResult?.guestSent)}`
    );

    return NextResponse.json(
      {
        success: true,
        message: "O seu RSVP foi registado com sucesso!",
        data: submission,
        persisted: Boolean(persistResult?.ok),
        emailSent: Boolean(emailResult?.teamSent),
        guestEmailSent: Boolean(emailResult?.guestSent),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("RSVP Server Error:", error);
    return NextResponse.json(
      { success: false, error: "Ocorreu um erro ao processar o seu RSVP." },
      { status: 500 }
    );
  }
}
