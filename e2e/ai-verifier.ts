import { type Page } from '@playwright/test';

/**
 * AI proactive verification — sends a screenshot to OpenAI and asks
 * a semantic question about the content. Unlike reactive failure-only
 * AI, this runs on every passing test to catch rendering bugs that
 * pixel matching might miss.
 */

export interface AIVerificationResult {
  passed: boolean;
  explanation: string;
  confidence?: number;
}

export async function verifyScreenshotWithAI(
  page: Page,
  prompt: string,
  options?: { apiKey?: string; model?: string },
): Promise<AIVerificationResult> {
  const apiKey = options?.apiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('[ai-verifier] OPENAI_API_KEY not set — skipping AI verification');
    return { passed: true, explanation: 'AI skipped (no API key)' };
  }

  const screenshotBuffer = await page.screenshot({ type: 'png', fullPage: false });
  const base64 = screenshotBuffer.toString('base64');

  const model = options?.model || 'gpt-4o-mini';
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are a UI verification assistant. Analyze this screenshot and respond only with a JSON object containing:
- passed: boolean (true if all requirements are met)
- explanation: string (why it passed or failed)
- confidence: number (0-1, your certainty)

Requirements:
${prompt}`,
            },
            {
              type: 'image_url',
              image_url: { url: `data:image/png;base64,${base64}`, detail: 'low' },
            },
          ],
        },
      ],
      max_tokens: 300,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${text}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';

  try {
    const result = JSON.parse(content);
    return {
      passed: result.passed === true,
      explanation: result.explanation || 'No explanation provided',
      confidence: result.confidence || 0.5,
    };
  } catch {
    const passed =
      content.toLowerCase().includes('"passed":true') ||
      content.toLowerCase().includes('passed: true');
    return { passed, explanation: content, confidence: 0.5 };
  }
}
