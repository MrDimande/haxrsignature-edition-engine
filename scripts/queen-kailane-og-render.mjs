/**
 * Render Queen Kailane OG / WhatsApp card — 1200×630
 * Output: public/images/queen-kailane/social/queen-kailane-og.png
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const TEMPLATE = path.join(ROOT, "scripts/queen-kailane-og-template.html");
const OUT_DIR = path.join(ROOT, "public/images/queen-kailane/social");
const OUT = path.join(OUT_DIR, "queen-kailane-og.png");
const REVIEW = path.join(ROOT, "tmp/queen-kailane-review/og-whatsapp-1200x630.png");

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(path.dirname(REVIEW), { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
});

await page.goto(pathToFileURL(TEMPLATE).href, {
  waitUntil: "networkidle",
  timeout: 60000,
});
// Allow webfonts to settle
await page.waitForTimeout(900);

await page.screenshot({
  path: OUT,
  type: "png",
  clip: { x: 0, y: 0, width: 1200, height: 630 },
});
fs.copyFileSync(OUT, REVIEW);

await browser.close();

const stat = fs.statSync(OUT);
console.log(`wrote ${OUT} (${stat.size} bytes)`);
console.log(`review copy ${REVIEW}`);
