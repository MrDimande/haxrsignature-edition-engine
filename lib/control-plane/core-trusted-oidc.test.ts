import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import {
  applyTrustedOidcHeader,
  CORE_TRUSTED_OIDC_HEADER,
  isTrustedOidcPresent,
  resolveEditionCoreOidcToken,
} from "./core-trusted-oidc";

const SOURCE_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "core-trusted-oidc.ts"
);

describe("isTrustedOidcPresent", () => {
  it("token exists → true e header Trusted Sources anexado", () => {
    const token = "preview-trusted-token";
    assert.equal(isTrustedOidcPresent(token), true);

    const headers: Record<string, string> = {};
    applyTrustedOidcHeader(headers, token);
    assert.equal(headers[CORE_TRUSTED_OIDC_HEADER], token);
  });

  it("token absent → false e header omitido", () => {
    assert.equal(isTrustedOidcPresent(undefined), false);
    assert.equal(isTrustedOidcPresent(""), false);
    assert.equal(isTrustedOidcPresent("   "), false);

    const headers: Record<string, string> = {};
    applyTrustedOidcHeader(headers, undefined);
    assert.equal(headers[CORE_TRUSTED_OIDC_HEADER], undefined);
  });
});

describe("applyTrustedOidcHeader", () => {
  it("envia x-vercel-trusted-oidc-idp-token quando há token", () => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    applyTrustedOidcHeader(headers, "oidc-token-example");
    assert.equal(headers[CORE_TRUSTED_OIDC_HEADER], "oidc-token-example");
  });

  it("omite o header Trusted Sources quando o token está ausente", () => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    applyTrustedOidcHeader(headers, undefined);
    assert.equal(headers[CORE_TRUSTED_OIDC_HEADER], undefined);
  });

  it("não regista o valor do token", () => {
    const logs: string[] = [];
    const originalInfo = console.info;
    console.info = (...args: unknown[]) => {
      logs.push(args.map(String).join(" "));
    };

    try {
      const headers: Record<string, string> = {};
      applyTrustedOidcHeader(headers, "secret-oidc-value");
      assert.equal(
        logs.some((line) => line.includes("secret-oidc-value")),
        false
      );
    } finally {
      console.info = originalInfo;
    }
  });
});

describe("resolveEditionCoreOidcToken", () => {
  it("devolve undefined em local quando getVercelOidcToken falha", async () => {
    const token = await resolveEditionCoreOidcToken();
    assert.equal(token, undefined);
  });

  it("usa getVercelOidcToken como única fonte — sem fallbacks manuais", () => {
    const source = fs.readFileSync(SOURCE_PATH, "utf8");
    assert.match(source, /getVercelOidcToken\(\)/);
    assert.doesNotMatch(source, /x-vercel-oidc-token/);
    assert.doesNotMatch(source, /VERCEL_OIDC_TOKEN/);
    assert.doesNotMatch(source, /readOidcFromRuntime/);
  });

  it("não regista tokens em resolveEditionCoreOidcToken", async () => {
    const logs: string[] = [];
    const originalInfo = console.info;
    const originalWarn = console.warn;
    const originalError = console.error;

    console.info = (...args: unknown[]) => {
      logs.push(args.map(String).join(" "));
    };
    console.warn = (...args: unknown[]) => {
      logs.push(args.map(String).join(" "));
    };
    console.error = (...args: unknown[]) => {
      logs.push(args.map(String).join(" "));
    };

    try {
      await resolveEditionCoreOidcToken();
      assert.equal(logs.length, 0);
    } finally {
      console.info = originalInfo;
      console.warn = originalWarn;
      console.error = originalError;
    }
  });
});

describe("rsvp-proxy trusted OIDC contract", () => {
  it("proxy usa applyTrustedOidcHeader sem protection-bypass", () => {
    const source = fs.readFileSync(
      path.join(path.dirname(fileURLToPath(import.meta.url)), "rsvp-proxy.ts"),
      "utf8"
    );
    assert.match(source, /applyTrustedOidcHeader\(coreHeaders, trustedOidcToken\)/);
    assert.match(source, /Authorization: `Bearer \$\{secret\}`/);
    assert.match(source, /readUpstreamDiagnostics\(response, trustedOidcPresent\)/);
    assert.match(source, /isTrustedOidcPresent\(trustedOidcToken\)/);
    assert.doesNotMatch(source, /protection-bypass/i);
    assert.doesNotMatch(source, /PROTECTION_BYPASS/);
  });
});
