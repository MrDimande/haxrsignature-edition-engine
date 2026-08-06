/**
 * Team-Up BR sparkle fix validation — Nian only.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import sharp from "sharp";

const OUT = path.resolve("tmp/nian-visual-review/approval-pack-2b-teamup-fix");
fs.mkdirSync(OUT, { recursive: true });
const BASE = process.env.NIAN_URL || "http://localhost:3011/nian";

async function enter(page) {
  await page.goto(`${BASE}?tu=${Date.now()}`, {
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
  await page.waitForSelector("#team-up", { timeout: 30000 });
  await page.waitForTimeout(500);
}

async function go(page, id) {
  await page.evaluate((id) => {
    document.getElementById(id)?.scrollIntoView({
      block: "start",
      behavior: "instant",
    });
  }, id);
  await page.waitForTimeout(1000);
}

async function maxLum(buf) {
  const { data, info } = await sharp(buf)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let max = { lum: 0 };
  for (let i = 0; i < data.length; i += info.channels) {
    const lum = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    if (lum > max.lum) max = { lum, r: data[i], g: data[i + 1], b: data[i + 2] };
  }
  return max;
}

function clampClip(clip, vw, vh) {
  const x = Math.max(0, Math.min(clip.x, vw - 2));
  const y = Math.max(0, Math.min(clip.y, vh - 2));
  const width = Math.max(2, Math.min(clip.width, vw - x));
  const height = Math.max(2, Math.min(clip.height, vh - y));
  return { x, y, width, height };
}

async function main() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const report = [];

  for (const vp of [
    { name: "mobile-360x800", w: 360, h: 800, mobile: true },
    { name: "mobile-390x844", w: 390, h: 844, mobile: true },
    { name: "mobile-430x932", w: 430, h: 932, mobile: true },
    { name: "desktop-1366x768", w: 1366, h: 768, mobile: false },
    { name: "desktop-1440x900", w: 1440, h: 900, mobile: false },
    { name: "desktop-1920x1080", w: 1920, h: 1080, mobile: false },
  ]) {
    const ctx = await browser.newContext({
      viewport: { width: vp.w, height: vp.h },
      isMobile: vp.mobile,
      deviceScaleFactor: vp.mobile ? 2 : 1,
    });
    const page = await ctx.newPage();
    await enter(page);
    await go(page, "team-up");
    await page.screenshot({
      path: path.join(OUT, `${vp.name}-team-up.png`),
      fullPage: false,
    });

    const box = await page.evaluate((isMobile) => {
      const section = document.getElementById("team-up");
      if (!section) return null;
      if (isMobile) {
        const r = section.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      }
      const plates = [...section.querySelectorAll(".overflow-hidden")];
      const plate = plates.find((el) => {
        const r = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        return (
          r.width > 180 &&
          r.height > 280 &&
          style.visibility !== "hidden" &&
          style.display !== "none"
        );
      });
      if (!plate) return null;
      const r = plate.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    }, vp.mobile);

    let brMax = null;
    if (box) {
      const raw = vp.mobile
        ? {
            x: box.x + box.width * 0.78,
            y: box.y + box.height * 0.72,
            width: box.width * 0.2,
            height: box.height * 0.12,
          }
        : {
            x: box.x + box.width * 0.78,
            y: box.y + box.height * 0.78,
            width: box.width * 0.22,
            height: box.height * 0.22,
          };
      const clip = clampClip(raw, vp.w, vp.h);
      const buf = await page.screenshot({ clip });
      fs.writeFileSync(path.join(OUT, `${vp.name}-br-crop.png`), buf);
      brMax = await maxLum(buf);
    }

    report.push({ vp: vp.name, brMax, hasBox: Boolean(box) });
    await ctx.close();
  }

  fs.copyFileSync(
    path.join(OUT, "mobile-390x844-team-up.png"),
    path.join(OUT, "01-team-up-mobile-390x844.png")
  );
  fs.copyFileSync(
    path.join(OUT, "desktop-1440x900-team-up.png"),
    path.join(OUT, "02-team-up-desktop-1440x900.png")
  );
  fs.writeFileSync(path.join(OUT, "REPORT.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));

  // Sparkle is near-white; rooftop is dark. Fail if BR peak is sparkle-like.
  const desktop = report.filter((r) => r.vp.startsWith("desktop"));
  const hot = desktop.filter((r) => r.brMax && r.brMax.lum > 180);
  if (hot.length) {
    console.error("SPARKLE STILL VISIBLE", hot);
    process.exit(1);
  }
  console.log("TEAMUP FIX OK — no bright BR sparkle on desktop");
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
