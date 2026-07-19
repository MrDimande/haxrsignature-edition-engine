import { createAdminClient, isSupabaseConfigured } from "@lib/supabase/server";
import {
  getEditionEventBinding,
  type EditionEventBinding,
} from "@lib/rsvp/events";
import { normalizeGuestName } from "@lib/rsvp/normalize";
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

async function resolveVerifiedEventBinding(
  binding: EditionEventBinding
): Promise<EditionEventBinding | null> {
  if (!binding.expectedRegistryKey) {
    return binding;
  }

  const supabase = createAdminClient();
  const { data: configuredEvent, error: configuredError } = await supabase
    .from("events")
    .select("id, edition_registry_key")
    .eq("id", binding.eventId)
    .maybeSingle();

  if (configuredError) {
    console.error(
      `[RSVP] Failed to verify event binding for slug "${binding.slug}": ${configuredError.message}`
    );
    return null;
  }

  if (configuredEvent?.edition_registry_key === binding.expectedRegistryKey) {
    return binding;
  }

  console.error(
    `[RSVP] Event binding mismatch for slug "${binding.slug}": ${binding.envVar} points to registry "${configuredEvent?.edition_registry_key ?? "missing"}", expected "${binding.expectedRegistryKey}".`
  );

  const { data: fallbackEvents, error: fallbackError } = await supabase
    .from("events")
    .select("id")
    .eq("edition_registry_key", binding.expectedRegistryKey)
    .eq("is_active", true)
    .order("date", { ascending: true, nullsFirst: false })
    .limit(2);

  if (fallbackError) {
    console.error(
      `[RSVP] Failed to resolve fallback event for slug "${binding.slug}": ${fallbackError.message}`
    );
    return null;
  }

  if (fallbackEvents?.length === 1 && typeof fallbackEvents[0].id === "string") {
    return {
      ...binding,
      eventId: fallbackEvents[0].id,
      envVar: `${binding.envVar}:verified-by-registry`,
    };
  }

  console.error(
    `[RSVP] Could not safely resolve one active event for registry "${binding.expectedRegistryKey}" and slug "${binding.slug}".`
  );
  return null;
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
  const verifiedBinding = await resolveVerifiedEventBinding(binding);
  if (!verifiedBinding) {
    return {
      ok: false,
      error: "event_binding_mismatch",
      skipped: "event_binding_verification",
    };
  }

  const partySize = submission.attending ? submission.guests : 0;
  const nameNormalized = normalizeGuestName(submission.name);

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("submit_edition_rsvp", {
    p_event_id: verifiedBinding.eventId,
    p_name: submission.name.trim(),
    p_name_normalized: nameNormalized,
    p_attending: submission.attending,
    p_party_size: partySize,
    p_edition_slug: verifiedBinding.slug,
    p_email: submission.email?.trim() ?? "",
    p_phone: submission.phone?.trim() ?? "",
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
