import { describe, it, expect } from 'vitest';
import { generateInterface } from './generator';
import { toA2UI, validateA2UI } from './a2ui';

describe('A2UI v0.9 adapter', () => {
  const desc = generateInterface({
    role: 'coordinator',
    spoons: 3,
    passport: null,
    viewData: { participants_count: 5, sessions_count: 10 },
  });

  it('emits a valid v0.9 message', () => {
    const msg = toA2UI(desc, 3);
    expect(msg.version).toBe('v0.9');
    expect(msg.createSurface?.catalogId).toBe('p31ca.org:a2ui');
    expect(validateA2UI(msg)).toBe(true);
  });

  it('includes a root component and all widgets', () => {
    const msg = toA2UI(desc, 3);
    const comps = msg.updateComponents!.components;
    expect(comps[0].id).toBe('root');
    expect(comps.length).toBe(desc.widgets.length + 1);
  });

  it('maps widget types to A2UI component names', () => {
    const msg = toA2UI(desc, 3);
    const stat = msg.updateComponents!.components.find((c) => c.id.startsWith('stat-'));
    expect(stat?.component).toBe('Card');
  });

  it('carries P31 extension (crisisMode/spoons)', () => {
    const crisis = generateInterface({
      role: 'participant',
      spoons: 0,
      passport: null,
      viewData: {},
    });
    const msg = toA2UI(crisis, 0);
    expect(msg.extensions?.p31?.crisisMode).toBe(true);
    expect(msg.extensions?.p31?.spoons).toBe(0);
    expect(validateA2UI(msg)).toBe(true);
  });
});
