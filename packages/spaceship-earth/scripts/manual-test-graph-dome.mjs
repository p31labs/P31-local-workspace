// Manual Graph Data Dome test — headless browser screenshot + DOM validation.
// Exit 0 on success, non-zero on failure.
//
//   node scripts/manual-test-graph-dome.mjs
//   SHIP_VERIFY_BASE=https://... node scripts/manual-test-graph-dome.mjs
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.SHIP_VERIFY_BASE || 'https://bf53b085.spaceship-earth.pages.dev';
const SCREENSHOT = path.join(__dirname, '..', 'manual-test-graph-dome.png');

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  page.setDefaultTimeout(15000);
  await page.addInitScript(() => { window.__P31_VERIFY__ = true; });

  console.log(`[manual-test] Navigating to ${BASE}`);
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.locator('canvas').first().waitFor({ state: 'attached', timeout: 60000 });
  await page.waitForTimeout(3000);

  const results = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    const jitterbug = document.querySelector('.jitterbug-background');
    const dome = window.__p31_domeStructure;
    const observatory = window.__p31_observatory;
    const led = window.__p31_led;
    return {
      canvas: !!canvas,
      jitterbug: !!jitterbug,
      dome: !!dome,
      observatory: !!observatory,
      led: !!led,
      nodeCount: observatory?.nodeCount,
      edgeCount: observatory?.edgeCount,
      axisCount: observatory?.axisCount,
      shellEdges: observatory?.shellEdges,
    };
  });

  const ok = (cond, label) => {
    console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}`);
    return cond;
  };

  let pass = true;
  pass = ok(results.canvas, 'WebGL canvas mounted') && pass;
  pass = ok(results.jitterbug, 'JitterbugBackground present') && pass;
  pass = ok(results.dome, '__p31_domeStructure exposed') && pass;
  pass = ok(results.observatory, '__p31_observatory exposed') && pass;
  pass = ok(results.led, '__p31_led exposed') && pass;
  pass = ok(results.nodeCount === 58, `observatory.nodeCount=58 (got ${results.nodeCount})`) && pass;
  pass = ok(results.edgeCount === 55, `observatory.edgeCount=55 (got ${results.edgeCount})`) && pass;
  pass = ok(results.axisCount === 4, `observatory.axisCount=4 (got ${results.axisCount})`) && pass;
  pass = ok(results.shellEdges === 480, `observatory.shellEdges=480 (got ${results.shellEdges})`) && pass;

  await page.screenshot({ path: SCREENSHOT, fullPage: true });
  console.log(`[manual-test] Screenshot saved to ${SCREENSHOT}`);

  await browser.close();
  process.exit(pass ? 0 : 1);
})().catch((e) => {
  console.error('[manual-test] SUITE ERROR:', e.message);
  process.exit(2);
});
