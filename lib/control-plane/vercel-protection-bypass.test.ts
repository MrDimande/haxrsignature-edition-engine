import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyCoreProtectionBypassHeader,
  isAuthorizedVercelAppCoreHost,
  redactProtectionBypassSecret,
  resolveCoreProtectionBypassHeader,
  VERCEL_PROTECTION_BYPASS_HEADER,
} from "./vercel-protection-bypass";

const PREVIEW_CORE =
  "https://haxrsignatureweb-nahhh0n0q-alberto-dimandes-projects.vercel.app";
const SECRET = "preview-bypass-secret-for-tests-only-32";

describe("isAuthorizedVercelAppCoreHost", () => {
  it("aceita hosts vercel.app de deployment", () => {
    assert.equal(
      isAuthorizedVercelAppCoreHost(
        "haxrsignatureweb-nahhh0n0q-alberto-dimandes-projects.vercel.app"
      ),
      true
    );
  });

  it("rejeita produção e hosts não autorizados", () => {
    assert.equal(isAuthorizedVercelAppCoreHost("www.haxrsignature.com"), false);
    assert.equal(isAuthorizedVercelAppCoreHost("vercel.app"), false);
    assert.equal(isAuthorizedVercelAppCoreHost("evil.vercel.app.evil.com"), false);
    assert.equal(isAuthorizedVercelAppCoreHost("a.b.vercel.app"), false);
  });
});

describe("resolveCoreProtectionBypassHeader", () => {
  it("aplica header em Preview configurado com host vercel.app", () => {
    const decision = resolveCoreProtectionBypassHeader(PREVIEW_CORE, {
      vercelEnv: "preview",
      bypassSecret: SECRET,
    });
    assert.equal(decision.apply, true);
    if (decision.apply) {
      assert.equal(decision.headerName, VERCEL_PROTECTION_BYPASS_HEADER);
      assert.equal(decision.headerValue, SECRET);
    }
  });

  it("ausente em Production", () => {
    const decision = resolveCoreProtectionBypassHeader(PREVIEW_CORE, {
      vercelEnv: "production",
      bypassSecret: SECRET,
    });
    assert.deepEqual(decision, { apply: false, reason: "not_preview" });
  });

  it("ausente quando não configurado", () => {
    const decision = resolveCoreProtectionBypassHeader(PREVIEW_CORE, {
      vercelEnv: "preview",
      bypassSecret: "",
    });
    assert.deepEqual(decision, { apply: false, reason: "missing_secret" });
  });

  it("ausente para destino não vercel.app", () => {
    const decision = resolveCoreProtectionBypassHeader(
      "https://www.haxrsignature.com",
      { vercelEnv: "preview", bypassSecret: SECRET }
    );
    assert.deepEqual(decision, { apply: false, reason: "unauthorized_host" });
  });
});

describe("applyCoreProtectionBypassHeader", () => {
  it("preserva Authorization Bearer e adiciona bypass só quando aplicável", () => {
    const headers: Record<string, string> = {
      Authorization: "Bearer haxr-proxy-secret",
    };
    applyCoreProtectionBypassHeader(headers, PREVIEW_CORE, {
      vercelEnv: "preview",
      bypassSecret: SECRET,
    });
    assert.equal(headers.Authorization, "Bearer haxr-proxy-secret");
    assert.equal(headers[VERCEL_PROTECTION_BYPASS_HEADER], SECRET);
  });

  it("não adiciona header em production", () => {
    const headers: Record<string, string> = {
      Authorization: "Bearer haxr-proxy-secret",
    };
    applyCoreProtectionBypassHeader(headers, PREVIEW_CORE, {
      vercelEnv: "production",
      bypassSecret: SECRET,
    });
    assert.equal(headers[VERCEL_PROTECTION_BYPASS_HEADER], undefined);
  });
});

describe("redactProtectionBypassSecret", () => {
  it("nunca deixa o secret aparecer em texto de erro/log", () => {
    const leaked = `upstream failed authorization=${SECRET} detail`;
    const redacted = redactProtectionBypassSecret(leaked, SECRET);
    assert.equal(redacted.includes(SECRET), false);
    assert.match(redacted, /\[REDACTED\]/);
  });
});
