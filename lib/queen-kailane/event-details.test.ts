import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  QUEEN_KAILANE_COPY,
  QUEEN_KAILANE_EVENT,
  QUEEN_KAILANE_RSVP,
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

  it("keeps the confirmed ceremony time at 08h00", () => {
    assert.equal(QUEEN_KAILANE_EVENT.ceremonyTime, "08h00");
    assert.equal(getQueenKailaneCeremonyTime(), "08h00");
    assert.equal(shouldShowQueenKailaneCeremonyTime(), true);
  });

  it("keeps lunch at 13h00 in São Dâmaso", () => {
    assert.equal(getQueenKailaneLunchTime(), "13h00");
    assert.equal(QUEEN_KAILANE_EVENT.lunchLocation, "São Dâmaso");
    assert.equal(QUEEN_KAILANE_EVENT.lunchVenue, "Residência dos seus Pais");
  });

  it("keeps the Anglican parish venue and map plus code", () => {
    assert.match(
      QUEEN_KAILANE_EVENT.ceremonyVenue,
      /Igreja Anglicana/
    );
    assert.match(
      QUEEN_KAILANE_EVENT.ceremonyParish,
      /São Estêvão e Lourenço/
    );
    assert.equal(
      QUEEN_KAILANE_EVENT.mapPlusCode,
      "3FG8+97Q Paróquia Santo Estêvão da, Matola"
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

  it("builds timed ICS and Google Calendar URLs for 08h00", async () => {
    const {
      buildQueenKailaneIcsContent,
      buildQueenKailaneGoogleCalendarUrl,
    } = await import("./event-details");
    const ics = buildQueenKailaneIcsContent();
    assert.match(ics, /DTSTART;TZID=Africa\/Maputo:20260830T080000/);
    assert.match(ics, /DTEND;TZID=Africa\/Maputo:20260830T170000/);
    assert.match(
      buildQueenKailaneGoogleCalendarUrl(),
      /dates=20260830T060000Z%2F20260830T150000Z|dates=20260830T060000Z\/20260830T150000Z/
    );
  });

  it("does not invent a remote event id in the client module", () => {
    // Server env only — helper returns boolean without inventing UUID
    assert.equal(typeof isQueenKailaneRemotePersistConfigured(), "boolean");
  });

  it("sets the authorized RSVP deadline to 28 August 2026", () => {
    assert.equal(QUEEN_KAILANE_RSVP.deadlineIso, "2026-08-28");
    assert.equal(QUEEN_KAILANE_RSVP.deadlineLabel, "28 de Agosto de 2026");
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

  it("configures exactly 7 sacred blessings of light with valid references", async () => {
    const { QUEEN_KAILANE_BLESSINGS, getQueenKailaneBlessingForGuest } =
      await import("./event-details");
    assert.equal(QUEEN_KAILANE_BLESSINGS.length, 7);
    for (const b of QUEEN_KAILANE_BLESSINGS) {
      assert.ok(b.id >= 1 && b.id <= 7);
      assert.ok(b.theme.length > 0);
      assert.ok(b.verse.length > 10);
      assert.ok(b.reference.length > 3);
    }

    const b1 = getQueenKailaneBlessingForGuest("Carlos Cande");
    const b2 = getQueenKailaneBlessingForGuest("Carlos Cande");
    assert.equal(b1.id, b2.id, "Blessing assignment should be deterministic for the same name");

    const defaultBlessing = getQueenKailaneBlessingForGuest("");
    assert.equal(defaultBlessing.id, 1);
  });
});

describe("queen-kailane registry wiring", () => {
  it("registers invitation metadata with confirmed ceremony time 08h00", () => {
    const invitation = getInvitation(QUEEN_KAILANE_SLUG);
    assert.ok(invitation);
    assert.equal(invitation.slug, QUEEN_KAILANE_SLUG);
    assert.equal(invitation.theme, "queen-kailane-luz-da-graca");
    assert.equal(invitation.metadata.date, "2026-08-30");
    assert.equal(invitation.metadata.eventDate, "2026-08-30");
    assert.equal(invitation.metadata.eventType, "Sacramento do Crisma");
    assert.equal(invitation.metadata.time, "08h00");
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

  it("registers theme with luz-da-graca render profile, map coordinates and ambient audio", () => {
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
    assert.equal(
      queenKailaneLuzDaGracaTheme.copy.location.mapCoordinates,
      "3FG8+97Q, Matola"
    );
    assert.equal(queenKailaneLuzDaGracaTheme.audio.type, "ambient");
    assert.equal(
      queenKailaneLuzDaGracaTheme.audio.src,
      "/audio/tatana-yamukela-mhamba.mp3"
    );
    assert.equal(
      queenKailaneLuzDaGracaTheme.audio.credit?.title,
      "Tatana Yamukela Mhamba"
    );
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

  it("binds queenkailanecrisma exclusively to EDITION_EVENT_QUEEN_KAILANE_ID", async () => {
    const { getEditionEventBinding, isEditionPersistenceConfigured } = await import(
      "../rsvp/events"
    );
    process.env.EDITION_EVENT_QUEEN_KAILANE_ID = "test-queen-uuid";

    try {
      const binding = getEditionEventBinding(QUEEN_KAILANE_SLUG);
      assert.ok(binding, "Binding for queenkailanecrisma should exist");
      assert.equal(binding.slug, QUEEN_KAILANE_SLUG);
      assert.equal(binding.envVar, "EDITION_EVENT_QUEEN_KAILANE_ID");
      assert.equal(binding.eventId, "test-queen-uuid");
      assert.equal(isEditionPersistenceConfigured(QUEEN_KAILANE_SLUG), true);
    } finally {
      delete process.env.EDITION_EVENT_QUEEN_KAILANE_ID;
    }
  });
});
