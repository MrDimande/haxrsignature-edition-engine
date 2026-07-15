import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { escapeHtml, sanitizeEmailText } from "./escape-html";
import {
  buildEmailDetailCard,
  buildEmailStatusHero,
} from "./brand-shell";

describe("escapeHtml", () => {
  it("escapa caracteres HTML críticos", () => {
    assert.equal(
      escapeHtml(`<script>alert(1)</script>`),
      "&lt;script&gt;alert(1)&lt;/script&gt;"
    );
    assert.equal(
      escapeHtml(`" onclick="alert(1)`),
      "&quot; onclick=&quot;alert(1)"
    );
    assert.equal(escapeHtml(`Tom & Maria`), "Tom &amp; Maria");
    assert.equal(escapeHtml(`<b>Nome</b>`), "&lt;b&gt;Nome&lt;/b&gt;");
    assert.equal(
      escapeHtml(`<img src=x onerror=alert(1)>`),
      "&lt;img src=x onerror=alert(1)&gt;"
    );
  });

  it("trata null/undefined como string vazia", () => {
    assert.equal(escapeHtml(null), "");
    assert.equal(escapeHtml(undefined), "");
  });
});

describe("email rendering", () => {
  it("escapa o nome no status hero", () => {
    const html = buildEmailStatusHero(
      true,
      `<img src=x onerror=alert(1)>`,
      "1 pessoa"
    );
    assert.doesNotMatch(html, /<img src=x/);
    assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  });

  it("escapa valores do detail card", () => {
    const html = buildEmailDetailCard([
      { label: "Observação", value: `<script>alert(1)</script>` },
    ]);
    assert.doesNotMatch(html, /<script>/);
    assert.match(html, /&lt;script&gt;/);
  });

  it("sanitizeEmailText remove controlo e limpa espaços", () => {
    assert.equal(sanitizeEmailText("  Ana\n  Costa  "), "Ana Costa");
  });
});
