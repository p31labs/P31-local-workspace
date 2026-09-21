/**
 * The music maker — ZoneListbox.
 *
 * The keyboard twin of the canvas raycast tap. A spatial instrument must be
 * playable without a pointer: a screen-reader user (or anyone using Tab/arrow
 * navigation) needs a way to discover zones and trigger them. This is the
 * accessible listbox pattern the spatial-audio accessibility research
 * validates (Cosmic Sonar: "full keyboard navigation"; sound3fy: "full keyboard
 * navigation, ARIA attributes, focus management, screen reader announcements").
 *
 * Semantics: role="listbox" with role="option" items. Arrow keys move
 * selection (aria-activedescendant points at the focused option); Enter/Space
 * triggers the selected zone through the SAME callback as the canvas tap.
 * Selection changes are announced via the caller's live region (the
 * screen-reader equivalent of hover), and the trigger is announced too.
 *
 * Visually hidden: the list is clipped like the per-zone AAF spans, so it
 * never interferes with the canvas. It IS in the tab order, so a keyboard
 * user reaches it.
 */
import { useCallback, useEffect, useState } from 'react';
import type { MusicZone } from '../scene/musicZone';

export interface ZoneListboxProps {
  zones: MusicZone[];
  /** Trigger a zone — the same callback the canvas raycast uses. */
  onZoneTrigger: (id: string) => void;
  /** Announce text in the live region (selection changes, triggers). */
  announce: (text: string) => void;
}

export function ZoneListbox({ zones, onZoneTrigger, announce }: ZoneListboxProps) {
  // The selected option index. Keyboard input is low-frequency, so a state
  // update here is fine (unlike per-frame state) and keeps aria-selected /
  // aria-activedescendant in sync with React's render. Reset whenever the
  // zone set shrinks so selection never points past the end.
  const [activeIndex, setActiveIndex] = useState(0);
  useEffect(() => {
    if (activeIndex >= zones.length) setActiveIndex(0);
  }, [zones.length, activeIndex]);

  const focusIndex = (index: number) => {
    const clamped = Math.max(0, Math.min(zones.length - 1, index));
    setActiveIndex(clamped);
    const z = zones[clamped];
    if (z) {
      const [, y] = z.position;
      announce(`${z.name || z.id}, at height ${y > 0 ? 'high' : y < 0 ? 'low' : 'middle'}`);
    }
  };

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (zones.length === 0) return;
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          focusIndex(activeIndex + 1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          focusIndex(activeIndex - 1);
          break;
        case 'Home':
          e.preventDefault();
          focusIndex(0);
          break;
        case 'End':
          e.preventDefault();
          focusIndex(zones.length - 1);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          {
            const z = zones[activeIndex];
            if (z) {
              onZoneTrigger(z.id);
              announce(`${z.name || z.id} played`);
            }
          }
          break;
      }
    },
    [zones, onZoneTrigger, announce, activeIndex],
  );

  return (
    <ul
      className="mm-zone-list"
      role="listbox"
      aria-label="the zones of the spatial instrument"
      tabIndex={0}
      aria-activedescendant={zones.length ? `mm-zone-opt-${activeIndex}` : undefined}
      onKeyDown={onKeyDown}
      onFocus={() => focusIndex(activeIndex)}
    >
      {zones.map((z, i) => (
        <li
          key={z.id}
          id={`mm-zone-opt-${i}`}
          role="option"
          aria-selected={i === activeIndex}
          data-zone-id={z.id}
          data-agent-kind="action"
          data-agent-action="instrument.zone.trigger"
          data-agent-danger="none"
          data-agent-confirm="never"
          onClick={() => {
            focusIndex(i);
            onZoneTrigger(z.id);
            announce(`${z.name || z.id} played`);
          }}
        >
          {z.name || z.id}
        </li>
      ))}
    </ul>
  );
}