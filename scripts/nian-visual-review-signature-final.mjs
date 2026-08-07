/**
 * Nian — approval pack: assinatura HAXR final + créditos.
 * Does not commit tmp/. Env: NIAN_URL (default http://localhost:3011/nianwebnight)
 */
import { createRequire } from "module";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadPlaywright() {
  const candidates = [
    path.resolve(__dirname, "../node_modules/playwright"),
    path.resolve(
      __dirname,
      "../../projecto_haxrsignature/node_modules/playwright"
    ),
  ];
  for (const c of candidates) {
    try {
      return require(c);
    } catch {
      /* try next */
    }
  }
  throw new Error(
    "playwright not found — install in repo or sibling projecto_haxrsignature"
  );
}

const { chromium } = loadPlaywright();

const BASE = process.env.NIAN_URL || "http://localhost:3011/nianwebnight";
const OUT = path.resolve("tmp/nian-visual-review/approval-pack-signature-final");

const VIEWPORTS = {
  mobile360: { width: 360, height: 800 },
  mobile390: { width: 390, height: 844 },
  mobile430: { width: 430, height: 932 },
  desktop1366: { width: 1366, height: 768 },
  desktop1440: { width: 1440, height: 900 },
  desktop1920: { width: 1920, height: 1080 },
};

