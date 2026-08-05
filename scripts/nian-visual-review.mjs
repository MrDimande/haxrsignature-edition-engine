/**
 * Nian Phase 2A visual review capture
 * Screenshots + short scroll video (enter without music).
 */
import { chromium, devices } from "playwright";
import fs from "fs";
import path from "path";

const BASE = process.env.NIAN_URL || "http://localhost:3010/nian";
const OUT = path.resolve("tmp/nian-visual-review");
const MOBILE = [
  { name: "360x800", width: 360, height: 800 },
  { name: "390x844", width: 390, height: 844 },
  { name: "430x932", width: 430, height: 932 },
];
const DESKTOP = [
  { name: "1366x768", width: 1366, height: 768 },
  { name: "1440x900", width: 1440, height: 900 },
  { name: "1920x1080", width: 1920, height: 1080 },
];

async function enterWithoutMusic(page) {
  await page.goto(`${BASE}?review=${Date.now()}`, {
    waitUntil: "domcontentloaded",
    timeout: 180000,
  });
  // Prefer text locator — more resilient than role name with accents.
  const btn = page.locator("button", { hasText: /Entrar sem música/i });
  await btn.waitFor({ state: "visible", timeout: 90000 });
  for (let i = 0; i < 40; i++) {
    if (await btn.isEnabled()) break;
    await page.waitForTimeout(250);
  }
  await btn.click({ force: true });
  await page.waitForSelector("#hero", { timeout: 30000 });
  await page.waitForTimeout(900);
}

async function shot(page, file) {
  const dest = path.join(OUT, file);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  await page.screenshot({ path: dest, fullPage: false });
  return dest;
}

async function scrollTo(page, id, block = "start") {
  await page.evaluate(
    ({ id, block }) => {
      document.getElementById(id)?.scrollIntoView({ block, behavior: "instant" });
    },
    { id, block }
  );
  await page.waitForTimeout(700);
}

async function captureViewport(browser, label, width, height, isMobile) {
  const context = await browser.newContext({
    viewport: { width, height },
    isMobile,
    deviceScaleFactor: isMobile ? 2 : 1,
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();
  await enterWithoutMusic(page);

  // Hero → Origin transition
  await scrollTo(page, "hero", "start");
  await shot(page, `${label}/01-hero.png`);
  await page.evaluate(() => {
    const o = document.getElementById("origin");
    if (!o) return;
    const y = o.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.35;
    window.scrollTo({ top: y, behavior: "instant" });
  });
  await page.waitForTimeout(500);
  await shot(page, `${label}/02-hero-to-origin.png`);

  await scrollTo(page, "origin", "start");
  await shot(page, `${label}/03-origin.png`);

  await scrollTo(page, "brief", "start");
  await shot(page, `${label}/04-brief.png`);

  await scrollTo(page, "action", "start");
  await shot(page, `${label}/05-action.png`);

  // Action → continua
  await page.evaluate(() => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "instant",
    });
  });
  await page.waitForTimeout(500);
  await shot(page, `${label}/06-action-to-continua.png`);

  // Section transitions mid-points (desktop mainly useful)
  if (!isMobile) {
    await scrollTo(page, "origin", "end");
    await shot(page, `${label}/07-transition-origin-brief.png`);
    await scrollTo(page, "brief", "end");
    await shot(page, `${label}/08-transition-brief-action.png`);
  }

  await context.close();
}

async function recordFlow(browser) {
  const dir = path.join(OUT, "video");
  fs.mkdirSync(dir, { recursive: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    deviceScaleFactor: 2,
    recordVideo: { dir, size: { width: 390, height: 844 } },
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();
  await enterWithoutMusic(page);
  await page.waitForTimeout(600);
  const sections = ["hero", "origin", "brief", "action"];
  for (const id of sections) {
    await page.evaluate((id) => {
      document.getElementById(id)?.scrollIntoView({
        block: "start",
        behavior: "smooth",
      });
    }, id);
    await page.waitForTimeout(2200);
  }
  await page.evaluate(() =>
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })
  );
  await page.waitForTimeout(1500);
  await context.close();
  const videos = fs.readdirSync(dir).filter((f) => f.endsWith(".webm"));
  if (videos[0]) {
    const from = path.join(dir, videos[0]);
    const to = path.join(OUT, "flow-gate-to-action.webm");
    fs.renameSync(from, to);
    return to;
  }
  return null;
}

async function recordReducedMotion(browser) {
  const dir = path.join(OUT, "video-rm");
  fs.mkdirSync(dir, { recursive: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    deviceScaleFactor: 2,
    recordVideo: { dir, size: { width: 390, height: 844 } },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await enterWithoutMusic(page);
  for (const id of ["origin", "brief", "action"]) {
    await scrollTo(page, id, "start");
    await page.waitForTimeout(900);
  }
  await context.close();
  const videos = fs.readdirSync(dir).filter((f) => f.endsWith(".webm"));
  if (videos[0]) {
    const from = path.join(dir, videos[0]);
    const to = path.join(OUT, "flow-reduced-motion.webm");
    fs.renameSync(from, to);
    return to;
  }
  return null;
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  // Prefer system browsers — avoids downloading Chromium into sandbox cache.
  let browser;
  for (const channel of ["chrome", "msedge", undefined]) {
    try {
      browser = await chromium.launch({
        headless: true,
        ...(channel ? { channel } : {}),
      });
      console.log("launched", channel || "bundled-chromium");
      break;
    } catch (err) {
      console.warn("launch failed", channel || "bundled", String(err.message || err));
    }
  }
  if (!browser) throw new Error("Could not launch any Chromium/Chrome/Edge");
  try {
    for (const vp of MOBILE) {
      console.log("mobile", vp.name);
      await captureViewport(browser, `mobile-${vp.name}`, vp.width, vp.height, true);
    }
    for (const vp of DESKTOP) {
      console.log("desktop", vp.name);
      await captureViewport(browser, `desktop-${vp.name}`, vp.width, vp.height, false);
    }
    console.log("recording flow…");
    const video = await recordFlow(browser);
    console.log("video", video);
    console.log("recording reduced motion…");
    const rm = await recordReducedMotion(browser);
    console.log("reduced-motion video", rm);
  } finally {
    await browser.close();
  }
  console.log("DONE", OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
