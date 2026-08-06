/**
 * Nian Phase 2B approval pack — Uniforme / Team-Up / Squad Mode
 * Isolado a /nian. Não tocar outros perfis.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE = process.env.NIAN_URL || "http://localhost:3010/nian";
const OUT = path.resolve("tmp/nian-visual-review/approval-pack-2b");

async function enterWithoutMusic(page) {
  await page.goto(`${BASE}?review2b=${Date.now()}`, {
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
  await page.waitForSelector("#uniforme", { timeout: 30000 });
  await page.waitForTimeout(600);
}

async function scrollTo(page, id) {
  await page.evaluate((id) => {
    document.getElementById(id)?.scrollIntoView({
      block: "start",
      behavior: "instant",
    });
  }, id);
  await page.waitForTimeout(900);
}

async function shot(page, file) {
  const dest = path.join(OUT, file);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  await page.screenshot({ path: dest, fullPage: false });
  return dest;
}

async function captureTransition(page, fromId, toId, file) {
  await scrollTo(page, fromId);
  await page.evaluate(
    ({ fromId, toId }) => {
      const from = document.getElementById(fromId);
      const to = document.getElementById(toId);
      if (!from || !to) return;
      const mid =
        (from.getBoundingClientRect().bottom +
          to.getBoundingClientRect().top) /
          2 +
        window.scrollY -
        window.innerHeight / 2;
      window.scrollTo(0, Math.max(0, mid));
    },
    { fromId, toId }
  );
  await page.waitForTimeout(700);
  await shot(page, file);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ channel: "chrome", headless: true });

  // Mobile 390×844
  {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      deviceScaleFactor: 2,
    });
    const page = await ctx.newPage();
    await enterWithoutMusic(page);

    await scrollTo(page, "uniforme");
    await shot(page, "01-mobile-390x844-uniforme.png");
    await scrollTo(page, "team-up");
    await shot(page, "02-mobile-390x844-team-up.png");
    await scrollTo(page, "squad-mode");
    await shot(page, "03-mobile-390x844-squad-mode.png");
    await captureTransition(
      page,
      "action",
      "uniforme",
      "04-mobile-390x844-action-to-uniforme.png"
    );
    await captureTransition(
      page,
      "squad-mode",
      "continua",
      "05-mobile-390x844-squad-to-continua.png"
    );
    await ctx.close();
  }

  // Extra mobile sizes — overflow / faces check
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
    for (const id of ["uniforme", "team-up", "squad-mode"]) {
      await scrollTo(page, id);
      await shot(page, `check-mobile-${vp.name}-${id}.png`);
    }
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
    await scrollTo(page, "uniforme");
    await shot(page, "06-desktop-1440x900-uniforme.png");
    await scrollTo(page, "team-up");
    await shot(page, "07-desktop-1440x900-team-up.png");
    await scrollTo(page, "squad-mode");
    await shot(page, "08-desktop-1440x900-squad-mode.png");
    await ctx.close();
  }

  // Extra desktop sizes
  for (const vp of [
    { name: "1366x768", w: 1366, h: 768 },
    { name: "1920x1080", w: 1920, h: 1080 },
  ]) {
    const ctx = await browser.newContext({
      viewport: { width: vp.w, height: vp.h },
      deviceScaleFactor: 1,
    });
    const page = await ctx.newPage();
    await enterWithoutMusic(page);
    for (const id of ["uniforme", "team-up", "squad-mode"]) {
      await scrollTo(page, id);
      await shot(page, `check-desktop-${vp.name}-${id}.png`);
    }
    await ctx.close();
  }

  // Video: Action → Squad Mode
  {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      deviceScaleFactor: 2,
      recordVideo: { dir: OUT, size: { width: 390, height: 844 } },
    });
    const page = await ctx.newPage();
    await enterWithoutMusic(page);
    await scrollTo(page, "action");
    await page.waitForTimeout(400);
    await page.evaluate(async () => {
      const start = document.getElementById("action");
      const end = document.getElementById("squad-mode");
      if (!start || !end) return;
      const from =
        start.getBoundingClientRect().top + window.scrollY;
      const to = end.getBoundingClientRect().top + window.scrollY;
      const steps = 48;
      for (let i = 1; i <= steps; i++) {
        window.scrollTo(0, from + ((to - from) * i) / steps);
        await new Promise((r) => setTimeout(r, 55));
      }
    });
    await page.waitForTimeout(500);
    await ctx.close();
    const videos = fs
      .readdirSync(OUT)
      .filter((f) => f.endsWith(".webm"));
    if (videos.length) {
      const newest = videos
        .map((f) => ({ f, t: fs.statSync(path.join(OUT, f)).mtimeMs }))
        .sort((a, b) => b.t - a.t)[0].f;
      fs.renameSync(
        path.join(OUT, newest),
        path.join(OUT, "09-flow-action-to-squad.webm")
      );
    }
  }

  fs.writeFileSync(
    path.join(OUT, "README.txt"),
    [
      "Nian · Phase 2B approval pack",
      "Uniforme → Team-Up → Squad Mode",
      "URL: " + BASE,
      "At: " + new Date().toISOString(),
      "",
      "01-03 mobile sections",
      "04 action→uniforme",
      "05 squad→continua",
      "06-08 desktop sections",
      "09 video action→squad",
      "",
    ].join("\n")
  );

  await browser.close();
  console.log("APPROVAL PACK 2B OK", OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
