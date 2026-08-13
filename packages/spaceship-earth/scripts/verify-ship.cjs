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
//
// Contracts under test (current code, 2026-08):
//   - 320 face-target docking ports (DOME_FACE_CENTROIDS), 480-edge geodesic
//   - HUD closed by default (hudRight null) — the suite opens panels via the
//     right HUD pill (System → duna/system boards, Hardware → LedController)
//   - graph data dome renders only when a dataset is active; the suite loads
//     a demo dataset through __p31_loadDemoDataset and asserts scene content
//     via the __p31_scene probe (lines/points/instances)
//   - relay + shell workers reflect CORS only for explicit allowed origins
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.SHIP_VERIFY_BASE || 'https://spaceship-earth.pages.dev';
const RELAY = 'https://spaceship-relay.trimtab-signal.workers.dev';
const SHELL = 'https://p31-shell.trimtab-signal.workers.dev';
const ROOT = '/home/p31/P31-local-workspace/packages/spaceship-earth';
const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`);
}

// Open a HUD panel by clicking its right-dock pill. Playwright's locator-click
// actionability pipeline stalls on the heavy SwiftShader WebGL page, so we
// dispatch real CDP mouse events at the button center, then fall back to a
// programmatic DOM click if the pointer path was flaky.
async function openPanel(page, label, testid, timeout = 15000) {
  const sel = `.hud-pill--right [aria-label="${label}"]`;
  await page.waitForSelector(sel, { timeout: 20000 });
  const rect = await page.$eval(sel, (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  await page.mouse.click(rect.x + rect.w / 2, rect.y + rect.h / 2);
  await page.waitForTimeout(400);
  if (!(await page.$(testid))) {
    await page.evaluate((s) => document.querySelector(s)?.click(), sel);
    await page.waitForTimeout(400);
  }
  await page.waitForSelector(testid, { timeout });
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
    ['verify/SceneProbe.tsx', 'verify scene probe (__p31_scene)'],
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
    hooksOk = hooks.includes('__p31_domeStructure') && hooks.includes('__p31_ship') && hooks.includes('__p31_led') && hooks.includes('__p31_observatory') && hooks.includes('__p31_loadDemoDataset');
  } catch {}
  check('preflight: verify hooks expose dome/ship/led/observatory/demoDataset windows', hooksOk);

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

  let portsOk = false;
  try {
    const cfg = fs.readFileSync(path.join(ROOT, 'src', 'config', 'domeConfig.ts'), 'utf-8');
    portsOk = cfg.includes('maxActiveDatasets: 2') || cfg.includes('focusReminderMinutes');
  } catch {}
  check('preflight: dome config present', portsOk);
}

// ── Section B: deploy fingerprint (informational by default) ──
async function runSuite() {
  results.length = 0;
  const browser = await chromium.launch({ args: ['--no-sandbox', '--use-angle=swiftshader', '--disable-dev-shm-usage'] });
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    serviceWorkers: 'block',
  });
  let page = await ctx.newPage();
  page.setDefaultTimeout(15000);
  await page.addInitScript(() => { window.__P31_VERIFY__ = true; });

  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));

  {
    const html = await (await fetch(BASE + '/')).text();
    const asset = (html.match(/assets\/index-[A-Za-z0-9_-]+\.js/) || [])[0];
    check('deploy: live index.html references a hashed JS asset', !!asset, asset || 'no asset');
  }

  // Load the app and wait until the WebGL canvas + verify hooks are present.
  // If the canvas disappears mid-suite the headless GL context was lost — the
  // driver reloads once and re-runs Sections C–F before continuing.
  async function waitForApp() {
    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.locator('canvas').first().waitFor({ state: 'attached', timeout: 60000 });
    await page
      .waitForFunction(() => typeof window.__p31_domeStructure === 'object' && typeof window.__p31_observatory === 'object', undefined, { timeout: 30000 })
      .catch(() => {});
    await page.waitForTimeout(1500);
  }
  await waitForApp();

  const runCtoF = async () => {
    const sections = [];

    // ── Section C: app load + verify hooks ──
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

    // ── Section C.1: observatory numbers ──
    const observatory = await page.evaluate(() => window.__p31_observatory || null);
    check('observatory: nodeCount=58', observatory && observatory.nodeCount === 58, observatory ? `nodeCount=${observatory.nodeCount}` : 'null');
    check('observatory: edgeCount=55', observatory && observatory.edgeCount === 55, observatory ? `edgeCount=${observatory.edgeCount}` : 'null');
    check('observatory: axisCount=4', observatory && observatory.axisCount === 4, observatory ? `axisCount=${observatory.axisCount}` : 'null');
    check('observatory: shellVertices = 162', observatory && observatory.shellVertices === 162, observatory ? `shellVertices=${observatory.shellVertices}` : 'null');
    check('observatory: shellEdges=480', observatory && observatory.shellEdges === 480, observatory ? `shellEdges=${observatory.shellEdges}` : 'null');

    // ── Section C.2: graph data dome — load a demo dataset, then assert the
    // scene actually contains lines (edges), points (starfield) and
    // instanced meshes (graph nodes) via the __p31_scene probe. ──
    check('graph: JitterbugBackground mounts (.jitterbug-background)',
      (await page.$('.jitterbug-background')) !== null);
    const seeded = await page.evaluate(() => window.__p31_loadDemoDataset().catch(() => false));
    check('graph: demo dataset loads through __p31_loadDemoDataset', seeded === true);
    const scenePopulated = await page
      .waitForFunction(
        () => {
          const s = window.__p31_scene;
          return !!s && s.lines >= 1 && s.instances >= 1;
        },
        undefined,
        { timeout: 45000 },
      )
      .then(() => true)
      .catch(() => false);
    const scene = await page.evaluate(() => window.__p31_scene || null);
    check('graph: scene renders edge lines + graph node instances',
      scenePopulated, scene ? `lines=${scene.lines} instances=${scene.instances} points=${scene.points}` : 'no __p31_scene');
    check('graph: starfield points in scene',
      !!scene && scene.points >= 1, scene ? `points=${scene.points}` : 'no __p31_scene');
    check('graph: WebGL canvas remains mounted (no context-loss crash)',
      (await page.$('canvas')) !== null);

    // ── Section D: dome structure ──
    const dome = await page.evaluate(() => window.__p31_domeStructure || null);
    check('dome: 4-layer docking dome (layers=4, mode=docking-dome)',
      dome && dome.layers === 4 && dome.mode === 'docking-dome',
      dome ? `layers=${dome.layers} mode=${dome.mode}` : 'null');
    check('dome: 480-edge outer geodesic shell',
      dome && dome.outerEdges === 480, dome ? `outerEdges=${dome.outerEdges}` : 'null');
    check('dome: 320 face-target docking ports',
      dome && dome.ports === 320, dome ? `ports=${dome.ports}` : 'null');
    check('dome: NeoPixel frame segments = 9600 (480 × 20)',
      dome && dome.neoPixelSegments === 9600, dome ? `segments=${dome.neoPixelSegments}` : 'null');
    check('dome: K4 tensegrity frame present (6 tetra edges)',
      dome && dome.tetraFrame === 6, dome ? `tetraFrame=${dome.tetraFrame}` : 'null');
    check('dome: inner info dome present',
      dome && dome.innerDome === true, dome ? `innerDome=${dome.innerDome}` : 'null');

    // ── Section E: HUD boards — open the System panel via the right pill ──
    await openPanel(page, 'System', '[data-testid="duna-board"]');
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

    // ── Section F: LED controller — open the Hardware panel, then collapse/
    // expand + mode switch through the real UI ──
    // The right dock renders either the pill row OR the open panel, so close
    // the System panel first before the Hardware pill becomes available.
    await page.evaluate(() => document.querySelector('[aria-label="Close panel"]')?.click());
    await page.waitForTimeout(300);
    await openPanel(page, 'Hardware', '[data-testid="led-controller"]');
    {
      const ledInit = await page.evaluate(() => window.__p31_led || null);
      const collInit = await page.getAttribute('[data-testid="led-controller"]', 'data-collapsed');
      check('led: controller collapsed by default (store + data-collapsed)',
        ledInit && ledInit.collapsed === true && collInit === 'true',
        ledInit ? `collapsed=${ledInit.collapsed}` : 'null');

      await page.evaluate(() => document.querySelector('[aria-label="Collapse NeoPixel controller"]')?.click());
      await page.waitForFunction(
        () => document.querySelector('[data-testid="led-controller"]')?.getAttribute('data-collapsed') === 'false',
        { timeout: 30000 },
      );
      const ledAfterExpand = await page.evaluate(() => window.__p31_led?.collapsed);
      check('led: click on collapsed pill expands the controller',
        ledAfterExpand === false);

      check('led: mode buttons render (rainbow + off present)',
        (await page.$$('button:has-text("rainbow")')).length >= 1 && (await page.$$('button:has-text("off")')).length >= 1);
      check('led: brightness + speed sliders render',
        (await page.$$('input[type="range"]')).length >= 2);

      await page.evaluate(() => {
        const b = Array.from(document.querySelectorAll('button')).find((el) => el.textContent.trim() === 'solid');
        b?.click();
      });
      await page.waitForTimeout(300);
      const ledSolid = await page.evaluate(() => window.__p31_led?.mode);
      check('led: mode switch (solid) propagates to store hook',
        ledSolid === 'solid', `mode=${ledSolid}`);

      await page.evaluate(() => document.querySelector('[aria-label="Collapse NeoPixel controller"]')?.click());
      await page.waitForFunction(
        () => document.querySelector('[data-testid="led-controller"]')?.getAttribute('data-collapsed') === 'true',
        { timeout: 30000 },
      );
      const ledAfterCollapse = await page.evaluate(() => window.__p31_led?.collapsed);
      check('led: header button collapses the controller back to a pill',
        ledAfterCollapse === true);
    }

    // Crash detection: the canvas must still be mounted after all interaction.
    const alive = (await page.$('canvas')) !== null;
    sections.push({ name: 'canvas-alive', ok: alive });
    return alive;
  };

  let healthy = await runCtoF();
  if (!healthy) {
    console.log('  (canvas lost — reloading once and re-running Sections C–F)');
    await waitForApp();
    healthy = await runCtoF();
  }
  check('stability: WebGL canvas survives the full HUD/led interaction',
    healthy);

  // ── Section G: state persistence across reload ──
  // Reload-in-place can hang once the software-GL renderer is wedged, so open
  // a fresh page in the same context (same localStorage, so zustand persist
  // state survives) instead.
  {
    await page.close();
    page = await ctx.newPage();
    page.setDefaultTimeout(15000);
    await page.addInitScript(() => { window.__P31_VERIFY__ = true; });
    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.locator('canvas').first().waitFor({ state: 'attached', timeout: 60000 });
    await page
      .waitForFunction(() => typeof window.__p31_led === 'object', undefined, { timeout: 30000 })
      .catch(() => {});
    await page.waitForTimeout(1500);
    const ledReload = await page.evaluate(() => window.__p31_led || null);
    check('persist: ledCollapsed + ledMode survive reload (zustand persist)',
      ledReload && ledReload.collapsed === true && ledReload.mode === 'solid',
      ledReload ? `collapsed=${ledReload.collapsed} mode=${ledReload.mode}` : 'null');
  }

  // ── Section H: CORS — relay + shell reflect only allowed origins ──
  {
    const allowed = 'https://spaceship-earth.pages.dev';
    const evil = 'https://evil.example';
    const acao = async (url, origin) => {
      try {
        const res = await fetch(url, { headers: { Origin: origin } });
        return res.headers.get('access-control-allow-origin');
      } catch (e) {
        return `error:${e.message}`;
      }
    };
    check('cors: relay reflects allowed origin (spaceship-earth)',
      await acao(`${RELAY}/api/spaceship-state`, allowed) === allowed);
    check('cors: relay does not reflect a disallowed origin',
      (await acao(`${RELAY}/api/spaceship-state`, evil)) !== evil);
    check('cors: shell worker reflects allowed origin',
      await acao(`${SHELL}/api/shell-state`, allowed) === allowed);
    check('cors: shell worker does not reflect a disallowed origin',
      (await acao(`${SHELL}/api/shell-state`, evil)) !== evil);
  }

  const fails = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - fails}/${results.length} checks passed`);
  await browser.close();

  // ── LED subsystem verify (standalone suite, its own browser) ──
  try {
    const { execFileSync } = require('child_process');
    execFileSync(process.execPath, [path.join(__dirname, 'verify-led.cjs')], {
      stdio: 'inherit',
      env: process.env,
    });
    check('led: verify-led.cjs passes', true);
  } catch (e) {
    check('led: verify-led.cjs passes', false, e.message);
  }

  const ledFails = results.filter((r) => !r.ok).length;
  return ledFails ? 1 : 0;
}

(async () => {
  let attempts = 0;
  const max = 2;
  while (attempts < max) {
    try {
      const code = await runSuite();
      process.exit(code);
    } catch (e) {
      attempts++;
      if (attempts >= max) {
        console.error('SUITE ERROR:', e.message);
        process.exit(2);
      }
      console.log(`[retry ${attempts}/${max}] ${e.message.split('\n')[0]} — restarting browser...`);
    }
  }
})().catch((e) => { console.error('FATAL:', e.message); process.exit(2); });
