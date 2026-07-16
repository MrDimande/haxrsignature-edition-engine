import { createAdminClient, isSupabaseConfigured } from "@lib/supabase/server";
import { getEditionEventBinding } from "@lib/rsvp/events";
import {
  buildRsvpIdentityKey,
  normalizeGuestName,
  normalizeRsvpEmail,
  normalizeRsvpPhone,
} from "@lib/rsvp/normalize";
import type { RsvpSubmission } from "@lib/rsvp/send-notification";

export type EditionRsvpPersistResult =
  | {
      ok: true;
      guestId: string;
      status: "confirmed" | "declined";
      created: boolean;
      partySize: number;
      plusOnes: number;
    }
  | {
      ok: false;
      error: string;
      skipped?: string;
    };

type ExistingEditionGuestIdentity = {
  name_normalized: string | null;
  email: string | null;
  phone: string | null;
};

export function resolveExistingRsvpIdentityKey(
  candidates: ExistingEditionGuestIdentity[],
  submission: Pick<RsvpSubmission, "name" | "email" | "phone">
): string {
  const email = normalizeRsvpEmail(submission.email);
  const phone = normalizeRsvpPhone(submission.phone);

  const contactMatch = candidates.find((candidate) => {
    if (email && normalizeRsvpEmail(candidate.email) === email) return true;
    if (phone && normalizeRsvpPhone(candidate.phone) === phone) return true;
    return false;
  });

  if (contactMatch?.name_normalized) {
    return contactMatch.name_normalized;
  }

  // Name fallback is safe only when no contact was supplied.
  if (!email && !phone) {
    const normalizedName = normalizeGuestName(submission.name);
    const nameMatch = candidates.find(
      (candidate) =>
        candidate.name_normalized === normalizedName ||
        candidate.name_normalized === `name:${normalizedName}`
    );
    if (nameMatch?.name_normalized) return nameMatch.name_normalized;
  }

  return buildRsvpIdentityKey(submission);
}

export async function persistEditionRsvp(
  submission: RsvpSubmission
): Promise<EditionRsvpPersistResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "supabase_not_configured", skipped: "supabase" };
  }

  const binding = getEditionEventBinding(submission.slug);
  if (!binding) {
    return {
      ok: false,
      error: "event_not_linked",
      skipped: "missing_event_id",
    };
  }

  const attending = submission.attending === true;
  const partySize = attending ? submission.guests : 0;
  const emailNormalized = normalizeRsvpEmail(submission.email);
  const phoneNormalized = normalizeRsvpPhone(submission.phone);

  const supabase = createAdminClient();
  const { data: existingGuests, error: lookupError } = await supabase
    .from("guests")
    .select("name_normalized,email,phone")
    .eq("event_id", binding.eventId)
    .eq("guest_source", "edition_rsvp");

  if (lookupError) {
    console.error("[RSVP] Identity lookup failed:", lookupError.message);
    return { ok: false, error: lookupError.message };
  }

  const identityKey = resolveExistingRsvpIdentityKey(
    (existingGuests ?? []) as ExistingEditionGuestIdentity[],
    submission
  );

  const { data, error } = await supabase.rpc("submit_edition_rsvp", {
    p_event_id: binding.eventId,
    p_name: submission.name.trim(),
    p_name_normalized: identityKey,
    p_attending: attending,
    p_party_size: partySize,
    p_edition_slug: binding.slug,
    p_email: emailNormalized,
    p_phone: phoneNormalized,
    p_message_for_bride: submission.messageForBride?.trim() ?? "",
    p_size: submission.size?.trim() ?? "",
    p_dress_code_confirmed: submission.dressCodeConfirmed ?? null,
  });

  if (error) {
    console.error("[RSVP] Supabase persist failed:", error.message);
    return { ok: false, error: error.message };
  }

  const payload = data as {
    ok?: boolean;
    error?: string;
    guestId?: string;
    status?: "confirmed" | "declined";
    created?: boolean;
    partySize?: number;
    plusOnes?: number;
  } | null;

  if (!payload?.ok || !payload.guestId || !payload.status) {
    return {
      ok: false,
      error: payload?.error ?? "persist_failed",
    };
  }

  return {
    ok: true,
    guestId: payload.guestId,
    status: payload.status,
    created: Boolean(payload.created),
    partySize: payload.partySize ?? partySize,
    plusOnes: payload.plusOnes ?? Math.max(0, partySize - 1),
  };
}
