import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, it } from "node:test";
import {
  applyTrustedOidcHeader,
  CORE_TRUSTED_OIDC_HEADER,
  isTrustedOidcPresent,
  resolveEditionCoreOidcToken,
} from "./core-trusted-oidc";
import {
  clearOidcEnv,
  oidcEnvPresence,
  restoreOidcEnv,
  snapshotOidcEnv,
  withClearedOidcEnv,
  withPoisonedOidcEnv,
} from "./oidc-test-isolation";

const SOURCE_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "core-trusted-oidc.ts"
);
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const VERCEL_DIR = path.join(REPO_ROOT, ".vercel");

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
  it("devolve undefined quando o reader falha (fail-closed sem throw)", async () => {
    const token = await resolveEditionCoreOidcToken(async () => {
      throw new Error("oidc unavailable");
    });
    assert.equal(token, undefined);
  });

  it("trim e rejeita token vazio do reader", async () => {
    assert.equal(await resolveEditionCoreOidcToken(async () => "   "), undefined);
    assert.equal(
      await resolveEditionCoreOidcToken(async () => "  preview-token  "),
      "preview-token"
    );
  });

  it("usa getVercelOidcToken como única fonte — sem fallbacks manuais", () => {
    const source = fs.readFileSync(SOURCE_PATH, "utf8");
    assert.match(source, /getVercelOidcToken/);
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
      await resolveEditionCoreOidcToken(async () => "secret-oidc-value");
      assert.equal(
        logs.some((line) => line.includes("secret-oidc-value")),
        false
      );
    } finally {
      console.info = originalInfo;
      console.warn = originalWarn;
      console.error = originalError;
    }
  });
});

describe("OIDC test isolation", () => {
  const suiteBaseline = snapshotOidcEnv();

  afterEach(() => {
    restoreOidcEnv(suiteBaseline);
  });

  it("env envenenado não afecta resolve com reader injectado", async () => {
    await withPoisonedOidcEnv(async () => {
      assert.equal(oidcEnvPresence().VERCEL_OIDC_TOKEN, true);
      const token = await resolveEditionCoreOidcToken(async () => {
        throw new Error("forced fail-closed");
      });
      assert.equal(token, undefined);
      assert.equal(
        await resolveEditionCoreOidcToken(async () => "isolated-ok"),
        "isolated-ok"
      );
    });
  });

  it("independente da presença de .vercel no repo", async () => {
    const hadVercelDir = fs.existsSync(VERCEL_DIR);
    let createdTempMarker: string | undefined;

    try {
      if (!hadVercelDir) {
        fs.mkdirSync(VERCEL_DIR, { recursive: true });
        createdTempMarker = path.join(VERCEL_DIR, `.oidc-isolation-${process.pid}`);
        fs.writeFileSync(
          createdTempMarker,
          "synthetic .vercel marker for OIDC isolation test\n",
          "utf8"
        );
      }

      assert.equal(fs.existsSync(VERCEL_DIR), true);
      assert.equal(
        await resolveEditionCoreOidcToken(async () => {
          throw new Error("vercel dir must not drive reader");
        }),
        undefined
      );
      assert.equal(
        await resolveEditionCoreOidcToken(async () => "vercel-independent"),
        "vercel-independent"
      );
    } finally {
      if (createdTempMarker && fs.existsSync(createdTempMarker)) {
        fs.unlinkSync(createdTempMarker);
      }
      if (!hadVercelDir && fs.existsSync(VERCEL_DIR)) {
        // Remove only the empty synthetic dir we created (never wipe a real link).
        const remaining = fs.readdirSync(VERCEL_DIR);
        if (remaining.length === 0) {
          fs.rmdirSync(VERCEL_DIR);
        }
      }
    }
  });

  it("ordem independente: poison → clear → reader determinístico", async () => {
    const before = snapshotOidcEnv();
    try {
      process.env.VERCEL_OIDC_TOKEN = "poison-first-pass";
      assert.equal(
        await resolveEditionCoreOidcToken(async () => undefined),
        undefined
      );

      clearOidcEnv();
      assert.equal(oidcEnvPresence().VERCEL_OIDC_TOKEN, false);

      assert.equal(
        await resolveEditionCoreOidcToken(async () => "after-clear"),
        "after-clear"
      );

      await withClearedOidcEnv(async () => {
        process.env.VERCEL_OIDC_TOKEN = "mid-isolation-poison";
        assert.equal(
          await resolveEditionCoreOidcToken(async () => {
            throw new Error("still isolated");
          }),
          undefined
        );
      });
    } finally {
      restoreOidcEnv(before);
    }
  });

  it("helper restaura snapshot após poison (sem vazar presença)", async () => {
    const baseline = oidcEnvPresence();
    await withPoisonedOidcEnv(async () => {
      assert.equal(oidcEnvPresence().VERCEL_OIDC_TOKEN, true);
    });
    assert.deepEqual(oidcEnvPresence(), baseline);
  });

  it("afterEach + withClearedOidcEnv restauram env herdado", async () => {
    const marker = `oidc-restore-${process.pid}-${Date.now()}`;
    process.env.VERCEL_OIDC_TOKEN = marker;
    assert.equal(oidcEnvPresence().VERCEL_OIDC_TOKEN, true);

    await withClearedOidcEnv(async () => {
      assert.equal(oidcEnvPresence().VERCEL_OIDC_TOKEN, false);
      assert.equal(
        await resolveEditionCoreOidcToken(async () => "cleared-ok"),
        "cleared-ok"
      );
    });

    assert.equal(process.env.VERCEL_OIDC_TOKEN, marker);
  });
});

describe("rsvp-proxy trusted OIDC contract", () => {
  it("proxy mantém Bearer HAXR + OIDC e aplica bypass Preview só via helper", () => {
    const source = fs.readFileSync(
      path.join(path.dirname(fileURLToPath(import.meta.url)), "rsvp-proxy.ts"),
      "utf8"
    );
    assert.match(source, /applyTrustedOidcHeader\(coreHeaders, trustedOidcToken\)/);
    assert.match(source, /Authorization: `Bearer \$\{secret\}`/);
    assert.match(source, /applyCoreProtectionBypassHeader\(coreHeaders, coreBase\)/);
    assert.match(source, /readUpstreamDiagnostics\(response, trustedOidcPresent\)/);
    assert.match(source, /isTrustedOidcPresent\(trustedOidcToken\)/);
    assert.match(source, /redactProtectionBypassSecret/);
    assert.doesNotMatch(source, /x-vercel-protection-bypass:\s/);
    assert.doesNotMatch(source, /VERCEL_AUTOMATION_BYPASS_SECRET/);
  });
});
