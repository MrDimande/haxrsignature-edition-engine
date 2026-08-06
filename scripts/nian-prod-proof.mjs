/**
 * Production local smoke for Nian on :3011
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE = process.env.NIAN_URL || "http://localhost:3011/nian";
const OUT = path.resolve("tmp/nian-visual-review/runtime-proof-prod");

fs.mkdirSync(OUT, { recursive: true });

async function overlay(page) {
  return page.evaluate(() => {
    const t = document.body?.innerText || "";
    return {
      hasSyntax: /Runtime SyntaxError|Invalid or unexpected token/i.test(t),
      hasDialog: Boolean(document.querySelector("[data-nextjs-dialog]")),
      issueBubble: Boolean(
        [...document.querySelectorAll("body *")].find((el) =>
          /^\d+\s+Issues?$/i.test((el.textContent || "").trim())
        )
      ),
    };
  });
}

async function main() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const report = {
    base: BASE,
    pageErrors: [],
    consoleErrors: [],
    timings: null,
    withMusic: null,
    withoutMusic: null,
    overlayAt1500: null,
  };

  async function freshPage() {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      deviceScaleFactor: 2,
    });
    const page = await ctx.newPage();
    page.on("pageerror", (e) => report.pageErrors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") report.consoleErrors.push(m.text());
    });
    return { ctx, page };
  }

  // Cold load + timings
  {
    const { ctx, page } = await freshPage();
    await page.goto(`${BASE}?prod=${Date.now()}`, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });
    await page.waitForSelector('[data-nian-gate][data-nian-hydrated="true"]', {
      timeout: 60000,
    });
    const t0 = Date.now();
    await page.screenshot({ path: path.join(OUT, "01-gate-no-overlay.png") });

    let cta1 = null;
    let cta2 = null;
    for (let i = 0; i < 80; i++) {
      const s = await page.evaluate(() => {
        const btns = [...document.querySelectorAll("[data-nian-gate] button")];
        return btns.map((b) => ({ disabled: b.disabled }));
      });
      const elapsed = Date.now() - t0;
      if (cta1 == null && s[0] && !s[0].disabled) cta1 = elapsed;
      if (cta2 == null && s[1] && !s[1].disabled) cta2 = elapsed;
      if (cta1 != null && cta2 != null) break;
      await page.waitForTimeout(40);
    }

    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(OUT, "02-gate-after-1500ms.png") });
    report.timings = { cta1ClickableMs: cta1, cta2ClickableMs: cta2 };
    report.overlayAt1500 = await overlay(page);
    await ctx.close();
  }

  // Enter without music
  {
    const { ctx, page } = await freshPage();
    await page.goto(`${BASE}?wout=${Date.now()}`, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });
    const btn = page.locator("button", { hasText: /Entrar sem música/i });
    await btn.waitFor({ state: "visible", timeout: 60000 });
    for (let i = 0; i < 50; i++) {
      if (await btn.isEnabled()) break;
      await page.waitForTimeout(100);
    }
    await btn.click({ force: true });
    await page.waitForSelector("#hero", { timeout: 30000 });
    await page.waitForSelector("#origin");
    await page.waitForSelector("#brief");
    await page.waitForSelector("#action");
    await page.screenshot({
      path: path.join(OUT, "03-prod-after-enter-without-music.png"),
    });
    report.withoutMusic = { ok: true, overlay: await overlay(page) };
    await ctx.close();
  }

  // Enter with music
  {
    const { ctx, page } = await freshPage();
    await page.goto(`${BASE}?with=${Date.now()}`, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });
    const btn = page.locator("button", { hasText: /Entrar com música/i });
    await btn.waitFor({ state: "visible", timeout: 60000 });
    for (let i = 0; i < 50; i++) {
      if (await btn.isEnabled()) break;
      await page.waitForTimeout(100);
    }
    await btn.click({ force: true });
    await page.waitForSelector("#hero", { timeout: 30000 });
    await page.screenshot({
      path: path.join(OUT, "04-prod-after-enter-with-music.png"),
    });
    report.withMusic = { ok: true, overlay: await overlay(page) };
    await ctx.close();
  }

  await browser.close();

  const fail = [];
  if (report.pageErrors.length) fail.push(`pageErrors: ${JSON.stringify(report.pageErrors)}`);
  if (report.consoleErrors.length)
    fail.push(`consoleErrors: ${JSON.stringify(report.consoleErrors)}`);
  if (
    report.overlayAt1500?.hasSyntax ||
    report.overlayAt1500?.hasDialog ||
    report.overlayAt1500?.issueBubble
  ) {
    fail.push("overlay present");
  }
  if (report.timings.cta1ClickableMs == null || report.timings.cta1ClickableMs > 1300) {
    fail.push(`cta1 late ${report.timings.cta1ClickableMs}`);
  }
  if (report.withoutMusic?.overlay?.hasSyntax) fail.push("withoutMusic syntax");
  if (report.withMusic?.overlay?.hasSyntax) fail.push("withMusic syntax");

  fs.writeFileSync(path.join(OUT, "REPORT.json"), JSON.stringify(report, null, 2));
  fs.writeFileSync(
    path.join(OUT, "REPORT.txt"),
    [
      "Production local proof — " + BASE,
      JSON.stringify(report, null, 2),
      fail.length ? "FAIL: " + fail.join("; ") : "PASS",
      "",
    ].join("\n")
  );

  console.log(JSON.stringify(report, null, 2));
  if (fail.length) {
    console.error("FAIL", fail);
    process.exit(1);
  }
  console.log("PROD PROOF OK", OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
