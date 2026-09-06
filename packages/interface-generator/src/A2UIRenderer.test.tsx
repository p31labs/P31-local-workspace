import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { A2UIRenderer } from './A2UIRenderer';
import { toA2UI } from './a2ui';
import { generateInterface } from './generator';

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

  it('renders an Icon component from the catalog', () => {
    const msg: any = {
      version: 'v0.9',
      createSurface: {
        surfaceId: 'test',
        catalogId: 'p31ca.org:a2ui',
        theme: {
          iconCatalog: {
            'sovereign-crown': {
              svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%"><title>Crown</title><circle cx="100" cy="100" r="20"/></svg>',
              family: 'advanced',
              colors: ['--p31-accent'],
              animated: false,
              description: 'Crown',
            },
          },
        },
      },
      updateComponents: {
        surfaceId: 'test',
        components: [
          {
            id: 'root',
            component: 'Column',
            accessibility: { label: 'P31 Surface' },
            children: ['icon-1'],
          },
          {
            id: 'icon-1',
            component: 'Icon',
            props: { name: 'sovereign-crown', size: 'md', label: 'Crown' },
          },
        ],
      },
      extensions: { p31: { spoons: 3 } },
    };

    const html = renderToStaticMarkup(
      <A2UIRenderer message={msg} />
    );
    expect(html).toContain('a2ui-icon');
    expect(html).toContain('aria-label="Crown"');
    expect(html).toContain('cr-crown');
  });
});
