import { type Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { verifyScreenshotWithAI } from './ai-verifier';

export interface VisualTestOptions {
  fullPage?: boolean;
  threshold?: number;
  ai?: boolean | {
    verify?: string;
    provider?: 'openai';
    apiKey?: string;
  };
  mask?: string[];
  freezeTime?: boolean | number;
  update?: boolean;
  element?: string;
}

export interface VisualTestResult {
  passed: boolean;
  diffPercentage: number;
  baselinePath: string;
  currentPath: string;
  diffPath?: string;
  isNewBaseline: boolean;
  ai?: {
    classification: string;
    severity: string;
    explanation: string;
  };
  aiVerification?: {
    passed: boolean;
    explanation: string;
    confidence?: number;
  };
}

const DEFAULT_THRESHOLD = 0.01;
const BASELINE_DIR = path.resolve(process.cwd(), 'e2e', '__snapshots__');

function ensureBaselineDir() {
  fs.mkdirSync(BASELINE_DIR, { recursive: true });
}

async function captureScreenshot(page: Page, fullPage: boolean, element?: string): Promise<Buffer> {
  if (element) {
    const locator = page.locator(element);
    await locator.waitFor({ state: 'visible', timeout: 3000 });
    return await locator.screenshot({ type: 'png' });
  }
  return await page.screenshot({ fullPage, type: 'png' });
}

function loadPng(buffer: Buffer) {
  return PNG.sync.read(buffer);
}

function computeDiff(baseline: PNG, current: PNG) {
  const width = Math.min(baseline.width, current.width);
  const height = Math.min(baseline.height, current.height);
  const diff = new PNG({ width, height });
  const diffPixels = pixelmatch(
    baseline.data,
    current.data,
    diff.data,
    width,
    height,
    { threshold: 0.1 },
  );
  const totalPixels = width * height;
  return { width, height, diff, diffPixels, totalPixels };
}

async function classifyWithOpenAI(diffPath: string, apiKey: string): Promise<{
  classification: string;
  severity: string;
  explanation: string;
}> {
  const imageBuffer = fs.readFileSync(diffPath);
  const base64 = imageBuffer.toString('base64');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: [
                'Analyze this visual regression diff image.',
                'Changed pixels are highlighted in red/magenta.',
                '',
                'Classify the change as exactly one of:',
                '- "regression": an unintended bug or visual defect',
                '- "intentional": a planned and desired UI change',
                '- "content_update": only dynamic content changed (text, images, data)',
                '',
                'Also assign severity as exactly one of:',
                '- "critical": breaks functionality or is severely broken',
                '- "high": very noticeable issue',
                '- "medium": noticeable but not critical',
                '- "low": subtle or minor change',
                '',
                'Provide a brief explanation.',
                '',
                'Respond in this exact format:',
                'Classification: <regression|intentional|content_update>',
                'Severity: <critical|high|medium|low>',
                'Explanation: <brief description>',
              ].join('\n'),
            },
            {
              type: 'image_url',
              image_url: { url: `data:image/png;base64,${base64}`, detail: 'low' },
            },
          ],
        },
      ],
      max_tokens: 200,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${text}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content ?? '';

  const classificationMatch = content.match(/Classification:\s*(\w+)/i);
  const severityMatch = content.match(/Severity:\s*(\w+)/i);
  const explanationMatch = content.match(/Explanation:\s*(.+)/is);

  return {
    classification: classificationMatch?.[1]?.toLowerCase() ?? 'unknown',
    severity: severityMatch?.[1]?.toLowerCase() ?? 'medium',
    explanation: explanationMatch?.[1]?.trim() ?? content,
  };
}

export async function visualTest(
  page: Page,
  name: string,
  options: VisualTestOptions = {},
): Promise<VisualTestResult> {
  const {
    fullPage = true,
    threshold = DEFAULT_THRESHOLD,
    ai = false,
    mask = [],
    freezeTime = false,
    update = false,
    element,
  } = options;

  ensureBaselineDir();

  const baselinePath = path.join(BASELINE_DIR, `${name}.png`);
  const currentPath = path.join(BASELINE_DIR, `${name}.current.png`);
  const diffPath = path.join(BASELINE_DIR, `${name}.diff.png`);

  if (freezeTime) {
    const timestamp = typeof freezeTime === 'number' ? freezeTime : new Date('2024-01-01').getTime();
    await page.evaluate((t: number) => {
      const OriginalDate = Date;
      // @ts-ignore
      Date = new Proxy(OriginalDate, {
        construct: () => new Date(t),
        get: (target: any, prop: string | symbol) => {
          if (prop === 'now') return () => t;
          return target[prop];
        },
      });
    }, timestamp);
  }

  if (mask.length > 0) {
    await page.addStyleTag({
      content: mask.map((sel) => `${sel} { visibility: hidden !important; }`).join('\n'),
    });
  }

  const screenshotBuffer = await captureScreenshot(page, fullPage, element);
  fs.writeFileSync(currentPath, screenshotBuffer);

  const currentPng = loadPng(screenshotBuffer);
  const shouldUpdate = update || process.env.VISUAL_TEST_UPDATE === '1';

  if (!fs.existsSync(baselinePath) || shouldUpdate) {
    fs.copyFileSync(currentPath, baselinePath);
    return {
      passed: true,
      diffPercentage: 0,
      baselinePath,
      currentPath,
      isNewBaseline: !fs.existsSync(baselinePath),
    };
  }

  const baseline = loadPng(fs.readFileSync(baselinePath));

  if (baseline.width !== currentPng.width || baseline.height !== currentPng.height) {
    throw new Error(
      `Screenshot dimensions mismatch for ${name}: ` +
      `baseline=${baseline.width}x${baseline.height}, current=${currentPng.width}x${currentPng.height}. ` +
      `Ensure fullPage/matching viewports.`,
    );
  }

  const { width, height, diff, diffPixels, totalPixels } = computeDiff(baseline, currentPng);
  const diffPercentage = totalPixels > 0 ? diffPixels / totalPixels : 0;

  const passed = diffPercentage <= threshold;

  let aiVerification: VisualTestResult['aiVerification'];
  if (passed && typeof ai === 'object' && ai.verify) {
    const apiKey = ai.apiKey || process.env.OPENAI_API_KEY;
    if (apiKey) {
      try {
        aiVerification = await verifyScreenshotWithAI(page, ai.verify, { apiKey });
        if (!aiVerification.passed) {
          const failLog = path.join(BASELINE_DIR, `${name}.ai-fail.txt`);
          fs.writeFileSync(failLog, `AI verification failed:\n${aiVerification.explanation}\n`);
        }
      } catch (err) {
        console.warn(`[visualTest] AI verification failed for ${name}:`, err);
      }
    }
  }

  if (!passed) {
    fs.writeFileSync(diffPath, PNG.sync.write(diff));

    if (typeof ai === 'object' && ai.apiKey) {
      try {
        const classification = await classifyWithOpenAI(diffPath, ai.apiKey);
        return {
          passed: false,
          diffPercentage,
          baselinePath,
          currentPath,
          diffPath,
          isNewBaseline: false,
          ai: classification,
          aiVerification,
        };
      } catch (error) {
        console.error('[visualTest] AI classification failed:', error);
      }
    }

    return {
      passed: false,
      diffPercentage,
      baselinePath,
      currentPath,
      diffPath,
      isNewBaseline: false,
      aiVerification,
    };
  }

  return {
    passed: true,
    diffPercentage,
    baselinePath,
    currentPath,
    isNewBaseline: false,
    aiVerification,
  };
}
