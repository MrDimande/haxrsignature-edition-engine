import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { logProxyRsvp } from "./logging";

describe("logProxyRsvp diagnostic fields", () => {
  it("regista campos seguros sem token ou PII", () => {
    const lines: string[] = [];
    const originalInfo = console.info;
    console.info = (...args: unknown[]) => {
      lines.push(args.map(String).join(" "));
    };

    try {
      logProxyRsvp({
        requestId: "req-diagnostic-1",
        backend: "proxy",
        outcome: "invalid_core_response",
        proxyLatencyMs: 412,
        trustedOidcPresent: true,
        upstreamStatus: 200,
        upstreamContentType: "text/html",
        upstreamRedirected: true,
        upstreamFinalHost: "vercel.com",
      });

      assert.equal(lines.length, 1);
      const payload = JSON.parse(lines[0] ?? "{}") as Record<string, unknown>;

      assert.equal(payload.scope, "edition/rsvp/proxy");
      assert.equal(payload.trustedOidcPresent, true);
      assert.equal(payload.upstreamStatus, 200);
      assert.equal(payload.upstreamContentType, "text/html");
      assert.equal(payload.upstreamRedirected, true);
      assert.equal(payload.upstreamFinalHost, "vercel.com");
      assert.equal(payload.outcome, "invalid_core_response");
      assert.equal(String(lines[0]).includes("eyJ"), false);
      assert.equal(String(lines[0]).includes("Bearer"), false);
    } finally {
      console.info = originalInfo;
    }
  });
});
