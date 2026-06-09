import type { HelpBlock } from '../types';
import { escapeHtml } from './escape';

export function helpBlocksToHtml(blocks: HelpBlock[]): string {
  return blocks
    .map((b) => {
      if (b.type === 'p') {
        return `<p>${escapeHtml(b.text)}</p>`;
      }
      if (b.type === 'h3') {
        return `<h3 class="h3-article">${escapeHtml(b.text)}</h3>`;
      }
      if (b.type === 'ul') {
        return `<ul class="compact">${b.items
          .map((i) => `<li>${escapeHtml(i)}</li>`)
          .join('')}</ul>`;
      }
      if (b.type === 'callout') {
        const tone = `callout--${b.tone}`;
        return `<aside class="callout ${tone}" role="note"><p class="p-callout">${escapeHtml(
          b.text
        )}</p></aside>`;
      }
      return '';
    })
    .join('');
}
