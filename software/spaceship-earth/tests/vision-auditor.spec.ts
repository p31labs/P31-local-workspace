import { test, expect } from '@playwright/test';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not set');

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper: capture screenshot and send to Gemini
async function auditCognitiveState(
  page: any,
  stateName: string,
  stateSetup: () => Promise<void>,
  auditPrompt: string
): Promise<string> {
  await stateSetup();
  await page.waitForTimeout(2000); // allow shader transitions

  const screenshotPath = path.join(__dirname, `artifacts/dome-${stateName}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const imageBuffer = fs.readFileSync(screenshotPath);
  const base64Image = imageBuffer.toString('base64');

  const result = await model.generateContent([
    auditPrompt,
    { inlineData: { data: base64Image, mimeType: 'image/png' } }
  ]);
  return result.response.text();
}

test.describe('Spaceship Earth – Cognitive Visual Audit', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5180/spaceship-earth/#dome');
    await page.waitForSelector('canvas'); // ensure Three.js is ready
  });

  test('QUANTUM mode (5 spoons) – high energy, vibrant, full particle field', async ({ page }) => {
    const response = await auditCognitiveState(
      page,
      'quantum',
      async () => await page.evaluate(() => window.__p31Dome?.setSpoons?.(5)),
      `You are a cognitive accessibility auditor. The interface is in QUANTUM mode (full energy).
      Verify:
      1. The K₄ topology is fully visible, with bright, saturated colors (emerald, cyan, coral).
      2. Particle field is dense and active.
      3. Bloom effect is present but not overwhelming (edges should glow).
      Answer strictly with 'PASS' or 'FAIL: [reason]'.`
    );
    console.log(`Gemini: ${response}`);
    expect(response).toContain('PASS');
  });

  test('GRAY ROCK mode (0 spoons) – muted, low contrast, no animations', async ({ page }) => {
    const response = await auditCognitiveState(
      page,
      'gray-rock',
      async () => await page.evaluate(() => window.__p31Dome?.setSpoons?.(0)),
      `You are a cognitive accessibility auditor. The interface is in GRAY ROCK mode (crisis protection).
      Verify:
      1. No bright, saturated colors – only muted, low‑contrast tones (grayscale or desaturated).
      2. Particle field is greatly reduced or absent.
      3. Bloom effect is disabled – no glowing edges.
      Answer strictly with 'PASS' or 'FAIL: [reason]'.`
    );
    console.log(`Gemini: ${response}`);
    expect(response).toContain('PASS');
  });

  test('TRANSITION mode (2 spoons) – reduced animations, simplified UI', async ({ page }) => {
    const response = await auditCognitiveState(
      page,
      'transition',
      async () => await page.evaluate(() => window.__p31Dome?.setSpoons?.(2)),
      `You are a cognitive accessibility auditor. The interface is in TRANSITION mode (low energy).
      Verify:
      1. Particle density is reduced by at least 50% compared to QUANTUM mode.
      2. Movement of struts/particles is slower and less chaotic.
      3. UI elements are simplified (fewer panels, larger text).
      Answer strictly with 'PASS' or 'FAIL: [reason]'.`
    );
    console.log(`Gemini: ${response}`);
    expect(response).toContain('PASS');
  });
});
