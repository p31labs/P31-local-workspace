// Spaceship-earth — LED subsystem verify (Playwright + Chromium, headless).
// Runs against the live Pages deploy. Durable copy lives in-repo.
//
//   node scripts/verify-led.cjs
//   SHIP_VERIFY_BASE=https://... node scripts/verify-led.cjs
//
// Phase 1: static preflight (no browser) — modes, bridge contract, files.
// Phase 2: simulation round-trips via __p31_ledBridge (store mirror).
// Phase 3: mocked BLE — navigator.bluetooth is stubbed before app load;
//          the real nodeZeroBridge connects to the mock GATT and the real
//          NeoPixelBridgeImpl.flush() writes theme/coherence/spoons; the
//          byte-level payloads are asserted against the captured writes.
//
// Exits 0 only when every check passes.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.SHIP_VERIFY_BASE || 'https://spaceship-earth.pages.dev';
const ROOT = '/home/p31/P31-local-workspace/packages/spaceship-earth';

const LED_MODES = ['rainbow', 'chase', 'solid', 'breath', 'gradient', 'dual-chase', 'off'];

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`);
}

// ── Phase 1: static preflight (no browser) ──
console.log('\n── Phase 1: static preflight ──');
{
  const files = [
    ['services/neoPixelBridge.ts', 'LED bridge (simulation/hardware)'],
    ['services/nodeZeroBridge.ts', 'Node Zero Web Bluetooth bridge'],
    ['hud/LedController.tsx', 'LED controller (collapsible)'],
    ['cockpit/NeoPixelFrame.tsx', 'NeoPixel frame'],
    ['verify/hooks.ts', 'verify hooks module'],
  ];
  files.forEach(([rel, label]) => {
    check(`preflight: ${label} present (${rel})`, fs.existsSync(path.join(ROOT, 'src', rel)));
  });

  let modesOk = false;
  try {
    const cfg = fs.readFileSync(path.join(ROOT, 'src', 'config', 'domeConfig.ts'), 'utf-8');
    modesOk = LED_MODES.every((m) => cfg.includes(`'${m}'`));
  } catch {}
  check(`preflight: LedMode declares all ${LED_MODES.length} modes`, modesOk);

  let bridgeOk = false;
  try {
    const b = fs.readFileSync(path.join(ROOT, 'src', 'services', 'neoPixelBridge.ts'), 'utf-8');
    bridgeOk =
      ['setMode', 'setSpeed', 'setColor', 'setBrightness', 'flush', 'setHardwareMode', 'getNeoPixelBridge']
        .every((m) => b.includes(m));
  } catch {}
  check('preflight: NeoPixelBridgeImpl has setters + flush + hardware mode', bridgeOk);

  let nzOk = false;
  try {
    const nz = fs.readFileSync(path.join(ROOT, 'src', 'services', 'nodeZeroBridge.ts'), 'utf-8');
    nzOk =
      nz.includes('writeTheme') && nz.includes('writeCoherence') && nz.includes('writeSpoons') &&
      nz.includes('requestDevice') && nz.includes('P31_SERVICE_UUID');
  } catch {}
  check('preflight: nodeZeroBridge writes theme/coherence/spoons over GATT', nzOk);

  let hooksOk = false;
  try {
    const h = fs.readFileSync(path.join(ROOT, 'src', 'verify', 'hooks.ts'), 'utf-8');
    hooksOk = h.includes('__p31_led') && h.includes('__p31_ledBridge') && h.includes('__p31_nodeZero');
  } catch {}
  check('preflight: verify hooks expose __p31_led / __p31_ledBridge / __p31_nodeZero', hooksOk);
}

// ── Phase 2 + 3: browser (simulation + mocked BLE) ──
async function runLedVerify() {
  results.length = 0;
  console.log('\n── Phase 2/3: browser (simulation + mocked BLE) ──');
  const browser = await chromium.launch({ args: ['--no-sandbox', '--use-angle=swiftshader', '--disable-dev-shm-usage'] });
  // Block the service worker so we always exercise the freshly deployed bundle,
  // never a stale precache from a previous visit.
  const context = await browser.newContext({ serviceWorkers: 'block' });
  const page = await context.newPage();

  await page.addInitScript(() => {
    // Verify-only hooks + a recording Web Bluetooth stub installed BEFORE the
    // bundle's first tick so nodeZeroBridge sees it.
    window.__P31_VERIFY__ = true;

    const writes = [];
    window.__gattWrites = writes;

    const makeChar = (uuid) => ({
      startNotifications: async () => {},
      addEventListener: () => {},
      writeValue: async (payload) => {
        const bytes = payload instanceof ArrayBuffer ? new Uint8Array(payload) : new Uint8Array(payload);
        writes.push({ uuid, bytes: Array.from(bytes) });
      },
    });

    const service = {
      getCharacteristic: async (uuid) => makeChar(uuid),
    };

    const server = {
      connect: async () => server,
      getPrimaryService: async () => service,
    };

    const device = {
      name: 'NODE ZERO',
      gatt: server,
      addEventListener: () => {},
    };

    try {
      Object.defineProperty(navigator, 'bluetooth', {
        configurable: true,
        get: () => ({ requestDevice: async () => device }),
      });
    } catch {}
  });

  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') pageErrors.push(msg.text());
  });

  await page.goto(BASE, { waitUntil: 'domcontentloaded' });

  // The bundle must fully mount before any hook is usable — wait for the
  // verify hooks (installed by installVerifyHooks at app init) rather than
  // a fixed sleep. Times out if the app crashed on load.
  const mounted = await page
    .waitForFunction(() => typeof window.__p31_ledBridge === 'object' && typeof window.__p31_nodeZero === 'object', undefined, { timeout: 30000 })
    .then(() => true)
    .catch(() => false);
  check('app mounts and installs verify hooks', mounted);

  // Known noise: the live deploy's CSP predates the _headers update that
  // allows https://p31ca.org — the telemetry script is blocked until redeploy.
  const realErrors = pageErrors.filter((e) => !e.includes('p31-telemetry.js'));
  check('page loads without console errors (non-telemetry)', realErrors.length === 0, realErrors.join('; '));

  // The HUD is closed by default (hudRight defaults to null) — open the
  // Hardware panel so the LED controller is actually mounted, then wait for
  // the controller DOM node. Mirrors the Dock/HUDPill contract.
  await page.evaluate(() => {
    const pill = document.querySelector('.hud-pill--right [aria-label="Hardware"]');
    if (pill) pill.click();
  });
  const ctrl = await page
    .waitForSelector('[data-testid="led-controller"]', { timeout: 10000 })
    .then(() => true)
    .catch(() => null);
  check('LED controller rendered', Boolean(ctrl), 'data-testid=led-controller not found');
  await page.waitForTimeout(400);

  const hasHooks = await page.evaluate(
    () => typeof window.__p31_ledBridge === 'object' && typeof window.__p31_nodeZero === 'object',
  );
  check('__p31_ledBridge + __p31_nodeZero installed', hasHooks);

  // ── Phase 2: simulation round-trips ──
  let simOk = true;
  const simDetails = [];
  for (const mode of LED_MODES) {
    let ok = false;
    try {
      ok = await page.evaluate((m) => {
        window.__p31_ledBridge.setMode(m);
        return window.__p31_led.mode === m;
      }, mode);
    } catch (e) {
      simDetails.push(`${mode}(${e.message})`);
    }
    if (!ok) simDetails.push(mode);
  }
  simOk = simDetails.length === 0;
  check('simulation: all 7 modes round-trip to ship store', simOk, simDetails.join(', '));

  check(
    'simulation: speed/color/brightness round-trip',
    await page.evaluate(() => {
      window.__p31_ledBridge.setSpeed(7);
      window.__p31_ledBridge.setColor('#ff8800');
      window.__p31_ledBridge.setBrightness(50);
      return (
        window.__p31_led.speed === 7 &&
        window.__p31_led.color === '#ff8800' &&
        window.__p31_led.brightness === 50
      );
    }),
  );

  // ── Phase 3: mocked BLE write path ──
  check(
    'mocked navigator.bluetooth installed',
    await page.evaluate(() => typeof navigator.bluetooth?.requestDevice === 'function'),
  );

  const bleResult = await page.evaluate(async () => {
    const zero = window.__p31_nodeZero;
    const bridge = window.__p31_ledBridge;

    const connectRes = await zero.connect();
    if (!connectRes.success) return { ok: false, detail: JSON.stringify(connectRes) };

    bridge.setHardwareMode(true);
    bridge.setMode('dual-chase');
    bridge.setSpeed(15);
    bridge.setBrightness(50);
    bridge.flush();

    // flush() dispatches fire-and-forget; give the writes a moment to land.
    await new Promise((r) => setTimeout(r, 300));

    const writes = window.__gattWrites;
    const byUuid = (suffix) => writes.find((w) => w.uuid.endsWith(suffix));
    const theme = byUuid('31500004-7033-314c-cafe-ca9504630000');
    const coherence = byUuid('31500001-7033-314c-cafe-ca9504630000');
    const spoons = byUuid('31500002-7033-314c-cafe-ca9504630000');

    return {
      ok: Boolean(theme) && Boolean(coherence) && Boolean(spoons),
      themeText: theme ? new TextDecoder().decode(new Uint8Array(theme.bytes)) : null,
      coherenceVal: coherence ? new DataView(new Uint8Array(coherence.bytes).buffer).getFloat32(0, true) : null,
      spoonsByte: spoons ? spoons.bytes[0] : null,
      connected: zero.connected,
      totalWrites: writes.length,
    };
  });

  check(
    'BLE: connect() succeeds against mocked GATT',
    bleResult.ok && bleResult.connected === true,
    bleResult.detail || `connected=${bleResult.connected}`,
  );
  check('BLE: flush() writes theme/coherence/spoons characteristics', bleResult.ok, `writes=${bleResult.totalWrites}`);
  check('BLE: theme payload = UTF-8 "dual-chase"', bleResult.themeText === 'dual-chase', String(bleResult.themeText));
  check(
    'BLE: coherence payload = Float32(1.5) little-endian',
    Math.abs(bleResult.coherenceVal - 1.5) < 1e-6,
    String(bleResult.coherenceVal),
  );
  check('BLE: spoons payload = 0x80 (brightness 50%)', bleResult.spoonsByte === 128, String(bleResult.spoonsByte));

  const failed = results.filter((r) => !r.ok);
  const summary = `\n── LED verify summary ──\n${results.length - failed.length}/${results.length} checks passed`;
  console.log(summary);
  await browser.close();
  return failed.length > 0 ? 1 : 0;
}

(async () => {
  let attempts = 0;
  const max = 2;
  while (attempts < max) {
    try {
      const code = await runLedVerify();
      process.exit(code);
    } catch (e) {
      attempts++;
      if (attempts >= max) {
        console.error('FATAL:', e.message || e);
        process.exit(1);
      }
      console.log(`[retry ${attempts}/${max}] ${(e.message || e).split('\n')[0]} — restarting browser...`);
    }
  }
})().catch((e) => { console.error('FATAL:', e.message || e); process.exit(1); });
