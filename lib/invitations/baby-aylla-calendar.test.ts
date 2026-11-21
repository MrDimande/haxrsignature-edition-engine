import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getDaysUntilAylla } from "../aylla/calendar";

describe("Aylla calendar-day countdown", () => {
  it("uses Maputo midnight rather than the viewer's time zone", () => {
    assert.equal(getDaysUntilAylla(new Date("2027-01-21T21:59:59Z")), 2);
    assert.equal(getDaysUntilAylla(new Date("2027-01-21T22:00:00Z")), 1);
  });
  it("keeps one day until the celebration date begins locally", () => {
    assert.equal(getDaysUntilAylla(new Date("2027-01-22T21:59:59Z")), 1);
    assert.equal(getDaysUntilAylla(new Date("2027-01-22T22:00:00Z")), 0);
  });
  it("distinguishes the celebration day from a past celebration", () => {
    assert.equal(getDaysUntilAylla(new Date("2027-01-23T21:59:59Z")), 0);
    assert.equal(getDaysUntilAylla(new Date("2027-01-23T22:00:00Z")), -1);
  });
  it("crosses the year boundary using the canonical event date", () => {
    assert.equal(getDaysUntilAylla(new Date("2026-12-31T22:00:00Z")), 22);
  });
  it("does not silently accept an invalid clock", () => {
    assert.throws(() => getDaysUntilAylla(new Date(Number.NaN)), RangeError);
  });
});
