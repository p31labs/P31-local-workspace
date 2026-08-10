const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const logs = [];
  page.on('console', msg => logs.push({ type: msg.type(), text: msg.text() }));
  page.on('pageerror', err => logs.push({ type: 'pageerror', text: err.message }));
  await page.goto('https://ed5691fc.spaceship-earth.pages.dev', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(5000);
  const canvas = await page.$('canvas');
  const root = await page.$('#root');
  console.log('canvas:', !!canvas);
  console.log('root children:', root ? await root.evaluate(el => el.childElementCount) : 'null');
  console.log('logs:', JSON.stringify(logs.slice(0, 20), null, 2));
  await browser.close();
})();