async function enter(page, { withMusic = false } = {}) {
  await page.goto(`${BASE}?sig=${Date.now()}`, {
    waitUntil: "load",
    timeout: 180000,
  });
  const label = withMusic ? /Entrar com música/i : /Entrar sem música/i;
  const btn = page.getByRole("button", { name: label });
  // Playwright auto-waits for enabled / stable before click
  await btn.click({ timeout: 120000 });
  await page.waitForSelector("#assinatura", { state: "attached", timeout: 60000 });
  await page.waitForTimeout(900);
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

async function goSignature(page) {
  await page.evaluate(() => {
    const el = document.getElementById("assinatura");
    if (!el) throw new Error("#assinatura not found");
    el.scrollIntoView({ block: "start", behavior: "instant" });
  });
  await waitVisualStable(page, 900);

  const text = await page.locator("#assinatura").innerText();
  if (!/FIM DA TRANSMISSÃO/i.test(text)) {
    throw new Error('Missing "FIM DA TRANSMISSÃO" in #assinatura');
  }
  if (!/HAXR SIGNATURE/i.test(text)) {
    throw new Error('Missing "HAXR SIGNATURE" in #assinatura');
  }
  if (!/UMA EXPERIÊNCIA ASSINADA POR/i.test(text)) {
    throw new Error('Missing "UMA EXPERIÊNCIA ASSINADA POR" in #assinatura');
  }
}

async function shot(page, name) {
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, fullPage: false });
  console.log("wrote", file);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const pageErrors = [];

  try {
    // 01 + 02 mobile
    {
      const context = await browser.newContext({
        viewport: VIEWPORTS.mobile390,
        deviceScaleFactor: 2,
      });
      const page = await context.newPage();
      page.on("pageerror", (e) => pageErrors.push(String(e)));
      await enter(page);
      await goSignature(page);
      await shot(page, "01-mobile-signature.png");

      await page.setViewportSize(VIEWPORTS.mobile360);
      await waitVisualStable(page, 400);
      await goSignature(page);
      await shot(page, "01b-mobile-360-signature.png");

      await page.setViewportSize(VIEWPORTS.mobile430);
      await waitVisualStable(page, 400);
      await goSignature(page);
      await shot(page, "01c-mobile-430-signature.png");

      await page.setViewportSize(VIEWPORTS.mobile390);
      await goSignature(page);
      const creditBtn = page.locator("#assinatura button", {
        hasText: /Créditos da banda sonora/i,
      });
      await creditBtn.click({ timeout: 15000 });
      await waitVisualStable(page, 500);
      const expanded = await creditBtn.getAttribute("aria-expanded");
      if (expanded !== "true") {
        throw new Error("aria-expanded not true after opening credits");
      }
      const panel = page.locator('[aria-label="Créditos da banda sonora"]');
      await panel.waitFor({ state: "visible", timeout: 10000 });
      const panelText = await panel.innerText();
      if (!/Sunflower/i.test(panelText)) {
        throw new Error("Credits panel missing Sunflower");
      }
      await shot(page, "02-mobile-credits-open.png");
      await context.close();
    }

    // 03 desktop 1440
    {
      const context = await browser.newContext({
        viewport: VIEWPORTS.desktop1440,
      });
      const page = await context.newPage();
      page.on("pageerror", (e) => pageErrors.push(String(e)));
      await enter(page);
      await goSignature(page);
      await shot(page, "03-desktop-signature-1440.png");
      await context.close();
    }

    // 04 desktop 1920 + 1366
    {
      const context = await browser.newContext({
        viewport: VIEWPORTS.desktop1920,
      });
      const page = await context.newPage();
      page.on("pageerror", (e) => pageErrors.push(String(e)));
      await enter(page);
      await goSignature(page);
      await shot(page, "04-desktop-signature-1920.png");
      await page.setViewportSize(VIEWPORTS.desktop1366);
      await waitVisualStable(page, 400);
      await goSignature(page);
      await shot(page, "04b-desktop-signature-1366.png");
      await context.close();
    }

    // 05 / 06 / 07 — RSVP→signature, credits, video + currentTime
    {
      const context = await browser.newContext({
        viewport: VIEWPORTS.desktop1440,
        recordVideo: { dir: OUT, size: VIEWPORTS.desktop1440 },
      });
      const page = await context.newPage();
      page.on("pageerror", (e) => pageErrors.push(String(e)));
      await enter(page, { withMusic: true });
      await page.waitForTimeout(2500);

      const t0 = await page.evaluate(() => {
        const a = document.querySelector("audio");
        return a ? a.currentTime : -1;
      });

      await page.evaluate(() => {
        document.getElementById("rsvp")?.scrollIntoView({
          block: "center",
          behavior: "instant",
        });
      });
      await waitVisualStable(page, 600);
      await page.evaluate(() => {
        document.getElementById("assinatura")?.scrollIntoView({
          block: "start",
          behavior: "instant",
        });
      });
      await waitVisualStable(page, 800);
      await shot(page, "05-rsvp-to-signature.png");

      const t1 = await page.evaluate(() => {
        const a = document.querySelector("audio");
        return a ? a.currentTime : -1;
      });

      const creditBtn = page.locator("#assinatura button", {
        hasText: /Créditos da banda sonora/i,
      });
      await creditBtn.click();
      await waitVisualStable(page, 500);
      await shot(page, "06-signature-credits-open.png");

      const t2 = await page.evaluate(() => {
        const a = document.querySelector("audio");
        return a ? a.currentTime : -1;
      });

      if (t0 >= 0 && t2 >= 0) {
        const deltaOpen = Math.abs(t2 - t1);
        if (deltaOpen > 2.5) {
          throw new Error(
            `Credits open changed currentTime unexpectedly: t1=${t1} t2=${t2}`
          );
        }
        if (t2 < t0 - 0.5) {
          throw new Error(`currentTime rewound on credits: t0=${t0} t2=${t2}`);
        }
      }
      console.log(
        JSON.stringify({ audioCurrentTime: { t0, t1, t2 }, ok: true })
      );

      await page.keyboard.press("Escape");
      await waitVisualStable(page, 300);
      const expanded = await creditBtn.getAttribute("aria-expanded");
      if (expanded === "true") {
        throw new Error("Escape did not close credits");
      }

      await context.close();

      const videos = fs.readdirSync(OUT).filter((f) => f.endsWith(".webm"));
      const newest = videos
        .map((f) => ({ f, m: fs.statSync(path.join(OUT, f)).mtimeMs }))
        .sort((a, b) => b.m - a.m)[0];
      if (newest) {
        const dest = path.join(OUT, "07-rsvp-signature-credits.webm");
        if (fs.existsSync(dest) && newest.f !== "07-rsvp-signature-credits.webm") {
          fs.unlinkSync(dest);
        }
        if (newest.f !== "07-rsvp-signature-credits.webm") {
          fs.renameSync(path.join(OUT, newest.f), dest);
        }
        console.log("wrote", dest);
      }
    }

    if (pageErrors.length) {
      console.warn("pageerrors:", pageErrors.slice(0, 5));
      throw new Error(`pageerror count=${pageErrors.length}`);
    }

    console.log("APPROVAL_PACK_SIGNATURE_FINAL_OK", OUT);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
