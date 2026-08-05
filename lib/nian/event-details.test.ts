import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  NIAN_AUDIO_AUTHORIZED,
  NIAN_EVENT,
  getNianEventTimeLabel,
  resolveNianAudioSrc,
  shouldShowNianEventTime,
} from "./event-details";
import { nianNightOfTheWebTheme } from "../../theme/definitions/nian-night-of-the-web";
import { ThemeRegistry } from "../../theme/registry";

describe("nian event-details", () => {
  it("does not invent event time while pending", () => {
    assert.equal(NIAN_EVENT.timeLabel, null);
    assert.equal(getNianEventTimeLabel(), null);
    assert.equal(shouldShowNianEventTime(), false);
  });

  it("resolves placeholder audio until authorised flag is true", () => {
    assert.equal(NIAN_AUDIO_AUTHORIZED, false);
    assert.equal(
      resolveNianAudioSrc(),
      "/audio/nian/sunflower-placeholder.mp3"
    );
  });
});

describe("nian-night-of-the-web theme", () => {
  it("registers with explicit-user-choice audio and no loop", () => {
    const theme = ThemeRegistry["nian-night-of-the-web"];
    assert.equal(theme.renderProfile, "nian-night-of-the-web");
    assert.equal(theme.audio.audioStartMode, "explicit-user-choice");
    assert.equal(theme.audio.loop, false);
    assert.equal(theme.audio.src, "/audio/nian/sunflower-placeholder.mp3");
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
