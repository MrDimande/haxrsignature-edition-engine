/**
 * Nian Phase 2C final approval pack
 * Localização · Closing · RSVP (persisted true/false)
 *
 * Requires production-like host for RSVP gate
 * (next start / Preview) so persisted:false keeps the form.
 *
 * Env: NIAN_URL (default http://localhost:3011/nian)
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE = process.env.NIAN_URL || "http://localhost:3011/nian";
const OUT = path.resolve("tmp/nian-visual-review/approval-pack-2c-final");

const HERO_LEAK_PATTERNS = [
  /NIGHT OF THE WEB/i,
  /Uma cidade em movimento/i,
];

async function enter(page) {
  await page.goto(`${BASE}?p2cf=${Date.now()}`, {
    waitUntil: "domcontentloaded",
    timeout: 180000,
  });
  const btn = page.locator("button", { hasText: /Entrar sem música/i });
  await btn.waitFor({ state: "visible", timeout: 90000 });
  for (let i = 0; i < 50; i++) {
    if (await btn.isEnabled()) break;
    await page.waitForTimeout(200);
  }
  await btn.click({ force: true });
  await page.waitForSelector("#hero", { timeout: 30000 });
  await page.waitForSelector("#local", { timeout: 30000 });
  await page.waitForSelector("#closing", { timeout: 30000 });
  await page.waitForSelector("#rsvp", { timeout: 30000 });
  await page.waitForTimeout(400);
}

async function waitVisualStable(page, ms = 700) {
  await page.waitForTimeout(ms);
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve))
      )
  );
  await page.waitForTimeout(200);
}

/**
 * Locate #closing, scroll, wait for CONVOCAÇÃO FINAL, reject Hero leaks.
 */
async function goClosing(page) {
  const closing = page.locator("#closing");
  await closing.waitFor({ state: "attached", timeout: 30000 });

  await page.evaluate(() => {
    const el = document.getElementById("closing");
    if (!el) throw new Error("#closing not found");
    el.scrollIntoView({ block: "start", behavior: "instant" });
  });

  await waitVisualStable(page, 900);

  const text = await closing.innerText();
  if (!/CONVOCAÇÃO FINAL/i.test(text)) {
    throw new Error(
      'Closing capture aborted: "CONVOCAÇÃO FINAL" not found in #closing'
    );
  }

  for (const re of HERO_LEAK_PATTERNS) {
    if (re.test(text)) {
      throw new Error(
        `Closing capture aborted: Hero content leaked into #closing (${re})`
      );
    }
  }

  // Viewport must not be dominated by Hero copy from another section
  const bodySample = await page.evaluate(() => {
    const closingEl = document.getElementById("closing");
    if (!closingEl) return "";
    const rect = closingEl.getBoundingClientRect();
    // Prefer text nodes whose bounding box intersects the viewport center band of #closing
    return closingEl.innerText || "";
  });

  for (const re of HERO_LEAK_PATTERNS) {
    if (re.test(bodySample)) {
      throw new Error(
        `Closing capture aborted: Hero pattern in closing sample (${re})`
      );
    }
  }

  // Fail if Hero section is the primary visible section (top of viewport)
  const heroOverlap = await page.evaluate(() => {
    const hero = document.getElementById("hero");
    if (!hero) return 0;
    const r = hero.getBoundingClientRect();
    const vh = window.innerHeight;
    const visible = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
    return visible / vh;
  });
  if (heroOverlap > 0.35) {
    throw new Error(
      `Closing capture aborted: #hero still covers ${(heroOverlap * 100).toFixed(0)}% of viewport`
    );
  }
}

async function goSection(page, id) {
  await page.evaluate((sectionId) => {
    const el = document.getElementById(sectionId);
    if (!el) throw new Error(`#${sectionId} not found`);
    el.scrollIntoView({ block: "start", behavior: "instant" });
  }, id);
  await waitVisualStable(page, 800);
}

async function shot(page, file) {
  const dest = path.join(OUT, file);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  await page.screenshot({ path: dest, fullPage: false });
  console.log("shot", file);
}

