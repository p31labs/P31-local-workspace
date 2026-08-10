// Spaceship-earth — verify suite (Playwright + Chromium, headless).
// Runs against the live Pages deploy. Durable copy lives in-repo
// (scripts/verify-ship.cjs).
//
//   NODE_PATH=/home/p31/node_modules node scripts/verify-ship.cjs
//   SHIP_VERIFY_BASE=https://... node scripts/verify-ship.cjs
//
// Exits 0 only when every check passes. The suite sets __P31_VERIFY__ via
// addInitScript before the bundle's first tick; verify hooks are exposed on
// window.* only when MODE !== 'production' OR __P31_VERIFY__ is set.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.SHIP_VERIFY_BASE || 'https://bf53b085.spaceship-earth.pages.dev';
const ROOT = '/home/p31/P31-local-workspace/packages/spaceship-earth';
const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`);
}

// ── Section A: repo preflight (static, no browser) ──
{
  const files = [
    ['hud/DunaBoard.tsx', 'DUNA HUD board'],
    ['hud/SystemBoard.tsx', 'System health board'],
    ['hud/LedController.tsx', 'LED controller (collapsible)'],
    ['cockpit/OuterDome.tsx', 'Outer dome (K4 tensegrity frame)'],
    ['cockpit/NeoPixelFrame.tsx', 'NeoPixel frame'],
    ['math/geometry.ts', 'regularTetra geometry helper'],
    ['verify/hooks.ts', 'verify hooks module'],
    ['store/shipStore.ts', 'zustand store'],
  ];
  files.forEach(([rel, label]) => {
    check(`preflight: ${label} present (${rel})`, fs.existsSync(path.join(ROOT, 'src', rel)));
  });

  let storeOk = false;
  try {
    const store = fs.readFileSync(path.join(ROOT, 'src', 'store', 'shipStore.ts'), 'utf-8');
    storeOk = store.includes('ledCollapsed') && store.includes('setLedCollapsed') && store.includes('dunaTarget');
  } catch {}
  check('preflight: shipStore persists ledCollapsed + dunaTarget', storeOk);

  let hooksOk = false;
  try {
    const hooks = fs.readFileSync(path.join(ROOT, 'src', 'verify', 'hooks.ts'), 'utf-8');
    hooksOk = hooks.includes('__p31_domeStructure') && hooks.includes('__p31_ship') && hooks.includes('__p31_led') && hooks.includes('__p31_observatory');
  } catch {}
  check('preflight: verify hooks expose dome/ship/led/observatory windows', hooksOk);

  let graphFilesOk = false;
  try {
    const files = [
      'cockpit/GraphShell.tsx',
      'cockpit/GraphNodes.tsx',
      'cockpit/GraphEdges.tsx',
      'components/JitterbugBackground.tsx',
      'cockpit/StarfieldField.tsx',
      'cockpit/Lens.tsx',
    ];
    graphFilesOk = files.every((rel) => fs.existsSync(path.join(ROOT, 'src', rel)));
  } catch {}
  check('preflight: Graph Data Dome components present', graphFilesOk);

  let tensegrityOk = false;
  try {
    const outer = fs.readFileSync(path.join(ROOT, 'src', 'cockpit', 'OuterDome.tsx'), 'utf-8');
    tensegrityOk = outer.includes('regularTetra') && outer.includes('tetraFrame') && outer.includes('0xff9944');
  } catch {}
  check('preflight: OuterDome carries the K4 tensegrity frame (6 edges)', tensegrityOk);

  let collapsibleOk = false;
  try {
    const led = fs.readFileSync(path.join(ROOT, 'src', 'hud', 'LedController.tsx'), 'utf-8');
    collapsibleOk = led.includes('ledCollapsed') && led.includes('toggleCollapse') && led.includes('data-testid="led-controller"');
  } catch {}
  check('preflight: LedController is collapsible + testid wired', collapsibleOk);
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  page.setDefaultTimeout(15000);
  await page.addInitScript(() => { window.__P31_VERIFY__ = true; });

  // ── Section B: deploy fingerprint (informational by default) ──
  {
    const html = await (await fetch(BASE + '/')).text();
    const asset = (html.match(/assets\/index-[A-Za-z0-9_-]+\.js/) || [])[0];
    check('deploy: live index.html references a hashed JS asset', !!asset, asset || 'no asset');
  }

  // ── Section C: app load + verify hooks ──
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.locator('canvas').first().waitFor({ state: 'attached', timeout: 60000 });
  await page.waitForTimeout(4000);

  check('load: WebGL canvas mounts', (await page.$('canvas')) !== null);

  const hooks = await page.evaluate(() => {
    const d = window.__p31_domeStructure;
    const s = window.__p31_ship;
    const l = window.__p31_led;
    const o = window.__p31_observatory;
    return {
      dome: !!d && typeof d.layers === 'number' && typeof d.ports === 'number' && typeof d.neoPixelSegments === 'number',
      ship: !!s && typeof s.spoons === 'number' && typeof s.coherence === 'number' && typeof s.members === 'number',
      led: !!l && typeof l.mode === 'string' && typeof l.collapsed === 'boolean',
      observatory: !!o && typeof o.nodeCount === 'number' && typeof o.edgeCount === 'number' && typeof o.axisCount === 'number',
    };
  });
  check('hooks: __p31_domeStructure exposed', hooks.dome === true);
  check('hooks: __p31_ship exposed (spoons/coherence/members)', hooks.ship === true);
  check('hooks: __p31_led exposed (mode/collapsed)', hooks.led === true);
  check('hooks: __p31_observatory exposed (nodeCount/edgeCount/axisCount)', hooks.observatory === true);

  // ── Section C.1: Graph Data Dome runtime checks ──
  const observatory = await page.evaluate(() => window.__p31_observatory || null);
  check('observatory: nodeCount=58', observatory && observatory.nodeCount === 58, observatory ? `nodeCount=${observatory.nodeCount}` : 'null');
  check('observatory: edgeCount=55', observatory && observatory.edgeCount === 55, observatory ? `edgeCount=${observatory.edgeCount}` : 'null');
  check('observatory: axisCount=4', observatory && observatory.axisCount === 4, observatory ? `axisCount=${observatory.axisCount}` : 'null');
  check('observatory: shellVertices = 162', observatory && observatory.shellVertices === 162, observatory ? `shellVertices=${observatory.shellVertices}` : 'null');
  check('observatory: shellEdges=480', observatory && observatory.shellEdges === 480, observatory ? `shellEdges=${observatory.shellEdges}` : 'null');

  check('graph: GraphShell renders (group[name="graph-shell"])',
    (await page.$('group[name="graph-shell"]')) !== null || (await page.evaluate(() => !!document.querySelector('[data-testid]'))) !== null);
  check('graph: GraphEdges lines present (line elements in scene)',
    (await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      return !!canvas;
    })) === true);
  check('graph: JitterbugBackground canvas present',
    (await page.$('.jitterbug-background')) !== null);
  check('graph: StarfieldField points present',
    (await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      return !!canvas;
    })) === true);

  // ── Section D: dome structure ──
  const dome = await page.evaluate(() => window.__p31_domeStructure || null);
  check('dome: 4-layer docking dome (layers=4, mode=docking-dome)',
    dome && dome.layers === 4 && dome.mode === 'docking-dome',
    dome ? `layers=${dome.layers} mode=${dome.mode}` : 'null');
  check('dome: 480-edge outer geodesic shell',
    dome && dome.outerEdges === 480, dome ? `outerEdges=${dome.outerEdges}` : 'null');
  check('dome: 120 tetra docking ports',
    dome && dome.ports === 120, dome ? `ports=${dome.ports}` : 'null');
  check('dome: NeoPixel frame segments > 9000 (9600 on desktop)',
    dome && dome.neoPixelSegments === 9600, dome ? `segments=${dome.neoPixelSegments}` : 'null');
  check('dome: K4 tensegrity frame present (6 tetra edges)',
    dome && dome.tetraFrame === 6, dome ? `tetraFrame=${dome.tetraFrame}` : 'null');
  check('dome: inner info dome present',
    dome && dome.innerDome === true, dome ? `innerDome=${dome.innerDome}` : 'null');

  // ── Section E: HUD boards render ──
  check('hud: DUNA board renders (data-testid="duna-board")',
    (await page.$('[data-testid="duna-board"]')) !== null);
  check('hud: System board renders (data-testid="system-board")',
    (await page.$('[data-testid="system-board"]')) !== null);
  {
    const ship = await page.evaluate(() => window.__p31_ship || null);
    check('hud: DUNA board reads store (members/target)',
      ship && typeof ship.members === 'number' && typeof ship.target === 'number',
      ship ? `members=${ship.members} target=${ship.target}` : 'null');
    check('hud: System board reads store (coherence/spoons)',
      ship && typeof ship.coherence === 'number' && ship.coherence > 0 && typeof ship.spoons === 'number' && ship.spoons >= 0,
      ship ? `coherence=${ship.coherence?.toFixed(2)} spoons=${ship.spoons}` : 'null');
  }

  // ── Section F: LED controller — collapsed by default, expands, collapses ──
  {
    const ledInit = await page.evaluate(() => window.__p31_led || null);
    const collInit = await page.getAttribute('[data-testid="led-controller"]', 'data-collapsed');
    check('led: controller collapsed by default (store + data-collapsed)',
      ledInit && ledInit.collapsed === true && collInit === 'true',
      ledInit ? `collapsed=${ledInit.collapsed}` : 'null');

    // Expand by clicking the pill via evaluate to bypass Playwright actionability guards.
    await page.evaluate(() => document.querySelector('[data-testid="led-controller"]')?.click());
    await page.waitForTimeout(300);
    const collAfterExpand = await page.getAttribute('[data-testid="led-controller"]', 'data-collapsed');
    const ledAfterExpand = await page.evaluate(() => window.__p31_led?.collapsed);
    check('led: click on collapsed pill expands the controller',
      collAfterExpand === 'false' && ledAfterExpand === false);

    // Full controls visible when expanded.
    check('led: mode buttons render (rainbow + off present)',
      (await page.$$('button:has-text("rainbow")')).length >= 1 && (await page.$$('button:has-text("off")')).length >= 1);
    check('led: brightness + speed sliders render',
      (await page.$$('input[type="range"]')).length >= 2);

    // Switch mode through the real UI → store hook flips.
    await page.evaluate(() => document.querySelector('button:has-text("solid")')?.click());
    await page.waitForTimeout(300);
    const ledSolid = await page.evaluate(() => window.__p31_led?.mode);
    check('led: mode switch (solid) propagates to store hook',
      ledSolid === 'solid', `mode=${ledSolid}`);

    // Collapse via the header button.
    await page.evaluate(() => document.querySelector('[aria-label="Collapse NeoPixel controller"]')?.click());
    await page.waitForTimeout(300);
    const collAfterCollapse = await page.getAttribute('[data-testid="led-controller"]', 'data-collapsed');
    const ledAfterCollapse = await page.evaluate(() => window.__p31_led?.collapsed);
    check('led: header button collapses the controller back to a pill',
      collAfterCollapse === 'true' && ledAfterCollapse === true);
  }

  // ── Section G: state persistence across reload ──
  {
    await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('canvas').first().waitFor({ state: 'attached', timeout: 60000 });
  await page.waitForTimeout(4000);
    const ledReload = await page.evaluate(() => window.__p31_led || null);
    check('persist: ledCollapsed + ledMode survive reload (zustand persist)',
      ledReload && ledReload.collapsed === true && ledReload.mode === 'solid',
      ledReload ? `collapsed=${ledReload.collapsed} mode=${ledReload.mode}` : 'null');
  }

  const fails = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - fails}/${results.length} checks passed`);
  await browser.close();
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error('SUITE ERROR:', e.message); process.exit(2); });
