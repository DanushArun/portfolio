import { chromium } from 'playwright';

async function run() {
  console.log('Starting Playwright check...');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:3000');
    console.log('Navigated to localhost:3000');
    
    // Wait for the Black Hole / Loading to settle
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'tests/screenshots/audit_landing.png' });
    console.log('Captured landing screenshot.');
    
    // Scroll down to the middle (where Work panels should be)
    await page.evaluate(() => window.scrollBy(0, 10000));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'tests/screenshots/audit_middle.png' });
    console.log('Captured middle screenshot.');

    // Scroll to the end
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'tests/screenshots/audit_end.png' });
    console.log('Captured end screenshot.');

  } catch (e) {
    console.error('Playwright failed:', e);
  } finally {
    await browser.close();
  }
}

run();