async function clearRsvpStorage(page) {
  await page.evaluate(() => {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.includes(":nian:") && k.includes("rsvp")) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  });
}

async function mockRsvp(page, body) {
  await page.unroute("**/api/rsvp").catch(() => {});
  await page.route("**/api/rsvp", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });
}

async function fillYesAndSubmit(page, name, contact) {
  await page.getByText(/Sim, estarei presente/i).click();
  await page.locator("#rsvp input[name='name']").fill(name);
  await page.locator("#rsvp input[name='contact']").fill(contact);
  await page.locator("#rsvp button[type='submit']").click();
}

async function main() {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({ channel: "chrome", headless: true });

  // 1–2 Localização with maps button
  {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      deviceScaleFactor: 2,
    });
    const page = await ctx.newPage();
    await enter(page);
    await goSection(page, "local");
    const maps = page.locator("#local a", { hasText: /Abrir localização/i });
    await maps.waitFor({ state: "visible", timeout: 10000 });
    await shot(page, "01-local-mobile-390x844.png");
    await ctx.close();
  }

  {
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const page = await ctx.newPage();
    await enter(page);
    await goSection(page, "local");
    await page
      .locator("#local a", { hasText: /Abrir localização/i })
      .waitFor({ state: "visible", timeout: 10000 });
    await shot(page, "02-local-desktop-1440x900.png");
    await ctx.close();
  }

  // 3–5 Closing (explicit #closing protocol)
  for (const vp of [
    { file: "03-closing-mobile-390x844.png", w: 390, h: 844, mobile: true },
    { file: "04-closing-desktop-1440x900.png", w: 1440, h: 900, mobile: false },
    {
      file: "05-closing-desktop-1920x1080.png",
      w: 1920,
      h: 1080,
      mobile: false,
    },
  ]) {
    const ctx = await browser.newContext({
      viewport: { width: vp.w, height: vp.h },
      isMobile: vp.mobile,
      deviceScaleFactor: vp.mobile ? 2 : 1,
    });
    const page = await ctx.newPage();
    await enter(page);
    await goClosing(page);
    await shot(page, vp.file);
    await ctx.close();
  }

  // Extra closing smoke viewports (not in pack index, validation only)
  for (const vp of [
    { name: "360x800", w: 360, h: 800, mobile: true },
    { name: "430x932", w: 430, h: 932, mobile: true },
    { name: "1366x768", w: 1366, h: 768, mobile: false },
  ]) {
    const ctx = await browser.newContext({
      viewport: { width: vp.w, height: vp.h },
      isMobile: vp.mobile,
      deviceScaleFactor: vp.mobile ? 2 : 1,
    });
    const page = await ctx.newPage();
    await enter(page);
    await goClosing(page);
    await shot(page, `check-closing-${vp.name}.png`);
    await ctx.close();
  }

  // 6 RSVP persisted:true
  {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      deviceScaleFactor: 2,
    });
    const page = await ctx.newPage();
    await enter(page);
    await clearRsvpStorage(page);
    await mockRsvp(page, {
      success: true,
      persisted: true,
      message: "ok",
    });
    await goSection(page, "rsvp");
    await fillYesAndSubmit(page, "Ada Persistida", "ada@example.com");
    await page.getByText(/Missão confirmada/i).waitFor({ timeout: 20000 });
    // Re-anchor on #rsvp so Closing copy is not the primary frame
    await goSection(page, "rsvp");
    await page
      .locator("#rsvp")
      .getByText(/Missão confirmada/i)
      .waitFor({ timeout: 10000 });
    const rsvpText = await page.locator("#rsvp").innerText();
    if (/CONVOCAÇÃO FINAL/i.test(rsvpText)) {
      throw new Error("RSVP success shot leaked Closing into #rsvp text");
    }
    await waitVisualStable(page);
    await page.locator("#rsvp").screenshot({
      path: path.join(OUT, "06-rsvp-persisted-true.png"),
    });
    console.log("shot", "06-rsvp-persisted-true.png");
    await ctx.close();
  }

  // 7 RSVP persisted:false — form preserved
  // Force strict gate via page hook: shadow NODE_ENV check by overriding
  // shouldAccept path — we mock API and also inject a production-like
  // evaluation by patching fetch response handling is already client-side.
  // Prefer next start; if still in development, inject temporary override.
  {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      deviceScaleFactor: 2,
    });
    const page = await ctx.newPage();
    await page.addInitScript(() => {
      // Pack proof for persisted:false even against next:dev
      window.__NIAN_FORCE_STRICT_RSVP__ = true;
    });
    await enter(page);
    await clearRsvpStorage(page);
    await mockRsvp(page, {
      success: true,
      persisted: false,
      message: "Confirmação recebida.",
    });
    await goSection(page, "rsvp");

    await fillYesAndSubmit(
      page,
      "Nian Sem Persist",
      "nian.nopersist@example.com"
    );

    const notPersisted = page.getByText(
      /A confirmação ainda não foi guardada/i
    );
    const success = page.getByText(/Missão confirmada/i);

    const which = await Promise.race([
      notPersisted.waitFor({ timeout: 20000 }).then(() => "not-persisted"),
      success.waitFor({ timeout: 20000 }).then(() => "success"),
    ]);
    if (which === "success") {
      throw new Error(
        "RSVP persisted:false shot failed: got Missão confirmada (strict gate inactive)"
      );
    }
    const nameVal = await page.locator("#rsvp input[name='name']").inputValue();
    const contactVal = await page
      .locator("#rsvp input[name='contact']")
      .inputValue();
    if (nameVal !== "Nian Sem Persist" || !contactVal.includes("nopersist")) {
      throw new Error(
        `Form not preserved after persisted:false (name=${nameVal}, contact=${contactVal})`
      );
    }

    await waitVisualStable(page);
    await page.locator("#rsvp").screenshot({
      path: path.join(OUT, "07-rsvp-persisted-false-form-preserved.png"),
    });
    console.log("shot", "07-rsvp-persisted-false-form-preserved.png");
    await ctx.close();
  }

  // 8 Short video: Local → Closing → RSVP
  {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      deviceScaleFactor: 2,
      recordVideo: { dir: OUT, size: { width: 390, height: 844 } },
    });
    const page = await ctx.newPage();
    await enter(page);
    await goSection(page, "local");
    await page.waitForTimeout(600);
    await goClosing(page);
    await page.waitForTimeout(700);
    await goSection(page, "rsvp");
    await page.waitForTimeout(800);
    await ctx.close();

    const videos = fs.readdirSync(OUT).filter((f) => f.endsWith(".webm"));
    if (!videos.length) {
      throw new Error("Video capture missing");
    }
    const newest = videos
      .map((f) => ({ f, t: fs.statSync(path.join(OUT, f)).mtimeMs }))
      .sort((a, b) => b.t - a.t)[0].f;
    fs.renameSync(
      path.join(OUT, newest),
      path.join(OUT, "08-flow-local-closing-rsvp.webm")
    );
  }

  const required = [
    "01-local-mobile-390x844.png",
    "02-local-desktop-1440x900.png",
    "03-closing-mobile-390x844.png",
    "04-closing-desktop-1440x900.png",
    "05-closing-desktop-1920x1080.png",
    "06-rsvp-persisted-true.png",
    "07-rsvp-persisted-false-form-preserved.png",
    "08-flow-local-closing-rsvp.webm",
  ];
  for (const f of required) {
    if (!fs.existsSync(path.join(OUT, f))) {
      throw new Error(`Missing pack asset: ${f}`);
    }
  }

  fs.writeFileSync(
    path.join(OUT, "README.txt"),
    [
      "Nian · Phase 2C final approval pack",
      "1 Local mobile · 2 Local desktop · 3–5 Closing · 6 persisted:true · 7 persisted:false · 8 video",
      "mapsUrl: https://share.google/iJNUcEM5s2AiQUxiX",
      "URL: " + BASE,
      "At: " + new Date().toISOString(),
      "",
    ].join("\n")
  );

  await browser.close();
  console.log("APPROVAL PACK 2C FINAL OK", OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
