// Headless screenshot of the Hero at localhost:3001.
// Waits for the canvas to mount and renders one frame before capture.

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '..', 'research', 'screenshots');
mkdirSync(OUT_DIR, { recursive: true });

const OUT_PATH = resolve(OUT_DIR, `hero-ballistic-${Date.now()}.png`);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

await page.goto('http://localhost:3001', { waitUntil: 'networkidle', timeout: 30_000 });
// The CALIBRATE loader runs ~2.9s + 0.5s fade. Wait for the shader canvas and
// then long enough for the loader overlay to fully dismiss and the shader to
// settle into a visually busy state.
await page.waitForSelector('canvas', { state: 'attached' });
await page.waitForTimeout(5000);

await page.screenshot({ path: OUT_PATH, fullPage: false });
console.log(OUT_PATH);

await browser.close();
