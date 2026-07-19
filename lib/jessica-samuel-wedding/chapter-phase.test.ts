import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getWeddingChapterPhase } from "./chapter-phase";
import { WEDDING_EVENT, WEDDING_POST_EVENT } from "./event-details";

describe("jessica-samuel wedding chapter phase", () => {
  it("resolve before / today / after em Africa/Maputo", () => {
    assert.equal(
      getWeddingChapterPhase(
        WEDDING_EVENT.dateIso,
        new Date("2026-07-18T12:00:00+02:00")
      ),
      "before"
    );
    assert.equal(
      getWeddingChapterPhase(
        WEDDING_EVENT.dateIso,
        new Date("2026-08-15T10:00:00+02:00")
      ),
      "today"
    );
    assert.equal(
      getWeddingChapterPhase(
        WEDDING_EVENT.dateIso,
        new Date("2026-08-16T00:30:00+02:00")
      ),
      "after"
    );
  });

  it("expõe copy pós-evento com CTA para o álbum", () => {
    assert.match(WEDDING_POST_EVENT.title, /Obrigado/i);
    assert.equal(WEDDING_POST_EVENT.albumAnchorId, "memorias");
    assert.match(WEDDING_POST_EVENT.albumCta, /álbum/i);
    assert.match(WEDDING_POST_EVENT.signNames, /Jessica/);
  });
});
