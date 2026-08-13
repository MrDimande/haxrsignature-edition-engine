import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  NIAN_AUDIO_AUTHORIZED,
  NIAN_EVENT,
  NIAN_VENUE,
  getNianEventTimeLabel,
  getNianMapsUrl,
  getNianVenueCity,
  getNianVenueName,
  hasNianMapsUrl,
  isNianRemotePersistConfigured,
  readNianRsvpLocalRecord,
  resolveNianAudioSrc,
  resolveNianMapsUrl,
  shouldShowNianEventTime,
} from "./event-details";
import { nianNightOfTheWebTheme } from "../../theme/definitions/nian-night-of-the-web";
import { ThemeRegistry } from "../../theme/registry";

describe("nian event-details", () => {
  it("configures event time to 12h00", () => {
    assert.equal(NIAN_EVENT.timeLabel, "12h00");
    assert.equal(getNianEventTimeLabel(), "12h00");
    assert.equal(shouldShowNianEventTime(), true);
  });

  it("uses authorised sunflower track when flag is enabled", () => {
    assert.equal(NIAN_AUDIO_AUTHORIZED, true);
    assert.equal(
      resolveNianAudioSrc(),
      "/audio/nian/sunflower-authorized.mp3"
    );
  });

  it("shows maps button only for the exact authorised mapsUrl", () => {
    assert.equal(
      NIAN_VENUE.mapsUrl,
      "https://share.google/iJNUcEM5s2AiQUxiX"
    );
    assert.equal(getNianMapsUrl(), "https://share.google/iJNUcEM5s2AiQUxiX");
    assert.equal(hasNianMapsUrl(), true);
    assert.equal(getNianVenueName(), "Salão de Eventos Benerla");
    assert.match(getNianVenueCity(), /MARRACUENE/);
  });

  it("hides maps button for null or invalid urls", () => {
    assert.equal(resolveNianMapsUrl(null), null);
    assert.equal(resolveNianMapsUrl(""), null);
    assert.equal(resolveNianMapsUrl("not-a-url"), null);
    assert.equal(resolveNianMapsUrl("ftp://example.com/x"), null);
    assert.equal(
      resolveNianMapsUrl("https://share.google/iJNUcEM5s2AiQUxiX"),
      "https://share.google/iJNUcEM5s2AiQUxiX"
    );
  });

  it("does not invent a remote event id in the client module", () => {
    // Server env only — helper returns null without EDITION_EVENT_NIAN_ID
    assert.equal(typeof isNianRemotePersistConfigured(), "boolean");
  });

  it("parses local RSVP records safely", () => {
    assert.equal(readNianRsvpLocalRecord(null), null);
    assert.equal(readNianRsvpLocalRecord("{"), null);
    const ok = readNianRsvpLocalRecord(
      JSON.stringify({
        attending: true,
        name: "Ada",
        submittedAt: "2026-01-01T00:00:00.000Z",
      })
    );
    assert.ok(ok);
    assert.equal(ok.attending, true);
    assert.equal(ok.name, "Ada");
  });
});

describe("nian RSVP contract reuse", () => {
  it("accepts minimal attending payload for slug nian", async () => {
    const { validateLocalRsvpPayload } = await import("@lib/rsvp/validate-local");
    const result = validateLocalRsvpPayload({
      slug: "nian",
      name: "Ada Lovelace",
      attending: true,
      guests: 1,
      email: "ada@example.com",
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      // Client sends "nian"; server resolves to public canonical route slug
      assert.equal(result.slug, "nianwebnight");
      assert.equal(result.submission.attending, true);
      assert.equal(result.submission.guests, 1);
    }
  });

  it("accepts decline payload without contact", async () => {
    const { validateLocalRsvpPayload } = await import("@lib/rsvp/validate-local");
    const result = validateLocalRsvpPayload({
      slug: "nian",
      name: "Ada Lovelace",
      attending: false,
      guests: 0,
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.submission.attending, false);
      assert.equal(result.submission.guests, 0);
    }
  });
});

describe("nian-night-of-the-web theme", () => {
  it("registers with explicit-user-choice audio and no loop", () => {
    const theme = ThemeRegistry["nian-night-of-the-web"];
    assert.equal(theme.renderProfile, "nian-night-of-the-web");
    assert.equal(theme.audio.audioStartMode, "explicit-user-choice");
    assert.equal(theme.audio.loop, false);
    assert.equal(theme.audio.src, "/audio/nian/sunflower-authorized.mp3");
  });

  it("does not change stan audio start defaults", () => {
    const stan = ThemeRegistry["stan-real-madrid"];
    assert.equal(stan.audio.audioStartMode, undefined);
    assert.equal(stan.audio.loop, undefined);
  });

  it("keeps identity aligned with definition export", () => {
    assert.equal(nianNightOfTheWebTheme.identity, "nian-night-of-the-web");
  });
});
