import { chromium } from 'playwright';
const PAGES = ['willow', 'tetra-ops', 'p31-portal', 'p31ca', 'phosphorus31'];
const browser = await chromium.launch();
const results = [];
for (const name of PAGES) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  try {
    await page.goto(`http://localhost:3789/${name}`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `/tmp/${name}.png`, fullPage: true });
    const tokens = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      return { hasP31Bg: root.getPropertyValue('--p31-bg').length > 0, hasP31Accent: root.getPropertyValue('--p31-accent').length > 0, hasP31GlassBlur: root.getPropertyValue('--p31-glass-blur').length > 0 };
    });
    const consoleErrors = [];
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    results.push({ name, status: 'OK', tokens, errors: consoleErrors.slice(0, 5) });
  } catch (e) {
    results.push({ name, status: 'FAIL', error: e.message.slice(0, 120) });
  }
  await page.close();
}
await browser.close();
console.log(JSON.stringify(results, null, 2));
