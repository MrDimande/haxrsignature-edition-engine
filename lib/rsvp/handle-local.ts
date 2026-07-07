import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getRsvpEmailConfig } from "@lib/rsvp/config";
import {
  isEditionPersistenceConfigured,
  resolveInvitationSlug,
} from "@lib/rsvp/events";
import { logLocalRsvp } from "@lib/rsvp/logging";
import { buildLocalRsvpSuccessBody } from "@lib/rsvp/local-response";
import { persistEditionRsvp } from "@lib/rsvp/persist";
import { sendRsvpNotificationEmail } from "@lib/rsvp/send-notification";
import { validateLocalRsvpPayload } from "@lib/rsvp/validate-local";
import {
  getRequestIp,
  RATE_LIMITS,
  rateLimitResponse,
} from "@lib/security/rate-limit";
import { persistentRateLimit } from "@lib/security/persistent-rate-limit";
import { isSupabaseConfigured } from "@lib/supabase/server";

type HandleLocalOptions = {
  rawBody?: string;
  requestId?: string;
};

function logStage(
  requestId: string,
  stage: Parameters<typeof logLocalRsvp>[0]["stage"],
  startedAt: number,
  httpStatus: number,
  outcome: Parameters<typeof logLocalRsvp>[0]["outcome"],
  extra?: Pick<
    Parameters<typeof logLocalRsvp>[0],
    "slug" | "persisted" | "emailSent" | "guestEmailSent"
  >
): void {
  logLocalRsvp({
    requestId,
    stage,
    durationMs: Date.now() - startedAt,
    httpStatus,
    outcome,
    ...extra,
  });
}

function queueRsvpNotificationEmail(
  requestId: string,
  submission: Parameters<typeof sendRsvpNotificationEmail>[0],
  emailConfig: NonNullable<ReturnType<typeof getRsvpEmailConfig>>
): void {
  void sendRsvpNotificationEmail(submission, emailConfig)
    .then((emailResult) => {
      logLocalRsvp({
        requestId,
        slug: submission.slug,
        stage: "email",
        durationMs: 0,
        httpStatus: 200,
        outcome: "success",
        persisted: true,
        emailSent: Boolean(emailResult.teamSent),
        guestEmailSent: Boolean(emailResult.guestSent),
      });
    })
    .catch((emailError) => {
      console.error("[RSVP] Email delivery failed:", emailError);
      logLocalRsvp({
        requestId,
        slug: submission.slug,
        stage: "email",
        durationMs: 0,
        httpStatus: 200,
        outcome: "email_failed",
        persisted: true,
        emailSent: false,
        guestEmailSent: false,
      });
    });
}

export async function handleLocalRsvpPost(
  request: Request,
  options?: HandleLocalOptions
): Promise<NextResponse> {
  const requestId = options?.requestId ?? randomUUID();
  const startedAt = Date.now();

  try {
    const body = options?.rawBody
      ? JSON.parse(options.rawBody)
      : await request.json();

    const validation = validateLocalRsvpPayload(body);

    if (!validation.ok) {
      logStage(
        requestId,
        "validate",
        startedAt,
        validation.status,
        validation.outcome
      );
      return NextResponse.json(validation.body, { status: validation.status });
    }

    const { submission } = validation;

    const ip = getRequestIp(request);
    const rateKey = `edition:rsvp:${ip}`;
    const rateResult = await persistentRateLimit(
      rateKey,
      RATE_LIMITS.editionRsvp
    );

    if (!rateResult.allowed) {
      logStage(requestId, "rate_limit", startedAt, 429, "rate_limited", {
        slug: submission.slug,
      });
      return rateLimitResponse(rateResult);
    }

    const persistenceRequired =
      isSupabaseConfigured() && isEditionPersistenceConfigured(submission.slug);

    let persistResult: Awaited<ReturnType<typeof persistEditionRsvp>> | null =
      null;

    if (persistenceRequired) {
      persistResult = await persistEditionRsvp(submission);

      if (!persistResult.ok) {
        console.error("[RSVP] Persist failed:", persistResult.error);
        logStage(requestId, "persist", startedAt, 502, "persist_failed", {
          slug: submission.slug,
        });
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
    const persisted = Boolean(persistResult?.ok);

    if (emailConfig) {
      if (persisted) {
        queueRsvpNotificationEmail(requestId, submission, emailConfig);
      } else {
        try {
          const emailResult = await sendRsvpNotificationEmail(
            submission,
            emailConfig
          );

          logStage(requestId, "email", startedAt, 200, "success", {
            slug: submission.slug,
            persisted: false,
            emailSent: Boolean(emailResult.teamSent),
            guestEmailSent: Boolean(emailResult.guestSent),
          });

          return NextResponse.json(buildLocalRsvpSuccessBody(), {
            status: 200,
          });
        } catch (emailError) {
          console.error("[RSVP] Email delivery failed:", emailError);

          if (process.env.RESEND_API_KEY) {
            logStage(requestId, "email", startedAt, 502, "email_failed", {
              slug: submission.slug,
              persisted: false,
            });
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
    }

    logStage(requestId, "complete", startedAt, 200, "success", {
      slug: submission.slug,
      persisted,
      emailSent: false,
      guestEmailSent: false,
    });

    return NextResponse.json(buildLocalRsvpSuccessBody(), { status: 200 });
  } catch (error) {
    console.error("RSVP Server Error:", error);
    logStage(requestId, "complete", startedAt, 500, "server_error");
    return NextResponse.json(
      { success: false, error: "Ocorreu um erro ao processar o seu RSVP." },
      { status: 500 }
    );
  }
}
