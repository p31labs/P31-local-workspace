import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { buttonContract } from '../../packages/canon/src/contracts/button.contract';

const ROOT = resolve(import.meta.dirname, '..', '..');
const tokensCss = readFileSync(resolve(ROOT, 'packages', 'canon', 'dist', 'tokens.css'), 'utf-8');
const buttonCss = readFileSync(resolve(ROOT, 'packages', 'canon-react', 'src', 'Button', 'Button.css'), 'utf-8');

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  asChild?: boolean;
  children: string;
}

async function renderButton(page: Page, props: ButtonProps) {
  const { Button } = await import('../../packages/canon-react/dist/index.js');
  const element = React.createElement(Button as unknown as React.ElementType, props);
  const html = ReactDOMServer.renderToStaticMarkup(element);

  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>${tokensCss}</style>
      <style>${buttonCss}</style>
    </head>
    <body>
      <div id="root">${html}</div>
    </body>
    </html>
  `);

  return page.locator('#root > *');
}

async function observe(page: Page, selector: string, property: string): Promise<string> {
  return page.locator(selector).evaluate((el, prop) => {
    if (prop.startsWith('aria-') || prop.startsWith('data-')) {
      return el.getAttribute(prop) ?? '';
    }
    const styles = getComputedStyle(el);
    return styles.getPropertyValue(prop).trim();
  }, property);
}

function match(matcher: string, observed: string, expected?: string): boolean {
  switch (matcher) {
    case 'equals':
      return observed === expected;
    case 'not-equals':
      return observed !== expected;
    case 'truthy':
      return observed !== '' && observed !== 'none' && observed !== '0' && observed !== 'false';
    case 'not-empty':
      return observed !== '';
    case 'contains':
      return expected !== undefined && observed.includes(expected);
    default:
      throw new Error(`Unknown matcher: ${matcher}`);
  }
}

test.describe(`Button — derived state harness (${Object.keys(buttonContract.interactionStates).length} states)`, () => {
  for (const [state, spec] of Object.entries(buttonContract.interactionStates)) {
    test(`${state}: ${spec.property} ${spec.matcher}${spec.expected ? ` ${spec.expected}` : ''}`, async ({ page }) => {
      const fixture = spec.fixture as ButtonProps;
      if (!fixture) {
        throw new Error(`No fixture for state "${state}". A state in the contract without a fixture is a contract gap, not a test gap.`);
      }

      await renderButton(page, fixture);
      const selector = '.p31-button';

      switch (spec.trigger) {
        case 'hover': {
          await page.locator(selector).hover();
          break;
        }
        case 'focus': {
          await page.locator(selector).focus();
          break;
        }
        case 'press': {
          await page.locator(selector).hover();
          await page.mouse.down();
          break;
        }
        case 'none':
        default:
          break;
      }

      const observed = await observe(page, selector, spec.property);
      const passed = match(spec.matcher, observed, spec.expected);

      if (spec.trigger === 'press') {
        await page.mouse.up();
      }

      expect(
        passed,
        `state "${state}" — ${spec.description}\n` +
          `  property: ${spec.property}\n` +
          `  matcher:  ${spec.matcher}\n` +
          `  expected: ${spec.expected ?? '(none)'}\n` +
          `  observed: "${observed}"`,
      ).toBe(true);
    });
  }
});
