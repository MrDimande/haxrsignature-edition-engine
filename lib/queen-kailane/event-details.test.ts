import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  QUEEN_KAILANE_COPY,
  QUEEN_KAILANE_EVENT,
  QUEEN_KAILANE_SIGNATURE,
  QUEEN_KAILANE_SLUG,
  QUEEN_KAILANE_VERSE,
  getQueenKailaneCeremonyTime,
  getQueenKailaneLunchTime,
  isQueenKailaneRemotePersistConfigured,
  readQueenKailaneRsvpLocalRecord,
  shouldShowQueenKailaneCeremonyTime,
} from "./event-details";
import {
  shouldAcceptQueenKailaneRsvpSuccess,
} from "./rsvp-persist";
import { queenKailaneLuzDaGracaTheme } from "../../theme/definitions/queen-kailane-luz-da-graca";
import { ThemeRegistry } from "../../theme/registry";
import { getInvitation } from "../../data/invitations";

describe("queen-kailane event-details", () => {
  it("keeps the authorised event date at 30 August 2026", () => {
    assert.equal(QUEEN_KAILANE_EVENT.dateIso, "2026-08-30");
    assert.equal(QUEEN_KAILANE_EVENT.dateDisplay, "30 · Agosto · 2026");
    assert.equal(QUEEN_KAILANE_EVENT.dateDisplayShort, "30 · AGOSTO · 2026");
  });

  it("does not invent ceremony time while pending", () => {
    assert.equal(QUEEN_KAILANE_EVENT.ceremonyTime, null);
    assert.equal(getQueenKailaneCeremonyTime(), null);
    assert.equal(shouldShowQueenKailaneCeremonyTime(), false);
  });

  it("keeps lunch at 13h00 in São Dâmaso", () => {
    assert.equal(getQueenKailaneLunchTime(), "13h00");
    assert.equal(QUEEN_KAILANE_EVENT.lunchLocation, "São Dâmaso");
    assert.equal(QUEEN_KAILANE_EVENT.lunchVenue, "Residência dos seus Pais");
  });

  it("keeps the Anglican parish venue", () => {
    assert.match(
      QUEEN_KAILANE_EVENT.ceremonyVenue,
      /Igreja Anglicana/
    );
    assert.match(
      QUEEN_KAILANE_EVENT.ceremonyParish,
      /São Estêvão e Lourenço/
    );
  });

  it("keeps the authorised verse spelling ANDAI", () => {
    assert.equal(QUEEN_KAILANE_VERSE.text, "ANDAI COMO FILHOS DA LUZ.");
    assert.equal(QUEEN_KAILANE_VERSE.reference, "EFÉSIOS 5:8");
    assert.doesNotMatch(QUEEN_KAILANE_VERSE.text, /Andal/i);
  });

  it("keeps conceptual signature and title", () => {
    assert.equal(QUEEN_KAILANE_EVENT.conceptualTitle, "LUZ DA GRAÇA");
    assert.equal(QUEEN_KAILANE_SIGNATURE.line1, "CONFIRMADA NA FÉ.");
    assert.equal(QUEEN_KAILANE_SIGNATURE.line2, "GUIADA PELA LUZ.");
    assert.equal(QUEEN_KAILANE_COPY.gateCta, "ENTRAR NA LUZ");
  });

  it("uses the canonical public slug", () => {
    assert.equal(QUEEN_KAILANE_SLUG, "queenkailanecrisma");
  });

  it("builds all-day ICS without inventing a clock time", async () => {
    const {
      buildQueenKailaneIcsContent,
      buildQueenKailaneGoogleCalendarUrl,
    } = await import("./event-details");
    const ics = buildQueenKailaneIcsContent();
    assert.match(ics, /DTSTART;VALUE=DATE:20260830/);
    assert.match(ics, /DTEND;VALUE=DATE:20260831/);
    assert.doesNotMatch(ics, /DTSTART;TZID=/);
    assert.match(
      buildQueenKailaneGoogleCalendarUrl(),
      /dates=20260830%2F20260831|dates=20260830\/20260831/
    );
  });

  it("does not invent a remote event id in the client module", () => {
    // Server env only — helper returns boolean without inventing UUID
    assert.equal(typeof isQueenKailaneRemotePersistConfigured(), "boolean");
  });

  it("parses local RSVP records safely", () => {
    assert.equal(readQueenKailaneRsvpLocalRecord(null), null);
    assert.equal(readQueenKailaneRsvpLocalRecord("{"), null);
    const ok = readQueenKailaneRsvpLocalRecord(
      JSON.stringify({
        attending: true,
        name: "Maria",
        submittedAt: "2026-01-01T00:00:00.000Z",
      })
    );
    assert.ok(ok);
    assert.equal(ok.attending, true);
    assert.equal(ok.name, "Maria");
  });
});

describe("queen-kailane registry wiring", () => {
  it("registers invitation metadata without inventing ceremony time", () => {
    const invitation = getInvitation(QUEEN_KAILANE_SLUG);
    assert.ok(invitation);
    assert.equal(invitation.slug, QUEEN_KAILANE_SLUG);
    assert.equal(invitation.theme, "queen-kailane-luz-da-graca");
    assert.equal(invitation.metadata.date, "2026-08-30");
    assert.equal(invitation.metadata.eventDate, "2026-08-30");
    assert.equal(invitation.metadata.eventType, "Sacramento do Crisma");
    assert.equal(invitation.metadata.time, "");
    assert.equal(
      invitation.metadata.ogImage,
      "/images/queen-kailane/social/queen-kailane-og.png"
    );
    assert.match(
      invitation.metadata.location,
      /Igreja Anglicana/
    );
    assert.equal(
      invitation.admin?.envVar,
      "EDITION_EVENT_QUEEN_KAILANE_ID"
    );
    assert.equal(
      invitation.admin?.expectedRegistryKey,
      "queen-kailane-luz-da-graca"
    );
  });

  it("registers theme with luz-da-graca render profile", () => {
    assert.equal(
      queenKailaneLuzDaGracaTheme.renderProfile,
      "queen-kailane-luz-da-graca"
    );
    assert.equal(
      ThemeRegistry["queen-kailane-luz-da-graca"]?.identity,
      "queen-kailane-luz-da-graca"
    );
    assert.equal(queenKailaneLuzDaGracaTheme.assets.monogram, "QKC");
    assert.equal(queenKailaneLuzDaGracaTheme.copy.enterCta, "ENTRAR NA LUZ");
  });
});

describe("queen-kailane rsvp persist rules", () => {
  it("accepts persisted success in strict mode", () => {
    assert.equal(
      shouldAcceptQueenKailaneRsvpSuccess(
        { success: true, persisted: true },
        { strict: true }
      ),
      true
    );
  });

  it("rejects non-persisted success in strict mode", () => {
    assert.equal(
      shouldAcceptQueenKailaneRsvpSuccess(
        { success: true, persisted: false },
        { strict: true }
      ),
      false
    );
  });

  it("allows local success in development mode", () => {
    assert.equal(
      shouldAcceptQueenKailaneRsvpSuccess(
        { success: true, persisted: false },
        { strict: false }
      ),
      true
    );
  });
});
