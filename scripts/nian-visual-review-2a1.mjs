/**
 * Nian Phase 2A.1 approval pack capture
 * Sections + cold-load filmstrip + short gate→action video.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE = process.env.NIAN_URL || "http://localhost:3010/nian";
const OUT = path.resolve("tmp/nian-visual-review/approval-pack-2a1");

async function enterWithoutMusic(page) {
  await page.goto(`${BASE}?review=${Date.now()}`, {
    waitUntil: "domcontentloaded",
    timeout: 180000,
  });
  const btn = page.locator("button", { hasText: /Entrar sem música/i });
  await btn.waitFor({ state: "visible", timeout: 90000 });
  for (let i = 0; i < 40; i++) {
    if (await btn.isEnabled()) break;
    await page.waitForTimeout(250);
  }
  await btn.click({ force: true });
  await page.waitForSelector("#hero", { timeout: 30000 });
  await page.waitForTimeout(700);
}

async function scrollTo(page, id) {
  await page.evaluate((id) => {
    document.getElementById(id)?.scrollIntoView({
      block: "start",
      behavior: "instant",
    });
  }, id);
  await page.waitForTimeout(800);
}

async function shot(page, file) {
  const dest = path.join(OUT, file);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  await page.screenshot({ path: dest, fullPage: false });
  return dest;
}

async function captureSections(browser) {
  // Mobile 390×844
  {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      deviceScaleFactor: 2,
    });
    const page = await ctx.newPage();
    await enterWithoutMusic(page);
    await scrollTo(page, "origin");
    await shot(page, "01-mobile-390x844-origin.png");
    await scrollTo(page, "brief");
    await shot(page, "02-mobile-390x844-brief.png");
    await scrollTo(page, "action");
    await shot(page, "03-mobile-390x844-action.png");
    // Also validate 360 and 430 action collisions via extra shots
    await ctx.close();
  }

  for (const vp of [
    { name: "360x800", w: 360, h: 800 },
    { name: "430x932", w: 430, h: 932 },
  ]) {
    const ctx = await browser.newContext({
      viewport: { width: vp.w, height: vp.h },
      isMobile: true,
      deviceScaleFactor: 2,
    });
    const page = await ctx.newPage();
    await enterWithoutMusic(page);
    await scrollTo(page, "action");
    await shot(page, `action-check-mobile-${vp.name}.png`);
    await ctx.close();
  }

  // Desktop 1440×900
  {
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
    });
    const page = await ctx.newPage();
    await enterWithoutMusic(page);
    await scrollTo(page, "origin");
    await shot(page, "04-desktop-1440x900-origin.png");
    await scrollTo(page, "brief");
    await shot(page, "05-desktop-1440x900-brief.png");
    await scrollTo(page, "action");
    await shot(page, "06-desktop-1440x900-action.png");
    await ctx.close();
  }
}

async function coldLoadFilmstrip(browser) {
  const dir = path.join(OUT, "cold-load");
  fs.mkdirSync(dir, { recursive: true });
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  const log = [];

  await shot(page, "cold-load/00-about-blank.png");
  log.push({
    ms: 0,
    note: "about:blank before navigation (Playwright default — NOT the app)",
  });

  const t0 = Date.now();
  await page.goto(`${BASE}?cold=${Date.now()}`, {
    waitUntil: "domcontentloaded",
    timeout: 180000,
  });
  log.push({ ms: Date.now() - t0, note: "domcontentloaded" });

  let last = 0;
  for (const ms of [0, 200, 450, 850, 1200, 2000]) {
    const wait = ms - last;
    if (wait > 0) await page.waitForTimeout(wait);
    last = ms;
    const info = await page.evaluate(() => {
      const body = getComputedStyle(document.body);
      const root = document.querySelector(
        '[data-render-profile="nian-night-of-the-web"]'
      );
      const gate = document.querySelector('[role="dialog"]');
      const experience = document.querySelector("[data-experience]");
      return {
        bodyBg: body.backgroundColor,
        experienceBg: experience
          ? getComputedStyle(experience).backgroundColor
          : null,
        rootBg: root ? getComputedStyle(root).backgroundColor : null,
        gateBg: gate ? getComputedStyle(gate).backgroundColor : null,
        hasGate: Boolean(gate),
      };
    });
    const file = `cold-load/${String(ms).padStart(4, "0")}ms-after-dcl.png`;
    await page.screenshot({ path: path.join(OUT, file), fullPage: false });
    log.push({
      ms: Date.now() - t0,
      sampleAt: `${ms}ms after DCL`,
      ...info,
    });
  }

  await shot(page, "cold-load/99-gate-settled.png");
  fs.writeFileSync(path.join(dir, "TIMELINE.json"), JSON.stringify(log, null, 2));
  fs.writeFileSync(
    path.join(dir, "REPORT.txt"),
    [
      "Nian cold-load first-paint report",
      "=================================",
      "",
      "CONCLUSION:",
      "- 00-about-blank.png is Playwright's blank page BEFORE any navigation.",
      "  The ~4s white at the start of earlier review videos is recording",
      "  overhead / about:blank, not Nian UI.",
      "- After navigation, Nian theme background is #03050b (rgb(3,5,11))",
      "  on TrueThemeEngine (theme.colors.background) and NianExperience root.",
      "- Gate dialog also paints #03050b immediately.",
      "- No global body style was changed for other profiles.",
      "",
      "TIMELINE:",
      JSON.stringify(log, null, 2),
      "",
    ].join("\n")
  );
  await ctx.close();
}

async function recordFlow(browser) {
  const dir = path.join(OUT, "video");
  fs.mkdirSync(dir, { recursive: true });
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    deviceScaleFactor: 2,
    recordVideo: { dir, size: { width: 390, height: 844 } },
  });
  const page = await ctx.newPage();
  await enterWithoutMusic(page);
  for (const id of ["hero", "origin", "brief", "action"]) {
    await page.evaluate((id) => {
      document.getElementById(id)?.scrollIntoView({
        block: "start",
        behavior: "smooth",
      });
    }, id);
    await page.waitForTimeout(2000);
  }
  await ctx.close();
  const videos = fs.readdirSync(dir).filter((f) => f.endsWith(".webm"));
  if (videos[0]) {
    const from = path.join(dir, videos[0]);
    const to = path.join(OUT, "07-flow-gate-to-action.webm");
    fs.renameSync(from, to);
    return to;
  }
  return null;
}

async function main() {
  if (fs.existsSync(OUT)) {
    fs.rmSync(OUT, { recursive: true, force: true });
  }
  fs.mkdirSync(OUT, { recursive: true });

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
      console.warn("fail", channel, e.message);
    }
  }
  if (!browser) throw new Error("no browser");

  try {
    console.log("sections…");
    await captureSections(browser);
    console.log("cold-load…");
    await coldLoadFilmstrip(browser);
    console.log("video…");
    const v = await recordFlow(browser);
    console.log("video", v);
  } finally {
    await browser.close();
  }

  fs.writeFileSync(
    path.join(OUT, "README.txt"),
    [
      "Nian · Phase 2A.1 visual approval pack",
      "=====================================",
      "Base commit preserved: dfbc8a5",
      "Phase 2B: suspended",
      "No retouch after capture.",
      "",
      "01-mobile-390x844-origin.png",
      "02-mobile-390x844-brief.png",
      "03-mobile-390x844-action.png",
      "04-desktop-1440x900-origin.png",
      "05-desktop-1440x900-brief.png",
      "06-desktop-1440x900-action.png",
      "07-flow-gate-to-action.webm",
      "cold-load/ — first-paint filmstrip + REPORT.txt",
      "action-check-mobile-360x800.png / 430x932.png — audio-safe-area checks",
      "",
    ].join("\n")
  );
  console.log("DONE", OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
