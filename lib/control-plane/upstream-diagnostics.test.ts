import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readUpstreamDiagnostics } from "./upstream-diagnostics";

describe("readUpstreamDiagnostics", () => {
  it("extrai campos seguros do upstream", () => {
    const response = new Response("<html></html>", {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
    Object.defineProperty(response, "url", {
      value:
        "https://vercel.com/login?next=%2Fsso-api%3Furl%3Dhttps%253A%252F%252Fcore.example",
    });
    Object.defineProperty(response, "redirected", { value: true });

    const diagnostics = readUpstreamDiagnostics(response, true);

    assert.equal(diagnostics.trustedOidcPresent, true);
    assert.equal(diagnostics.upstreamStatus, 200);
    assert.equal(diagnostics.upstreamContentType, "text/html");
    assert.equal(diagnostics.upstreamRedirected, true);
    assert.equal(diagnostics.upstreamFinalHost, "vercel.com");
  });

  it("não inclui query string no host final", () => {
    const response = new Response("{}", {
      status: 400,
      headers: { "content-type": "application/json" },
    });
    Object.defineProperty(response, "url", {
      value: "https://haxrsignatureweb-abc.vercel.app/api/v1/edition/rsvp",
    });

    const diagnostics = readUpstreamDiagnostics(response, false);

    assert.equal(diagnostics.trustedOidcPresent, false);
    assert.equal(diagnostics.upstreamFinalHost, "haxrsignatureweb-abc.vercel.app");
    assert.equal(diagnostics.upstreamContentType, "application/json");
  });
});
