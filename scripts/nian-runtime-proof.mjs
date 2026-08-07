/**
 * Nian cold-load / runtime diagnostics + Gate timing proof.
 * Fails hard on pageerror, Next overlay, or SyntaxError.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE = process.env.NIAN_URL || "http://localhost:3010/nian";
const OUT = path.resolve("tmp/nian-visual-review/runtime-proof");

function ensureOut() {
  fs.mkdirSync(OUT, { recursive: true });
}

function attachListeners(page, bag) {
  page.on("pageerror", (error) => {
    bag.pageErrors.push({
      message: error.message,
      stack: error.stack || null,
      name: error.name,
    });
  });
  page.on("console", (msg) => {
    const entry = {
      type: msg.type(),
      text: msg.text(),
      location: msg.location(),
    };
    bag.console.push(entry);
    if (msg.type() === "error") bag.consoleErrors.push(entry);
  });
  page.on("response", async (res) => {
    if (res.status() >= 400 && res.url().includes("/_next/")) {
      bag.badResponses.push({
        status: res.status(),
        url: res.url(),
      });
    }
  });
}

async function detectOverlay(page) {
  return page.evaluate(() => {
    const bodyText = document.body?.innerText || "";
    const dialog =
      document.querySelector("[data-nextjs-dialog]") ||
      document.querySelector("[data-nextjs-dialog-overlay]") ||
      document.querySelector("nextjs-portal [role='dialog']");
    const issueBubble = Array.from(document.querySelectorAll("body *")).find(
      (el) => /^\d+\s+Issues?$/i.test((el.textContent || "").trim())
    );
    const hasSyntaxErrorText = /Invalid or unexpected token|Runtime SyntaxError/i.test(
      bodyText
    );
    const hasOverlay =
      Boolean(dialog) ||
      hasSyntaxErrorText ||
      Boolean(issueBubble);
    const issueMatch = bodyText.match(/(\d+)\s+Issues?/i);
    return {
      hasOverlay,
      issueCount: issueMatch ? Number(issueMatch[1]) : null,
      bodySnippet: bodyText.slice(0, 2500),
      hasSyntaxErrorText,
      portalCount: document.querySelectorAll("nextjs-portal").length,
      hasDialog: Boolean(dialog),
      hasIssueBubble: Boolean(issueBubble),
    };
  });
}

function assertClean(bag, overlay, label) {
  const failures = [];
  if (bag.pageErrors.length) {
    failures.push(
      `pageerror (${bag.pageErrors.length}): ${bag.pageErrors
        .map((e) => e.message)
        .join(" | ")}`
    );
  }
  const bundleConsole = bag.consoleErrors.filter(
    (e) =>
      /syntaxerror|unexpected token|chunk load|webpack/i.test(e.text) ||
      e.text.includes("/_next/") ||
      /Failed to load resource/i.test(e.text)
  );
  if (bundleConsole.length) {
    failures.push(
      `console bundle errors (${bundleConsole.length}): ${bundleConsole
        .map((e) => e.text)
        .slice(0, 5)
        .join(" | ")}`
    );
  }
  if (overlay.hasOverlay || overlay.hasSyntaxErrorText) {
    failures.push(
      `Next overlay detected (issues=${overlay.issueCount}): ${overlay.bodySnippet.slice(0, 400)}`
    );
  }
  if (/Invalid or unexpected token|Runtime SyntaxError/i.test(
    JSON.stringify(bag)
  )) {
    failures.push("SyntaxError string present in collected diagnostics");
  }
  if (failures.length) {
    const err = new Error(`[${label}] RUNTIME FAIL\n- ${failures.join("\n- ")}`);
    err.diagnostics = { bag, overlay };
    throw err;
  }
}

async function measureGateTiming(page) {
  // Unequivocal client mount mark (avoids SSR-shell clock skew)
  await page.waitForSelector(
    '[data-nian-gate][data-nian-hydrated="true"]',
    { timeout: 60000 }
  );
  const t0 = Date.now();

  const poll = async () =>
    page.evaluate(() => {
      const dialog = document.querySelector(
        '[role="dialog"][aria-labelledby="nian-gate-title"]'
      );
      if (!dialog) return null;
      const eyebrow = dialog.querySelector("#nian-gate-eyebrow");
      const headline = dialog.querySelector("#nian-gate-title");
      const desc = Array.from(dialog.querySelectorAll("p")).find((p) =>
        /experiência para o aniversário/i.test(p.textContent || "")
      );
      const buttons = Array.from(
        dialog.querySelectorAll('button[type="button"]')
      );
      const cta1 = buttons[0] || null;
      const cta2 = buttons[1] || null;

      const vis = (el) => {
        if (!el) return { visible: false, opacity: 0, pe: null, box: null };
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        let opacity = Number(cs.opacity);
        // Accumulate ancestor opacity (motion wrappers often fade the parent)
        let node = el.parentElement;
        while (node && node !== document.body) {
          const po = Number(getComputedStyle(node).opacity);
          if (!Number.isNaN(po)) opacity *= po;
          node = node.parentElement;
        }
        const visible =
          cs.visibility !== "hidden" &&
          cs.display !== "none" &&
          opacity > 0.05 &&
          r.width > 0 &&
          r.height > 0;
        return {
          visible,
          opacity,
          pe: cs.pointerEvents,
          disabled: el instanceof HTMLButtonElement ? el.disabled : null,
          box: {
            w: Math.round(r.width),
            h: Math.round(r.height),
            y: Math.round(r.y),
          },
        };
      };

      return {
        gate: vis(dialog),
        eyebrow: vis(eyebrow),
        headline: vis(headline),
        description: vis(desc),
        cta1: vis(cta1),
        cta2: vis(cta2),
        cta1Clickable:
          Boolean(cta1) &&
          !cta1.disabled &&
          getComputedStyle(cta1).pointerEvents !== "none" &&
          Number(getComputedStyle(cta1).opacity) > 0.05,
        cta2Clickable:
          Boolean(cta2) &&
          !cta2.disabled &&
          getComputedStyle(cta2).pointerEvents !== "none" &&
          Number(getComputedStyle(cta2).opacity) > 0.05,
      };
    });

  const marks = {
    gateMountedMs: 0,
    eyebrowVisibleMs: null,
    headlineVisibleMs: null,
    descriptionVisibleMs: null,
    cta1VisibleMs: null,
    cta1ClickableMs: null,
    cta2ClickableMs: null,
  };

  const deadline = Date.now() + 8000;
  while (Date.now() < deadline) {
    const snap = await poll();
    const elapsed = Date.now() - t0;
    if (!snap) {
      await page.waitForTimeout(40);
      continue;
    }
    if (marks.eyebrowVisibleMs == null && snap.eyebrow.visible)
      marks.eyebrowVisibleMs = elapsed;
    if (marks.headlineVisibleMs == null && snap.headline.visible)
      marks.headlineVisibleMs = elapsed;
    if (marks.descriptionVisibleMs == null && snap.description.visible)
      marks.descriptionVisibleMs = elapsed;
    if (marks.cta1VisibleMs == null && snap.cta1.visible)
      marks.cta1VisibleMs = elapsed;
    if (marks.cta1ClickableMs == null && snap.cta1Clickable)
      marks.cta1ClickableMs = elapsed;
    if (marks.cta2ClickableMs == null && snap.cta2Clickable)
      marks.cta2ClickableMs = elapsed;

    if (
      marks.eyebrowVisibleMs != null &&
      marks.headlineVisibleMs != null &&
      marks.descriptionVisibleMs != null &&
      marks.cta1VisibleMs != null &&
      marks.cta1ClickableMs != null &&
      marks.cta2ClickableMs != null
    ) {
      break;
    }
    await page.waitForTimeout(40);
  }

  return marks;
}

async function main() {
  ensureOut();
  const report = {
    base: BASE,
    startedAt: new Date().toISOString(),
    pageErrors: [],
    consoleErrors: [],
    console: [],
    badResponses: [],
    overlays: [],
    timings: null,
    production: null,
  };

  let browser;
  for (const channel of ["chrome", "msedge", undefined]) {
    try {
      browser = await chromium.launch({
        headless: true,
        ...(channel ? { channel } : {}),
      });
      console.log("launched", channel || "bundled");
      break;
    } catch (e) {
      console.warn("launch fail", channel, e.message);
    }
  }
  if (!browser) throw new Error("no browser");

  try {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      deviceScaleFactor: 2,
    });
    const page = await ctx.newPage();
    const bag = {
      pageErrors: [],
      consoleErrors: [],
      console: [],
      badResponses: [],
    };
    attachListeners(page, bag);

    console.log("navigating…");
    await page.goto(`${BASE}?proof=${Date.now()}`, {
      waitUntil: "domcontentloaded",
      timeout: 180000,
    });

    // Gate mounted shot
    await page.waitForSelector(
      '[role="dialog"][aria-labelledby="nian-gate-title"]',
      { timeout: 60000 }
    );
    await page.screenshot({
      path: path.join(OUT, "01-gate-no-overlay.png"),
      fullPage: false,
    });
    let overlay = await detectOverlay(page);
    report.overlays.push({ at: "gate-mounted", ...overlay });
    assertClean(bag, overlay, "gate-mounted");

    // Timing from gate mounted
    report.timings = await measureGateTiming(page);
    console.log("timings", report.timings);

    // 1500ms after gate mounted
    await page.waitForTimeout(1500);
    await page.screenshot({
      path: path.join(OUT, "02-gate-after-1500ms.png"),
      fullPage: false,
    });
    overlay = await detectOverlay(page);
    report.overlays.push({ at: "1500ms", ...overlay });
    assertClean(bag, overlay, "1500ms");

    // CTA interactive check ≤ ~1200ms
    if (
      report.timings.cta1ClickableMs == null ||
      report.timings.cta1ClickableMs > 1300
    ) {
      throw new Error(
        `CTA1 clickable too late: ${report.timings.cta1ClickableMs}ms (budget ~1200ms)`
      );
    }
    if (
      report.timings.cta2ClickableMs == null ||
      report.timings.cta2ClickableMs > 1300
    ) {
      throw new Error(
        `CTA2 clickable too late: ${report.timings.cta2ClickableMs}ms (budget ~1200ms)`
      );
    }

    // Enter without music smoke
    const without = page.locator("button", { hasText: /Entrar sem música/i });
    await without.click({ force: true });
    await page.waitForSelector("#hero", { timeout: 30000 });
    await page.waitForSelector("#origin", { timeout: 15000 });
    await page.waitForSelector("#brief", { timeout: 15000 });
    await page.waitForSelector("#action", { timeout: 15000 });
    overlay = await detectOverlay(page);
    assertClean(bag, overlay, "after-enter-without-music");

    report.pageErrors = bag.pageErrors;
    report.consoleErrors = bag.consoleErrors;
    report.console = bag.console.filter((c) => c.type === "error" || c.type === "warning").slice(0, 40);
    report.badResponses = bag.badResponses;

    await ctx.close();
  } finally {
    await browser.close();
  }

  fs.writeFileSync(
    path.join(OUT, "DIAGNOSTICS.json"),
    JSON.stringify(report, null, 2)
  );
  fs.writeFileSync(
    path.join(OUT, "REPORT.txt"),
    [
      "Nian runtime proof",
      "==================",
      `URL: ${BASE}`,
      `At: ${report.startedAt}`,
      "",
      "ZERO Runtime SyntaxError",
      "ZERO Next error overlay",
      `CTA1 clickable at: ${report.timings?.cta1ClickableMs}ms after gate mounted`,
      `CTA2 clickable at: ${report.timings?.cta2ClickableMs}ms after gate mounted`,
      "",
      "TIMINGS (ms from gate mounted):",
      JSON.stringify(report.timings, null, 2),
      "",
      "PAGE ERRORS:",
      JSON.stringify(report.pageErrors, null, 2),
      "",
      "CONSOLE ERRORS:",
      JSON.stringify(report.consoleErrors, null, 2),
      "",
    ].join("\n")
  );

  console.log("PROOF OK", OUT);
}

main().catch((err) => {
  console.error(err);
  try {
    fs.mkdirSync(OUT, { recursive: true });
    fs.writeFileSync(
      path.join(OUT, "FAILURE.json"),
      JSON.stringify(
        {
          message: err.message,
          diagnostics: err.diagnostics || null,
          stack: err.stack,
        },
        null,
        2
      )
    );
  } catch {
    /* ignore */
  }
  process.exit(1);
});
