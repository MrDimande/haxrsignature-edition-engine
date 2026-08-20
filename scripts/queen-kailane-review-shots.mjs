/**
 * Visual review screenshots — Queen Kailane · As Portas da Luz
 * Writes to tmp/queen-kailane-review/ (not for commit).
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE =
  process.env.QUEEN_REVIEW_URL ||
  "http://127.0.0.1:3467/queenkailanecrisma";
const OUT = path.resolve("tmp/queen-kailane-review");
fs.mkdirSync(OUT, { recursive: true });

async function shot(page, name) {
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, fullPage: false });
  console.log("wrote", file);
}

async function waitGateReady(page) {
  await page.getByRole("button", { name: /ABRIR/i }).waitFor({
    state: "visible",
    timeout: 15000,
  });
  await page.waitForTimeout(1900);
}

async function run() {
  const browser = await chromium.launch({ headless: true });

  // Desktop gate
  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    await page.goto(BASE, { waitUntil: "networkidle", timeout: 60000 });
    await waitGateReady(page);
    await shot(page, "01-gate-desktop.png");

    // Capture mid-open: click and shoot during bloom
    await page.getByRole("button", { name: /ABRIR/i }).click();
    await page.waitForTimeout(900);
    await shot(page, "03-gate-opening-state.png");
    await page.waitForTimeout(2600);
    await page.locator("#queen-hero").waitFor({ state: "visible", timeout: 10000 });
    await shot(page, "04-hero-desktop.png");

    await page.locator("#queen-versiculo").scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    await shot(page, "06-verse-section.png");

    await page.locator("#queen-rsvp").scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    await shot(page, "07-rsvp-section.png");

    await page.locator("#queen-haxr").scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    await shot(page, "08-final-signature.png");
    await context.close();
  }

  // Mobile gate + hero
  {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    await page.goto(BASE, { waitUntil: "networkidle", timeout: 60000 });
    await waitGateReady(page);
    await shot(page, "02-gate-mobile.png");
    await page.getByRole("button", { name: /ABRIR/i }).click();
    await page.waitForTimeout(2200);
    await page.locator("#queen-hero").waitFor({ state: "visible", timeout: 10000 });
    await shot(page, "05-hero-mobile.png");
    await context.close();
  }

  await browser.close();
  console.log("Queen Kailane gate polish screenshots complete.");
}

await run();
