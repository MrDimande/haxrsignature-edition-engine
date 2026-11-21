import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  getInvitation,
  getActiveInvitations,
  activeInvitationSlugs,
} from "../../data/invitations";
import {
  isActiveInvitationSlug,
  resolveCanonicalInvitationSlug,
  resolveActiveInvitationSlug,
} from "./allowlist";
import { resolveActiveRsvpSlug } from "../rsvp/events";
import { getRegistryTheme } from "../../theme/registry";
import { BABY_AYLLA_EVENT } from "../aylla/event-details";

describe("Baby Aylla — Architectural & Security Contract", () => {
  it("registers canonical slug 'babyaylla' in theme engine with draft status", () => {
    const invitation = getInvitation("babyaylla");
    assert.ok(invitation, "Invitation config for 'babyaylla' must exist");
    assert.equal(invitation.slug, "babyaylla");
    assert.equal(invitation.engine, "theme");
    assert.equal(invitation.theme, "baby-aylla-couture");
    assert.equal(invitation.status, "draft");
    assert.equal(invitation.metadata.date, "2027-01-23");
    assert.equal(invitation.metadata.time, "Hora a confirmar");
    assert.equal(invitation.metadata.location, "Vila do Mar Eventos, Maputo, Moçambique");
  });

  it("resolves registered aliases 'aylla' and 'the-bow-collection' to canonical slug", () => {
    assert.equal(resolveCanonicalInvitationSlug("aylla"), "babyaylla");
    assert.equal(resolveCanonicalInvitationSlug("the-bow-collection"), "babyaylla");
    assert.equal(resolveCanonicalInvitationSlug("dior-collection-rosa"), "babyaylla");
    assert.equal(resolveCanonicalInvitationSlug("BABYAYLLA"), "babyaylla");
  });

  it("enforces fail-closed isolation: draft is excluded from active public allowlist", () => {
    assert.equal(
      isActiveInvitationSlug("babyaylla"),
      false,
      "Draft invitation must not be marked active"
    );
    assert.equal(
      resolveActiveInvitationSlug("babyaylla"),
      null,
      "resolveActiveInvitationSlug must return null for draft"
    );
    assert.equal(
      activeInvitationSlugs.includes("babyaylla"),
      false,
      "babyaylla must not appear in activeInvitationSlugs"
    );
    const activeList = getActiveInvitations();
    assert.equal(
      activeList.some((inv) => inv.slug === "babyaylla"),
      false,
      "babyaylla must not appear in getActiveInvitations()"
    );
  });

  it("prevents RSVP persistence leakage for unreleased draft edition", () => {
    assert.equal(
      resolveActiveRsvpSlug("babyaylla"),
      null,
      "resolveActiveRsvpSlug must return null for draft — fail-closed protection"
    );
    assert.equal(
      resolveActiveRsvpSlug("aylla"),
      null,
      "resolveActiveRsvpSlug must return null for alias when draft"
    );
  });

  it("registers 'baby-aylla-couture' theme with correct visual and audio tokens", () => {
    const theme = getRegistryTheme("baby-aylla-couture");
    assert.ok(theme, "Theme 'baby-aylla-couture' must be registered in ThemeRegistry");
    assert.equal(theme.identity, "baby-aylla-couture");
    assert.equal(theme.renderProfile, "baby-aylla-couture");
    assert.equal(theme.structure, "editorial");
    assert.equal(theme.flow, "ritual-entry");
    assert.equal(theme.audio.type, "ambient");
    assert.equal(theme.audio.volume, 0.24);
    assert.equal(theme.audio.fadeIn, 3000);
    assert.equal(theme.audio.src, BABY_AYLLA_EVENT.music.src);
    assert.equal(theme.audio.audioStartMode, "explicit-user-choice");
    assert.equal(theme.audio.loop, false);
    assert.equal(theme.colors.accent, "#C87A6E");
    assert.equal(theme.colors.primary, "#C49B94");
  });

  it("matches the canonical domain event details", () => {
    assert.equal(BABY_AYLLA_EVENT.eventDateIso, "2027-01-23");
    assert.equal(BABY_AYLLA_EVENT.celebrant, "Aylla");
    assert.equal(BABY_AYLLA_EVENT.collection, "Dior Collection Rosa");
    assert.equal(
      BABY_AYLLA_EVENT.concept,
      "Alta-Costura Infantil, Romantismo e Delicadeza Editorial"
    );
    assert.equal(BABY_AYLLA_EVENT.time.isConfirmed, false);
    assert.equal(BABY_AYLLA_EVENT.venue.isConfirmed, true);
    assert.equal(BABY_AYLLA_EVENT.venue.name, "Vila do Mar Eventos");
    assert.equal(BABY_AYLLA_EVENT.rsvp.isConfigured, true);
    assert.equal(BABY_AYLLA_EVENT.rsvp.adminEnvVar, "EDITION_EVENT_AYLLA_ID");
  });
});
