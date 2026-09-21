import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ZoneListbox } from './ZoneListbox';
import type { MusicZone } from '../scene/musicZone';

/**
 * P3 — the keyboard twin of the canvas tap. A spatial instrument must be
 * playable without a pointer. These tests pin the listbox semantics: Tab
 * reaches it, arrow keys move selection, Enter/Space triggers the SAME
 * callback as the canvas raycast, and the live region announces.
 */

const ZONES: MusicZone[] = [
  { id: 'zone:a', position: [1, 0, 0], timbre: 'hydrogen', name: 'the sun' },
  { id: 'zone:b', position: [-1, 0.8, 0], timbre: 'oxygen', name: 'the moon' },
  { id: 'zone:c', position: [0, -0.8, 1], timbre: 'carbon', name: '' },
];

function renderListbox(onTrigger = vi.fn(), announce = vi.fn()) {
  const utils = render(<ZoneListbox zones={ZONES} onZoneTrigger={onTrigger} announce={announce} />);
  const list = utils.container.querySelector<HTMLElement>('[role="listbox"]')!;
  return { onTrigger, announce, list };
}

describe('ZoneListbox', () => {
  it('renders an option per zone', () => {
    const { list } = renderListbox();
    expect(list.querySelectorAll('[role="option"]')).toHaveLength(3);
  });

  it('triggers the SAME onZoneTrigger callback as the canvas tap', () => {
    const { onTrigger, list } = renderListbox();
    fireEvent.keyDown(list, { key: 'ArrowDown' });
    fireEvent.keyDown(list, { key: 'Enter' });
    // ArrowDown moved to index 1 (the moon).
    expect(onTrigger).toHaveBeenCalledWith('zone:b');
  });

  it('moves selection with arrow keys and announces the selection', () => {
    const { announce, list } = renderListbox();
    fireEvent.keyDown(list, { key: 'ArrowDown' });
    expect(announce).toHaveBeenCalledWith('the moon, at height high');
    fireEvent.keyDown(list, { key: 'ArrowDown' });
    expect(announce).toHaveBeenCalledWith('zone:c, at height low');
  });

  it('does not go past the end of the list', () => {
    const { onTrigger, list } = renderListbox();
    // End jumps to the last option; Enter triggers it.
    fireEvent.keyDown(list, { key: 'End' });
    fireEvent.keyDown(list, { key: 'Enter' });
    expect(onTrigger).toHaveBeenCalledWith('zone:c');
  });

  it('marks the selected option with aria-selected', () => {
    const { list } = renderListbox();
    expect(list.getAttribute('aria-activedescendant')).toBe('mm-zone-opt-0');
    fireEvent.keyDown(list, { key: 'ArrowDown' });
    expect(list.getAttribute('aria-activedescendant')).toBe('mm-zone-opt-1');
    const opts = list.querySelectorAll('[role="option"]');
    expect(opts[1].getAttribute('aria-selected')).toBe('true');
    expect(opts[0].getAttribute('aria-selected')).toBe('false');
  });
});