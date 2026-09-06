import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { A2UIRenderer } from './A2UIRenderer';
import { toA2UI } from './a2ui';
import { generateInterface } from '../generator';

describe('A2UIRenderer', () => {
  it('renders a root surface with widget labels', () => {
    const desc = generateInterface({
      role: 'coordinator',
      spoons: 3,
      passport: null,
      viewData: { participants_count: 5 },
    });
    const html = renderToStaticMarkup(<A2UIRenderer message={toA2UI(desc, 3)} />);
    expect(html).toContain('a2ui-surface');
    expect(html).toContain('Participants'); // accessibility.label from widget title
  });

  it('renders crisis surface at spoons=0', () => {
    const desc = generateInterface({
      role: 'participant',
      spoons: 0,
      passport: null,
      viewData: {},
    });
    const html = renderToStaticMarkup(<A2UIRenderer message={toA2UI(desc, 0)} />);
    expect(html).toContain('a2ui-crisis');
    expect(html).toContain('data-spoons="0"');
  });
});
