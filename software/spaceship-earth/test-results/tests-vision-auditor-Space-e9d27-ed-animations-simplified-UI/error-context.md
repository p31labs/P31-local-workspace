# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/vision-auditor.spec.ts >> Spaceship Earth – Cognitive Visual Audit >> TRANSITION mode (2 spoons) – reduced animations, simplified UI
- Location: tests/vision-auditor.spec.ts:78:3

# Error details

```
Error: [GoogleGenerativeAI Error]: Error fetching from https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent: [404 Not Found] models/gemini-1.0-pro is not found for API version v1beta, or is not supported for generateContent. Call ModelService.ListModels to see the list of available models and their supported methods.
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e8] [cursor=pointer]:
    - generic [ref=e11]: PROOF OF CARE
    - generic [ref=e12]:
      - generic [ref=e13]: "0.00"
      - generic [ref=e14]:
        - text: Care Score = (T
        - subscript [ref=e15]: prox
        - text: × Q
        - subscript [ref=e16]: res
        - text: × Green) + Tasks
    - generic [ref=e17]:
      - generic [ref=e18]: SOVEREIGNTY RING
      - generic [ref=e19]: "Weight: 100%"
  - generic [ref=e21]:
    - generic [ref=e22]:
      - img [ref=e23]
      - heading "DELTA [L]" [level=1] [ref=e26]
    - generic [ref=e27]:
      - generic [ref=e28]: 100% - ISOSTATIC
      - img [ref=e30]
  - generic [ref=e33]:
    - text: Larmor
    - button [ref=e34]:
      - img [ref=e35]
  - generic [ref=e40]:
    - generic [ref=e41]:
      - heading "Whale Channel" [level=2] [ref=e42]
      - generic [ref=e43]: Fawn Guard
    - textbox "Prepare transmission..." [ref=e44]
    - button "TRANSMIT" [disabled] [ref=e46]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { GoogleGenerativeAI } from '@google/generative-ai';
  3  | import fs from 'fs';
  4  | import path from 'path';
  5  | import { fileURLToPath } from 'url';
  6  | 
  7  | const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  8  | if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not set');
  9  | 
  10 | const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  11 | const model = genAI.getGenerativeModel({ model: 'gemini-1.0-pro' });
  12 | 
  13 | // Get __dirname equivalent in ES modules
  14 | const __filename = fileURLToPath(import.meta.url);
  15 | const __dirname = path.dirname(__filename);
  16 | 
  17 | // Helper: capture screenshot and send to Gemini
  18 | async function auditCognitiveState(
  19 |   page: any,
  20 |   stateName: string,
  21 |   stateSetup: () => Promise<void>,
  22 |   auditPrompt: string
  23 | ): Promise<string> {
  24 |   await stateSetup();
  25 |   await page.waitForTimeout(2000); // allow shader transitions
  26 | 
  27 |   const screenshotPath = path.join(__dirname, `artifacts/dome-${stateName}.png`);
  28 |   await page.screenshot({ path: screenshotPath, fullPage: true });
  29 | 
  30 |   const imageBuffer = fs.readFileSync(screenshotPath);
  31 |   const base64Image = imageBuffer.toString('base64');
  32 | 
> 33 |   const result = await model.generateContent([
     |                  ^ Error: [GoogleGenerativeAI Error]: Error fetching from https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent: [404 Not Found] models/gemini-1.0-pro is not found for API version v1beta, or is not supported for generateContent. Call ModelService.ListModels to see the list of available models and their supported methods.
  34 |     auditPrompt,
  35 |     { inlineData: { data: base64Image, mimeType: 'image/png' } }
  36 |   ]);
  37 |   return result.response.text();
  38 | }
  39 | 
  40 | test.describe('Spaceship Earth – Cognitive Visual Audit', () => {
  41 |   test.beforeEach(async ({ page }) => {
  42 |     await page.goto('http://localhost:5180/spaceship-earth/#dome');
  43 |     await page.waitForSelector('canvas'); // ensure Three.js is ready
  44 |   });
  45 | 
  46 |   test('QUANTUM mode (5 spoons) – high energy, vibrant, full particle field', async ({ page }) => {
  47 |     const response = await auditCognitiveState(
  48 |       page,
  49 |       'quantum',
  50 |       async () => await page.evaluate(() => window.__p31Dome?.setSpoons?.(5)),
  51 |       `You are a cognitive accessibility auditor. The interface is in QUANTUM mode (full energy).
  52 |       Verify:
  53 |       1. The K₄ topology is fully visible, with bright, saturated colors (emerald, cyan, coral).
  54 |       2. Particle field is dense and active.
  55 |       3. Bloom effect is present but not overwhelming (edges should glow).
  56 |       Answer strictly with 'PASS' or 'FAIL: [reason]'.`
  57 |     );
  58 |     console.log(`Gemini: ${response}`);
  59 |     expect(response).toContain('PASS');
  60 |   });
  61 | 
  62 |   test('GRAY ROCK mode (0 spoons) – muted, low contrast, no animations', async ({ page }) => {
  63 |     const response = await auditCognitiveState(
  64 |       page,
  65 |       'gray-rock',
  66 |       async () => await page.evaluate(() => window.__p31Dome?.setSpoons?.(0)),
  67 |       `You are a cognitive accessibility auditor. The interface is in GRAY ROCK mode (crisis protection).
  68 |       Verify:
  69 |       1. No bright, saturated colors – only muted, low‑contrast tones (grayscale or desaturated).
  70 |       2. Particle field is greatly reduced or absent.
  71 |       3. Bloom effect is disabled – no glowing edges.
  72 |       Answer strictly with 'PASS' or 'FAIL: [reason]'.`
  73 |     );
  74 |     console.log(`Gemini: ${response}`);
  75 |     expect(response).toContain('PASS');
  76 |   });
  77 | 
  78 |   test('TRANSITION mode (2 spoons) – reduced animations, simplified UI', async ({ page }) => {
  79 |     const response = await auditCognitiveState(
  80 |       page,
  81 |       'transition',
  82 |       async () => await page.evaluate(() => window.__p31Dome?.setSpoons?.(2)),
  83 |       `You are a cognitive accessibility auditor. The interface is in TRANSITION mode (low energy).
  84 |       Verify:
  85 |       1. Particle density is reduced by at least 50% compared to QUANTUM mode.
  86 |       2. Movement of struts/particles is slower and less chaotic.
  87 |       3. UI elements are simplified (fewer panels, larger text).
  88 |       Answer strictly with 'PASS' or 'FAIL: [reason]'.`
  89 |     );
  90 |     console.log(`Gemini: ${response}`);
  91 |     expect(response).toContain('PASS');
  92 |   });
  93 | });
  94 | 
```