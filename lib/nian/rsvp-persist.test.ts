import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isNianRsvpPersistConfirmed,
  isNianRsvpStrictPersistMode,
  NIAN_RSVP_NOT_PERSISTED_MESSAGE,
  shouldAcceptNianRsvpSuccess,
} from "./rsvp-persist";

describe("nian rsvp persist gate", () => {
  it("confirma apenas success+persisted true", () => {
    assert.equal(
      isNianRsvpPersistConfirmed({ success: true, persisted: true }),
      true
    );
    assert.equal(
      isNianRsvpPersistConfirmed({ success: true, persisted: false }),
      false
    );
    assert.equal(
      isNianRsvpPersistConfirmed({ success: true }),
      false
    );
    assert.equal(
      isNianRsvpPersistConfirmed({ success: false, persisted: true }),
      false
    );
  });

  it("em produção rejeita persisted false e respostas antigas sem campo", () => {
    assert.equal(isNianRsvpStrictPersistMode("production"), true);
    assert.equal(
      shouldAcceptNianRsvpSuccess(
        { success: true, persisted: false },
        { nodeEnv: "production" }
      ),
      false
    );
    assert.equal(
      shouldAcceptNianRsvpSuccess(
        { success: true },
        { nodeEnv: "production" }
      ),
      false
    );
    assert.equal(
      shouldAcceptNianRsvpSuccess(
        { success: true, persisted: true },
        { nodeEnv: "production" }
      ),
      true
    );
  });

  it("em desenvolvimento autoriza success local sem persisted", () => {
    assert.equal(isNianRsvpStrictPersistMode("development"), false);
    assert.equal(
      shouldAcceptNianRsvpSuccess(
        { success: true, persisted: false },
        { nodeEnv: "development" }
      ),
      true
    );
    assert.equal(
      shouldAcceptNianRsvpSuccess(
        { success: true },
        { nodeEnv: "development" }
      ),
      true
    );
  });

  it("options.strict força rejeição mesmo em development", () => {
    assert.equal(
      shouldAcceptNianRsvpSuccess(
        { success: true, persisted: false },
        { strict: true, nodeEnv: "development" }
      ),
      false
    );
  });

  it("expõe mensagem humana quando não persistiu", () => {
    assert.match(NIAN_RSVP_NOT_PERSISTED_MESSAGE, /ainda não foi guardada/i);
  });
});
