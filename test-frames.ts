import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  
  try {
    await page.goto('http://localhost:3000');
    // Wait for initial load
    await page.waitForTimeout(3000);
    
    const maxScroll = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);

    // 1. Cover (0%)
    await page.screenshot({ path: 'tests/screenshots/frame_cover.png' });
    console.log('Captured Cover');

    // 2. Transition (45% scroll approx)
    await page.evaluate((max) => window.scrollTo(0, max * 0.45), maxScroll);
    await page.waitForTimeout(2000); // let animations settle
    await page.screenshot({ path: 'tests/screenshots/frame_transition.png' });
    console.log('Captured Transition');

    // 3. MIRA (58% scroll approx)
    await page.evaluate((max) => window.scrollTo(0, max * 0.58), maxScroll);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/screenshots/frame_mira.png' });
    console.log('Captured MIRA');

  } catch (e) {
    console.error(e);
  } finally {
    await browser.close();
  }
}

run();
